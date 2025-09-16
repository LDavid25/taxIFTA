const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// Contact form submission
router.post('/', contactController.sendContactForm);

module.exports = router;
