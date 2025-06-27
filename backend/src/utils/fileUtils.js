const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

/**
 * Crea un directorio si no existe
 */
const ensureDirectoryExists = async (directory) => {
  try {
    if (!(await existsAsync(directory))) {
      await mkdirAsync(directory, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error al crear el directorio:', error);
    throw error;
  }
};

/**
 * Elimina un archivo
 */
const deleteFile = async (filePath) => {
  try {
    if (await existsAsync(filePath)) {
      await unlinkAsync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar el archivo:', error);
    throw error;
  }
};

/**
 * Genera un nombre de archivo único usando timestamp
 */
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  return `${baseName}-${timestamp}${ext}`;
};

/**
 * Mueve un archivo de una ubicación a otra
 */
const moveFile = async (sourcePath, destinationPath) => {
  try {
    await ensureDirectoryExists(path.dirname(destinationPath));
    await fs.promises.rename(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error('Error al mover el archivo:', error);
    throw error;
  }
};

module.exports = {
  ensureDirectoryExists,
  deleteFile,
  generateUniqueFilename,
  moveFile,
};
