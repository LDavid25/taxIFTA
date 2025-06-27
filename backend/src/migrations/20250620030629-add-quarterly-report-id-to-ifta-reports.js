'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar la columna quarterly_report_id a la tabla ifta_reports
    await queryInterface.addColumn('ifta_reports', 'quarterly_report_id', {
      type: Sequelize.UUID,
      allowNull: false, // Hacer el campo obligatorio
      references: {
        model: 'ifta_quarterly_reports',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT' // Evitar eliminar si hay reportes asociados
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar la columna quarterly_report_id
    await queryInterface.removeColumn('ifta_reports', 'quarterly_report_id');
  }
};
