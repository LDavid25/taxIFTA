module.exports = (sequelize, DataTypes) => {
  const IftaReportAttachment = sequelize.define('IftaReportAttachment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: [['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']]
      }
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        max: 10485760 // 10MB
      }
    },
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    file_extension: {
      type: DataTypes.STRING(10)
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'ifta_report_attachments',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  IftaReportAttachment.associate = (models) => {
    IftaReportAttachment.belongsTo(models.IftaReport, {
      foreignKey: 'report_id',
      as: 'report'
    });
    IftaReportAttachment.belongsTo(models.User, {
      foreignKey: 'uploaded_by',
      as: 'uploadedBy'
    });
  };

  return IftaReportAttachment;
};
