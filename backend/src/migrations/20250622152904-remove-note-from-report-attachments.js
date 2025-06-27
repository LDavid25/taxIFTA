'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove note column if it exists
    const columns = await queryInterface.describeTable('ifta_report_attachments');
    
    if (columns.note) {
      await queryInterface.removeColumn('ifta_report_attachments', 'note');
    }
  },

  async down(queryInterface, Sequelize) {
    // Add the column back if we need to rollback
    await queryInterface.addColumn('ifta_report_attachments', 'note', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Nota adicional (máx. 100 caracteres)'
    });
  }
};
