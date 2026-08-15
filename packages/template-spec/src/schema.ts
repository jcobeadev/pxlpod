import { z } from "zod";

/**
 * The Poplab template format.
 *
 * A template is a JSON document that describes how N captured photos become
 * one composed image. It is the contract between three renderers:
 *
 *   - the mobile app        (Skia, on device)
 *   - the web booth         (Canvas 2D, in the browser)
 *   - the operator console  (Konva, for authoring and preview)
 *
 * All three import THIS file. There is exactly one definition of where a slot
 * sits, so the three cannot drift apart.
 *
 * Coordinates are in canvas pixels with the origin at the top-left, and every
 * renderer scales the whole canvas uniformly. Never store a coordinate that has
 * already been scaled for a particular output size.
 */

/* ------------------------------------------------------------------ slots */

export const SlotShape = z.enum(["rect", "circle"]);
export type SlotShape = z.infer<typeof SlotShape>;

export const SlotFit = z.enum(["cover", "contain"]);
export type SlotFit = z.infer<typeof SlotFit>;

export const SlotSchema = z.object({
  /** Stable id. Survives reordering so the console can track a slot across edits. */
  id: z.string().min(1),

  /**
   * Which captured photo fills this window.
   *
   * Deliberately NOT the slot's position in the array. A double strip has eight
   * windows showing four photos — the same shots repeated in two columns that
   * get cut apart after printing. Several slots may share a photoIndex, and
   * `shotCount` is derived from the distinct values, never from `slots.length`.
   *
   * Automatic slot detection cannot infer this: a 2x2 sheet of four distinct
   * photos and a 4x2 cut-apart strip are geometrically identical. The operator
   * decides, in the Slot Mapper.
   */
  photoIndex: z.number().int().min(0),

  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),

  shape: SlotShape.default("rect"),
  /** Ignored unless shape is "rect". */
  cornerRadius: z.number().min(0).default(0),
  /** Degrees, clockwise, about the slot's own centre. */
  rotation: z.number().default(0),
  fit: SlotFit.default("cover"),
  /**
   * Mirror the photo horizontally when drawing. Front-camera capture is already
   * mirrored on screen; without this the printed strip reads back-to-front.
   */
  mirror: z.boolean().default(true),
});
export type Slot = z.infer<typeof SlotSchema>;

/* ----------------------------------------------------------------- layers */

/**
 * Tokens interpolated into text layers at render time. Lets one template stamp
 * every event without re-exporting artwork.
 */
export const TEXT_TOKENS = [
  "{event_name}",
  "{venue}",
  "{date}",
  "{year}",
  "{caption}",
  "{sequence}",
] as const;

const LayerBase = z.object({
  id: z.string().min(1),
  /** Paint order, ascending. Photos are always drawn at z = 0. */
  z: z.number().int(),
});

export const ImageLayerSchema = LayerBase.extend({
  type: z.literal("image"),
  /** Storage path within the tenant's `overlays` bucket. */
  src: z.string().min(1),
  opacity: z.number().min(0).max(1).default(1),
});

export const TextLayerSchema = LayerBase.extend({
  type: z.literal("text"),
  /** May contain any of TEXT_TOKENS. */
  text: z.string(),
  x: z.number(),
  y: z.number(),
  /** Wrap width in canvas px. Omit to lay out on a single line. */
  maxWidth: z.number().positive().optional(),
  font: z.string().default("Archivo"),
  size: z.number().positive(),
  weight: z.number().int().min(100).max(900).default(400),
  letterSpacing: z.number().default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  align: z.enum(["left", "center", "right"]).default("left"),
  uppercase: z.boolean().default(false),
  rotation: z.number().default(0),
});

export const LayerSchema = z.discriminatedUnion("type", [
  ImageLayerSchema,
  TextLayerSchema,
]);
export type Layer = z.infer<typeof LayerSchema>;

/* --------------------------------------------------------------- variants */

/**
 * A colourway of the same layout — the six supplied PNGs are really three
 * templates in white and black. Modelling them as variants halves the library
 * and lets the guest flip paper colour live on the effects screen.
 */
export const VariantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Overlay artwork for this colourway; replaces the base image layer's src. */
  overlay: z.string().min(1),
  /** Applied to every text layer that does not set its own colour. */
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  isDefault: z.boolean().default(false),
});
export type Variant = z.infer<typeof VariantSchema>;

/* ----------------------------------------------------------------- canvas */

/**
 * The print master. The six supplied overlays are 1200x1800 at 300dpi, which is
 * exactly 4x6in — the native page size of the DNP DS-RX1HS. Do not raise this
 * to chase sharpness: the RX1HS tops out at 6x8in, so a larger canvas is not
 * printable, only slower.
 *
 * Digital exports render the same canvas at DIGITAL_SCALE for retina and social.
 */
