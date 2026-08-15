// Framework-agnostic shape of the Poplab Tailwind preset, kept free of a
// direct `tailwindcss` dependency so it can be consumed by apps pinned to
// different major versions (apps/web -> v4, apps/mobile -> v3 via NativeWind).

export interface PoplabColorScale {
  DEFAULT: string;
  [step: string]: string;
}

export interface PoplabTailwindPreset {
  theme: {
    extend: {
      colors: {
        ink: string;
        amber: string;
        canvas: string;
        surface: PoplabColorScale;
        muted: PoplabColorScale;
        faint: PoplabColorScale;
        hairline: PoplabColorScale;
        ground: string;
      };
      fontFamily: {
        body: string[];
        display: string[];
      };
    };
  };
}

declare const preset: PoplabTailwindPreset;
export = preset;
