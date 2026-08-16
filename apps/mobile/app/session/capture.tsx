import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from "react-native-vision-camera";
import { aspectForPhoto } from "@poplab/template-spec/schema";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { CountdownRing } from "../../src/components/session/CountdownRing";
import { SlotProgress } from "../../src/components/session/SlotProgress";
import { useSession } from "../../src/session/store";

/**
 * 08 Capture / 08b Get ready / 09 Shot review — one screen, one small state
 * machine.
 *
 *   getready → counting → (flash) capture → review → getready(next) → … → assemble
 *
 * The camera is VisionCamera v5: a `Camera` view fed a device and a photo
 * output. The ultra-wide ("fish-eye") lens is requested first and the wide lens
 * is the fallback, so the fish-eye templates get the look and every other phone
 * still works.
 */

type Phase = "getready" | "counting" | "review";

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

/**
 * A few zoom stops for the quick control. Always the widest (minZoom) plus a
 * couple of steps in, so a device with an ultra-wide gets its 0.5x view as the
 * first stop and everything zooms up from there.
 */
function zoomStops(minZoom: number, maxZoom: number): number[] {
  const stops = [minZoom, minZoom * 2, minZoom * 4].filter((z) => z <= maxZoom);
  if (stops[stops.length - 1] !== maxZoom && maxZoom > minZoom) {
    // keep it to at most 3 stops; no-op if already covered
  }
  return stops.length > 0 ? stops : [minZoom];
}

/**
 * Label a stop the way the iOS camera does: the widest lens is the reference.
 * If the device zooms below 1.0 it has an ultra-wide, so that stop reads "0.5×";
 * otherwise the widest is "1×".
 */
function zoomStopLabel(z: number, minZoom: number): string {
  const hasUltraWide = minZoom < 0.95;
  const relative = hasUltraWide ? z / (minZoom * 2) : z / minZoom;
  if (relative < 0.75) return "0.5×";
  return `${relative.toFixed(relative < 10 ? 1 : 0).replace(/\.0$/, "")}×`;
}

