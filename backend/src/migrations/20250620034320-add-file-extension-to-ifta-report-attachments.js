'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ifta_report_attachments', 'file_extension', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'file_path'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ifta_report_attachments', 'file_extension');
  }
};
