const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');

// Configuración de almacenamiento para archivos temporales
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp');
    // Crear el directorio si no existe
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre de archivo único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Tipo de archivo no permitido. Solo se permiten PDF, JPG, JPEG y PNG.',
        400
      ),
      false
    );
  }
};

// Configuración de límites
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5, // Máximo 5 archivos
};

// Middleware de carga de archivos
const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Middleware para manejar errores de carga
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer (ej: archivo muy grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('El archivo es demasiado grande. Tamaño máximo: 10MB', 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Demasiados archivos. Máximo permitido: 5', 400));
    }
    return next(new AppError(`Error al cargar el archivo: ${err.message}`, 400));
  } else if (err) {
    // Otros errores
    return next(err);
  }
  next();
};

// Función para limpiar archivos temporales
const cleanupTempFiles = (req, res, next) => {
  // Limpiar archivos temporales después de la respuesta
  res.on('finish', () => {
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error al eliminar archivo temporal:', err);
          });
        }
      });
    }
  });
  next();
};

module.exports = {
  upload,
  handleUploadErrors,
  cleanupTempFiles,
};
