const path = require('path');
const fs = require('fs');

// Directorio base para las cargas
const baseDir = path.join(__dirname, '../../uploads');

// Crear directorio base si no existe
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

module.exports = {
  // Ruta base para almacenar archivos
  baseDir,
  
  // Ruta para los reportes IFTA
  iftaReports: path.join(baseDir, 'ifta-reports'),
  
  // Ruta para archivos temporales
  tempDir: path.join(baseDir, 'temp'),
  
  // Obtener la ruta de un archivo adjunto
  getAttachmentPath: (reportId, fileName) => {
    return path.join(baseDir, 'ifta-reports', reportId, fileName);
  },
};
