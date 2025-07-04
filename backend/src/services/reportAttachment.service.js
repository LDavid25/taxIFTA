const { IftaReportAttachment } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const path = require('path');

/**
 * Obtiene todos los archivos adjuntos de un reporte
 * @param {string} reportId - ID del reporte
 * @returns {Promise<Array>}
 */
const getAttachmentsByReportId = async (reportId) => {
  const attachments = await IftaReportAttachment.findAll({
    where: { report_id: reportId },
    include: [
      {
        association: 'uploadedBy',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  
  // Transformar los datos para el frontend
  return attachments.map(attachment => ({
    id: attachment.id,
    name: attachment.file_name,
    type: attachment.file_type,
    size: attachment.file_size,
    url: `/api/attachments/${attachment.id}/file`,
    thumbnailUrl: attachment.file_type.startsWith('image/') 
      ? `/api/attachments/${attachment.id}/thumbnail` 
      : null,
    extension: attachment.file_extension || path.extname(attachment.file_name).replace('.', ''),
    description: attachment.description,
    uploadedBy: attachment.uploadedBy ? {
      id: attachment.uploadedBy.id,
      name: attachment.uploadedBy.name,
      email: attachment.uploadedBy.email
    } : null,
    uploadedAt: attachment.created_at
  }));
};

module.exports = {
  getAttachmentsByReportId
};
