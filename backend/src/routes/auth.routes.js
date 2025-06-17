const express = require('express');
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const { validate } = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} = require('../validations/auth.validations');

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    authController.forgotPassword
);
router.patch(
    '/reset-password/:token',
    validate(resetPasswordSchema),
    authController.resetPassword
);

// Protected routes (require authentication)
router.use(authController.protect);

// Obtener información del usuario autenticado
router.get('/me', userController.getMe);

router.patch(
    '/update-password',
    validate(updatePasswordSchema),
    authController.updatePassword
);

// Admin only routes
router.use(authController.restrictTo('admin'));
router.post('/register', validate(registerSchema), authController.register);
// Add admin-only routes here

module.exports = router;
