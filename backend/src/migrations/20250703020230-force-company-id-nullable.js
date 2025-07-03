'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Eliminar la restricción de clave foránea existente
    const [results] = await queryInterface.sequelize.query(`
      SELECT conname
      FROM pg_constraint 
      JOIN pg_class ON conrelid = pg_class.oid
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE contype = 'f' 
      AND conname LIKE '%company_id%' 
      AND pg_class.relname = 'users';
    `);

    if (results.length > 0) {
      const fkName = results[0].conname;
      console.log(`Eliminando restricción: ${fkName}`);
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT "${fkName}";
      `);
    }

    // 2. Modificar la columna para hacerla nuleable
    console.log('Haciendo company_id nuleable...');
    await queryInterface.sequelize.query(`
      ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;
    `);

    // 3. Volver a agregar la restricción de clave foránea
    console.log('Agregando restricción de clave foránea...');
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_company_id_fkey 
      FOREIGN KEY (company_id) 
      REFERENCES companies(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE;
    `);

    console.log('Migración completada: company_id ahora es nuleable');
  },

  async down(queryInterface, Sequelize) {
    // 1. Eliminar la restricción de clave foránea
    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
    `);

    // 2. Hacer que la columna no sea nula
    await queryInterface.sequelize.query(`
      ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
    `);

    // 3. Volver a agregar la restricción de clave foránea
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_company_id_fkey 
      FOREIGN KEY (company_id) 
      REFERENCES companies(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE;
    `);

    console.log('Migración revertida: company_id ya no es nuleable');
  }
};
