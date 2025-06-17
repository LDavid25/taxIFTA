require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../src/config/sequelize');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    // Sincronizar todos los modelos con la base de datos
    await sequelize.sync({ force: false });
    console.log('✅ Base de datos sincronizada');

    // Datos del administrador
    const adminData = {
      name: 'Admin',
      email: 'admin@iftaeasytax.com',
      password: 'Password123',
      companyName: 'Admin Company',
      role: 'admin',
      isActive: true
    };

    // Verificar si ya existe un administrador
    const existingAdmin = await User.findOne({ where: { email: adminData.email } });
    
    if (existingAdmin) {
      console.log('ℹ️ El usuario administrador ya existe');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Rol: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Crear el administrador
    const admin = await User.create(adminData);
    
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`- Nombre: ${admin.name}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Rol: ${admin.role}`);
    console.log('\n🔑 Credenciales de acceso:');
    console.log(`- Email: ${adminData.email}`);
    console.log(`- Contraseña: ${adminData.password}`);
    console.log('\n⚠️ Asegúrate de cambiar la contraseña después del primer inicio de sesión.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:');
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar la función principal
createAdmin();
