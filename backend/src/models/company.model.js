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
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  zip_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
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

  return Company;
};
