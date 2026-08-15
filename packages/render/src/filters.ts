/**
 * Photo filters as 4x5 colour matrices.
 *
 * Plain numbers, no platform types — Skia takes them directly as a colour
 * filter, Canvas 2D applies them through an SVG filter, and Konva has a matrix
 * filter of its own. One definition means the thumbnail a guest taps, the
 * preview they approve and the file that reaches the printer are the same
 * transformation at three different sizes, rather than three approximations.
 *
 * Layout is row-major, each row [r, g, b, a, offset], offsets in 0..1.
 */

export interface Filter {
  id: string;
  label: string;
  matrix: readonly number[];
}

/** Rec. 709 luminance weights — how the eye actually weighs each channel. */
const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

/** Blend a matrix toward identity. 1 = full effect, 0 = none. */
export function withIntensity(matrix: readonly number[], intensity: number): number[] {
  const t = Math.max(0, Math.min(1, intensity));
  return matrix.map((v, i) => {
    const identity = IDENTITY[i]!;
    return identity + (v - identity) * t;
  });
}

export const IDENTITY: readonly number[] = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

export const FILTERS: readonly Filter[] = [
  {
    id: "original",
    label: "Original",
    matrix: IDENTITY,
  },
  {
    id: "vintage",
    label: "Vintage",
    // Warm sepia cast with lifted blacks, so shadows go milky rather than dense
    // — the look of a strip that has sat in a wallet for a year.
    matrix: [
      0.62, 0.35, 0.18, 0, 0.06,
      0.34, 0.60, 0.16, 0, 0.04,
      0.24, 0.32, 0.52, 0, 0.02,
      0,    0,    0,    1, 0,
    ],
  },
  {
    id: "noir",
    label: "Noir",
    // Luminance-weighted greyscale with contrast pushed and blacks held down.
    matrix: [
      LR * 1.28, LG * 1.28, LB * 1.28, 0, -0.08,
      LR * 1.28, LG * 1.28, LB * 1.28, 0, -0.08,
      LR * 1.28, LG * 1.28, LB * 1.28, 0, -0.08,
      0,         0,         0,         1, 0,
    ],
  },
  {
    id: "warm",
    label: "Warm",
    // Gentle golden-hour push. Deliberately mild: skin tones go orange fast,
    // and a booth photo is almost always a face.
    matrix: [
      1.08, 0.04, 0.00, 0, 0.02,
      0.02, 1.02, 0.00, 0, 0.01,
      0.00, 0.02, 0.92, 0, 0.00,
      0,    0,    0,    1, 0,
    ],
  },
  {
    id: "fade",
    label: "Fade",
    // Matte: compress the range and lift the floor. Reads well on paper, where
    // dye-sub blacks are dense enough to lose shadow detail.
    matrix: [
      0.86, 0.02, 0.02, 0, 0.10,
      0.02, 0.86, 0.02, 0, 0.10,
      0.02, 0.02, 0.86, 0, 0.11,
      0,    0,    0,    1, 0,
    ],
  },
  {
    id: "y2k",
    label: "Y2K Flash",
    // Hard contrast with a cool cast, imitating a direct on-camera flash.
    matrix: [
      1.30, -0.06, -0.04, 0, -0.10,
      -0.04, 1.26, -0.04, 0, -0.09,
      -0.02, -0.04, 1.34, 0, -0.06,
      0,     0,     0,    1, 0,
    ],
  },
];

export function filterById(id: string | null | undefined): Filter {
  return FILTERS.find((f) => f.id === id) ?? FILTERS[0]!;
}

/** CSS `filter: url(#id)` payload for the web booth's SVG filter definitions. */
export function toSvgColorMatrix(matrix: readonly number[]): string {
  return matrix.map((n) => Number(n.toFixed(4))).join(" ");
}
