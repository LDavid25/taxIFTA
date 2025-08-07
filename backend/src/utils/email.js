const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const emailTemplates = require('./template.js');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (userEmail, templateName, variables) => {
  if (!emailTemplates[templateName]) {
    throw new Error('planilla no encontrada');
  }
  const myEmail = 'ifta-notifications@dottruckpermits.com';

  const subject = emailTemplates[templateName].subject(variables);
  const html = emailTemplates[templateName].html(variables);
  const mailOptions = {
    from: myEmail,
    to: userEmail,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions).then(console.log('Correo enviado a: ', userEmail));
  } catch (error) {
    console.error('Error en [email.js]: ', error);
  }
};

module.exports = sendEmail;
