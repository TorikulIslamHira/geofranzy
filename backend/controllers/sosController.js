// ===========================================
// controllers/sosController.js
// Handles Emergency SOS alerts
//
// Sends an instant real-time alert to ALL
// of the user's friends with their location
// and battery level.
// ===========================================

const SOSAlert = require('../models/SOSAlert');
const User = require('../models/User');

// -----------------------------------------------
// @desc    Send an SOS alert to all friends
// @route   POST /api/sos/send
// @access  Private
// Body:    { latitude, longitude, batteryLevel?, message? }
// -----------------------------------------------
const sendSOS = async (req, res) => {
    try {
        const io = req.app.get('io');
        const { latitude, longitude, batteryLevel, message } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Location is required for SOS.' });
        }

        // Get sender's info and friends list
        const sender = await User.findById(req.user._id).select('name avatar friends batteryLevel');

        // Update battery level if provided
        if (batteryLevel !== undefined) {
            sender.batteryLevel = batteryLevel;
            await sender.save();
        }

        const sosMessage = message || '🆘 I need help! This is an emergency!';

        // Create the SOS record in the database
        const sosAlert = await SOSAlert.create({
            sender: req.user._id,
            location: { latitude, longitude },
            batteryLevel: batteryLevel || sender.batteryLevel,
            message: sosMessage,
            notifiedUsers: sender.friends,
        });

        // Broadcast to ALL friends via Socket.io instantly
        if (io) {
            const sosPayload = {
                type: 'SOS_ALERT',
                from: { _id: req.user._id, name: sender.name, avatar: sender.avatar },
                location: { latitude, longitude },
                batteryLevel: batteryLevel || null,
                message: sosMessage,
                sentAt: new Date().toISOString(),
                alertId: sosAlert._id,
            };

            // Send to all friends' socket rooms
            sender.friends.forEach((friendId) => {
                io.to(friendId.toString()).emit('sosAlert', sosPayload);
            });
        }

        res.status(200).json({ success: true, message: 'SOS alert sent to all friends.' });
    } catch (error) {
        console.error('SOS Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error sending SOS.' });
    }
};

// -----------------------------------------------
// @desc    Resolve/cancel an active SOS alert
// @route   PATCH /api/sos/resolve/:alertId
// @access  Private
// -----------------------------------------------
const resolveSOS = async (req, res) => {
    try {
        const io = req.app.get('io');
        const alert = await SOSAlert.findById(req.params.alertId);

        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
        if (alert.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized.' });
        }

        alert.isResolved = true;
        await alert.save();

        // Notify friends the user is safe
        if (io) {
            alert.notifiedUsers.forEach((friendId) => {
                io.to(friendId.toString()).emit('sosResolved', {
                    type: 'SOS_RESOLVED',
                    alertId: alert._id,
                    message: `${req.user.name} is now safe! ✅`,
                });
            });
        }

        res.status(200).json({ success: true, message: 'SOS resolved. Friends have been notified you are safe.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error resolving SOS.' });
    }
};

module.exports = { sendSOS, resolveSOS };
