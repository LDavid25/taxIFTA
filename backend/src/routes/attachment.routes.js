const express = require('express');
const { auth } = require('../middlewares/auth.middleware');
const attachmentController = require('../controllers/reportAttachment.controller');

const router = express.Router();

// Obtener archivos adjuntos de un reporte
router.get('/reports/:reportId/attachments', auth(), attachmentController.getReportAttachments);

// Descargar un archivo adjunto
router.get('/attachments/:attachmentId/file', auth(), attachmentController.downloadAttachment);

// Obtener miniatura de una imagen
router.get('/attachments/:attachmentId/thumbnail', auth(), attachmentController.getThumbnail);

module.exports = router;
