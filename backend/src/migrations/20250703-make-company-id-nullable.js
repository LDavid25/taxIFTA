'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, eliminar la restricción de clave foránea existente
    const [results] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_type = 'FOREIGN KEY' 
      AND constraint_name LIKE '%company_id%';
    `);

    if (results.length > 0) {
      const fkName = results[0].constraint_name;
      await queryInterface.sequelize.query(`
        ALTER TABLE users DROP CONSTRAINT "${fkName}";
      `);
    }

    // Luego, modificar la columna para hacerla nullable
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    console.log('Columna company_id actualizada para ser nuleable');
  },

  async down(queryInterface, Sequelize) {
    // Primero, hacer que la columna no sea nula
    await queryInterface.changeColumn('users', 'company_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    
    console.log('Columna company_id revertida a no nuleable');
  },
};
