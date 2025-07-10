const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');
const { protect } = require('../middlewares/auth.middleware');
const { checkCompanyAccess } = require('../middlewares/companyAccess.middleware');

// Get distribution emails
router.get('/:companyId/emails', protect, checkCompanyAccess(), async (req, res, next) => {
  try {
    const emails = await EmailService.getDistributionEmails(req.params.companyId, req.user.id);
    res.json(emails);
  } catch (error) {
    next(error);
  }
});

// Add email to distribution list
router.post('/:companyId/emails', protect, checkCompanyAccess(), async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emails = await EmailService.addDistributionEmail(req.params.companyId, email, req.user.id);
    res.status(201).json(emails);
  } catch (error) {
    next(error);
  }
});

// Remove email from distribution list
router.delete('/:companyId/emails/:email', protect, checkCompanyAccess(), async (req, res, next) => {
  try {
    const emails = await EmailService.removeDistributionEmail(
      req.params.companyId, 
      decodeURIComponent(req.params.email),
      req.user.id
    );
    res.json(emails);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
