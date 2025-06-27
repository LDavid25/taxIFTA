'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar la columna approved_at a la tabla ifta_reports
    await queryInterface.addColumn('ifta_reports', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true, // Puede ser nulo si el reporte no ha sido aprobado
      comment: 'Fecha de aprobación del reporte'
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar la columna approved_at
    await queryInterface.removeColumn('ifta_reports', 'approved_at');
  }
};
