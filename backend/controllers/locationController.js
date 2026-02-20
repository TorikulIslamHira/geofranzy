// ===========================================
// controllers/locationController.js
// Handles all location updates and proximity checks
//
// This is the CORE engine of the app.
// When a user updates their location, this
// checks all their friends' positions and
// fires a "NEARBY" alert if they are close.
// ===========================================

const Location = require('../models/Location');
const User = require('../models/User');
const MeetingHistory = require('../models/MeetingHistory');
const { getDistanceInMeters, getMidpoint } = require('../utils/distance');

// We will attach the socket.io instance to this module
let io;
const setSocketIO = (socketInstance) => { io = socketInstance; };

// In-memory tracker to avoid sending repeated nearby alerts
// Format: "userId1-userId2" -> timestamp of last alert
const recentAlerts = new Map();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between alerts

// -----------------------------------------------
// @desc    Update current user's location
// @route   POST /api/location/update
// @access  Private
// -----------------------------------------------
const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy, altitude, speed } = req.body;
        const userId = req.user._id;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
        }

        // --- STEP 1: Update or create the user's location record ---
        const myLocation = await Location.findOneAndUpdate(
            { user: userId },
            { latitude, longitude, accuracy, altitude, speed, updatedAt: new Date() },
            { upsert: true, new: true } // Create if doesn't exist
        );

        // --- STEP 2: Skip proximity check if user is in Ghost Mode ---
        const currentUser = await User.findById(userId).select('friends isGhostMode name avatar');
        if (currentUser.isGhostMode) {
            return res.status(200).json({ success: true, message: 'Location updated (Ghost Mode active).' });
        }

        // --- STEP 3: Get all friends' locations in ONE database query ---
        const friendLocations = await Location.find({ user: { $in: currentUser.friends } })
            .populate('user', 'name avatar isGhostMode');

        // --- STEP 4: Calculate distance to each friend ---
        const nearbyFriends = [];
        const NEARBY_THRESHOLD = parseInt(process.env.NEARBY_THRESHOLD_METERS) || 500;

        for (const friendLoc of friendLocations) {
            // Skip friends who have ghost mode on
            if (friendLoc.user.isGhostMode) continue;

            const distanceMeters = getDistanceInMeters(
                latitude, longitude,
                friendLoc.latitude, friendLoc.longitude
            );

            if (distanceMeters <= NEARBY_THRESHOLD) {
                nearbyFriends.push({ user: friendLoc.user, distanceMeters: Math.round(distanceMeters) });

                // --- STEP 5: Fire real-time socket notification (with cooldown) ---
                const alertKey = [userId.toString(), friendLoc.user._id.toString()].sort().join('-');
                const lastAlertTime = recentAlerts.get(alertKey);
                const now = Date.now();

                if (!lastAlertTime || (now - lastAlertTime) > ALERT_COOLDOWN_MS) {
                    recentAlerts.set(alertKey, now);

                    // Emit socket event to BOTH users
                    if (io) {
                        const alertPayload = {
                            type: 'NEARBY_ALERT',
                            message: `You are near ${friendLoc.user.name}!`,
                            distance: Math.round(distanceMeters),
                        };
                        io.to(userId.toString()).emit('nearbyAlert', { ...alertPayload, friend: friendLoc.user });
                        io.to(friendLoc.user._id.toString()).emit('nearbyAlert', {
                            ...alertPayload,
                            message: `You are near ${currentUser.name}!`,
                            friend: { _id: userId, name: currentUser.name, avatar: currentUser.avatar },
                        });

                        // --- STEP 6: Log the meeting to history ---
                        const midpoint = getMidpoint(latitude, longitude, friendLoc.latitude, friendLoc.longitude);
                        await MeetingHistory.create({
                            users: [userId, friendLoc.user._id],
                            location: { latitude: midpoint.latitude, longitude: midpoint.longitude },
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, nearbyFriends });
    } catch (error) {
        console.error('Update Location Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error updating location.' });
    }
};

// -----------------------------------------------
// @desc    Get locations of all user's friends
// @route   GET /api/location/friends
// @access  Private
// -----------------------------------------------
const getFriendsLocations = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id).select('friends');

        const locations = await Location.find({ user: { $in: currentUser.friends } })
            .populate('user', 'name avatar isGhostMode batteryLevel')
            .select('-__v');

        // Filter out ghost mode friends
        const visibleLocations = locations.filter(loc => !loc.user.isGhostMode);

        res.status(200).json({ success: true, locations: visibleLocations });
    } catch (error) {
        console.error('Get Friends Locations Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching locations.' });
    }
};

// -----------------------------------------------
// @desc    Get meeting history for current user
// @route   GET /api/location/history
// @access  Private
// -----------------------------------------------
const getMeetingHistory = async (req, res) => {
    try {
        const history = await MeetingHistory.find({ users: req.user._id })
            .populate('users', 'name avatar')
            .sort({ metAt: -1 }) // Newest meetings first
            .limit(50);

        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error('Get History Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching history.' });
    }
};

module.exports = { updateLocation, getFriendsLocations, getMeetingHistory, setSocketIO };
