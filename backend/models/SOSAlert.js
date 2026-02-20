// ===========================================
// models/SOSAlert.js
// Records emergency SOS alerts sent by users
// ===========================================

const mongoose = require('mongoose');

const SOSAlertSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        location: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        batteryLevel: {
            type: Number,
            default: null,
        },
        message: {
            type: String,
            default: '🆘 Emergency! I need help!',
        },
        // Who was notified (list of friend IDs)
        notifiedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isResolved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SOSAlert', SOSAlertSchema);
