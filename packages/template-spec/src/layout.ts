import type { Canvas, Slot, Template } from "./schema.ts";
import { DIGITAL_SCALE } from "./schema.ts";

/**
 * Layout maths shared by all three renderers.
 *
 * Pure functions, no drawing. The Skia adapter (mobile), the Canvas 2D adapter
 * (web booth) and the Konva preview (console) each call these and then issue
 * their own platform draw calls. Because the arithmetic lives here exactly
 * once, a slot cannot land in a different place on a phone than it does in the
 * console preview — which is the failure mode this package exists to prevent.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Output size for a render pass. */
export type RenderTarget = "print" | "digital";

/**
 * Scale factor from canvas coordinates to the requested output.
 *
 * "print" is 1:1 with the canvas — the supplied overlays are already 1200x1800
 * at 300dpi, i.e. exactly 4x6in, the native page of the DNP DS-RX1HS. "digital"
 * doubles it for retina screens and social.
 */
export function scaleFor(target: RenderTarget): number {
  return target === "digital" ? DIGITAL_SCALE : 1;
}

export function outputSize(canvas: Canvas, target: RenderTarget) {
  const k = scaleFor(target);
  return { width: Math.round(canvas.width * k), height: Math.round(canvas.height * k) };
}

/** A slot's destination rectangle at a given scale. */
export function slotRect(slot: Slot, scale: number): Rect {
  return {
    x: slot.x * scale,
    y: slot.y * scale,
    w: slot.w * scale,
    h: slot.h * scale,
  };
}

/**
 * Source rectangle to read out of a photo so it fills `dest` under the slot's
 * fit rule, without distortion.
 *
 * "cover" crops the long axis and centres — the default, and what a photobooth
 * wants. "contain" letterboxes instead, returning the full source; the caller
 * paints the slot background first.
 */
export function sourceRect(
  photo: { width: number; height: number },
  dest: Pick<Rect, "w" | "h">,
  fit: Slot["fit"],
): Rect {
  const srcAspect = photo.width / photo.height;
  const dstAspect = dest.w / dest.h;

  if (fit === "contain" || srcAspect === dstAspect) {
    return { x: 0, y: 0, w: photo.width, h: photo.height };
  }

  if (srcAspect > dstAspect) {
    // Source is wider — trim the sides.
    const w = photo.height * dstAspect;
    return { x: (photo.width - w) / 2, y: 0, w, h: photo.height };
  }
  // Source is taller — trim top and bottom.
  const h = photo.width / dstAspect;
  return { x: 0, y: (photo.height - h) / 2, w: photo.width, h };
}

/**
 * Everything a renderer needs to draw one window: where it goes, what part of
 * which photo to read, and how to clip it.
 */
export interface SlotDraw {
  slot: Slot;
  dest: Rect;
  src: Rect;
  clip: { shape: Slot["shape"]; cornerRadius: number };
  /** Degrees clockwise about the destination centre. */
  rotation: number;
  mirror: boolean;
}

/** A captured frame handed to the compositor. */
export interface SourcePhoto {
  width: number;
  height: number;
  /**
   * Draw this frame flipped horizontally.
   *
   * Set it for front-camera captures: the preview the guest posed against is
   * mirrored, while the saved frame is not, so the strip only matches what they
   * saw if it is flipped back. Rear-camera shots and uploads leave it false, or
   * every sign and T-shirt in the picture comes out reversed.
   */
  flipHorizontal?: boolean;
}

export function planSlots(
  template: Pick<Template, "slots" | "canvas">,
  photos: ReadonlyArray<SourcePhoto>,
  target: RenderTarget = "print",
): SlotDraw[] {
  const scale = scaleFor(target);

  return template.slots.map((slot) => {
    const photo = photos[slot.photoIndex];
    if (!photo) {
      throw new Error(
        `Slot "${slot.id}" wants photo ${slot.photoIndex} but only ${photos.length} ` +
          `were captured. Check shotCount() against the capture flow.`,
      );
    }
    const dest = slotRect(slot, scale);
    return {
      slot,
      dest,
      src: sourceRect(photo, dest, slot.fit),
      clip: {
        shape: slot.shape,
        cornerRadius: slot.cornerRadius * scale,
      },
      rotation: slot.rotation,
      // XOR: the camera's flip and the template's artistic flip cancel out when
      // both are set, which is the behaviour a designer expects.
      mirror: (photo.flipHorizontal ?? false) !== slot.mirror,
    };
  });
}

/**
 * Fit the whole canvas inside a viewport, preserving aspect — used for the
 * on-screen preview and the capture screen's corner thumbnail.
 */
export function fitCanvas(
  canvas: Pick<Canvas, "width" | "height">,
  viewport: { width: number; height: number },
): Rect & { scale: number } {
  const scale = Math.min(viewport.width / canvas.width, viewport.height / canvas.height);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  return {
    x: (viewport.width - w) / 2,
    y: (viewport.height - h) / 2,
    w,
    h,
    scale,
  };
}

/** Interpolates {event_name}-style tokens in a text layer. */
export function resolveTokens(text: string, values: Record<string, string | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
