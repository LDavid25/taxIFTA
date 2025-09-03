import api from "./api";

const API_URL = "/v1/auth";

// Registrar un nuevo usuario
export const register = async (userData) => {
  try {
    const response = await api.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error al registrar usuario" };
  }
};

// Iniciar sesión
export const login = async (credentials) => {
  try {
    console.log("Enviando credenciales al backend:", credentials);
    const response = await api.post(`${API_URL}/login`, credentials);
    console.log("Respuesta del login:", response.data);

    if (response.data.token) {
      // Guardar el token en localStorage
      const token = response.data.token;
      localStorage.setItem("token", token);

      // Configurar el token en el header por defecto
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("Token configurado en los headers de axios");

      // Verificar que el token se guardó correctamente
      const savedToken = localStorage.getItem("token");
      console.log(
        "Token guardado en localStorage:",
        savedToken ? "OK" : "FALLO",
      );

      // Devolver tanto el token como los datos del usuario
      return {
        token: response.data.token,
        user: response.data.data?.user,
      };
    }
    return response.data;
  } catch (error) {
    console.error(
      "Error en authService.login:",
      error.response?.data || error.message,
    );
    throw error.response?.data || { message: "Error al iniciar sesión" };
  }
};

// Obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    console.log("🔍 Realizando petición a /me...", {
      headers: api.defaults.headers,
      url: `${API_URL}/me`,
      token: localStorage.getItem("token"),
    });

    const response = await api.get(`${API_URL}/me`);

    // La respuesta puede estar en response.data.user o directamente en response.data
    const responseData = response.data || {};
    const userData =
      responseData.data?.user || responseData.user || responseData;

    if (!userData) {
      throw new Error("No se recibieron datos de usuario válidos");
    }

    // Asegurarse de que el rol esté en minúsculas
    const normalizedUser = {
      ...userData,
      role: (userData.role || "").toLowerCase(),
    };

    console.log("✅ Respuesta de /me procesada:", {
      status: response.status,
      userData: {
        id: normalizedUser.id,
        email: normalizedUser.email,
        role: normalizedUser.role,
        hasToken: !!localStorage.getItem("token"),
      },
      rawResponse: response.data,
    });

    return normalizedUser;
  } catch (error) {
    console.error("Error en getCurrentUser:", {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      },
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });
    throw (
      error.response?.data || {
        message: "Error al obtener usuario actual",
        originalError: error.message,
      }
    );
  }
};

// Cerrar sesión
export const logout = () => {
  localStorage.removeItem("token");
  delete api.defaults.headers.common["Authorization"];
};

// Solicitar restablecimiento de contraseña
export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Error al solicitar restablecimiento de contraseña",
      }
    );
  }
};

// Restablecer contraseña
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`${API_URL}/reset-password`, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Error al restablecer la contraseña" }
    );
  }
};

// Actualizar contraseña del usuario actual
export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.patch(`${API_URL}/update-password`, {
      passwordCurrent: currentPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error en updatePassword:",
      error.response?.data || error.message,
    );
    throw (
      error.response?.data || { message: "Error al actualizar la contraseña" }
    );
  }
};

