const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add shared folder to watch folders
config.watchFolders = [
  path.resolve(__dirname, '../shared'),
];

// Add shared alias for cleaner imports
config.resolver.alias = {
  '@shared': path.resolve(__dirname, '../shared/src'),
};

module.exports = config;