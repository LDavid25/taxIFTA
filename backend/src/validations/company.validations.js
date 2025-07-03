const { body } = require('express-validator');
const validator = require('validator');

const companyValidation = [
  body('company_name')
    .if((value, { req }) => req.body.role === 'user' && !req.body.company_id)
    .trim()
    .notEmpty()
    .withMessage('Company name is required when creating a new company')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),

  body('company_email')
    .if((value, { req }) => req.body.role === 'user' && !req.body.company_id)
    .trim()
    .notEmpty()
    .withMessage('Company email is required when creating a new company')
    .isEmail()
    .withMessage('Please provide a valid company email'),

  body('company_distribution_emails')
    .if((value, { req }) => req.body.role === 'user' && !req.body.company_id)
    .optional()
    .isArray()
    .withMessage('Distribution emails must be an array')
    .custom((emails) => {
      if (!emails || emails.length === 0) return true;
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
