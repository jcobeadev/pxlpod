import {
  Skia,
  ImageFormat,
  type SkImage,
  type SkSurface,
  type SkCanvas,
  type SkPaint,
} from "@shopify/react-native-skia";
import {
  planSlots,
  outputSize,
  resolveTokens,
  type RenderTarget,
  type SourcePhoto,
} from "@poplab/template-spec/layout";
import type { Template, Variant } from "@poplab/template-spec/schema";

import { filterById, scaleMatrix, type ColorMatrix } from "./filters";

/**
 * The Skia compositor.
 *
 * Consumes the SAME `planSlots()` output as the web booth's Canvas 2D renderer
 * and the console's Konva preview. This file contains no geometry of its own —
 * if a slot lands in the wrong place, the bug is in @poplab/template-spec and
 * all three surfaces are wrong together, which is the point.
 *
 * Memory is the real constraint here. A 1200x1800 RGBA surface is ~8.6MB and a
 * digital export at 2400x3600 is ~34MB, on top of one decoded SkImage per
 * source photo. Every Skia object below is disposed explicitly rather than left
 * to the GC, because on a mid-range Android the GC will not run in time and the
 * process is killed instead.
 */

export interface ComposePhoto extends SourcePhoto {
  /** file:// or content:// URI of the captured frame. */
  uri: string;
}

export interface ComposeOptions {
  template: Template;
  variant: Variant;
  photos: ReadonlyArray<ComposePhoto>;
  /** Resolved URI for the variant's overlay artwork. */
  overlayUri: string;
  target?: RenderTarget;
  filterId?: string | null;
  /** 0..1, for the effects screen's intensity slider. */
  filterAmount?: number;
  /** Values for {event_name}-style tokens in text layers. */
  tokens?: Record<string, string | undefined>;
  /** JPEG quality, 0..100. */
  quality?: number;
}

export interface ComposeResult {
  bytes: Uint8Array;
  width: number;
  height: number;
}

/** Loads and decodes one image, or throws with the URI that failed. */
async function loadImage(uri: string): Promise<SkImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  // The SkData is copied into the image; holding it only wastes memory.
  data.dispose();
  if (!image) {
    throw new Error(`Could not decode image at ${uri}`);
  }
  return image;
}

function paintFor(matrix: ColorMatrix | null): SkPaint {
  const paint = Skia.Paint();
  paint.setAntiAlias(true);
  if (matrix) {
    paint.setColorFilter(Skia.ColorFilter.MakeMatrix([...matrix]));
  }
  return paint;
}

/**
 * Composes the finished image.
 *
 * Returns encoded bytes rather than writing a file, so this stays a pure
 * function the caller can persist, upload or hand to a preview as it likes.
 */
