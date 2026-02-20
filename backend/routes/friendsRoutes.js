// ===========================================
// routes/friendsRoutes.js
// All /api/friends/* endpoints
// ===========================================

const express = require('express');
const router = express.Router();
const {
    searchUsers,
    addFriend,
    removeFriend,
    getMeetingPoint,
    toggleGhostMode,
} = require('../controllers/friendsController');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET    /api/friends/search?q=query  — Search for users
router.get('/search', searchUsers);

// POST   /api/friends/add             — Add a friend
router.post('/add', addFriend);

// DELETE /api/friends/remove/:friendId — Remove a friend
router.delete('/remove/:friendId', removeFriend);

// GET    /api/friends/meetpoint/:friendId — Find meeting point
router.get('/meetpoint/:friendId', getMeetingPoint);

// PATCH  /api/friends/ghostmode       — Toggle ghost mode
router.patch('/ghostmode', toggleGhostMode);

module.exports = router;