export const CanvasSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dpi: z.number().int().positive().default(300),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
});
export type Canvas = z.infer<typeof CanvasSchema>;

export const DIGITAL_SCALE = 2;

/* ---------------------------------------------------------------- capture */

export const CaptureSchema = z.object({
  /** Seconds. The guest can override in session setup. */
  defaultTimer: z.union([z.literal(3), z.literal(5), z.literal(10)]).default(3),
  allowRetakePerShot: z.boolean().default(true),
  /** Filter ids offered for this template; empty means all. */
  allowedFilters: z.array(z.string()).default([]),
});

export const GifSchema = z.object({
  enabled: z.boolean().default(true),
  width: z.number().int().positive().default(600),
  fps: z.number().positive().default(4),
  boomerang: z.boolean().default(true),
});

/* --------------------------------------------------------------- template */

export const TemplateCategory = z.enum(["strip", "combo", "classic", "fisheye"]);
export type TemplateCategory = z.infer<typeof TemplateCategory>;

export const TemplateSchema = z
  .object({
    version: z.literal(1),
    tenantId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().default(""),
    category: TemplateCategory,

    canvas: CanvasSchema,
    slots: z.array(SlotSchema).min(1),
    layers: z.array(LayerSchema).default([]),
    variants: z.array(VariantSchema).min(1),

    // Spelled out rather than `.default({})`: zod v4 types `.default()` against
    // the OUTPUT shape, so an empty object fails even though every field has
    // its own default.
    capture: CaptureSchema.default({
      defaultTimer: 3,
      allowRetakePerShot: true,
      allowedFilters: [],
    }),
    gif: GifSchema.default({
      enabled: true,
      width: 600,
      fps: 4,
      boomerang: true,
    }),

    /** Whether this template can be redeemed for paper at a live event. */
    printable: z.boolean().default(true),
  })
  .superRefine((t, ctx) => {
    const dup = (arr: string[]) =>
      arr.find((v, i) => arr.indexOf(v) !== i);

    const dupSlot = dup(t.slots.map((s) => s.id));
    if (dupSlot) {
      ctx.addIssue({
        code: "custom",
        path: ["slots"],
        message: `Duplicate slot id "${dupSlot}". Slot ids must be unique.`,
      });
    }

    const dupLayer = dup(t.layers.map((l) => l.id));
    if (dupLayer) {
      ctx.addIssue({
        code: "custom",
        path: ["layers"],
        message: `Duplicate layer id "${dupLayer}". Layer ids must be unique.`,
      });
    }

    // photoIndex must be a dense range starting at 0, or capture would ask for
    // a shot that no window displays.
    const used = [...new Set(t.slots.map((s) => s.photoIndex))].sort((a, b) => a - b);
    const expected = used.map((_, i) => i);
    if (used.join() !== expected.join()) {
      ctx.addIssue({
        code: "custom",
        path: ["slots"],
        message:
          `photoIndex values must run 0..n with no gaps; got [${used.join(", ")}]. ` +
          `Every captured photo needs at least one window.`,
      });
    }

    for (const s of t.slots) {
      if (s.x < 0 || s.y < 0 || s.x + s.w > t.canvas.width || s.y + s.h > t.canvas.height) {
        ctx.addIssue({
          code: "custom",
          path: ["slots"],
          message: `Slot "${s.id}" falls outside the ${t.canvas.width}x${t.canvas.height} canvas.`,
        });
      }
    }

    if (t.variants.filter((v) => v.isDefault).length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Exactly one variant must be marked isDefault.",
      });
    }
  });

export type Template = z.infer<typeof TemplateSchema>;

/* ------------------------------------------------------------- accessors */

/** Number of photos the capture flow must collect. Never `slots.length`. */
export function shotCount(t: Pick<Template, "slots">): number {
  return new Set(t.slots.map((s) => s.photoIndex)).size;
}

/** Every window that displays a given photo. */
export function slotsForPhoto(t: Pick<Template, "slots">, photoIndex: number): Slot[] {
  return t.slots.filter((s) => s.photoIndex === photoIndex);
}

/**
 * Aspect ratio (w/h) to mask the camera preview with for a given shot, so the
 * guest frames what will actually survive the crop.
 *
 * This genuinely varies by template — measured from the supplied artwork, the
 * single strip is 0.71 (portrait), the double strip 1.35 (landscape) and the
 * fish-eye 1.04 (near-square). A fixed full-bleed preview would mis-frame two
 * of the three.
 */
export function aspectForPhoto(t: Pick<Template, "slots">, photoIndex: number): number {
  const slots = slotsForPhoto(t, photoIndex);
  if (slots.length === 0) return 1;
  // Duplicated windows are identical; the first is representative.
  const s = slots[0]!;
  return s.w / s.h;
}
