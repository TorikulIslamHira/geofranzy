// ===========================================
// models/MeetingHistory.js
// A log of when two friends were near each other
// Saved automatically by the server
// ===========================================

const mongoose = require('mongoose');

const MeetingHistorySchema = new mongoose.Schema(
    {
        // The two users who met
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        // Where they met (approximate center point)
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            placeName: { type: String, default: 'Unknown Location' }, // e.g. "Downtown, Dhaka"
        },
        // How long they were together (in minutes)
        durationMinutes: {
            type: Number,
            default: 0,
        },
        metAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MeetingHistory', MeetingHistorySchema);
