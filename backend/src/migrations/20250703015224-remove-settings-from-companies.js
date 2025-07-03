'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si la columna settings existe antes de intentar eliminarla
    const tableInfo = await queryInterface.describeTable('companies');
    
    if (tableInfo.settings) {
      await queryInterface.removeColumn('companies', 'settings');
    }
  },

  async down(queryInterface, Sequelize) {
    // En caso de hacer rollback, volvemos a agregar la columna settings
    await queryInterface.addColumn('companies', 'settings', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Configuraciones adicionales de la compañía'
    });
  }
};
