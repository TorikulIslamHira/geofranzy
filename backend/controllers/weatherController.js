// ===========================================
// controllers/weatherController.js
// Fetches weather data and handles sharing
// Uses OpenWeatherMap FREE API
// ===========================================

const axios = require('axios');
const User = require('../models/User');

// -----------------------------------------------
// @desc    Get weather at specific coordinates
// @route   GET /api/weather?lat=XX&lon=YY
// @access  Private
// -----------------------------------------------
const getWeatherAtLocation = async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ success: false, message: 'Latitude (lat) and longitude (lon) are required.' });
        }

        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        const response = await axios.get(url);
        const data = response.data;

        // Extract only the fields we need
        const weatherData = {
            city: data.name,
            country: data.sys.country,
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            condition: data.weather[0].main,       // e.g., "Rain", "Clear"
            description: data.weather[0].description, // e.g., "light rain"
            icon: data.weather[0].icon,            // e.g., "10d"
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
        };

        res.status(200).json({ success: true, weather: weatherData });
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ success: false, message: 'Invalid OpenWeatherMap API key.' });
        }
        console.error('Weather Fetch Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch weather data.' });
    }
};

// -----------------------------------------------
// @desc    Share your weather with a specific friend
// @route   POST /api/weather/share
// @access  Private
// Body:    { friendId, lat, lon }
// -----------------------------------------------
const shareWeatherWithFriend = async (req, res) => {
    let io;
    try {
        // We'll get io from the app context (set in server.js)
        io = req.app.get('io');
        const { friendId, lat, lon } = req.body;

        if (!friendId || !lat || !lon) {
            return res.status(400).json({ success: false, message: 'friendId, lat, and lon are required.' });
        }

        // Verify friendship
        const sender = await User.findById(req.user._id).select('friends name avatar');
        if (!sender.friends.map(f => f.toString()).includes(friendId)) {
            return res.status(403).json({ success: false, message: 'You can only share weather with your friends.' });
        }

        // Fetch the weather
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;

        const weatherPayload = {
            type: 'WEATHER_SHARE',
            from: { name: sender.name, avatar: sender.avatar },
            weather: {
                city: data.name,
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                condition: data.weather[0].main,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
            },
            sentAt: new Date().toISOString(),
        };

        // Send via Socket.io to the friend in real-time
        if (io) {
            io.to(friendId).emit('weatherShare', weatherPayload);
        }

        res.status(200).json({ success: true, message: 'Weather shared successfully!', data: weatherPayload });
    } catch (error) {
        console.error('Share Weather Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to share weather.' });
    }
};

module.exports = { getWeatherAtLocation, shareWeatherWithFriend };
