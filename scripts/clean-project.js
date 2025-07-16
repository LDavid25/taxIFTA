const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Archivos y carpetas que se pueden eliminar de forma segura
const FILES_TO_REMOVE = [
  'check-users.js',
  'logs',
  '.vscode',
  'tests',
  'scripts/node_modules',
  'scripts/package-lock.json'
];

// Función para eliminar archivos o carpetas de forma segura
async function removeFileOrDir(pathToRemove) {
  try {
    await fs.access(pathToRemove);
    const stats = await fs.lstat(pathToRemove);
    
    if (stats.isDirectory()) {
      console.log(`Eliminando directorio: ${pathToRemove}`);
      await fs.rm(pathToRemove, { recursive: true, force: true });
    } else {
      console.log(`Eliminando archivo: ${pathToRemove}`);
      await fs.unlink(pathToRemove);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error al eliminar ${pathToRemove}:`, error.message);
    }
  }
}

// Función principal
async function cleanProject() {
  console.log('🚀 Iniciando limpieza del proyecto...\n');
  
  // Eliminar archivos y carpetas innecesarios
  for (const fileOrDir of FILES_TO_REMOVE) {
    const fullPath = path.join(process.cwd(), fileOrDir);
    await removeFileOrDir(fullPath);
  }
  
  // Limpiar node_modules y reinstalar solo dependencias de producción
  console.log('\n🔧 Limpiando node_modules...');
  await removeFileOrDir(path.join(process.cwd(), 'node_modules'));
  
  console.log('\n📦 Reinstalando solo dependencias de producción...');
  execSync('npm install --production', { stdio: 'inherit' });
  
  console.log('\n✅ Limpieza completada con éxito!');
  console.log('\n📌 Recuerda que puedes regenerar las dependencias de desarrollo con:');
  console.log('   npm install --only=dev');
}

// Ejecutar la limpieza
cleanProject().catch(console.error);
