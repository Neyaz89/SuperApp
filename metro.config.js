const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backend folder from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
  /node_modules\/.*\/backend\/.*/,
];

// Exclude backend from watch folders
config.watchFolders = [__dirname];

module.exports = config;
