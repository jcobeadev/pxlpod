import { useEffect } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import { useCameraPermission } from "react-native-vision-camera";

import { Button, Icon, Screen, Text } from "../src/components/ui";
import { colors } from "../src/theme";

// 02 Permission primer + 02b Permission denied (design/PXLPOD App.dc.html).
//
// react-native-vision-camera v5.2.2 (the version installed in this repo) has
// no `Camera.requestCameraPermission()` static — that's the v3/v4 API. v5
// exposes `useCameraPermission()` instead, which is what's used below.
export default function Permissions() {
  const router = useRouter();
  const { status, hasPermission, requestPermission } = useCameraPermission();

  // If permission is already granted (e.g. the user backed into this route),
  // don't make them look at a primer for a permission they already hold.
  useEffect(() => {
    if (hasPermission) {
      router.replace("/(tabs)");
    }
  }, [hasPermission, router]);

  if (hasPermission) {
    return null;
  }

  const denied = status === "denied" || status === "restricted";

  const handleAllow = () => {
    void requestPermission();
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  return denied ? (
    <DeniedView onOpenSettings={handleOpenSettings} onBrowseWithoutCamera={handleSkip} />
  ) : (
    <PrimerView onAllow={handleAllow} onNotNow={handleSkip} />
  );
}

function PrimerView({ onAllow, onNotNow }: { onAllow: () => void; onNotNow: () => void }) {
  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 34, gap: 28 }}>
        <Icon name="camera" size={78} />

        <View style={{ gap: 14 }}>
          <Text
            variant="display"
            style={{ fontSize: 38, lineHeight: 38, textTransform: "uppercase" }}
          >
            {"Camera\naccess"}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: colors.faint["2"] }}>
            PxlPod needs your camera to shoot the 4 photos in a strip. Nothing is uploaded —
            photos stay on this phone until you choose to share or print.
          </Text>
        </View>

        <View
          style={{
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: colors.surface["4"],
            paddingTop: 20,
          }}
        >
          <PrimerBullet label="Used only during a session" />
          <PrimerBullet label="No microphone, no location" />
          <PrimerBullet label="No account, ever" />
        </View>
      </View>

      <View style={{ paddingHorizontal: 28, paddingTop: 22, paddingBottom: 40, gap: 12 }}>
        <Button label="Allow camera" variant="primary" onPress={onAllow} />
        <Button label="Not now" variant="ghost" onPress={onNotNow} />
      </View>
    </Screen>
  );
}

function PrimerBullet({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <View style={{ width: 8, height: 8, marginTop: 7, backgroundColor: colors.amber }} />
      <Text weight="medium" style={{ fontSize: 14, lineHeight: 19.6, flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function DeniedView({
  onOpenSettings,
  onBrowseWithoutCamera,
}: {
  onOpenSettings: () => void;
  onBrowseWithoutCamera: () => void;
}) {
  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 34, gap: 26 }}>
        <Icon name="alert" size={78} />

        <View style={{ gap: 14 }}>
          <Text
            variant="display"
            style={{ fontSize: 38, lineHeight: 38, textTransform: "uppercase" }}
          >
            {"Camera is\nblocked"}
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 24, color: colors.faint["2"] }}>
            We can&apos;t open the booth without the camera. Turn it back on in your phone
            settings, then come back.
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.ink,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 20,
            gap: 14,
          }}
        >
          <Text
            weight="bold"
            style={{
              fontSize: 11,
              letterSpacing: 1.98,
              textTransform: "uppercase",
              color: colors.muted.DEFAULT,
            }}
          >
            How to re-enable
          </Text>
          <View style={{ gap: 10 }}>
            <ReenableStep index={1} label="Open Settings" />
            <ReenableStep index={2} label="Tap PxlPod → Permissions" />
            <ReenableStep index={3} label="Switch Camera on" />
          </View>
        </View>

        <Text
          weight="medium"
          style={{ fontSize: 13, lineHeight: 19.5, color: colors.muted.DEFAULT }}
        >
          You can still browse templates, events and the portfolio without the camera.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 28, paddingTop: 22, paddingBottom: 40, gap: 12 }}>
        <Button label="Open settings" variant="primary" onPress={onOpenSettings} />
        <Button label="Browse without camera" variant="secondary" onPress={onBrowseWithoutCamera} />
      </View>
    </Screen>
  );
}

function ReenableStep({ index, label }: { index: number; label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
      <View
        style={{
          width: 22,
          height: 22,
          backgroundColor: colors.ink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text weight="bold" style={{ fontSize: 11, color: colors.surface.DEFAULT }}>
          {index}
        </Text>
      </View>
      <Text weight="medium" style={{ fontSize: 14 }}>
        {label}
      </Text>
    </View>
  );
}
