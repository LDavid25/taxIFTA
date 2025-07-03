require('dotenv').config();
const { sequelize, Company } = require('../src/models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Configuración
const TEST_COMPANY = {
  name: 'Empresa de Prueba ' + Date.now(),
  phone: '1234567890',
  contact_email: `contacto+${Date.now()}@empresaprueba.com`,
  address: {
    street: 'Calle Falsa 123',
    city: 'Ciudad',
    state: 'Estado',
    postal_code: '12345',
    country: 'País'
  },
  is_active: true,
  distribution_emails: [
    `soporte+${Date.now()}@empresaprueba.com`,
    `facturacion+${Date.now()}@empresaprueba.com`
  ]
};

// Función para crear una compañía
async function createCompany() {
  console.log('=== Iniciando creación de compañía ===');
  console.log('Datos de la compañía:', JSON.stringify(TEST_COMPANY, null, 2));

  const transaction = await sequelize.transaction();
  
  try {
    // Verificar si ya existe una compañía con el mismo nombre o email
    const existingCompany = await Company.findOne({
      where: {
        [Op.or]: [
          { name: TEST_COMPANY.name },
          { contact_email: TEST_COMPANY.contact_email }
        ]
      },
      transaction
    });

    if (existingCompany) {
      await transaction.rollback();
      console.error('Ya existe una compañía con el mismo nombre o correo electrónico');
      process.exit(1);
    }

    // Crear la compañía
    const newCompany = await Company.create(TEST_COMPANY, { transaction });
    
    await transaction.commit();
    
    console.log('\n=== Compañía creada exitosamente ===');
    console.log('ID:', newCompany.id);
    console.log('Nombre:', newCompany.name);
    console.log('Email:', newCompany.contact_email);
    console.log('Teléfono:', newCompany.phone);
    console.log('Activa:', newCompany.is_active ? 'Sí' : 'No');
    
    return newCompany;
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear la compañía:');
    console.error(error.message);
    
    if (error.errors) {
      console.error('Errores de validación:');
      error.errors.forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la función principal
if (require.main === module) {
  createCompany()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { createCompany };
