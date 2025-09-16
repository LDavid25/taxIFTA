const sendEmail = require('../utils/email');

const contactController = {
  sendContactForm: async (req, res) => {
    try {
      const { name, email, phone = '', company = '', message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, and message are required' 
        });
      }

      // Send email to admin
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@dottruckpermits.com',
        'contact',
        { name, email, phone, company, message }
      );

      // Send confirmation email to user
      await sendEmail(
        email,
        'contactConfirmation',
        { name }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Your message has been sent successfully!' 
      });
    } catch (error) {
      console.error('Error in sendContactForm:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error sending message. Please try again later.' 
      });
    }
  },
};

module.exports = contactController;
