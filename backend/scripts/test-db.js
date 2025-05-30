const { testConnection, closeConnection, syncModels } = require('../src/config/db');

async function test() {
  console.log('🔍 Probando conexión a la base de datos...');
  
  // Probar conexión
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Conexión exitosa!');
    
    // Sincronizar modelos (solo para desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Sincronizando modelos...');
      await syncModels(process.argv.includes('--force'));
    }
    
    // Cerrar conexión
    await closeConnection();
  }
  
  process.exit(isConnected ? 0 : 1);
}

test().catch(console.error);
