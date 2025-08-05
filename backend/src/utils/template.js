const emailTemplate = {
  register: {
    subject: companyName => `¡Bienvenido a ${companyName} - tus credenciales de acceso!`,
    html: ({ name, companyName, message }) => `
      <div style="font-family: Arial, sans-serif;">
        <h1>Hola ${name || 'Usuario'} 👋</h1>
        <p>${message || 'Gracias por unirte a nosotros.'}</p>
        <p style="margin-top: 30px;">
          ¡Bienvenido a bordo!
        </p>
        <p> Saludos. </p>
        <p>El equipo de ${companyName}</p>
      </div>
    `,
  },

  resetPassword: {
    subject: companyName => `Recupera tu contraseña en ${companyName}`,
    html: ({ name, companyName, message, resetLink }) => `
      <div>
        <h2>Hola ${name},</h2>
        <p>${message || 'Haz clic en el siguiente enlace para restablecer tu contraseña: '}</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Si no solicitaste este cambio, Ignora este mensaje.</p>
        <p>Gracias por confiar en nosotros.</p>
        <p>Saludos.</p>
        <p>El equipo de ${companyName}</p>
      </div>
    `,
  },
};

module.exports = emailTemplate;
