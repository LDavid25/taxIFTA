const emailTemplate = {
  contactConfirmation: {
    subject: () => 'Thank you for contacting us',
    html: ({ name }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Thank you for reaching out, ${name}!</h2>
        <p>We've received your message and our team will get back to you as soon as possible. We typically respond within 24-48 hours.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>What to expect next:</strong></p>
          <ul>
            <li>Our team will review your inquiry</li>
            <li>We may contact you for additional information if needed</li>
            <li>You'll receive a response from one of our representatives</li>
          </ul>
        </div>
        
        <p>If you have any urgent questions, feel free to reply directly to this email.</p>
        
        <p style="color: #666; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  },
  contact: {
    subject: () => 'New Contact Form Submission',
    html: ({ name, email, phone, company, message }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p>You have received a new message from the contact form:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-line; background-color: white; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
            ${message}
          </div>
        </div>
        
        <p style="color: #666; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          This message was sent from the contact form on your website.
        </p>
      </div>
    `,
  },
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
