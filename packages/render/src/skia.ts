import {
  Skia,
  ImageFormat,
  type SkImage,
  type SkCanvas,
  type SkSurface,
} from "@shopify/react-native-skia";
import {
  planSlots,
  outputSize,
  scaleFor,
  resolveTokens,
  type RenderTarget,
  type SourcePhoto,
  type SlotDraw,
} from "@poplab/template-spec/layout";
import type { Template, Variant } from "@poplab/template-spec/schema";
import { filterById, withIntensity } from "./filters.ts";

/**
 * The production compositor.
 *
 * Draws a finished strip at full print resolution on an offscreen Skia surface.
 * Geometry comes entirely from `planSlots()` — the same call the web booth and
 * the console preview make — so this file's only job is to honour a plan that
 * is already correct, never to compute one.
 *
 * Memory is the live hazard. A 1200x1800 RGBA surface is ~8.6 MB and the
 * digital target is four times that, before counting the decoded source photos
 * and the overlay. Everything here is disposed explicitly and renders are
 * serialised; see `renderStrip`'s guard.
 */

export interface RenderRequest {
  template: Template;
  /** Decoded captures, indexed to match each slot's photoIndex. */
  photos: ReadonlyArray<{ image: SkImage; flipHorizontal?: boolean }>;
  /** Overlay artwork for the chosen colourway, already decoded. */
  overlay: SkImage;
  variant: Variant;
  target: RenderTarget;
  filterId?: string;
  /** 0..1. Ignored for the identity filter. */
  filterIntensity?: number;
  /** Values for {event_name}-style tokens in text layers. */
  tokens?: Record<string, string | undefined>;
  /** JPEG quality, 0..100. */
  quality?: number;
}

export interface RenderResult {
  bytes: Uint8Array;
  width: number;
  height: number;
}

let inFlight: Promise<unknown> | null = null;

/**
 * Compose a strip and encode it as JPEG.
 *
 * Serialised deliberately: two concurrent print-resolution renders on a
 * mid-range Android is the reliable way to get killed for memory, and the
 * guest cannot perceive the difference between parallel and sequential here.
 */
export async function renderStrip(req: RenderRequest): Promise<RenderResult> {
  while (inFlight) await inFlight.catch(() => undefined);
  const run = renderStripUnsafe(req);
  inFlight = run;
  try {
    return await run;
  } finally {
    inFlight = null;
  }
}

async function renderStripUnsafe(req: RenderRequest): Promise<RenderResult> {
  const { template, photos, overlay, variant, target } = req;
  const size = outputSize(template.canvas, target);
  const scale = scaleFor(target);

  const surface: SkSurface | null = Skia.Surface.MakeOffscreen(size.width, size.height);
  if (!surface) {
    throw new Error(
      `Could not allocate a ${size.width}x${size.height} Skia surface. ` +
        `On a low-memory device, fall back to the "print" target before giving up.`,
    );
  }

  try {
    const canvas = surface.getCanvas();

    const bg = Skia.Paint();
    bg.setColor(Skia.Color(template.canvas.background));
    canvas.drawRect({ x: 0, y: 0, width: size.width, height: size.height }, bg);

    const plan = planSlots(
      template,
      photos.map<SourcePhoto>((p) => ({
        width: p.image.width(),
        height: p.image.height(),
        flipHorizontal: p.flipHorizontal,
      })),
      target,
    );

    const photoPaint = Skia.Paint();
    const filter = filterById(req.filterId);
    const matrix =
      req.filterIntensity === undefined
        ? filter.matrix
        : withIntensity(filter.matrix, req.filterIntensity);
    if (filter.id !== "original") {
      photoPaint.setColorFilter(Skia.ColorFilter.MakeMatrix([...matrix]));
    }

    for (const draw of plan) {
      const photo = photos[draw.slot.photoIndex];
      if (!photo) continue;
      drawSlot(canvas, draw, photo.image, photoPaint);
    }

    // The overlay goes on last, and its punched-through alpha is what actually
    // masks each window — which is why a circular slot needs no path clip in
    // this path. The clip below is belt-and-braces for templates whose artwork
    // does not fully cover the area around a window.
    canvas.drawImageRect(
      overlay,
      { x: 0, y: 0, width: overlay.width(), height: overlay.height() },
      { x: 0, y: 0, width: size.width, height: size.height },
      Skia.Paint(),
    );

    drawTextLayers(canvas, template, variant, scale, req.tokens ?? {});

    const snapshot = surface.makeImageSnapshot();
    try {
      const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, req.quality ?? 92);
      if (!bytes) throw new Error("Skia returned no bytes when encoding the strip.");
      return { bytes, width: size.width, height: size.height };
    } finally {
      snapshot.dispose();
    }
  } finally {
    surface.dispose();
  }
}

