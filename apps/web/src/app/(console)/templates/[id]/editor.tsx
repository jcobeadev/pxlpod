"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Template, Slot } from "@poplab/template-spec";
import { overlayUrl } from "../../../../lib/storage";
import { detectSlots } from "../../../../lib/detect-slots";
import { saveTemplate } from "./actions";

type Status = "draft" | "published" | "archived";

/**
 * W-08 Template editor + W-09 Slot mapper.
 *
 * Shows the default variant's overlay with its photo windows drawn on top.
 * Windows can be auto-detected from the artwork's transparent holes, dragged,
 * reshaped and reassigned to a photo, then saved. All geometry stays in canvas
 * coordinates; only the display is scaled.
 */
export function TemplateEditor({
  templateId,
  initialSpec,
  initialName,
  initialStatus,
}: {
  templateId: string;
  initialSpec: Template;
  initialName: string;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [slots, setSlots] = useState<Slot[]>(initialSpec.slots);
  const [selected, setSelected] = useState<string | null>(slots[0]?.id ?? null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [busy, setBusy] = useState<"idle" | "detecting" | "saving">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const canvas = initialSpec.canvas;
  const variant = initialSpec.variants[variantIdx] ?? initialSpec.variants[0];
  const dark = (variant?.label ?? "").toLowerCase().includes("black");
  const frameRef = useRef<HTMLDivElement>(null);

  const shotCount = new Set(slots.map((s) => s.photoIndex)).size;

  const patchSlot = (id: string, patch: Partial<Slot>) =>
    setSlots((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const runDetect = async () => {
    setBusy("detecting");
    setMessage(null);
    try {
      const { slots: detected } = await detectSlots(overlayUrl(variant.overlay));
      setSlots(
        detected.map((d) => ({
          id: d.id,
          photoIndex: d.photoIndex,
          x: d.x,
          y: d.y,
          w: d.w,
          h: d.h,
          shape: d.shape,
          cornerRadius: 0,
          rotation: 0,
          fit: "cover",
          mirror: false,
        })),
      );
      setSelected(detected[0]?.id ?? null);
      setMessage(`Detected ${detected.length} windows.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Detection failed");
    } finally {
      setBusy("idle");
    }
  };

  const onSave = async () => {
    setBusy("saving");
    setMessage(null);
    const spec: Template = { ...initialSpec, name, slots };
    const res = await saveTemplate({ id: templateId, name, status, spec });
    setBusy("idle");
    if (!res.ok) {
      setMessage(res.error);
      return;
    }
    setMessage("Saved.");
    router.refresh();
  };

  // Drag a slot by the pointer, converting screen delta to canvas units.
  const startDrag = (e: React.PointerEvent, slot: Slot, mode: "move" | "resize") => {
    e.stopPropagation();
    setSelected(slot.id);
    const frame = frameRef.current;
    if (!frame) return;
    const scale = canvas.width / frame.clientWidth;
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...slot };
    (e.target as Element).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) * scale;
      const dy = (ev.clientY - startY) * scale;
      if (mode === "move") {
        patchSlot(slot.id, {
          x: clamp(orig.x + dx, 0, canvas.width - orig.w),
          y: clamp(orig.y + dy, 0, canvas.height - orig.h),
        });
      } else {
        patchSlot(slot.id, {
          w: clamp(orig.w + dx, 40, canvas.width - orig.x),
          h: clamp(orig.h + dy, 40, canvas.height - orig.y),
        });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const selectedSlot = slots.find((s) => s.id === selected) ?? null;

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      {/* Canvas */}
      <div className="flex justify-center">
        <div
          ref={frameRef}
          onPointerDown={() => setSelected(null)}
          className="relative border select-none"
          style={{
            width: 340,
            aspectRatio: `${canvas.width}/${canvas.height}`,
            background: dark ? "#0e0e0c" : "#ece8df",
            borderColor: "#14140f",
            touchAction: "none",
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.id}
              onPointerDown={(e) => startDrag(e, slot, "move")}
              className="absolute cursor-move"
              style={{
                left: `${(slot.x / canvas.width) * 100}%`,
                top: `${(slot.y / canvas.height) * 100}%`,
                width: `${(slot.w / canvas.width) * 100}%`,
                height: `${(slot.h / canvas.height) * 100}%`,
                borderRadius: slot.shape === "circle" ? "9999px" : 2,
                background: "rgba(255,184,31,0.28)",
                outline: selected === slot.id ? "2px solid #14140f" : "1px solid rgba(20,20,15,0.4)",
              }}
            >
              <span className="absolute top-0.5 left-1 text-[10px] font-bold text-[#14140f]">{slot.photoIndex + 1}</span>
              {selected === slot.id ? (
                <div
                  onPointerDown={(e) => startDrag(e, slot, "resize")}
                  className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-[#14140f] cursor-se-resize"
                />
              ) : null}
            </div>
          ))}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={overlayUrl(variant.overlay)} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
      </div>

      {/* Inspector */}
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border border-[#14140f] px-3 py-2 bg-white" />
        </label>

        {initialSpec.variants.length > 1 ? (
          <div className="flex gap-2">
            {initialSpec.variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setVariantIdx(i)}
                className={`px-3 py-1.5 text-[12px] font-semibold border border-[#14140f] ${i === variantIdx ? "bg-[#14140f] text-white" : "bg-white"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="bg-white border border-[#14140f] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">
              Windows · {slots.length} / {shotCount} shots
            </span>
          </div>
          <button
            onClick={runDetect}
            disabled={busy !== "idle"}
            className="w-full border border-[#14140f] py-2 text-[12px] font-bold uppercase tracking-wide hover:bg-[#14140f] hover:text-white disabled:opacity-40"
          >
            {busy === "detecting" ? "Detecting…" : "Auto-detect from artwork"}
          </button>
        </div>

        {selectedSlot ? (
          <div className="bg-white border border-[#14140f] p-3 flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Window {selectedSlot.id}</span>
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px]">Photo #</span>
              <input
                type="number"
                min={0}
                value={selectedSlot.photoIndex}
                onChange={(e) => patchSlot(selectedSlot.id, { photoIndex: Math.max(0, Number(e.target.value)) })}
                className="border border-[#14140f] px-2 py-1 w-20 bg-white"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-[13px]">Shape</span>
              <select
                value={selectedSlot.shape}
                onChange={(e) => patchSlot(selectedSlot.id, { shape: e.target.value as "rect" | "circle" })}
                className="border border-[#14140f] px-2 py-1 bg-white"
              >
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </label>
            <button
              onClick={() => {
                setSlots((ss) => ss.filter((s) => s.id !== selectedSlot.id));
                setSelected(null);
              }}
              className="border border-[#a33418] text-[#a33418] py-1.5 text-[12px] font-bold uppercase tracking-wide"
            >
              Remove window
            </button>
          </div>
        ) : (
          <p className="text-[13px] text-[#7a736a]">Tap a window to edit it.</p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="border border-[#14140f] px-3 py-2 bg-white">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        {message ? <p className="text-[13px] text-[#8a570d]">{message}</p> : null}

        <button
          onClick={onSave}
          disabled={busy !== "idle"}
          className="bg-[#14140f] text-white font-bold uppercase tracking-wide py-3 disabled:opacity-50"
        >
          {busy === "saving" ? "Saving…" : "Save template"}
        </button>
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
