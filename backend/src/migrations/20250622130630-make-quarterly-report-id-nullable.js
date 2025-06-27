'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the foreign key constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE ifta_reports DROP CONSTRAINT IF EXISTS ifta_reports_quarterly_report_id_fkey;'
    );
    
    // Then modify the column to allow null
    await queryInterface.changeColumn('ifta_reports', 'quarterly_report_id', {
      type: Sequelize.UUID,
      allowNull: true, // Changed from false to true
      references: {
        model: 'ifta_quarterly_reports',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Changed from RESTRICT to SET NULL
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes if needed
    await queryInterface.sequelize.query(
      'ALTER TABLE ifta_reports DROP CONSTRAINT IF EXISTS ifta_reports_quarterly_report_id_fkey;'
    );
    
    await queryInterface.changeColumn('ifta_reports', 'quarterly_report_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'ifta_quarterly_reports',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  }
};
