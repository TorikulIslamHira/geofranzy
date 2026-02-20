// ===========================================
// models/User.js
// The "Blueprint" for what a User looks like
// in the database
// ===========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        // --- Basic Info ---
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            minlength: 6,
            select: false, // Never return password in queries by default
        },
        avatar: {
            type: String,
            default: '', // URL to profile picture (from Google, etc.)
        },

        // --- Social Auth ---
        googleId: { type: String, default: null },

        // --- Friends ---
        // Stores the IDs of friends the user has added
        friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        // --- Privacy Settings ---
        isGhostMode: {
            type: Boolean,
            default: false, // When true, the user is invisible to other friends
        },

        // --- Push Notifications ---
        // FCM Token used to send push notifications to this user's device
        fcmToken: {
            type: String,
            default: null,
        },

        // --- Battery ---
        batteryLevel: {
            type: Number, // 0-100 (percentage)
            default: null,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// --- Hook: Hash password before saving to database ---
UserSchema.pre('save', async function (next) {
    // Only hash if password was actually modified (not on social logins)
    if (!this.isModified('password') || !this.password) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- Method: Compare entered password with hashed one in DB ---
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
