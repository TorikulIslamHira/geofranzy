// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution.
// This allows packages like axios (v1.x) to correctly resolve their
// "react-native" condition instead of falling back to the Node.js bundle,
// which would import Node-only modules (e.g. `crypto`) unavailable in RN.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
