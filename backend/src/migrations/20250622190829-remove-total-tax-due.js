'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ifta_reports', 'total_tax_due');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('ifta_reports', 'total_tax_due', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
  }
};

