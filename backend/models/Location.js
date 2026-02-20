// ===========================================
// models/Location.js
// Stores the LATEST location for each user
// We only keep the most recent one per user
// ===========================================

const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One location record per user
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        accuracy: {
            type: Number, // GPS accuracy in meters
            default: null,
        },
        // "Geohash" for efficient proximity searches
        // (A short string code that represents a geographic area)
        altitude: {
            type: Number,
            default: null,
        },
        speed: {
            type: Number, // meters per second
            default: null,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Location', LocationSchema);
