const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Monorepo wiring. Without it Metro watches only apps/mobile, so an edit to
// packages/template-spec or packages/render never reaches the running app —
// and with pnpm it also has to be told to look in the workspace root's
// node_modules, since dependencies are not nested under the app.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// NOTE: do not set `disableHierarchicalLookup`. It is in every npm/yarn
// monorepo recipe, and it breaks this one: pnpm keeps transitive dependencies
// inside node_modules/.pnpm/... rather than hoisting them all, and hierarchical
// lookup is exactly what walks up to find them. Setting it fails the build on
// `@expo/metro-runtime` before it renders a single screen.

module.exports = withNativeWind(config, { input: "./global.css" });
