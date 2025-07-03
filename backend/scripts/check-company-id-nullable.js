const { sequelize } = require('../src/models');

async function checkCompanyIdNullable() {
  try {
    // Verificar la estructura de la columna company_id en la tabla users
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type, column_default, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id';
    `);

    console.log('Estado actual de la columna company_id en la tabla users:');
    console.log(results[0]);
    
    // Verificar si hay algún usuario con company_id nulo
    const [nullUsers] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE company_id IS NULL;
    `);
    
    console.log('\nUsuarios con company_id nulo:', nullUsers[0].count);
    
    // Verificar la estructura de la tabla companies
    const [companyColumns] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies';
    `);
    
    console.log('\nColumnas en la tabla companies:');
    console.table(companyColumns);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar la estructura de la tabla:', error);
    process.exit(1);
  }
}

checkCompanyIdNullable();
