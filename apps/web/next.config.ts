import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript (with .ts import specifiers), so Next
  // has to transpile them rather than expect pre-built JS.
  transpilePackages: ["@poplab/api", "@poplab/template-spec", "@poplab/tokens"],
  images: {
    remotePatterns: [
      // Overlay artwork and album photos come from Supabase Storage.
      { protocol: "https", hostname: "plvosxnepmhbamjpjoxr.supabase.co" },
    ],
  },
};

export default nextConfig;