function drawSlot(canvas: SkCanvas, draw: SlotDraw, image: SkImage, paint: ReturnType<typeof Skia.Paint>) {
  const { dest, src, clip, rotation, mirror } = draw;

  canvas.save();

  // Clip to the window before any transform, so the shape stays put while the
  // image inside it is flipped or rotated.
  if (clip.shape === "circle") {
    const path = Skia.Path.Make();
    path.addOval({ x: dest.x, y: dest.y, width: dest.w, height: dest.h });
    canvas.clipPath(path, 1 /* Intersect */, true /* antialias */);
  } else if (clip.cornerRadius > 0) {
    canvas.clipRRect(
      {
        rect: { x: dest.x, y: dest.y, width: dest.w, height: dest.h },
        topLeft: { x: clip.cornerRadius, y: clip.cornerRadius },
        topRight: { x: clip.cornerRadius, y: clip.cornerRadius },
        bottomRight: { x: clip.cornerRadius, y: clip.cornerRadius },
        bottomLeft: { x: clip.cornerRadius, y: clip.cornerRadius },
      },
      1,
      true,
    );
  } else {
    canvas.clipRect({ x: dest.x, y: dest.y, width: dest.w, height: dest.h }, 1, true);
  }

  const cx = dest.x + dest.w / 2;
  const cy = dest.y + dest.h / 2;

  if (rotation !== 0) {
    canvas.translate(cx, cy);
    canvas.rotate(rotation, 0, 0);
    canvas.translate(-cx, -cy);
  }

  if (mirror) {
    canvas.translate(cx, cy);
    canvas.scale(-1, 1);
    canvas.translate(-cx, -cy);
  }

  canvas.drawImageRect(
    image,
    { x: src.x, y: src.y, width: src.w, height: src.h },
    { x: dest.x, y: dest.y, width: dest.w, height: dest.h },
    paint,
  );

  canvas.restore();
}

function drawTextLayers(
  canvas: SkCanvas,
  template: Template,
  variant: Variant,
  scale: number,
  tokens: Record<string, string | undefined>,
) {
  const texts = template.layers
    .filter((l): l is Extract<typeof l, { type: "text" }> => l.type === "text")
    .sort((a, b) => a.z - b.z);

  for (const layer of texts) {
    const resolved = resolveTokens(layer.text, tokens);
    if (!resolved.trim()) continue;

    const face = Skia.FontMgr.System().matchFamilyStyle(layer.font, {
      weight: layer.weight,
    });
    if (!face) continue;

    const font = Skia.Font(face, layer.size * scale);
    const paint = Skia.Paint();
    // A layer may set its own colour; otherwise it inherits the colourway's,
    // which is how one template serves both the white and black paper.
    paint.setColor(Skia.Color(layer.color || variant.textColor));

    const body = layer.uppercase ? resolved.toUpperCase() : resolved;
    const width = font.measureText(body).width;
    const x =
      layer.align === "center"
        ? layer.x * scale - width / 2
        : layer.align === "right"
          ? layer.x * scale - width
          : layer.x * scale;

    canvas.save();
    if (layer.rotation !== 0) {
      canvas.translate(layer.x * scale, layer.y * scale);
      canvas.rotate(layer.rotation, 0, 0);
      canvas.translate(-layer.x * scale, -layer.y * scale);
    }
    canvas.drawText(body, x, layer.y * scale, paint, font);
    canvas.restore();
  }
}

