'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension if not exists
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // 1. Create companies table first (no dependencies)
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      address: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tax_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Create users table (depends on companies)
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(20),
        defaultValue: 'user',
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'is_active'
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_login'
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'password_changed_at'
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'password_reset_token'
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'password_reset_expires'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Create ifta_reports table (depends on users and companies)
    await queryInterface.createTable('ifta_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      vehicle_plate: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      report_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      report_month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'draft',
        allowNull: false
      },
      total_miles: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      total_gallons: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0,
        allowNull: false
      },
      total_tax_due: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Create ifta_report_states table (depends on ifta_reports)
    await queryInterface.createTable('ifta_report_states', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      report_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ifta_reports',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      state_code: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      miles: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      gallons: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
      },
      tax_due: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Create ifta_report_attachments table (depends on ifta_reports and users)
    await queryInterface.createTable('ifta_report_attachments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      report_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ifta_reports',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 6. Create ifta_quarterly_reports table (depends on companies and users)
    await queryInterface.createTable('ifta_quarterly_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      quarter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'draft',
        allowNull: false
      },
      total_miles: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      total_gallons: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0,
        allowNull: false
      },
      total_tax_due: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['company_id']);
    await queryInterface.addIndex('ifta_reports', ['company_id']);
    await queryInterface.addIndex('ifta_reports', ['created_by']);
    await queryInterface.addIndex('ifta_report_states', ['report_id']);
    await queryInterface.addIndex('ifta_report_attachments', ['report_id']);
    await queryInterface.addIndex('ifta_quarterly_reports', ['company_id']);
    await queryInterface.addIndex('ifta_quarterly_reports', ['quarter', 'year']);

    // Add check constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_user_role 
      CHECK (role IN ('admin', 'cliente'));
      
      ALTER TABLE ifta_reports 
      ADD CONSTRAINT check_report_status 
      CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
      ADD CONSTRAINT check_report_month_range 
      CHECK (report_month BETWEEN 1 AND 12);
      
      ALTER TABLE ifta_quarterly_reports 
      ADD CONSTRAINT check_quarter_report_status 
      CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
      ADD CONSTRAINT check_quarter_range 
      CHECK (quarter BETWEEN 1 AND 4);
      
      ALTER TABLE ifta_report_states 
      ADD CONSTRAINT check_miles_positive CHECK (miles >= 0),
      ADD CONSTRAINT check_gallons_positive CHECK (gallons >= 0),
      ADD CONSTRAINT check_tax_due_positive CHECK (tax_due >= 0);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable('ifta_quarterly_reports');
    await queryInterface.dropTable('ifta_report_attachments');
    await queryInterface.dropTable('ifta_report_states');
    await queryInterface.dropTable('ifta_reports');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('companies');
    
    // Drop extension
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  }
};
