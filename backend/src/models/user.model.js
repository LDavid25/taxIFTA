const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 100],
    },
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: true,  // Hacer que sea opcional
    references: {
      model: 'companies',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'  // Cambiar a SET NULL para mantener la integridad referencial
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'client'),
    defaultValue: 'user',
    validate: {
      isIn: [['admin', 'user', 'client']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login',
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    field: 'password_changed_at',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
        user.passwordChangedAt = new Date();
      }
    },
  },
});

// Instance method to check password
User.prototype.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after JWT was issued
User.prototype.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

  // Instance method to check password
  User.prototype.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };

  // Instance method to check if password was changed after JWT was issued
  User.prototype.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

  // Set up associations
  User.associate = (models) => {
    // Define the Company association
    User.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });

    // Define the IftaReport association
    User.hasMany(models.IftaReport, {
      foreignKey: 'created_by',
      as: 'createdReports'
    });
  };

  return User;
};
