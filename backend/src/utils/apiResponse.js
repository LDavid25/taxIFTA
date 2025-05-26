class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  // Método para enviar la respuesta
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  // Métodos estáticos para respuestas comunes
  static success(res, data, message = 'Operación exitosa') {
    return new ApiResponse(200, data, message).send(res);
  }

  static created(res, data, message = 'Recurso creado exitosamente') {
    return new ApiResponse(201, data, message).send(res);
  }

  static noContent(res, message = 'No hay contenido para mostrar') {
    return new ApiResponse(204, null, message).send(res);
  }

  static badRequest(res, message = 'Solicitud incorrecta') {
    return new ApiResponse(400, null, message).send(res);
  }

  static unauthorized(res, message = 'No autorizado') {
    return new ApiResponse(401, null, message).send(res);
  }

  static forbidden(res, message = 'Prohibido') {
    return new ApiResponse(403, null, message).send(res);
  }

  static notFound(res, message = 'Recurso no encontrado') {
    return new ApiResponse(404, null, message).send(res);
  }

  static conflict(res, message = 'Conflicto en la solicitud') {
    return new ApiResponse(409, null, message).send(res);
  }

  static error(res, message = 'Error interno del servidor', statusCode = 500) {
    return new ApiResponse(statusCode, null, message).send(res);
  }
}

module.exports = ApiResponse;