export async function compose(opts: ComposeOptions): Promise<ComposeResult> {
  const {
    template,
    variant,
    photos,
    overlayUri,
    target = "print",
    filterId = null,
    filterAmount = 1,
    tokens = {},
    quality = 92,
  } = opts;

  const size = outputSize(template.canvas, target);
  const plan = planSlots(template, photos, target);
  const matrix = scaleMatrix(filterById(filterId)?.matrix ?? null, filterAmount);

  const surface: SkSurface | null = Skia.Surface.MakeOffscreen(size.width, size.height);
  if (!surface) {
    throw new Error(
      `Could not allocate a ${size.width}x${size.height} Skia surface. ` +
        `This is almost always memory pressure — try target "print" rather than "digital".`,
    );
  }

  // Everything allocated below, disposed in reverse in the finally block.
  const loaded: SkImage[] = [];

  try {
    const canvas: SkCanvas = surface.getCanvas();

    // 1. Paper.
    canvas.clear(Skia.Color(template.canvas.background));

    // 2. Photos, one draw per window. Decode each source once even when several
    //    windows share it — a double strip draws four photos into eight windows.
    const decoded = new Map<number, SkImage>();
    for (const draw of plan) {
      let img = decoded.get(draw.slot.photoIndex);
      if (!img) {
        const photo = photos[draw.slot.photoIndex];
        if (!photo) throw new Error(`Missing photo ${draw.slot.photoIndex}`);
        img = await loadImage(photo.uri);
        decoded.set(draw.slot.photoIndex, img);
        loaded.push(img);
      }

      const paint = paintFor(matrix);
      const dest = Skia.XYWHRect(draw.dest.x, draw.dest.y, draw.dest.w, draw.dest.h);
      const src = Skia.XYWHRect(draw.src.x, draw.src.y, draw.src.w, draw.src.h);

      canvas.save();

      // Clip to the window. In practice the overlay's punched-through alpha
      // already masks each window — verified against all three PXLPOD
      // templates — so this only matters for templates whose artwork does not
      // fully surround its slots. Cheap insurance; keep it.
      if (draw.clip.shape === "circle") {
        const path = Skia.Path.Make();
        path.addOval(dest);
        canvas.clipPath(path, /* ClipOp.Intersect */ 1, true);
        path.dispose();
      } else if (draw.clip.cornerRadius > 0) {
        canvas.clipRRect(Skia.RRectXY(dest, draw.clip.cornerRadius, draw.clip.cornerRadius), 1, true);
      } else {
        canvas.clipRect(dest, 1, true);
      }

      const cx = draw.dest.x + draw.dest.w / 2;
      const cy = draw.dest.y + draw.dest.h / 2;

      if (draw.rotation !== 0) {
        canvas.translate(cx, cy);
        canvas.rotate(draw.rotation, 0, 0);
        canvas.translate(-cx, -cy);
      }

      // Mirror about the window's own centre, so the flip does not also move
      // the photo out of its slot.
      if (draw.mirror) {
        canvas.translate(cx, cy);
        canvas.scale(-1, 1);
        canvas.translate(-cx, -cy);
      }

      canvas.drawImageRect(img, src, dest, paint);
      canvas.restore();
      paint.dispose();
    }

    // 3. Overlay artwork on top — its transparent windows are what let the
    //    photos show through, and its opaque areas are the branding.
    const overlay = await loadImage(overlayUri);
    loaded.push(overlay);
    const overlayPaint = Skia.Paint();
    overlayPaint.setAntiAlias(true);
    canvas.drawImageRect(
      overlay,
      Skia.XYWHRect(0, 0, overlay.width(), overlay.height()),
      Skia.XYWHRect(0, 0, size.width, size.height),
      overlayPaint,
    );
    overlayPaint.dispose();

    // 4. Text layers, stamped with this event's values.
    const textLayers = template.layers
      .filter((l) => l.type === "text")
      .sort((a, b) => a.z - b.z);

    if (textLayers.length > 0) {
      const scale = size.width / template.canvas.width;
      const fontMgr = Skia.FontMgr.System();

      for (const layer of textLayers) {
        if (layer.type !== "text") continue;
        const typeface =
          fontMgr.matchFamilyStyle(layer.font, {
            weight: layer.weight,
          }) ?? fontMgr.matchFamilyStyle(fontMgr.getFamilyName(0), { weight: layer.weight });
        if (!typeface) continue;

        const font = Skia.Font(typeface, layer.size * scale);
        const paint = Skia.Paint();
        paint.setAntiAlias(true);
        paint.setColor(Skia.Color(layer.color || variant.textColor));

        let text = resolveTokens(layer.text, tokens);
        if (layer.uppercase) text = text.toUpperCase();

        const width = font.measureText(text).width;
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
        canvas.drawText(text, x, layer.y * scale, paint, font);
        canvas.restore();

        paint.dispose();
        font.dispose();
        typeface.dispose();
      }
    }

    // 5. Encode.
    const snapshot = surface.makeImageSnapshot();
    const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, quality);
    snapshot.dispose();

    if (!bytes) {
      throw new Error("Skia produced no bytes when encoding the composite to JPEG.");
    }

    return { bytes, width: size.width, height: size.height };
  } finally {
    for (const img of loaded) img.dispose();
    surface.dispose();
  }
}
