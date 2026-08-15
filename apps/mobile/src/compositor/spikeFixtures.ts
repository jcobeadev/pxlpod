import { TemplateSchema, type Template, type Variant } from "@poplab/template-spec/schema";

import detected from "../../../../packages/template-spec/fixtures/detected-slots.json";

/**
 * Fixtures for the compositor spike.
 *
 * Builds real Template documents from the slot geometry that `detect_slots.py`
 * derived from the actual PXLPOD overlays, rather than from the database — the
 * spike is testing Skia, and a network round trip would only add a second way
 * for it to fail.
 *
 * Note the photoIndex assignment: the double strip repeats four shots across
 * eight windows, which is the operator's decision in the Slot Mapper and cannot
 * be inferred from geometry. Here it is hardcoded to match the artwork.
 */

export type SpikeCaseId = "single" | "double" | "fisheye";

interface SpikeCase {
  label: string;
  detectedKey: string;
  overlay: number;
  photos: number[];
  /** True when eight windows show four repeated shots. */
  duplicateColumns: boolean;
  category: Template["category"];
}

const PHOTOS = [
  require("../../assets/spike/shot-1.jpg"),
  require("../../assets/spike/shot-2.jpg"),
  require("../../assets/spike/shot-3.jpg"),
  require("../../assets/spike/shot-4.jpg"),
];

export const SPIKE_CASES: Record<SpikeCaseId, SpikeCase> = {
  single: {
    label: "Single",
    detectedKey: "single strip/SS-White.png",
    overlay: require("../../assets/spike/ss-white.png"),
    photos: PHOTOS,
    duplicateColumns: false,
    category: "classic",
  },
  double: {
    label: "Double",
    detectedKey: "double strip/DS-White.png",
    overlay: require("../../assets/spike/ds-white.png"),
    photos: PHOTOS,
    duplicateColumns: true,
    category: "strip",
  },
  fisheye: {
    label: "Fish-eye",
    detectedKey: "fish eye/2026-FS-SS-White.png",
    overlay: require("../../assets/spike/fisheye-white.png"),
    photos: PHOTOS,
    duplicateColumns: false,
    category: "fisheye",
  },
};

interface DetectedSlot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: "rect" | "circle";
}

interface DetectedEntry {
  canvas: { width: number; height: number };
  slots: DetectedSlot[];
}

export function loadSpikeTemplate(id: SpikeCaseId): { template: Template; variant: Variant } {
  const spec = SPIKE_CASES[id];
  const entry = (detected as Record<string, DetectedEntry>)[spec.detectedKey];
  if (!entry) {
    throw new Error(`No detected geometry for "${spec.detectedKey}"`);
  }

  const slots = entry.slots.map((s, i) => ({
    id: s.id,
    // Two columns of the same four shots, versus four distinct shots.
    photoIndex: spec.duplicateColumns ? Math.floor(i / 2) : i,
    x: s.x,
    y: s.y,
    w: s.w,
    h: s.h,
    shape: s.shape,
    cornerRadius: 0,
    rotation: 0,
    fit: "cover" as const,
    mirror: false,
  }));

  const variant: Variant = {
    id: "white",
    label: "White",
    overlay: "spike",
    textColor: "#14140F",
    isDefault: true,
  };

  // Parsed rather than cast, so the spike exercises the same validation the
  // console will run before publishing — including the dense-photoIndex rule.
  const template = TemplateSchema.parse({
    version: 1,
    tenantId: "9e605b70-4e7f-4aec-ade9-84c20b69d20d",
    name: spec.label,
    description: "",
    category: spec.category,
    canvas: { width: entry.canvas.width, height: entry.canvas.height, dpi: 300, background: "#FFFFFF" },
    slots,
    layers: [],
    variants: [variant],
    printable: true,
  });

  return { template, variant };
}
