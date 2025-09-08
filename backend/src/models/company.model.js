module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // Dirección como JSONB
  address: {
    type: DataTypes.JSONB,
    field: 'address',  // Explicitly set the field name
    allowNull: true,
    defaultValue: {}
  },
  contact_email: {
    type: DataTypes.STRING,
    field: 'contact_email',  // Explicitly set the field name
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  distribution_emails: {
    type: DataTypes.JSONB,  // Changed to JSONB to match database type
    field: 'distribution_emails',  // Explicitly set the field name
    allowNull: true,
    validate: {
      isValidEmails(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Los correos de distribución deben ser un arreglo');
        }
        if (value && value.length > 10) {
          throw new Error('No se pueden tener más de 10 correos de distribución');
        }
      }
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

  Company.associate = (models) => {
    // Define the User association
    Company.Users = Company.hasMany(models.User, {
      foreignKey: 'company_id',
      as: 'users'
    });
    
    // Define the IftaReport association
    Company.IftaReports = Company.hasMany(models.IftaReport, {
      foreignKey: 'company_id',
      as: 'iftaReports'
    });

    // Define the IftaQuarterlyReport association
    Company.IftaQuarterlyReports = Company.hasMany(models.IftaQuarterlyReport, {
      foreignKey: 'company_id',
      as: 'iftaQuarterlyReports'
    });
  };

  // Check if company name is already taken
  Company.isNameTaken = async function(name, excludeCompanyId = null) {
    const where = { name };
    
    if (excludeCompanyId) {
      where.id = { [sequelize.Sequelize.Op.ne]: excludeCompanyId };
    }
    
    const company = await this.findOne({ where });
    return !!company;
  };

  return Company;
};
