// ===========================================
// routes/authRoutes.js
// All /api/auth/* endpoints
// ===========================================

const express = require('express');
const router = express.Router();
const { register, login, socialLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/register  — Create new account
router.post('/register', register);

// POST /api/auth/login      — Login with email/password
router.post('/login', login);

// POST /api/auth/google     — Login with Google OAuth token
router.post('/google', socialLogin);

// GET  /api/auth/me         — Get my profile (requires login)
router.get('/me', protect, getMe);

module.exports = router;
