'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si la columna existe antes de intentar eliminarla
    const tableInfo = await queryInterface.describeTable('companies');
    
    if (tableInfo.tax_id) {
      await queryInterface.removeColumn('companies', 'tax_id');
      console.log('Columna tax_id eliminada de la tabla companies');
    } else {
      console.log('La columna tax_id no existe en la tabla companies');
    }
  },

  async down(queryInterface, Sequelize) {
    // En caso de rollback, volver a agregar la columna
    await queryInterface.addColumn('companies', 'tax_id', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    console.log('Columna tax_id agregada nuevamente a la tabla companies');
  }
};
