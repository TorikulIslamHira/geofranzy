// ===========================================
// server.js — THE START BUTTON
//
// This is the main entry point of the backend.
// It sets up Express, Socket.io, connects to
// the database, and starts listening for requests.
// ===========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const { setSocketIO } = require('./controllers/locationController');

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const sosRoutes = require('./routes/sosRoutes');

// ===========================================
// 1. Initialize App & HTTP Server
// ===========================================
const app = express();
const httpServer = http.createServer(app); // We need an HTTP server for Socket.io

// ===========================================
// 2. Setup Socket.io (Real-time Engine)
// ===========================================
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
    },
});

// Make io accessible to controllers via app context
app.set('io', io);

// Give the location controller access to io
// so it can fire "NEARBY" alerts
setSocketIO(io);

// --- Socket.io Connection Handler ---
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Each user joins a "room" named after their userId
    // This lets us send private messages to any user
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their room`);
    });

    // "On My Way" — start sharing live location with a friend
    socket.on('onMyWay', ({ senderId, friendId, latitude, longitude, destination }) => {
        io.to(friendId).emit('friendOnMyWay', {
            type: 'ON_MY_WAY',
            from: senderId,
            location: { latitude, longitude },
            destination,
        });
    });

    // Battery level update — share with all friends
    socket.on('batteryUpdate', ({ userId, batteryLevel, friendIds }) => {
        friendIds.forEach((friendId) => {
            io.to(friendId).emit('friendBatteryUpdate', { userId, batteryLevel });
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

// ===========================================
// 3. Middleware
// ===========================================
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev'));  // Request logger (only in development)

// ===========================================
// 4. API Routes — Register all endpoints
// ===========================================
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/sos', sosRoutes);

// --- Health Check Endpoint ---
// Used by Render/Fly.io to verify the server is running
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Friend Locator API is running! 🚀' });
});

// --- 404 Handler ---
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ===========================================
// 5. Connect to Database & Start Server
// ===========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB(); // Connect to MongoDB Atlas first

    httpServer.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health Check: http://localhost:${PORT}/health\n`);
    });
};

startServer();
