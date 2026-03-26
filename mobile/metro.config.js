const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable watchman to avoid SHA-1 issues with paths containing 
// special characters (parentheses, Cyrillic in iCloud Drive path)
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [
    `${__dirname}/node_modules`,
];

module.exports = config;
