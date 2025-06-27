const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { tempDir } = require('../src/config/storage');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const HOUR = 3600000; // 1 hora en milisegundos

async function cleanupDirectory(directory) {
  try {
    const files = await readdir(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = await stat(filePath);

      // Eliminar archivos con más de 1 hora de antigüedad
      if (now - fileStat.mtime.getTime() > HOUR) {
        if (fileStat.isDirectory()) {
          await cleanupDirectory(filePath);
          // Intentar eliminar el directorio si está vacío
          try {
            await rmdir(filePath);
          } catch (e) {
            // El directorio no está vacío, no hacer nada
          }
        } else {
          await unlink(filePath);
          console.log(`Eliminado: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error limpiando directorio ${directory}:`, error);
  }
}

// Ejecutar limpieza
cleanupDirectory(tempDir)
  .then(() => {
    console.log('Limpieza de archivos temporales completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error durante la limpieza:', error);
    process.exit(1);
  });
