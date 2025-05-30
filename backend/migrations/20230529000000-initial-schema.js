'use strict';

/**
 * Initial database schema for IFTA Easy Tax System
 * Creates all necessary tables and relationships
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // ====================================
      // Create Users Table
      // ====================================
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        first_name: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        last_name: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        role: {
          type: DataTypes.ENUM('admin', 'manager', 'user'),
          defaultValue: 'user',
          allowNull: false
        },
        is_email_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true
        },
        password_changed_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        reset_password_token: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        reset_password_expires: {
          type: DataTypes.DATE,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'suspended'),
          defaultValue: 'active',
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      }, { transaction });


      // ====================================
      // Create Vehicles Table
      // ====================================
      await queryInterface.createTable('vehicles', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        make: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        model: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        year: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        vin: {
          type: DataTypes.STRING(50),
          allowNull: true,
          unique: true
        },
        license_plate: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        license_state: {
          type: DataTypes.STRING(2),
          allowNull: false
        },
        vehicle_type: {
          type: DataTypes.ENUM('truck', 'tractor', 'trailer', 'other'),
          allowNull: false
        },
        fuel_type: {
          type: DataTypes.ENUM('diesel', 'gasoline', 'electric', 'hybrid', 'other'),
          allowNull: false
        },
        fuel_capacity: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'In gallons'
        },
        mpg: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: true,
          comment: 'Miles per gallon'
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      }, { transaction });


      // ====================================
      // Create Trips Table
      // ====================================
      await queryInterface.createTable('trips', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        vehicle_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'vehicles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: true
        },
        start_odometer: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          comment: 'Odometer reading at trip start'
        },
        end_odometer: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Odometer reading at trip end'
        },
        start_fuel_level: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Fuel level at trip start (percentage)'
        },
        end_fuel_level: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true,
          comment: 'Fuel level at trip end (percentage)'
        },
        status: {
          type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
          defaultValue: 'planned',
          allowNull: false
        },
        is_business: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      }, { transaction });


      // ====================================
      // Create Trip Stops Table
      // ====================================
      await queryInterface.createTable('trip_stops', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        trip_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'trips',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        sequence: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'Order of stops in the trip'
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        address: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        state: {
          type: DataTypes.STRING(2),
          allowNull: true
        },
        postal_code: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        country: {
          type: DataTypes.STRING(2),
          defaultValue: 'US',
          allowNull: false
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true
        },
        planned_arrival: {
          type: DataTypes.DATE,
          allowNull: true
        },
        actual_arrival: {
          type: DataTypes.DATE,
          allowNull: true
        },
        planned_departure: {
          type: DataTypes.DATE,
          allowNull: true
        },
        actual_departure: {
          type: DataTypes.DATE,
          allowNull: true
        },
        odometer_reading: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Odometer reading at this stop'
        },
        fuel_purchased: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Gallons of fuel purchased'
        },
        fuel_cost: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Cost of fuel purchased'
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });


      // ====================================
      // Create Trip Segments Table
      // ====================================
      await queryInterface.createTable('trip_segments', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        trip_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'trips',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        from_stop_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'trip_stops',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        to_stop_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'trip_stops',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        distance: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          comment: 'Distance in miles'
        },
        start_odometer: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          comment: 'Odometer reading at segment start'
        },
        end_odometer: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          comment: 'Odometer reading at segment end'
        },
        start_time: {
          type: DataTypes.DATE,
          allowNull: false
        },
        end_time: {
          type: DataTypes.DATE,
          allowNull: true
        },
        fuel_used: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          comment: 'Gallons of fuel used'
        },
        mpg: {
          type: DataTypes.DECIMAL(6, 2),
          allowNull: true,
          comment: 'Miles per gallon for this segment'
        },
        route_geometry: {
          type: DataTypes.GEOMETRY('LINESTRING', 4326),
          allowNull: true,
          comment: 'Geospatial route data'
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });


      // ====================================
      // Create IFTA Reports Table
      // ====================================
      await queryInterface.createTable('ifta_reports', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        vehicle_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'vehicles',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        reporting_period: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: 'First day of the reporting period (quarter)'
        },
        total_miles: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        total_taxable_miles: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        total_gallons: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        total_tax_due: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        status: {
          type: DataTypes.ENUM('draft', 'submitted', 'paid', 'filed'),
          defaultValue: 'draft',
          allowNull: false
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        filed_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });


      // ====================================
      // Create IFTA Report Details Table
      // ====================================
      await queryInterface.createTable('ifta_report_details', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        report_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'ifta_reports',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        jurisdiction: {
          type: DataTypes.STRING(2),
          allowNull: false,
          comment: 'State or province code'
        },
        total_miles: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        taxable_miles: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        fuel_purchased: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          comment: 'Gallons of fuel purchased in this jurisdiction'
        },
        fuel_consumed: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          comment: 'Gallons of fuel consumed in this jurisdiction'
        },
        tax_due: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        tax_paid: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        tax_owed: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });


      // ====================================
      // Create Indexes
      // ====================================
      await queryInterface.addIndex('users', ['email'], {
        unique: true,
        name: 'users_email_unique',
        transaction
      });

      await queryInterface.addIndex('vehicles', ['user_id'], {
        name: 'vehicles_user_id_idx',
        transaction
      });

      await queryInterface.addIndex('vehicles', ['license_plate', 'license_state'], {
        unique: true,
        name: 'vehicles_license_unique',
        transaction
      });

      await queryInterface.addIndex('trips', ['user_id'], {
        name: 'trips_user_id_idx',
        transaction
      });

      await queryInterface.addIndex('trips', ['vehicle_id'], {
        name: 'trips_vehicle_id_idx',
        transaction
      });

      await queryInterface.addIndex('trip_stops', ['trip_id'], {
        name: 'trip_stops_trip_id_idx',
        transaction
      });

      await queryInterface.addIndex('trip_segments', ['trip_id'], {
        name: 'trip_segments_trip_id_idx',
        transaction
      });

      await queryInterface.addIndex('trip_segments', ['from_stop_id'], {
        name: 'trip_segments_from_stop_id_idx',
        transaction
      });

      await queryInterface.addIndex('trip_segments', ['to_stop_id'], {
        name: 'trip_segments_to_stop_id_idx',
        transaction
      });

      await queryInterface.addIndex('ifta_reports', ['user_id'], {
        name: 'ifta_reports_user_id_idx',
        transaction
      });

      await queryInterface.addIndex('ifta_reports', ['vehicle_id'], {
        name: 'ifta_reports_vehicle_id_idx',
        transaction
      });

      await queryInterface.addIndex('ifta_reports', ['reporting_period', 'vehicle_id'], {
        unique: true,
        name: 'ifta_reports_period_vehicle_unique',
        transaction
      });

      await queryInterface.addIndex('ifta_report_details', ['report_id'], {
        name: 'ifta_report_details_report_id_idx',
        transaction
      });

      await queryInterface.addIndex('ifta_report_details', ['jurisdiction', 'report_id'], {
        unique: true,
        name: 'ifta_report_details_jurisdiction_report_unique',
        transaction
      });

      // Commit the transaction
      await transaction.commit();
      
    } catch (error) {
      // If there's an error, rollback the transaction
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Drop tables in reverse order to respect foreign key constraints
      await queryInterface.dropTable('ifta_report_details', { transaction });
      await queryInterface.dropTable('ifta_reports', { transaction });
      await queryInterface.dropTable('trip_segments', { transaction });
      await queryInterface.dropTable('trip_stops', { transaction });
      await queryInterface.dropTable('trips', { transaction });
      await queryInterface.dropTable('vehicles', { transaction });
      await queryInterface.dropTable('users', { transaction });

      // Commit the transaction
      await transaction.commit();
      
    } catch (error) {
      // If there's an error, rollback the transaction
      await transaction.rollback();
      throw error;
    }
  }
};
