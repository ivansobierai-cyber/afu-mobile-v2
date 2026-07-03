const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Metro fails to resolve some package "exports"/"main" fields with platform
// extensions (seen with expo-router → @radix-ui/react-slot). Prefer the
// hoisted package when present.
const radixSlotPath = path.resolve(
  __dirname,
  "node_modules/@radix-ui/react-slot",
);
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@radix-ui/react-slot": radixSlotPath,
};

const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@radix-ui/react-slot") {
    return {
      filePath: path.join(radixSlotPath, "dist", "index.js"),
      type: "sourceFile",
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
