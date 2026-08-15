/// <reference types="nativewind/types" />

// `app/_layout.tsx` imports `../global.css` for its side effect — that import is
// what Metro's NativeWind transformer hooks to compile the Tailwind output into
// the bundle. TypeScript has no notion of a CSS module, so without this the
// whole app fails to typecheck on an import that is doing exactly what it should.
declare module "*.css";
