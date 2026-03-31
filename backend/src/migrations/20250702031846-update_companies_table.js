'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('companies', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        after: 'settings'
      });
    } catch (e) {
      console.log('Column is_active already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('companies', 'is_active');
  }
};
