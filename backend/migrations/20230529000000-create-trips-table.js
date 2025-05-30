'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trips', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      trip_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date of the trip',
      },
      origin_state: {
        type: Sequelize.STRING(2),
        allowNull: false,
        comment: 'Two-letter state code of origin',
      },
      destination_state: {
        type: Sequelize.STRING(2),
        allowNull: false,
        comment: 'Two-letter state code of destination',
      },
      distance_miles: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Distance traveled in miles',
      },
      fuel_consumed_gallons: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Fuel consumed in gallons',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes about the trip',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        defaultValue: 'completed',
        allowNull: false,
        comment: 'Status of the trip',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'User who owns this trip',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('trips', ['user_id'], {
      name: 'idx_trips_user_id',
    });
    await queryInterface.addIndex('trips', ['trip_date'], {
      name: 'idx_trips_date',
    });
    await queryInterface.addIndex(
      'trips',
      ['origin_state', 'destination_state'],
      {
        name: 'idx_trips_route',
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trips');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_trips_status";'
    );
  },
};
