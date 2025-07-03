require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuración
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
// Contraseña que cumple con las validaciones: al menos 8 caracteres, mayúscula, minúscula, número y carácter especial
const TEST_PASSWORD = 'Password123!';

// Datos de prueba para el usuario
const testUser = {
  name: 'Usuario de Prueba',
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  password_confirmation: TEST_PASSWORD,
  role: 'user', // Debe ser 'admin' o 'user' según la restricción check_user_role
  company_id: '00000000-0000-0000-0000-000000000001', // ID de la compañía de sistema
  is_active: true,
  
  // Campos requeridos por las validaciones
  company_name: 'Empresa de Prueba',
  company_phone: '1234567890',
  company_email: 'empresa@example.com',
  company_address: 'Dirección de prueba 123',
  company_distribution_emails: ['contacto@empresa.com']
};

// Función para probar el registro
async function testUserRegistration() {
  try {
    console.log('=== Iniciando prueba de registro de usuario ===');
    console.log('URL de la API:', `${API_BASE_URL}/auth/register`);
    console.log('Datos de prueba:', JSON.stringify(testUser, null, 2));

    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('\n=== Registro exitoso ===');
    console.log('Estado:', response.status);
    console.log('Datos de respuesta:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\nToken JWT recibido. Prueba de autenticación exitosa!');
    }
    
    return response.data;
  } catch (error) {
    console.error('\n=== Error en la prueba de registro ===');
    
    if (error.response) {
      console.error('Estado del error:', error.response.status);
      console.error('Datos del error:', JSON.stringify(error.response.data, null, 2));
      
      // Mostrar errores de validación detallados si están disponibles
      if (error.response.data.errors) {
        console.error('\nErrores de validación:');
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          console.error(`- ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`);
        });
      }
      
      console.error('\nSolicitud enviada:');
      console.error('URL:', error.config?.url);
      console.error('Método:', error.config?.method);
      console.error('Datos enviados:', error.config?.data);
      
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor:', error.request);
      console.error('Configuración de la petición:', error.config);
    } else {
      console.error('Error al configurar la petición:', error.message);
    }
    
    throw error;
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testUserRegistration()
    .then(() => {
      console.log('\nPrueba completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nPrueba fallida con error');
      process.exit(1);
    });
}

module.exports = { testUserRegistration };
