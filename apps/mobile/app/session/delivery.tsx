import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// The top-level saveToLibraryAsync is deprecated in SDK 57 and throws at
// runtime; the legacy subpath keeps the simple "save a file to the camera roll"
// call without adopting the new class-based Asset API.
import * as MediaLibrary from "expo-media-library/legacy";
import Share from "react-native-share";
import { useLiveEvent } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { useSession } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";
import { useLibrary } from "../../src/library/useLibrary";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * 14 Delivery hub — the screen the whole app exists to reach. Routes are
 * ordered by how much branding each carries back to the operator.
 *
 * What works today needs no server and no new native module: Save to device
 * (expo-media-library) and the OS share sheet (react-native-share), which
 * already covers Instagram, TikTok and Messenger. Email, SMS, share links and
 * print passes need the Next.js API (Phase 02) — they're shown but marked
 * "soon" so the hierarchy is real from day one.
 */
export default function DeliveryHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();

  const template = useSession((s) => s.template);
  const filterId = useSession((s) => s.filterId);
  const outputKind = useSession((s) => s.outputKind);
  const { uri, isComposing } = useComposite();
  const liveEventQuery = useLiveEvent(client, TENANT_ID);
  const liveEvent = liveEventQuery.data ?? null;
  const commit = useLibrary((s) => s.commit);

  const [saving, setSaving] = useState(false);
  const committed = useRef(false);

  const ready = Boolean(uri) && !isComposing;

  // Reaching delivery means the strip is finished — copy it into the on-device
  // library (My Photos / Home) exactly once. Failure here must not block
  // sharing, so it is swallowed.
  useEffect(() => {
    if (committed.current || !ready || !uri || !template) return;
    committed.current = true;
    void commit(uri, {
      templateId: template.id,
      templateName: template.name,
      outputKind,
      filterId,
    }).catch(() => {
      committed.current = false;
    });
  }, [ready, uri, template, outputKind, filterId, commit]);

  if (!template) {
    router.replace("/session");
    return null;
  }

  const onSave = async () => {
    if (!uri) return;
    setSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos access needed", "Allow photo access in Settings to save your strip.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Your strip is in your photos — never uploaded.");
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const onShare = async () => {
    if (!uri) return;
    try {
      await Share.open({ url: uri, type: "image/jpeg", failOnCancel: false });
    } catch {
      // user dismissed the sheet — not an error
    }
  };

  const soon = (what: string) =>
    Alert.alert(what, "Lands in the next update, once the booth's delivery service is switched on.");

  // Leave the whole capture flow and return Home. dismissAll() only pops the
  // session stack back to its first screen (Choose a template), which is why
  // Done was landing there; replacing to the tab root exits the group entirely,
  // unmounts the session (which resets the store), and Home refetches on focus.
  const onDone = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", justifyContent: "flex-end" }}>
        <Pressable onPress={onDone} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Done</Text>
        </Pressable>
      </View>

      <Text variant="display" style={{ fontSize: 32, textTransform: "uppercase", paddingHorizontal: 22, marginTop: 4, marginBottom: 18 }}>
        {"Share\nyour strip"}
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 24 }}>
        <Route label="Save to device" hint="Stays offline — never uploaded" onPress={onSave} disabled={!ready || saving} primary />
        <Route label="Share…" hint="Instagram, TikTok, Messenger" onPress={onShare} disabled={!ready} />

        <View style={{ height: 1, backgroundColor: colors.surface["4"], marginVertical: 14 }} />
        <Text weight="bold" style={{ fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: colors.faint.DEFAULT, marginBottom: 4 }}>
          Coming with delivery
        </Text>

        <Route label="Send by email or SMS" hint="From the booth's own address" onPress={() => soon("Send by email or SMS")} soon />
        <Route label="Create a share link" hint="A branded page & QR to hand over" onPress={() => soon("Share link")} soon />
        {liveEvent ? (
          <Route
            label="Print at this pop-up"
            hint={`Live · ${liveEvent.title}`}
            onPress={() => soon("Print at this pop-up")}
            soon
          />
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 12 }}>
        <Text style={{ fontSize: 12, color: colors.faint.DEFAULT, textAlign: "center" }}>
          Saved on this device · not uploaded
        </Text>
      </View>
    </View>
  );
}

function Route({
  label,
  hint,
  onPress,
  disabled,
  primary,
  soon,
}: {
  label: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  soon?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 18,
        marginBottom: 10,
        backgroundColor: primary ? colors.ink : "transparent",
        borderWidth: primary ? 0 : 1,
        borderColor: colors.surface["3"],
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" style={{ fontSize: 15.5, color: primary ? colors.surface.DEFAULT : colors.ink }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12.5, color: primary ? "rgba(255,255,255,0.7)" : colors.muted.DEFAULT }}>{hint}</Text>
      </View>
      {soon ? (
        <View style={{ borderWidth: 1, borderColor: colors.faint.DEFAULT, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text weight="bold" style={{ fontSize: 9, letterSpacing: 0.6, color: colors.muted.DEFAULT }}>SOON</Text>
        </View>
      ) : (
        <Text style={{ fontSize: 18, color: primary ? colors.amber : colors.ink }}>→</Text>
      )}
    </Pressable>
  );
}
