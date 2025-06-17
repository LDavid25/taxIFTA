'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'company_name',
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      last_login: {
        type: Sequelize.DATE,
        field: 'last_login',
      },
      password_changed_at: {
        type: Sequelize.DATE,
        field: 'password_changed_at',
      },
      password_reset_token: {
        type: Sequelize.STRING,
        field: 'password_reset_token',
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        field: 'password_reset_expires',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at',
      },
    });

    // Añadir índices
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });
    await queryInterface.addIndex('users', ['password_reset_token'], {
      name: 'users_password_reset_token_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
