const emailTemplate = {
  register: {
    subject: ({ serviceName }) => `Welcome to ${serviceName} - your access credentials!`,
    html: ({ name, serviceName, message }) => `
      <div style="font-family: Arial, sans-serif;">
        <h1>Hola ${name || 'Usuario'} 👋</h1>
        <p>${message || 'Thank you for joining us.'}</p>
        <p style="margin-top: 30px;">
          Welcome!
        </p>
      </div>
    `,
  },

  resetPassword: {
    subject: ({ serviceName }) => `Reset your password in ${serviceName}`,
    html: ({ name, message, resetLink, serviceName }) => `
      <div>
        <h2>Hello</h2>
        <p>${message || 'Click the following link to reset your password: '}</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this change, ignore this message.</p>
        <p>Thank you for trusting us.</p>
      </div>
    `,
  },

  inicioSesion: {
    subject: () => 'You have logged in.',
    html: ({ message }) => `
      <div>
        <h2>
          Hello, you have logged in.
        </h2>
        <p>
          ${message || 'Thank you for logging in.'}
        </p>
      </div>
     `,
  },

  reporte: {
    subject: () => 'New report generated',
    html: ({ name, units, date, companyName, url }) => `
      <div>
        <p>
            Hello
        </p>
        <p>
            Your report has been created.
            <br>
            Report details:
        </p>
        <p>
            User created: ${name}
            <br>
            Company name: ${companyName}
            <br>
            Number of units: ${units}
            <br>
            Creation date: ${date}
        </p>
        <p>
            You can access and review the report in your personal area.
            <br>
            Thank you for using our service.
        </p>
        <a href=${url}>
          <p>Click here to check the report</p>
        </a>
      </div>
    `,
  },

  declaration: {
    subject: ({ companyName }) => `Completion of declaration for ${companyName}`,
    html: ({ quarter, year, companyName, serviceName }) => `
      <div>
          <p>
              Hello,
              We inform you that the declaration corresponding to:
          </p>
          <p>
              Quarter: ${quarter}
              <br>
              Year: ${year}
              <br>
              Company: ${companyName}
          </p>
          <p>
              Has been finalized successfully.
              If you have any questions or require more information, do not hesitate to contact us.
          </p>
      </div>
    `,
  },
};

module.exports = emailTemplate;
