/**
 * Guards against duplicate copies of context-carrying singletons.
 *
 * This exists because of a bug that cost real time: packages/api depended on
 * react and @tanstack/react-query directly, so pnpm was free to satisfy
 * react-native's `^19.2.0` peer with a newer React than the app's own. Two
 * physical Reacts meant two react-queries keyed off them, so
 * QueryClientProvider set context on one copy while useQuery read it from the
 * other. Every screen using a hook failed with "No QueryClient set" — with the
 * provider plainly visible in the tree, and with typecheck and the bundle both
 * perfectly happy.
 *
 * Any library that holds React context must be a single instance. Add it here.
 *
 *   node tools/verify_deps.mts
 */
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);

/** Packages whose duplication breaks context or hooks at runtime. */
const SINGLETONS = [
  "react",
  "react-native",
  "@tanstack/react-query",
  "react-native-safe-area-context",
  "@shopify/react-native-skia",
];

/** Workspaces that must agree on the above. */
const CONSUMERS = ["apps/mobile", "packages/api"];

let failures = 0;

for (const pkg of SINGLETONS) {
  const seen = new Map<string, string[]>();

  for (const consumer of CONSUMERS) {
    let resolved: string;
    try {
      resolved = require.resolve(pkg, { paths: [resolve(consumer)] });
    } catch {
      continue; // not a dependency of this workspace; fine.
    }
    // Collapse to the pnpm store directory, which is what actually identifies
    // a physical copy.
    const store = resolved.match(/node_modules\/\.pnpm\/([^/]+)/)?.[1] ?? resolved;
    const list = seen.get(store) ?? [];
    list.push(consumer);
    seen.set(store, list);
  }

  if (seen.size > 1) {
    failures++;
    console.log(`FAIL  ${pkg} — ${seen.size} copies:`);
    for (const [store, consumers] of seen) {
      console.log(`        ${store}  <- ${consumers.join(", ")}`);
    }
  } else if (seen.size === 1) {
    console.log(`ok    ${pkg.padEnd(34)} single copy`);
  }
}

if (failures > 0) {
  console.log(
    `\n${failures} duplicated package(s). Fix by making the library peer-depend ` +
      `on it rather than depend on it, and/or pinning the version under ` +
      `\`overrides\` in pnpm-workspace.yaml (NOT package.json — pnpm 11 ignores it there).`,
  );
  process.exit(1);
}

console.log("\nALL SINGLETON CHECKS PASSED");
