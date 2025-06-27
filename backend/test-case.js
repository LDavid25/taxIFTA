const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'ApiError.js');

console.log('Verificando archivo:', filePath);
console.log('¿Existe el archivo?', fs.existsSync(filePath));

// Listar archivos en el directorio utils
const utilsDir = path.join(__dirname, 'src', 'utils');
console.log('\nArchivos en el directorio utils:');
fs.readdirSync(utilsDir).forEach(file => {
  console.log(`- ${file}`);
});
