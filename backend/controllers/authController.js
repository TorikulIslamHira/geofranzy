// ===========================================
// controllers/authController.js
// Handles user registration and login
// ===========================================

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// -----------------------------------------------
// @desc    Register a new user with Email & Password
// @route   POST /api/auth/register
// @access  Public
// -----------------------------------------------
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if a user with this email already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email already exists.',
            });
        }

        // Create the new user (password is hashed automatically by the model hook)
        const user = await User.create({ name, email, password });

        // Return user data + a login token
        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isGhostMode: user.isGhostMode,
            },
        });
    } catch (error) {
        console.error('Register Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// -----------------------------------------------
// @desc    Login with Email & Password
// @route   POST /api/auth/login
// @access  Public
// -----------------------------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user and include their password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.password || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isGhostMode: user.isGhostMode,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// -----------------------------------------------
// @desc    Google / Social OAuth Login
// @route   POST /api/auth/google
// @access  Public
// Receives: { googleId, name, email, avatar }
// -----------------------------------------------
const socialLogin = async (req, res) => {
    try {
        const { googleId, name, email, avatar } = req.body;

        // Find existing user or create a new one
        let user = await User.findOne({ email });

        if (!user) {
            // New user — create an account from their Google profile
            user = await User.create({ googleId, name, email, avatar });
        } else if (!user.googleId) {
            // Existing email account — link the Google ID to it
            user.googleId = googleId;
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save();
        }

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isGhostMode: user.isGhostMode,
            },
        });
    } catch (error) {
        console.error('Social Login Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during social login.' });
    }
};

// -----------------------------------------------
// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (requires login token)
// -----------------------------------------------
const getMe = async (req, res) => {
    // req.user is attached by our auth middleware
    res.status(200).json({ success: true, user: req.user });
};

module.exports = { register, login, socialLogin, getMe };
