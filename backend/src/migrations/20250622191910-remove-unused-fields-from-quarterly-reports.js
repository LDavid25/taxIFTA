'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove total_tax_due column if it exists
    const columns = await queryInterface.describeTable('ifta_quarterly_reports');
    
    if (columns.total_tax_due) {
      await queryInterface.removeColumn('ifta_quarterly_reports', 'total_tax_due');
    }
    
    if (columns.notes) {
      await queryInterface.removeColumn('ifta_quarterly_reports', 'notes');
    }
  },

  async down(queryInterface, Sequelize) {
    // Add the columns back if we need to rollback
    await queryInterface.addColumn('ifta_quarterly_reports', 'total_tax_due', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('ifta_quarterly_reports', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};
