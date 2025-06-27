module.exports = (sequelize, DataTypes) => {
  const IftaReport = sequelize.define('IftaReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    vehicle_plate: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    report_year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    report_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 12
      }
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'sent', 'rejected', 'completed'),
      defaultValue: 'in_progress'
    },
    total_miles: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_gallons: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0
    },
    notes: {
      type: DataTypes.STRING(256)
    },
    submitted_at: {
      type: DataTypes.DATE
    },
    approved_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'ifta_reports',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  IftaReport.associate = (models) => {
    IftaReport.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });
    IftaReport.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'createdBy'
    });
    IftaReport.hasMany(models.IftaReportState, {
      foreignKey: 'report_id',
      as: 'states'
    });
    IftaReport.hasMany(models.IftaReportAttachment, {
      foreignKey: 'report_id',
      as: 'attachments'
    });
    IftaReport.belongsTo(models.IftaQuarterlyReport, {
      foreignKey: 'quarterly_report_id',
      as: 'quarterlyReport'
    });
  };

  return IftaReport;
};
