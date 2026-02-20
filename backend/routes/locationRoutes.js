// ===========================================
// routes/locationRoutes.js
// All /api/location/* endpoints
// ===========================================

const express = require('express');
const router = express.Router();
const {
    updateLocation,
    getFriendsLocations,
    getMeetingHistory,
} = require('../controllers/locationController');
const { protect } = require('../middleware/auth');

// All location routes require the user to be logged in
router.use(protect);

// POST /api/location/update    — Send your current GPS location
router.post('/update', updateLocation);

// GET  /api/location/friends   — Get all friends' locations
router.get('/friends', getFriendsLocations);

// GET  /api/location/history   — Get meeting history log
router.get('/history', getMeetingHistory);

module.exports = router;
