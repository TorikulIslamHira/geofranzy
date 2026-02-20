// ===========================================
// routes/weatherRoutes.js
// All /api/weather/* endpoints
// ===========================================

const express = require('express');
const router = express.Router();
const { getWeatherAtLocation, shareWeatherWithFriend } = require('../controllers/weatherController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET  /api/weather?lat=XX&lon=YY  — Fetch weather at coordinates
router.get('/', getWeatherAtLocation);

// POST /api/weather/share           — Share your weather with a friend
router.post('/share', shareWeatherWithFriend);

module.exports = router;
