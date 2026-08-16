import { create } from "zustand";
import type { ValidatedTemplateRow } from "@poplab/api";
import { shotCount as shotCountOf, type Variant } from "@poplab/template-spec/schema";

/**
 * The capture session state machine.
 *
 * One session runs from "05 Choose a template" through "13 Your photos". Every
 * screen in `app/session/*` reads and writes THIS store rather than passing
 * params down a navigation stack — the flow branches (retake, skip, back) too
 * much for params to stay honest, and the compositor needs the whole thing at
 * the end anyway.
 *
 * Nothing here touches the network or the camera. It holds captured frame URIs
 * (already on disk) and the choices the guest has made; the capture screen
 * writes frames in, the assemble screen reads them out.
 */

export type CameraFacing = "front" | "back";

/** A single captured frame, straight off the camera and already saved to a file. */
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  /**
   * Whether this frame should be drawn mirrored to match the preview the guest
   * posed against. True for front-camera shots, false for the rear camera.
   * Travels with the photo because it is a property of the capture, not the
   * template (see planSlots' XOR with slot.mirror).
   */
  flipHorizontal: boolean;
}

export interface SessionSettings {
  timer: 3 | 5 | 10;
  facing: CameraFacing;
  /** Mirror the on-screen preview (front camera only; a real-mirror feel). */
  mirrorPreview: boolean;
  /** Flash the screen white to light the subject in a dark venue (front camera). */
  fillLight: boolean;
  /** Fire the hardware flash on the rear camera. Front cameras have no flash. */
  rearFlash: boolean;
  /** Play a countdown tick + shutter (best-effort; no-op until audio ships). */
  sound: boolean;
  /** Draw a thirds grid over the preview. */
  grid: boolean;
  /** Show the Keep/Retake beat after each shot (09), vs. shooting straight through. */
  reviewEachShot: boolean;
}

export const DEFAULT_SETTINGS: SessionSettings = {
  timer: 3,
  facing: "front",
  mirrorPreview: true,
  fillLight: false,
  rearFlash: false,
  sound: true,
  grid: false,
  reviewEachShot: true,
};

export type OutputKind = "photo" | "gif" | "boomerang";

export interface FinishingTouches {
  caption: string;
  dateStamp: boolean;
  /** Sticker ids chosen on 12; rendering them is a later batch. */
  stickers: string[];
}

interface SessionState {
  template: ValidatedTemplateRow | null;
  variant: Variant | null;
  settings: SessionSettings;

  photos: CapturedPhoto[];
  filterId: string;
  filterAmount: number;
  finishing: FinishingTouches;
  outputKind: OutputKind;

  // ---- derived ---------------------------------------------------------
  /** How many frames this template needs. 0 when no template is chosen. */
  shotCount: () => number;
  /** True once every required frame has been captured. */
  isComplete: () => boolean;

  // ---- template & setup ------------------------------------------------
  chooseTemplate: (template: ValidatedTemplateRow) => void;
  chooseVariant: (variant: Variant) => void;
  updateSettings: (patch: Partial<SessionSettings>) => void;

  // ---- capture ---------------------------------------------------------
  /** Append a frame. Ignored once the template's shot count is reached. */
  addPhoto: (photo: CapturedPhoto) => void;
  /** Drop the frame at `index` so the capture screen re-shoots just that slot. */
  retakeAt: (index: number) => void;
  /** Empty all captured frames so the whole session is shot again. */
  clearPhotos: () => void;

  // ---- effects & finishing --------------------------------------------
  setFilter: (id: string, amount?: number) => void;
  setFinishing: (patch: Partial<FinishingTouches>) => void;
  setOutputKind: (kind: OutputKind) => void;

  // ---- lifecycle -------------------------------------------------------
  /** Wipe everything back to defaults. Call when leaving the flow. */
  reset: () => void;
}

const INITIAL = {
  template: null,
  variant: null,
  settings: DEFAULT_SETTINGS,
  photos: [] as CapturedPhoto[],
  filterId: "original",
  filterAmount: 1,
  finishing: { caption: "", dateStamp: false, stickers: [] } as FinishingTouches,
  outputKind: "photo" as OutputKind,
};

export const useSession = create<SessionState>((set, get) => ({
  ...INITIAL,

  shotCount: () => {
    const template = get().template;
    return template ? shotCountOf(template.spec) : 0;
  },

  isComplete: () => {
    const { photos } = get();
    const need = get().shotCount();
    return need > 0 && photos.length >= need;
  },

  chooseTemplate: (template) => {
    const current = get().template;
    // Switching template invalidates captured frames (different shot count and
    // crop), so only clear photos when the template actually changes.
    const changed = current?.id !== template.id;
    const defaultVariant =
      template.spec.variants.find((v) => v.isDefault) ?? template.spec.variants[0] ?? null;

    // The fish-eye / "high angle" look is the REAR ultra-wide lens pointed down
    // from above — iPhone front cameras have no ultra-wide at all. So a fish-eye
    // template defaults to the rear camera (hold the phone up, aim down); every
    // other template stays on the selfie-friendly front. The guest can still
    // flip. Only steer facing when the template actually changes, so a manual
    // flip mid-session isn't overridden.
    const facing: CameraFacing = changed
      ? template.spec.category === "fisheye"
        ? "back"
        : "front"
      : get().settings.facing;

    set({
      template,
      variant: changed ? defaultVariant : get().variant ?? defaultVariant,
      photos: changed ? [] : get().photos,
      settings: { ...get().settings, facing, mirrorPreview: facing === "front" ? get().settings.mirrorPreview : false },
      // A template may restrict which filters it allows; if the current pick
      // isn't offered, fall back to Original.
      filterId:
        template.spec.capture.allowedFilters.length === 0 ||
        template.spec.capture.allowedFilters.includes(get().filterId)
          ? get().filterId
          : "original",
    });
  },

  chooseVariant: (variant) => set({ variant }),

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  addPhoto: (photo) =>
    set((s) => {
      if (s.template && s.photos.length >= shotCountOf(s.template.spec)) return s;
      return { photos: [...s.photos, photo] };
    }),

  retakeAt: (index) =>
    set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),

  clearPhotos: () => set({ photos: [] }),

  setFilter: (id, amount) =>
    set((s) => ({ filterId: id, filterAmount: amount ?? s.filterAmount })),

  setFinishing: (patch) => set((s) => ({ finishing: { ...s.finishing, ...patch } })),

  setOutputKind: (kind) => set({ outputKind: kind }),

  reset: () => set({ ...INITIAL, settings: DEFAULT_SETTINGS, photos: [], finishing: { caption: "", dateStamp: false, stickers: [] } }),
}));
