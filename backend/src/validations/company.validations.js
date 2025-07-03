const { body } = require('express-validator');
const validator = require('validator');

const companyValidation = [
  body('company_name')
    .if((value, { req }) => req.body.role === 'user')
    .trim()
    .notEmpty()
    .withMessage('Company name is required for client users')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('company_distribution_emails')
    .if((value, { req }) => req.body.role === 'user')
    .optional()
    .isArray()
    .withMessage('Distribution emails must be an array')
    .custom((emails) => {
      if (!emails) return true;
      if (!Array.isArray(emails)) throw new Error('Distribution emails must be an array');
      if (emails.length > 10) throw new Error('Maximum 10 distribution emails allowed');
      
      for (const email of emails) {
        if (email && typeof email === 'string' && email.trim() !== '') {
          if (!validator.isEmail(email.trim())) {
            throw new Error(`Invalid email format: ${email}`);
          }
        }
      }
      return true;
    })
];

module.exports = {
  companyValidation
};
