const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// GitHub Actions (and most CI providers) automatically set CI=true.
// `forceWriteFileSystem: true` makes NativeWind continuously write its
// generated CSS to node_modules/react-native-css-interop/.cache/web.css
// while Metro is bundling. On CI (e.g. static web export), this causes a
// race condition where Metro tries to hash that file (SHA-1) while it's
// still being written/rewritten, making the build fail intermittently.
// This flag is only needed to fix iOS styling in local development, so we
// disable it whenever running in CI.
const isCI = process.env.CI === "true" || process.env.CI === "1";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules.
  // This fixes iOS styling issues in local development mode, but must be
  // disabled on CI (see comment above) to avoid a Metro SHA-1 race
  // condition during static web export.
  forceWriteFileSystem: !isCI,
});