function measure(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      // If measuring fails, fall back to a 4:3 portrait guess rather than
      // blocking the session; the compositor's cover-fit tolerates it.
      () => resolve({ width: 3, height: 4 }),
    );
  });
}

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const template = useSession((s) => s.template);
  const settings = useSession((s) => s.settings);
  const photos = useSession((s) => s.photos);
  const addPhoto = useSession((s) => s.addPhoto);
  const retakeAt = useSession((s) => s.retakeAt);
  const updateSettings = useSession((s) => s.updateSettings);
  const shotCount = useSession((s) => s.shotCount());

  const { hasPermission, requestPermission } = useCameraPermission();
  // The default virtual device — on modern iPhones this fuses ultra-wide + wide
  // (+ tele), so a single `zoom` slides smoothly across lenses. That's how the
  // 0.5x ultra-wide is reached: zoom out to the device minimum. Locking a single
  // physical lens (as before) gave a fixed, un-zoomable frame.
  const device = useCameraDevice(settings.facing);
  // JPEG, explicitly. iOS defaults to HEIC, which Skia cannot decode — the
  // "Could not decode image at …heic" failure on the assemble screen. JPEG is
  // universally decodable and what the compositor expects.
  const photoOutput = usePhotoOutput({ qualityPrioritization: "quality", containerFormat: "jpeg" });

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 8, 8); // cap runaway digital zoom

  // Zoom is a plain number, NOT a reanimated SharedValue. Passing a SharedValue
  // to <Camera zoom> makes VisionCamera read it on the render thread via
  // react-native-vision-camera-worklets, which isn't in this build ("Cannot use
  // Frame Processors — worklets is not installed"). A number avoids that path.
  const [zoomLabel, setZoomLabel] = useState(1);
  // Shared values drive only the pinch math on the UI thread; the result is
  // mirrored to the number state for the Camera prop.
  const zoomSV = useSharedValue(1);
  const zoomStartSV = useSharedValue(1);

  // Start at the widest the device offers (the 0.5x ultra-wide view where it
  // exists) and reset when the lens set changes (front/back flip).
  useEffect(() => {
    zoomSV.value = minZoom;
    zoomStartSV.value = minZoom;
    setZoomLabel(minZoom);
  }, [minZoom, zoomSV, zoomStartSV]);

  const pinch = Gesture.Pinch()
    .onStart(() => {
      zoomStartSV.value = zoomSV.value;
    })
    .onUpdate((e) => {
      const next = zoomStartSV.value * e.scale;
      const clamped = next < minZoom ? minZoom : next > maxZoom ? maxZoom : next;
      zoomSV.value = clamped;
      runOnJS(setZoomLabel)(clamped);
    });

  const jumpZoom = (z: number) => {
    const clamped = z < minZoom ? minZoom : z > maxZoom ? maxZoom : z;
    zoomSV.value = clamped;
    setZoomLabel(clamped);
  };

  const [phase, setPhase] = useState<Phase>("getready");
  const [flash, setFlash] = useState(false);
  const [runNonce, setRunNonce] = useState(0);
  const busy = useRef(false);

  const currentShot = photos.length; // next slot to fill
  const shotNumber = currentShot + 1;

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  // Leave for assembly the moment the last shot lands.
  useEffect(() => {
    if (template && shotCount > 0 && photos.length >= shotCount) {
      router.replace("/session/assemble");
    }
  }, [photos.length, shotCount, template, router]);

  // Guard: no template means the flow was entered out of order.
  useEffect(() => {
    if (!template) router.replace("/session");
  }, [template, router]);

  // The get-ready beat is driven by the phase, not by the shot index. Whenever
  // we land in "getready" and shots remain, wait ~1.4s then start the count.
  // Everything else (capture done, review kept, retake) simply sets the phase
  // back to "getready" and this runs the next beat — no path can stall.
  useEffect(() => {
    if (phase !== "getready" || photos.length >= shotCount) return;
    const t = setTimeout(() => {
      setRunNonce((n) => n + 1);
      setPhase("counting");
    }, 1400);
    return () => clearTimeout(t);
  }, [phase, photos.length, shotCount, runNonce]);

  const capture = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      // Two kinds of "flash": the front camera has no hardware flash, so we
      // flood the screen white; the rear camera fires its real flash.
      const screenFlash = settings.facing === "front" && settings.fillLight;
      const flashMode: "on" | "off" = settings.facing === "back" && settings.rearFlash ? "on" : "off";

      if (screenFlash) setFlash(true);
      // Give the screen a frame to actually paint white before the shutter.
      await new Promise((r) => setTimeout(r, screenFlash ? 120 : 0));

      const file = await photoOutput.capturePhotoToFile({ flashMode }, {});
      const uri = file.filePath.startsWith("file://") ? file.filePath : `file://${file.filePath}`;
      const { width, height } = await measure(uri);

      addPhoto({
        uri,
        width,
        height,
        // Match the mirrored preview a front-camera selfie was posed against.
        flipHorizontal: settings.facing === "front" && settings.mirrorPreview,
      });

      setFlash(false);
      // Review the shot, or (review off) drop straight back to "getready",
      // which the beat effect picks up to start the next shot.
      setPhase(settings.reviewEachShot ? "review" : "getready");
    } catch {
      setFlash(false);
      // Re-arm the same shot rather than losing the session on a transient
      // capture error. Bumping the nonce forces the beat effect to re-fire even
      // though the phase is already "getready".
      setRunNonce((n) => n + 1);
      setPhase("getready");
    } finally {
      busy.current = false;
    }
  }, [photoOutput, settings, addPhoto]);

  // Auto-advance the Keep/Retake beat back into the next shot.
  useEffect(() => {
    if (phase !== "review") return;
    const t = setTimeout(() => setPhase("getready"), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const onRetake = () => {
    retakeAt(photos.length - 1);
    setRunNonce((n) => n + 1);
    setPhase("getready");
  };

  const onClose = () => router.dismissAll?.() ?? router.replace("/(tabs)");

  if (!template) return null;

  const cropAspect = aspectForPhoto(template.spec, currentShot);
  const lastPhoto = photos[photos.length - 1];

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* --- Camera preview -------------------------------------------- */}
      {device && hasPermission ? (
        <GestureDetector gesture={pinch}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={phase !== "review"}
            outputs={[photoOutput]}
            zoom={zoomLabel}
          />
        </GestureDetector>
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }]}>
          <Text variant="display" style={{ fontSize: 22, color: colors.surface.DEFAULT, textAlign: "center" }}>
            {device ? "Camera permission needed" : "No camera available"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", fontSize: 13 }}>
            {device
              ? "PxlPod needs the camera to take your strip."
              : "This device has no camera VisionCamera can reach."}
          </Text>
          {device ? <Button label="Allow camera" onPress={() => void requestPermission()} /> : null}
        </View>
      )}

      {/* Freeze-frame during review. */}
      {phase === "review" && lastPhoto ? (
        <Image source={{ uri: lastPhoto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}

      {/* Screen fill-light. */}
      {flash ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF" }]} /> : null}

      {/* --- Framing mask (crop aspect for this slot) ------------------ */}
      {phase !== "review" ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <View
            style={{
              width: "82%",
              aspectRatio: cropAspect,
              maxHeight: "62%",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
              borderRadius: 4,
            }}
          />
        </View>
      ) : null}

      {/* --- Top bar --------------------------------------------------- */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <RoundButton label="✕" onPress={onClose} />
        <View style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, alignItems: "center" }}>
          <Text weight="bold" style={{ color: colors.surface.DEFAULT, fontSize: 13, letterSpacing: 0.5 }}>
            Shot {Math.min(shotNumber, shotCount)} / {shotCount}
          </Text>
        </View>
        <RoundButton
          label="⟲"
          onPress={() => updateSettings({ facing: settings.facing === "front" ? "back" : "front" })}
        />
      </View>

      {/* --- Corner slot map ------------------------------------------- */}
      <View style={{ position: "absolute", top: insets.top + 56, right: 16 }}>
        <SlotProgress template={template.spec} filled={photos.length} />
      </View>

      {/* --- Zoom control: pinch anywhere, or tap a stop. The first stop is
             the widest the device offers (0.5x ultra-wide where present). --- */}
      {device && hasPermission && phase !== "review" ? (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 130,
            alignSelf: "center",
            flexDirection: "row",
            gap: 8,
            backgroundColor: "rgba(0,0,0,0.4)",
            borderRadius: 22,
            padding: 5,
          }}
        >
          {zoomStops(minZoom, maxZoom).map((z) => {
            const active = Math.abs(zoomLabel - z) < 0.05;
            return (
              <Pressable
                key={z}
                onPress={() => jumpZoom(z)}
                style={{
                  minWidth: 40,
                  height: 34,
                  paddingHorizontal: 10,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.surface.DEFAULT : "transparent",
                }}
              >
                <Text weight="bold" style={{ fontSize: 12, color: active ? colors.ink : colors.surface.DEFAULT }}>
                  {zoomStopLabel(z, minZoom)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* --- Centre: get-ready / countdown ----------------------------- */}
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
        {phase === "getready" ? (
          <View style={{ alignItems: "center", gap: 8, paddingHorizontal: 40 }}>
            <Text variant="display" style={{ fontSize: 30, color: colors.surface.DEFAULT }}>
              Get ready!
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, textAlign: "center" }}>
              The camera will take your {ORDINALS[currentShot] ?? "next"} photo
            </Text>
          </View>
        ) : null}

        {phase === "counting" && device && hasPermission ? (
          <CountdownRing durationMs={settings.timer * 1000} runKey={`${currentShot}-${runNonce}`} onComplete={capture} />
        ) : null}
      </View>

      {/* --- Review: Keep / Retake ------------------------------------- */}
      {phase === "review" ? (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 28,
            left: 24,
            right: 24,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Button label="Retake" variant="secondary" style={{ borderColor: colors.surface.DEFAULT }} onPress={onRetake} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Keep" onPress={() => { setRunNonce((n) => n + 1); setPhase("getready"); }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.surface.DEFAULT, fontSize: 18, lineHeight: 20 }}>{label}</Text>
    </Pressable>
  );
}
