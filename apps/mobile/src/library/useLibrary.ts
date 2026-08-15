import { useEffect } from "react";
import { create } from "zustand";

import { commitStrip, deleteStrip, listStrips, type StripRecord } from "./strips";

/**
 * Reactive view of the on-device strip library. One store, loaded once, kept in
 * step with the SQLite table so My Photos and Home's recent row re-render the
 * moment a strip is committed or removed.
 */
interface LibraryState {
  strips: StripRecord[];
  loaded: boolean;
  load: () => Promise<void>;
  commit: (
    sourceUri: string,
    meta: { templateId: string | null; templateName: string; outputKind: string; filterId: string },
  ) => Promise<StripRecord>;
  remove: (id: string) => Promise<void>;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  strips: [],
  loaded: false,

  load: async () => {
    const strips = await listStrips();
    set({ strips, loaded: true });
  },

  commit: async (sourceUri, meta) => {
    const record = await commitStrip(sourceUri, meta);
    set((s) => ({ strips: [record, ...s.strips] }));
    return record;
  },

  remove: async (id) => {
    await deleteStrip(id);
    set((s) => ({ strips: s.strips.filter((r) => r.id !== id) }));
  },
}));

/** Loads the library once on mount and returns the current strips. */
export function useStrips(): { strips: StripRecord[]; loaded: boolean } {
  const strips = useLibrary((s) => s.strips);
  const loaded = useLibrary((s) => s.loaded);
  const load = useLibrary((s) => s.load);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  return { strips, loaded };
}
