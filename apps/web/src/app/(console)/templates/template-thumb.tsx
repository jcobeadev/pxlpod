import { overlayUrl } from "../../../lib/storage";
import type { Template } from "@poplab/template-spec";

/**
 * A template thumbnail that stays legible on any colourway: grey photo-slots
 * painted first, the overlay artwork on top. Its transparent windows reveal the
 * grey, so a black template's slots don't vanish. Mirrors the mobile app's
 * TemplateThumb.
 */
export function TemplateThumb({
  spec,
  overlay,
  dark,
  width = 160,
}: {
  spec: Template;
  overlay: string | null;
  dark?: boolean;
  width?: number;
}) {
  const { canvas, slots } = spec;
  const ratio = canvas.height / canvas.width;

  return (
    <div
      className="relative overflow-hidden border"
      style={{
        width,
        height: width * ratio,
        background: dark ? "#0e0e0c" : "#ece8df",
        borderColor: dark ? "#0e0e0c" : "#d4d4cf",
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="absolute"
          style={{
            left: `${(slot.x / canvas.width) * 100}%`,
            top: `${(slot.y / canvas.height) * 100}%`,
            width: `${(slot.w / canvas.width) * 100}%`,
            height: `${(slot.h / canvas.height) * 100}%`,
            borderRadius: slot.shape === "circle" ? "9999px" : 2,
            background: "#d8d4cb",
          }}
        />
      ))}
      {overlay ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={overlayUrl(overlay)}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : null}
    </div>
  );
}
