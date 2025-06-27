module.exports = (sequelize, DataTypes) => {
  const IftaReportState = sequelize.define('IftaReportState', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    miles: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    gallons: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    mpg: {
      type: DataTypes.VIRTUAL, // Cambiado a VIRTUAL para que no se guarde en la base de datos
      get() {
        const gallons = this.getDataValue('gallons');
        const miles = this.getDataValue('miles');
        return gallons > 0 ? (miles / gallons).toFixed(2) : 0;
      },
      set(value) {
        // No hacer nada, es un campo de solo lectura
      }
    }
  }, {
    tableName: 'ifta_report_states',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  IftaReportState.associate = (models) => {
    IftaReportState.belongsTo(models.IftaReport, {
      foreignKey: 'report_id',
      as: 'report'
    });
  };

  return IftaReportState;
};
