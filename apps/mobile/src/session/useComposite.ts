import { useEffect, useRef, useState } from "react";
import { File, Paths } from "expo-file-system";

import { compose, type ComposePhoto } from "../compositor/compose";
import { overlayUriFor } from "./overlay";
import { useSession } from "./store";
import { usePoplabClient } from "../../app/_layout";

/**
 * Composes the current session into a preview image and keeps it in step with
 * the guest's choices — swapping a filter, toggling the date stamp, editing the
 * caption all re-render the strip.
 *
 * Shared by 11 Choose an effect, 12 Finishing touches and 13 Your photos, so
 * the compositor is invoked in exactly one place with one set of rules. The
 * capture and assemble screens do NOT use this — assemble runs the first,
 * deliberate compose and routes onward.
 *
 * Renders at print resolution (1200x1800, the RX1HS master). If the on-device
 * spike shows that is too slow to re-run on every filter tap, this is the one
 * place to introduce a smaller preview scale.
 */
export interface CompositeResult {
  uri: string | null;
  isComposing: boolean;
  error: string | null;
}

// The most recently written preview, module-level so it survives remounts and
// can be cleaned up when the next one is written.
let lastPreview: File | null = null;

export function useComposite(): CompositeResult {
  const client = usePoplabClient();
  const template = useSession((s) => s.template);
  const variant = useSession((s) => s.variant);
  const photos = useSession((s) => s.photos);
  const filterId = useSession((s) => s.filterId);
  const filterAmount = useSession((s) => s.filterAmount);
  const finishing = useSession((s) => s.finishing);

  const [result, setResult] = useState<CompositeResult>({
    uri: null,
    isComposing: false,
    error: null,
  });

  // Guards against an out-of-order compose winning: a fast filter tap can start
  // a second render before the first finishes, and without this the slower one
  // could overwrite the newer preview.
  const runId = useRef(0);

  useEffect(() => {
    if (!template || !variant || photos.length < 1) {
      setResult({ uri: null, isComposing: false, error: null });
      return;
    }

    const id = ++runId.current;
    setResult((r) => ({ ...r, isComposing: true, error: null }));

    (async () => {
      try {
        const composePhotos: ComposePhoto[] = photos.map((p) => ({
          uri: p.uri,
          width: p.width,
          height: p.height,
          flipHorizontal: p.flipHorizontal,
        }));

        const { bytes } = await compose({
          template: template.spec,
          variant,
          photos: composePhotos,
          overlayUri: overlayUriFor(client, variant),
          target: "print",
          filterId,
          filterAmount,
          tokens: {
            caption: finishing.caption,
            date: finishing.dateStamp ? new Date().toLocaleDateString("en-US") : "",
            year: String(new Date().getFullYear()),
          },
        });

        if (id !== runId.current) return; // superseded

        // A unique name per render so <Image> never serves a stale cache entry.
        // Date.now() keeps it unique across hook remounts and app restarts —
        // `preview-${id}` alone repeated (id resets to 1 each mount) and
        // collided with a leftover file, which is what File.create() was
        // throwing FileAlreadyExists on. Delete first as a belt-and-braces.
        const file = new File(Paths.cache, `preview-${Date.now()}-${id}.jpg`);
        if (file.exists) file.delete();
        file.create();
        file.write(bytes);

        // Drop the previous preview so the cache doesn't accumulate a file per
        // filter tap over a session.
        const prev = lastPreview;
        lastPreview = file;
        if (prev && prev.uri !== file.uri) {
          try {
            if (prev.exists) prev.delete();
          } catch {
            // best effort
          }
        }

        setResult({ uri: file.uri, isComposing: false, error: null });
      } catch (e) {
        if (id !== runId.current) return;
        setResult({
          uri: null,
          isComposing: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  }, [client, template, variant, photos, filterId, filterAmount, finishing]);

  return result;
}
