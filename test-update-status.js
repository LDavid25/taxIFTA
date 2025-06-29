const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/v1/ifta-reports`;

// ID del reporte a actualizar (cámbialo por uno que exista)
const REPORT_ID = 'a07bfe54-9737-4873-ba52-7f9e31042344';
const NEW_STATUS = 'rejected'; // Puedes probar con: 'in_progress', 'sent', 'rejected', 'completed'

// Token de autenticación (reemplázalo con un token válido)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImNvbXBhbnlfaWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJpYXQiOjE3NTExNTQ3NTcsImV4cCI6MTc1Mzc0Njc1N30.AP4gQonBFeQkCrKFw7QsEjmRLX0cC1XOtpTwwxpom1U';

async function testStatusUpdate() {
  try {
    console.log(`\n=== PRUEBA DE ACTUALIZACIÓN DE ESTADO ===`);
    console.log(`Reporte ID: ${REPORT_ID}`);
    console.log(`Nuevo estado: ${NEW_STATUS}`);

    // 1. Verificar que el reporte existe
    console.log('\n1. Verificando reporte...');
    const reportResponse = await axios.get(`${API_URL}/${REPORT_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('Reporte actual:');
    console.log('- ID:', reportResponse.data.data.report.id);
    console.log('- Estado actual:', reportResponse.data.data.report.status);
    console.log('- Compañía ID:', reportResponse.data.data.report.company_id);

    // 2. Intentar actualizar el estado
    console.log('\n2. Intentando actualizar estado...');
    const updateResponse = await axios.patch(
      `${API_URL}/${REPORT_ID}/status`,
      { status: NEW_STATUS },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );

    console.log('\n3. Respuesta del servidor:');
    console.log('- Estado HTTP:', updateResponse.status);
    console.log('- Datos:', JSON.stringify(updateResponse.data, null, 2));

    // 3. Verificar el cambio
    console.log('\n4. Verificando el cambio...');
    const updatedReport = await axios.get(`${API_URL}/${REPORT_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('Estado actualizado a:', updatedReport.data.data.report.status);
    console.log('\n=== PRUEBA COMPLETADA CON ÉXITO ===\n');

  } catch (error) {
    console.error('\n=== ERROR ===');
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('URL:', error.config?.url);
      console.error('Método:', error.config?.method?.toUpperCase());
      console.error('Headers:', JSON.stringify(error.config?.headers, null, 2));
      console.error('Datos enviados:', error.config?.data);
      console.error('\nRespuesta del servidor:');
      console.error('- Estado:', error.response.status);
      console.error('- Datos:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
      console.error('URL:', error.config?.url);
      console.error('Método:', error.config?.method?.toUpperCase());
    } else {
      // Error al configurar la petición
      console.error('Error al configurar la petición:', error.message);
    }
    
    console.error('\n=== FIN DEL ERROR ===\n');
  }
}

// Ejecutar la prueba
testStatusUpdate();
