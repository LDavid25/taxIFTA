const { sequelize } = require('../src/models');

async function checkSchema() {
  try {
    // Verificar la estructura de la columna company_id en users
    const [result] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'company_id';
    `);
    
    console.log('\nEstado de company_id en la tabla users:');
    console.table(result);
    
    // Verificar restricciones de la columna
    const [constraints] = await sequelize.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON rc.unique_constraint_name = ccu.constraint_name
      WHERE 
        tc.table_name = 'users' 
        AND kcu.column_name = 'company_id';
    `);
    
    console.log('\nRestricciones en company_id:');
    console.table(constraints);
    
    // Verificar si hay usuarios con company_id nulo
    const [nullCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE company_id IS NULL;
    `);
    
    console.log('\nUsuarios con company_id nulo:', nullCount[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error al verificar el esquema:', error);
    process.exit(1);
  }
}

checkSchema();
