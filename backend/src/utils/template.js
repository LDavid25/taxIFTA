const emailTemplate = {
  register: {
    subject: ({serviceName}) => `¡Bienvenido a ${serviceName} - tus credenciales de acceso!`,
    html: ({ name, serviceName, message }) => `
      <div style="font-family: Arial, sans-serif;">
        <h1>Hola ${name || 'Usuario'} 👋</h1>
        <p>${message || 'Gracias por unirte a nosotros.'}</p>
        <p style="margin-top: 30px;">
          ¡Bienvenido a bordo!
        </p>
        <p> Saludos. </p>
        <p>El equipo de ${serviceName}</p>
      </div>
    `,
  },

  resetPassword: {
    subject: ({serviceName}) => `Recupera tu contraseña en ${serviceName}`,
    html: ({ name, message, resetLink, serviceName }) => `
      <div>
        <h2>Hola ${name},</h2>
        <p>${message || 'Haz clic en el siguiente enlace para restablecer tu contraseña: '}</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Si no solicitaste este cambio, Ignora este mensaje.</p>
        <p>Gracias por confiar en nosotros.</p>
        <p>Saludos.</p>
        <p>El equipo de ${serviceName}</p>
      </div>
    `,
  },

  inicioSesion: {
    subject: () => 'Haz iniciado sesion.',
    html: () => `
      <div>
        <h2>
          Hola, haz iniciado sesion.
        </h2>
        <p>
          Saludos.
        </p>
      </div>
     `
  },

  reporte: {
    subject: () => 'Nuevo reporte Consumption generado',
    html: ({ units, date, companyName, serviceName }) => `
      <div>
        <p>
            Hola.
        </p>
        <p>
            Tu reporte de Consumption ha sido creado exitosamente.
            <br>
            Detalles del reporte:
        </p>
        <p>
            Nombre del usuario: ${name}
            <br>
            Número de unidades: ${units}
            <br>
            fecha de creación: ${date}
        </p>
        <p>
            Puedes acceder y revisar el reporte en tu área personal.
            <br>
            Gracias por usar nuestro servicio.
        </p>
        <p>
            Saludos.
            El equipo de ${serviceName}
        </p>
      </div>
    `
  },

  declaration: {
    subject: ({companyName}) => `Finalización de Declaration para ${companyName}`,
    html: ({ quarter, year, companyName, serviceName }) => `
      <div>
          <p>
              Hola,
              Te informamos que la declaración correspondiente a:
          </p>
          <p>
              Quarter: ${quarter}
              <br>
              Año: ${year}
              <br>
              Compañia: ${companyName}
          </p>
          <p>
              Ha sido finalizada correctamente.
              Si tienes alguna duda o requieres más información, no dudes en contactarnos.
          </p>
          <p>
              Saludos.
              <br>
              El equipo de ${serviceName}
          </p>
      </div>
    `
  }
};

module.exports = emailTemplate;
