const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/v1/ifta-reports`;

// ID del reporte a actualizar (cámbialo por uno que exista)
const REPORT_ID = 'a07bfe54-9737-4873-ba52-7f9e31042344';
const NEW_STATUS = 'sent'; // Puedes probar con: 'in_progress', 'sent', 'rejected', 'completed'

// Token de autenticación (reemplázalo con un token válido)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsImNvbXBhbnlfaWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJpYXQiOjE3NTExNTQ3NTcsImV4cCI6MTc1Mzc0Njc1N30.AP4gQonBFeQkCrKFw7QsEjmRLX0cC1XOtpTwwxpom1U';

async function testStatusUpdate() {
  try {
    console.log(`\n=== PRUEBA DE ACTUALIZACIÓN DE ESTADO ===`);
    console.log(`Reporte ID: ${REPORT_ID}`);
    console.log(`Nuevo estado: ${NEW_STATUS}`);

    // 1. Obtener el reporte actual
    console.log('\n1. Obteniendo reporte actual...');
    const currentReport = await axios.get(`${API_URL}/${REPORT_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('Estado actual:', currentReport.data.data.report.status);

    // 2. Actualizar el estado
    console.log('\n2. Actualizando estado...');
    const response = await axios.patch(
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
    console.log('Estado:', response.status);
    console.log('Datos:', response.data);

    // 3. Verificar el cambio
    console.log('\n4. Verificando el cambio...');
    const updatedReport = await axios.get(`${API_URL}/${REPORT_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('Nuevo estado:', updatedReport.data.data.report.status);
    console.log('\n=== PRUEBA COMPLETADA ===\n');

  } catch (error) {
    console.error('\n=== ERROR ===');
    if (error.response) {
      console.error('Respuesta del servidor:');
      console.error('Estado:', error.response.status);
      console.error('Datos:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    console.log('\n=== FIN DEL ERROR ===\n');
  }
}

// Ejecutar la prueba
testStatusUpdate();
