'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ifta_report_attachments', 'note', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'description'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ifta_report_attachments', 'note');
  }
};
