const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude the react-native-css-interop cache directory from Metro's file
// watcher/haste map. With `forceWriteFileSystem: true`, NativeWind writes
// CSS output to this cache path continuously during bundling, which races
// with Metro trying to hash the same file (SHA-1) and causes builds to
// fail intermittently, especially on CI (static web export).
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  /node_modules\/react-native-css-interop\/\.cache\/.*/,
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
