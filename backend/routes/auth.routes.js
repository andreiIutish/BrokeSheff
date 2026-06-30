const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me  (protected – requires valid JWT)
router.get('/me', verifyToken, authController.getMe);

// PUT /api/auth/profile  (protected – update email/password)
router.put('/profile', verifyToken, authController.updateProfile);

// DELETE /api/auth/profile  (protected – delete account)
router.delete('/profile', verifyToken, authController.deleteProfile);

module.exports = router;
