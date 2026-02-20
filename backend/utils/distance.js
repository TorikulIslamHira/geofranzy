// ===========================================
// utils/distance.js
// Haversine Formula — calculates the distance
// between two GPS coordinates in meters.
//
// Used by the server to check if two friends
// are "nearby" each other.
// ===========================================

/**
 * Calculate the distance between two GPS points.
 * @param {number} lat1 - Latitude of Point 1
 * @param {number} lon1 - Longitude of Point 1
 * @param {number} lat2 - Latitude of Point 2
 * @param {number} lon2 - Longitude of Point 2
 * @returns {number} Distance in meters
 */
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters

    // Convert degrees to radians
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c; // Distance in meters
};

/**
 * Find the geographic midpoint between two coordinates.
 * Used for the "Meeting Point Finder" feature.
 * @returns {{ latitude: number, longitude: number }}
 */
const getMidpoint = (lat1, lon1, lat2, lon2) => {
    return {
        latitude: (lat1 + lat2) / 2,
        longitude: (lon1 + lon2) / 2,
    };
};

module.exports = { getDistanceInMeters, getMidpoint };
