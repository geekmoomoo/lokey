const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const sharedRoot = path.resolve(__dirname, '..', '..');

config.watchFolders = [...(config.watchFolders || []), sharedRoot];

module.exports = config;
