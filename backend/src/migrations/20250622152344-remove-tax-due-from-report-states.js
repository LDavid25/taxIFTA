'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove tax_due column if it exists
    const columns = await queryInterface.describeTable('ifta_report_states');
    
    if (columns.tax_due) {
      await queryInterface.removeColumn('ifta_report_states', 'tax_due');
    }
  },

  async down(queryInterface, Sequelize) {
    // Add the column back if we need to rollback
    await queryInterface.addColumn('ifta_report_states', 'tax_due', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    });
  }
};
