'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('companies', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'settings'  // Asegura que el campo se cree después de settings
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('companies', 'is_active');
  }
};
