import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

/** Condense VisionCamera's device name to a short lens tag for the HUD. */
function lensLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("ultra")) return "◉ ULTRA-WIDE";
  if (n.includes("tele")) return "◉ TELEPHOTO";
  if (n.includes("wide")) return "◉ WIDE";
  if (n.includes("front")) return "◉ FRONT";
  return `◉ ${name.toUpperCase()}`;
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
  // Ultra-wide first for the fish-eye look; wide-angle is the universal fallback.
  const device = useCameraDevice(settings.facing, {
    physicalDevices: ["ultra-wide-angle", "wide-angle"],
  });
  // JPEG, explicitly. iOS defaults to HEIC, which Skia cannot decode — the
  // "Could not decode image at …heic" failure on the assemble screen. JPEG is
  // universally decodable and what the compositor expects.
  const photoOutput = usePhotoOutput({ qualityPrioritization: "quality", containerFormat: "jpeg" });

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

  const beginShot = useCallback(() => {
    setPhase("getready");
    const t = setTimeout(() => {
      setRunNonce((n) => n + 1);
      setPhase("counting");
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  // Kick off the first (and each subsequent) shot's get-ready beat.
  useEffect(() => {
    if (phase === "getready" && photos.length < shotCount) {
      return beginShot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShot]);

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
      if (settings.reviewEachShot) {
        setPhase("review");
      } else {
        // straight through — the currentShot effect starts the next beat
      }
    } catch {
      setFlash(false);
      // Re-arm the same shot rather than losing the session on a transient
      // capture error.
      setPhase("getready");
      setRunNonce((n) => n + 1);
      setTimeout(() => setPhase("counting"), 800);
    } finally {
      busy.current = false;
    }
  }, [photoOutput, settings, addPhoto]);

  // Auto-advance the Keep/Retake beat.
  useEffect(() => {
    if (phase !== "review") return;
    const t = setTimeout(() => beginShot(), 1800);
    return () => clearTimeout(t);
  }, [phase, beginShot]);

  const onRetake = () => {
    retakeAt(photos.length - 1);
    beginShot();
  };

  const onClose = () => router.dismissAll?.() ?? router.replace("/(tabs)");

  if (!template) return null;

  const cropAspect = aspectForPhoto(template.spec, currentShot);
  const lastPhoto = photos[photos.length - 1];

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* --- Camera preview -------------------------------------------- */}
      {device && hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={phase !== "review"}
          outputs={[photoOutput]}
        />
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
          {/* Which physical lens is live — lets us confirm the ultra-wide
              ("fish-eye") is actually being reached on this device. */}
          {device ? (
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, letterSpacing: 0.3 }} numberOfLines={1}>
              {lensLabel(device.name)}
            </Text>
          ) : null}
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
            <Button label="Keep" onPress={() => beginShot()} />
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
