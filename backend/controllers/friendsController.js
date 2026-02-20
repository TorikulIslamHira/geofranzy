// ===========================================
// controllers/friendsController.js
// Handles friend requests, listing, and
// the Meeting Point Finder feature
// ===========================================

const User = require('../models/User');
const Location = require('../models/Location');
const { getMidpoint } = require('../utils/distance');
const axios = require('axios');

// -----------------------------------------------
// @desc    Search for users by name or email
// @route   GET /api/friends/search?q=query
// @access  Private
// -----------------------------------------------
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters.' });
        }

        // Find users matching name or email, excluding the current user
        const users = await User.find({
            $and: [
                { _id: { $ne: req.user._id } },
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { email: { $regex: q, $options: 'i' } },
                    ],
                },
            ],
        }).select('name email avatar').limit(20);

        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error searching users.' });
    }
};

// -----------------------------------------------
// @desc    Add a friend (mutual relationship)
// @route   POST /api/friends/add
// @access  Private
// Body:    { friendId }
// -----------------------------------------------
const addFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user._id;

        if (friendId === userId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot add yourself as a friend.' });
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Add each user to the other's friends list (if not already there)
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } });

        res.status(200).json({ success: true, message: `You and ${friend.name} are now friends!` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error adding friend.' });
    }
};

// -----------------------------------------------
// @desc    Remove a friend
// @route   DELETE /api/friends/remove/:friendId
// @access  Private
// -----------------------------------------------
const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        res.status(200).json({ success: true, message: 'Friend removed.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error removing friend.' });
    }
};

// -----------------------------------------------
// @desc    Get meeting point suggestion between two users
// @route   GET /api/friends/meetpoint/:friendId
// @access  Private
// -----------------------------------------------
const getMeetingPoint = async (req, res) => {
    try {
        const { friendId } = req.params;

        // Get both users' locations
        const myLocation = await Location.findOne({ user: req.user._id });
        const friendLocation = await Location.findOne({ user: friendId });

        if (!myLocation || !friendLocation) {
            return res.status(404).json({ success: false, message: 'Location data not available for both users.' });
        }

        // Find the geographic midpoint
        const midpoint = getMidpoint(
            myLocation.latitude, myLocation.longitude,
            friendLocation.latitude, friendLocation.longitude
        );

        // Search for cafes/parks near the midpoint using Overpass API (FREE, no key needed)
        const overpassUrl = `https://overpass-api.de/api/interpreter`;
        const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="cafe"](around:1000,${midpoint.latitude},${midpoint.longitude});
        node["leisure"="park"](around:1000,${midpoint.latitude},${midpoint.longitude});
      );
      out body 5;
    `;

        let places = [];
        try {
            const overpassResponse = await axios.post(overpassUrl, `data=${encodeURIComponent(overpassQuery)}`);
            places = overpassResponse.data.elements.map(el => ({
                name: el.tags.name || 'Unnamed Place',
                type: el.tags.amenity || el.tags.leisure,
                latitude: el.lat,
                longitude: el.lon,
            }));
        } catch (overpassError) {
            // Overpass can be slow — still return the midpoint even if places fail
            console.warn('Overpass API unavailable:', overpassError.message);
        }

        res.status(200).json({
            success: true,
            midpoint,
            suggestedPlaces: places,
        });
    } catch (error) {
        console.error('Meeting Point Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error finding meeting point.' });
    }
};

// -----------------------------------------------
// @desc    Toggle Ghost Mode on/off
// @route   PATCH /api/friends/ghostmode
// @access  Private
// -----------------------------------------------
const toggleGhostMode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.isGhostMode = !user.isGhostMode;
        await user.save();
        res.status(200).json({ success: true, isGhostMode: user.isGhostMode });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error toggling ghost mode.' });
    }
};

module.exports = { searchUsers, addFriend, removeFriend, getMeetingPoint, toggleGhostMode };
