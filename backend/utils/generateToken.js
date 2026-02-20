// ===========================================
// utils/generateToken.js
// Creates a signed JWT (login token) for a user
// ===========================================

const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId }, // Payload: what we encode in the token
        process.env.JWT_SECRET, // Secret key
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' } // Expiry
    );
};

module.exports = generateToken;
