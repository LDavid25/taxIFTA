import api from './api';

export const getUsers = async (page = 1, limit = 10, search = '') => {
  try {
    console.log('🔍 Iniciando solicitud de lista de usuarios...');
    const params = { page, limit };
    
    if (search) {
      params.search = search;
    }
    
    const response = await api.get('/v1/users', { params });
    console.log('✅ Respuesta de la API (getUsers):', response);
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!response.data) {
      console.error('❌ La respuesta de la API no contiene datos:', response);
      throw new Error('La respuesta del servidor no contiene datos');
    }
    
    // Extraer los datos de la respuesta
    let usersData = [];
    let total = 0;
    
    if (response.data.data && Array.isArray(response.data.data.users)) {
      // Formato: { data: { users: [...], total: X } }
      usersData = response.data.data.users;
      total = response.data.data.total || usersData.length;
    } else if (Array.isArray(response.data)) {
      // Formato: [user1, user2, ...]
      usersData = response.data;
      total = usersData.length;
    } else if (response.data.data && !Array.isArray(response.data.data)) {
      // Formato: { data: { ...user } }
      usersData = [response.data.data];
      total = 1;
    }
    
    console.log(`📊 Usuarios obtenidos: ${usersData.length} de ${total}`);
    return {
      users: usersData,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      console.error('Status:', error.response.status);
    }
    throw error;
  }
};

export const updateUserStatus = async (userId, isActive) => {
  try {
    console.log(`🔄 Actualizando estado del usuario ${userId} a ${isActive ? 'activo' : 'inactivo'}`);
    const response = await api.patch(`/v1/users/${userId}/status`, {
      is_active: isActive
    });
    
    console.log('✅ Respuesta de actualización de estado:', response.data);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || 'Error desconocido al actualizar el estado');
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    
    // Mejorar el mensaje de error para el usuario
    if (error.response) {
      // El servidor respondió con un estado de error
      const { status, data } = error.response;
      const errorMessage = data?.message || `Error ${status} del servidor`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else {
      // Error al configurar la petición
      throw new Error('Error al realizar la petición');
    }
  }
};

export const getUserById = async (userId) => {
  try {
    console.log(`Obteniendo información del usuario ${userId}...`);
    const response = await api.get(`/v1/users/${userId}`);
    
    if (!response.data || !response.data.data) {
      throw new Error('No se recibieron datos del usuario o la estructura es incorrecta');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      console.error('Status:', error.response.status);
      
      if (error.response.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      throw new Error(error.response.data?.message || 'Error al obtener el usuario');
    }
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    console.log(`Actualizando usuario ${userId} con datos:`, userData);
    
    // Usar PATCH en lugar de PUT y ajustar la ruta
    const response = await api.patch(`/v1/users/${userId}`, userData);
    
    if (!response.data || !response.data.data) {
      throw new Error('La respuesta del servidor no contiene datos');
    }
    
    console.log('Usuario actualizado correctamente:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      console.error('Status:', error.response.status);
      
      if (error.response.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      
      if (error.response.status === 400) {
        throw new Error(error.response.data?.message || 'Datos de usuario no válidos');
      }
    }
    
    throw new Error(error.response?.data?.message || 'Error al actualizar el usuario');
  }
};

export const getCurrentUser = async () => {
  try {
    console.log('Obteniendo información del usuario actual...');
    const response = await api.get('/v1/auth/me');
    console.log('Respuesta completa de la API (getCurrentUser):', response);
    
    // Verificar si la respuesta tiene la estructura esperada
    if (!response.data || !response.data.data) {
      console.error('Estructura de respuesta inesperada:', response.data);
      throw new Error('No se recibieron datos del usuario actual o la estructura es incorrecta');
    }
    
    // Asegurarse de que el objeto de usuario tenga todos los campos necesarios
    const userData = response.data.data;
    console.log('Datos del usuario extraídos:', userData);
    
    // Validar campos mínimos requeridos
    if (!userData.id || !userData.email) {
      console.error('Faltan campos requeridos en los datos del usuario:', userData);
      throw new Error('Los datos del usuario están incompletos');
    }
    
    // Mapear los campos necesarios para mantener consistencia
    const formattedUser = {
      id: userData.id,
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      role: userData.role || 'user', // Valor por defecto 'user' si no se especifica
      company_id: userData.company_id || null,
      is_active: userData.is_active !== undefined ? userData.is_active : true
    };
    
    console.log('Usuario formateado para la aplicación:', formattedUser);
    return formattedUser;
  } catch (error) {
    console.error('Error fetching current user:', error);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      console.error('Status:', error.response.status);
      
      // Si el token es inválido o ha expirado
      if (error.response.status === 401) {
        // Limpiar el token y redirigir al login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    throw error;
  }
};
