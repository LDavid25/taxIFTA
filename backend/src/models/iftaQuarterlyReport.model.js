module.exports = (sequelize, DataTypes) => {
  const IftaQuarterlyReport = sequelize.define('IftaQuarterlyReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quarter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'sent', 'rejected', 'completed'),
      defaultValue: 'in_progress',
      comment: 'Estado del reporte: in_progress, sent, rejected, completed'
    },
    submitted_at: {
      type: DataTypes.DATE
    },
    approved_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'ifta_quarterly_reports',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['company_id', 'quarter', 'year']
      }
    ]
  });

  IftaQuarterlyReport.associate = (models) => {
    IftaQuarterlyReport.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });
    IftaQuarterlyReport.hasMany(models.IftaReport, {
      foreignKey: 'quarterly_report_id',
      as: 'reports'
    });
  };

  return IftaQuarterlyReport;
};
