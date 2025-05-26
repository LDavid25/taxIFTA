const axios = require('axios');
const colors = require('colors');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = null;
let userId = null;
let vehicleId = null;

// Datos de prueba
const testUser = {
  name: 'Usuario de Prueba',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  role: 'client'
};

const testVehicle = {
  license_plate: `TEST-${Date.now()}`,
  vin_number: '1HGCM82633A123456',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  fuel_type: 'gasoline'
};

// Utilidades
const printResponse = (title, response) => {
  console.log('\n' + colors.cyan.bold(`=== ${title} ===`));
  console.log(colors.green('Status:'), response.status);
  console.log(colors.green('Data:'), JSON.stringify(response.data, null, 2));
};

const printError = (title, error) => {
  console.log('\n' + colors.red.bold(`=== ${title} ERROR ===`));
  if (error.response) {
    console.log(colors.yellow('Status:'), error.response.status);
    console.log(colors.yellow('Data:'), JSON.stringify(error.response.data, null, 2));
  } else {
    console.log(colors.red('Error:'), error.message);
  }
};

// Cliente HTTP con interceptores para tokens
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Pruebas
const runTests = async () => {
  console.log(colors.cyan.bold('\n=== INICIANDO PRUEBAS DE API ==='));
  console.log(colors.cyan(`URL de la API: ${API_URL}`));

  try {
    // 1. Verificar estado del servidor
    console.log(colors.cyan('\n>> Verificando estado del servidor...'));
    const healthResponse = await api.get('/health');
    printResponse('Health Check', healthResponse);

    // 2. Registrar usuario
    console.log(colors.cyan('\n>> Registrando usuario...'));
    try {
      const registerResponse = await api.post('/auth/register', testUser);
      printResponse('Registro de Usuario', registerResponse);
      
      // Guardar token y ID de usuario
      authToken = registerResponse.data.data.token;
      userId = registerResponse.data.data.user.id;
    } catch (error) {
      printError('Registro de Usuario', error);
      
      // Intentar login si el usuario ya existe
      console.log(colors.yellow('\n>> El usuario puede ya existir, intentando login...'));
      const loginResponse = await api.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      printResponse('Login de Usuario', loginResponse);
      
      // Guardar token y ID de usuario
      authToken = loginResponse.data.data.token;
      userId = loginResponse.data.data.user.id;
    }

    // 3. Obtener información del usuario actual
    console.log(colors.cyan('\n>> Obteniendo información del usuario actual...'));
    const meResponse = await api.get('/auth/me');
    printResponse('Usuario Actual', meResponse);

    // 4. Crear un vehículo
    console.log(colors.cyan('\n>> Creando vehículo...'));
    try {
      const createVehicleResponse = await api.post('/vehicles', testVehicle);
      printResponse('Crear Vehículo', createVehicleResponse);
      
      // Guardar ID del vehículo
      vehicleId = createVehicleResponse.data.data.id;
    } catch (error) {
      printError('Crear Vehículo', error);
    }

    // 5. Obtener todos los vehículos
    console.log(colors.cyan('\n>> Obteniendo todos los vehículos...'));
    const vehiclesResponse = await api.get('/vehicles');
    printResponse('Listar Vehículos', vehiclesResponse);

    // Si tenemos un ID de vehículo, ejecutar pruebas adicionales
    if (vehicleId) {
      // 6. Obtener un vehículo específico
      console.log(colors.cyan(`\n>> Obteniendo vehículo con ID ${vehicleId}...`));
      const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
      printResponse('Obtener Vehículo', vehicleResponse);

      // 7. Actualizar un vehículo
      console.log(colors.cyan(`\n>> Actualizando vehículo con ID ${vehicleId}...`));
      const updateVehicleResponse = await api.put(`/vehicles/${vehicleId}`, {
        model: `${testVehicle.model} Updated`,
        year: 2023
      });
      printResponse('Actualizar Vehículo', updateVehicleResponse);

      // 8. Intentar eliminar el vehículo (puede fallar si tiene viajes asociados)
      console.log(colors.cyan(`\n>> Intentando eliminar vehículo con ID ${vehicleId}...`));
      try {
        const deleteVehicleResponse = await api.delete(`/vehicles/${vehicleId}`);
        printResponse('Eliminar Vehículo', deleteVehicleResponse);
      } catch (error) {
        printError('Eliminar Vehículo', error);
        console.log(colors.yellow('Nota: Es normal que falle si el vehículo tiene viajes asociados.'));
      }
    }

    console.log(colors.green.bold('\n=== PRUEBAS COMPLETADAS ==='));
  } catch (error) {
    console.error(colors.red.bold('\n=== ERROR EN LAS PRUEBAS ==='));
    console.error(colors.red(error.message));
    if (error.response) {
      console.error(colors.red('Respuesta:'), error.response.data);
    }
  }
};

// Ejecutar pruebas
runTests();
