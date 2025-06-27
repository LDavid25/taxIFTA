'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, creamos una compañía por defecto
    const [company] = await queryInterface.bulkInsert('companies', [{
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin Company',
      tax_id: '000000000',
      contact_email: 'admin@iftaeasytax.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // Luego, creamos el usuario administrador
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    return queryInterface.bulkInsert('users', [{
      id: '00000000-0000-0000-0000-000000000001',
      company_id: company.id,
      name: 'Administrador',
      email: 'admin@iftaeasytax.com',
      password: hashedPassword,
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar el usuario administrador y la compañía
    await queryInterface.bulkDelete('users', { id: '00000000-0000-0000-0000-000000000001' });
    return queryInterface.bulkDelete('companies', { id: '00000000-0000-0000-0000-000000000001' });
  }
};
