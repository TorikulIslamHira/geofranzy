// ===========================================
// routes/sosRoutes.js
// All /api/sos/* endpoints
// ===========================================

const express = require('express');
const router = express.Router();
const { sendSOS, resolveSOS } = require('../controllers/sosController');
const { protect } = require('../middleware/auth');

router.use(protect);

// POST  /api/sos/send                — Send SOS to all friends
router.post('/send', sendSOS);

// PATCH /api/sos/resolve/:alertId    — Mark SOS as resolved (you are safe)
router.patch('/resolve/:alertId', resolveSOS);

module.exports = router;
