/**
 * Photo filters, as 4x5 colour matrices.
 *
 * Skia applies these on the GPU as part of the draw, so a filter costs
 * essentially nothing versus rendering unfiltered — which is what makes the
 * effects screen able to show six live previews of a 1200x1800 composite.
 *
 * Layout is row-major, 20 entries:
 *
 *   R' = m0·R  + m1·G  + m2·B  + m3·A  + m4
 *   G' = m5·R  + m6·G  + m7·B  + m8·A  + m9
 *   B' = m10·R + m11·G + m12·B + m13·A + m14
 *   A' = m15·R + m16·G + m17·B + m18·A + m19
 *
 * The offset column (m4, m9, m14) is in 0..1 units, not 0..255.
 */

export type ColorMatrix = readonly number[];

export interface Filter {
  id: string;
  label: string;
  matrix: ColorMatrix | null;
}

const IDENTITY: ColorMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

/**
 * Luminance weights. Not thirds — the eye is far more sensitive to green than
 * to blue, and an even split makes skin tones read muddy in black and white.
 */
const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

const NOIR: ColorMatrix = [
  // Slightly punchier than a straight desaturate: 1.15 contrast about mid-grey.
  LR * 1.15, LG * 1.15, LB * 1.15, 0, -0.075,
  LR * 1.15, LG * 1.15, LB * 1.15, 0, -0.075,
  LR * 1.15, LG * 1.15, LB * 1.15, 0, -0.075,
  0, 0, 0, 1, 0,
];

const VINTAGE: ColorMatrix = [
  // Sepia, then lifted blacks — the faded-print look, warm and low contrast.
  0.393, 0.769, 0.189, 0, 0.02,
  0.349, 0.686, 0.168, 0, 0.01,
  0.272, 0.534, 0.131, 0, 0.0,
  0, 0, 0, 1, 0,
];

const WARM: ColorMatrix = [
  // Gentle tungsten shift: reds up, blues down, greens untouched.
  1.10, 0, 0, 0, 0.02,
  0, 1.02, 0, 0, 0.0,
  0, 0, 0.90, 0, -0.01,
  0, 0, 0, 1, 0,
];

const FADE: ColorMatrix = [
  // Desaturate ~35% and lift the whole curve — washed, matte, very 2014.
  0.78, 0.14, 0.05, 0, 0.06,
  0.07, 0.85, 0.05, 0, 0.06,
  0.07, 0.14, 0.76, 0, 0.07,
  0, 0, 0, 1, 0,
];

const Y2K_FLASH: ColorMatrix = [
  // Hard on-camera flash: blown highlights, cool cast, crushed midtones.
  1.28, 0, 0, 0, -0.06,
  0, 1.24, 0, 0, -0.06,
  0, 0, 1.34, 0, -0.04,
  0, 0, 0, 1, 0,
];

export const FILTERS: readonly Filter[] = [
  { id: "original", label: "Original", matrix: null },
  { id: "vintage", label: "Vintage", matrix: VINTAGE },
  { id: "noir", label: "Noir", matrix: NOIR },
  { id: "warm", label: "Warm", matrix: WARM },
  { id: "fade", label: "Fade", matrix: FADE },
  { id: "y2k", label: "Y2K Flash", matrix: Y2K_FLASH },
];

export function filterById(id: string | null | undefined): Filter | undefined {
  if (!id) return FILTERS[0];
  return FILTERS.find((f) => f.id === id);
}

/**
 * Blend a filter toward identity, for the intensity slider.
 * `amount` of 0 returns identity, 1 returns the filter unchanged.
 */
export function scaleMatrix(matrix: ColorMatrix | null, amount: number): ColorMatrix | null {
  if (!matrix) return null;
  const t = Math.min(1, Math.max(0, amount));
  if (t === 1) return matrix;
  if (t === 0) return null;
  return matrix.map((v, i) => IDENTITY[i]! + (v - IDENTITY[i]!) * t);
}
