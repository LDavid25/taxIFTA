import api from "./api";

const API_URL = "/v1";

// Función para normalizar los datos de la compañía
const normalizeCompany = (company) => ({
  id: company.id,
  name: company.name || "Sin nombre",
  contactName: company.contactName || "N/A",
  contactEmail: company.contactEmail || "N/A",
  status: company.status || "active",
  createdAt: company.createdAt || new Date().toISOString(),
  updatedAt: company.updatedAt || new Date().toISOString(),
});

// Obtener todos los usuarios con sus compañías asociadas
export const getCompanies = async () => {
  try {
    console.log("🔍 Solicitando usuarios con sus compañías...");
    const response = await api.get(`${API_URL}/companies`);

    console.log("✅ Respuesta de la API recibida");

    // Verificar si la respuesta tiene datos
    if (response && response.data) {
      return {
        status: "success",
        data: response.data,
      };
    }

    // Si no hay datos o la respuesta no es la esperada
    console.warn("La respuesta del servidor no contiene datos válidos");
    return {
      status: "success",
      data: [],
    };
  } catch (error) {
    console.error("❌ Error al obtener las compañías:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      },
    });

    // En caso de error, devolver información detallada
    return {
      status: "error",
      message:
        error.response?.data?.message || "No se pudieron cargar las compañías",
      statusCode: error.response?.status,
      data: [],
    };
  }
};

// Obtener una compañía por ID
export const getCompanyById = async (id) => {
  try {
    console.log(`Fetching company with ID: ${id}`);
    const response = await api.get(`${API_URL}/companies/${id}`);
    // Verificar si la respuesta tiene el formato esperado
    if (response.data && (response.data.data || response.data.id)) {
      // Si la respuesta ya tiene un formato { status, data }
      if (response.data.data) {
        return response.data;
      }
      // Si la respuesta es el objeto de la compañía directamente
      return {
        status: "success",
        data: response.data,
      };
    }

    throw new Error("Formato de respuesta inesperado del servidor");
  } catch (error) {
    console.error("Error al obtener la compañía:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Mejorar el mensaje de error
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "" ||
      error.message ||
      "Error al obtener los datos de la compañía";

    throw new Error(errorMessage);
  }
};

// Crear una nueva compañía
export const createCompany = async (companyData) => {
  try {
    const response = await api.post(`${API_URL}/companies`, companyData);
    return response.data;
  } catch (error) {
    console.error("Error al crear la compañía:", error);
    throw error.response?.data || { message: "Error al crear la compañía" };
  }
};

// Actualizar una compañía existente
export const updateCompany = async (id, companyData) => {
  try {
    const companyId = String(id).trim();
    if (!companyId) {
      throw new Error("ID de compañía no válido");
    }

    // Prepare the data in the exact format expected by the backend
    const requestData = {
      name: companyData.name,
      contactEmail: companyData.contactEmail || companyData.contact_email || "",
      phone: companyData.phone || "",
      // Ensure distribution_mail is an array of strings
      distribution_mail: Array.isArray(companyData.distribution_mail) 
        ? companyData.distribution_mail.filter(email => 
            email && typeof email === 'string' && email.includes('@')
          )
        : [],
      status: companyData.status || (companyData.is_active ? "active" : "inactive"),
    };

    console.log("=== SENDING TO BACKEND ===");
    console.log(`PATCH ${API_URL}/companies/${companyId}`);
    console.log("Request Data:", JSON.stringify(requestData, null, 2));
    
    const response = await api.patch(
      `${API_URL}/companies/${companyId}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log("=== BACKEND RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Data:", response.data);
    
    if (!response.data) {
      throw new Error("El servidor no devolvió datos");
    }
    
    return response.data;
    
  } catch (error) {
    console.error("=== ERROR UPDATING COMPANY ===");
    
    let errorMessage = "Error al actualizar la compañía";
    
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", error.response.data);
      
      errorMessage = error.response.data?.message || 
                   error.response.data?.error || 
                   error.message || 
                   errorMessage;
    } else {
      console.error("Error:", error);
    }
    
    throw new Error(errorMessage);
  }
};

// Eliminar una compañía
export const deleteCompany = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la compañía con ID ${id}:`, error);
    throw error.response?.data || { message: "Error al eliminar la compañía" };
  }
};

// Actualizar el estado de una compañía
export const updateCompanyStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`${API_URL}/companies/${id}/status`, {
      is_active: isActive,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error al actualizar el estado de la compañía con ID ${id}:`,
      error,
    );
    throw (
      error.response?.data || {
        message: "Error al actualizar el estado de la compañía",
      }
    );
  }
};
