const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'trip_date',
    comment: 'Date of the trip',
  },
  origin_state: {
    type: DataTypes.STRING(2),
    allowNull: false,
    field: 'origin_state',
    comment: 'Two-letter state code of origin',
  },
  destination_state: {
    type: DataTypes.STRING(2),
    allowNull: false,
    field: 'destination_state',
    comment: 'Two-letter state code of destination',
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'distance_miles',
    comment: 'Distance traveled in miles',
    validate: {
      min: 0,
    },
  },
  fuel_consumed: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'fuel_consumed_gallons',
    comment: 'Fuel consumed in gallons',
    validate: {
      min: 0,
    },
  },
  mpg: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.distance && this.fuel_consumed 
        ? (this.distance / this.fuel_consumed).toFixed(2)
        : null;
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes',
    comment: 'Additional notes about the trip',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed',
    allowNull: false,
    field: 'status',
    comment: 'Status of the trip',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'User who owns this trip',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'trips',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_trips_user_id',
    },
    {
      fields: ['trip_date'],
      name: 'idx_trips_date',
    },
    {
      fields: ['origin_state', 'destination_state'],
      name: 'idx_trips_route',
    },
  ],
  hooks: {
    beforeUpdate: (trip) => {
      trip.updated_at = new Date();
    },
  },
});

  // Define associations
  Trip.associate = (models) => {
    Trip.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Trip;
};
