import type { Config } from "tailwindcss";
import poplabPreset from "@poplab/tokens";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [poplabPreset as unknown as Partial<Config>],
};

export default config;
