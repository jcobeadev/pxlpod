// Typed access to the raw Poplab design tokens (packages/tokens/tokens.json).
//
// Prefer importing `colors` / `fontRoles` from here (or the `theme` barrel)
// over touching @poplab/tokens directly — this is the one place that should
// know the on-disk shape of the token package.
import tokens from "@poplab/tokens/tokens.json";

export type PoplabColorScale = {
  DEFAULT: string;
  [step: string]: string;
};

export type PoplabColors = {
  ink: string;
  amber: string;
  canvas: string;
  surface: PoplabColorScale;
  muted: PoplabColorScale;
  faint: PoplabColorScale;
  hairline: PoplabColorScale;
  ground: string;
};

export type PoplabFontRoles = {
  body: string;
  display: string;
};

export const colors: PoplabColors = tokens.color;
export const fontRoles: PoplabFontRoles = tokens.font;
