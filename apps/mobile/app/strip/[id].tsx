import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Legacy subpath: the top-level saveToLibraryAsync is deprecated and throws in
// SDK 57. See app/session/delivery.tsx.
import * as MediaLibrary from "expo-media-library/legacy";
import Share from "react-native-share";
import { useLiveEvent } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { useLibrary, useStrips } from "../../src/library/useLibrary";
import { createShareLink } from "../../src/session/shareLink";
import { createPrintPass } from "../../src/session/printPass";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * 22 Session detail — one saved strip, full size. Beyond the OS share sheet and
 * save-to-device, a saved strip can also be turned into a branded share link or,
 * when a pop-up is live, a print pass — so guests can print a favourite from a
 * past session, not only the one they just shot. Re-rendering into another
 * template still waits on retaining the original frames.
 */
export default function StripDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { strips } = useStrips();
  const remove = useLibrary((s) => s.remove);

  const liveEventQuery = useLiveEvent(client, TENANT_ID);
  const liveEvent = liveEventQuery.data ?? null;

  const [linking, setLinking] = useState(false);
  const [printing, setPrinting] = useState(false);

  const strip = strips.find((s) => s.id === id);

  if (!strip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: insets.top }}>
        <Text style={{ color: colors.surface.DEFAULT }}>This strip is gone.</Text>
        <Pressable onPress={() => router.back()}><Text weight="bold" style={{ color: colors.amber }}>Back</Text></Pressable>
      </View>
    );
  }

  const onShare = async () => {
    try {
      await Share.open({ url: strip.uri, type: "image/jpeg", failOnCancel: false });
    } catch {
      /* dismissed */
    }
  };

  const onSave = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos access needed", "Allow photo access in Settings to save.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(strip.uri);
      Alert.alert("Saved", "Your strip is in your photos.");
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : String(e));
    }
  };

  const onCreateLink = () => {
    Alert.alert(
      "Create a share link?",
      "This uploads your strip so anyone with the link can view it. It expires in 30 days.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create link",
          onPress: async () => {
            setLinking(true);
            try {
              const { url } = await createShareLink(client, strip.uri, TENANT_ID);
              await Share.open({ message: url, failOnCancel: false }).catch(() => {});
              Alert.alert("Link ready", url);
            } catch (e) {
              Alert.alert("Couldn't create link", e instanceof Error ? e.message : "Please try again.");
            } finally {
              setLinking(false);
            }
          },
        },
      ],
    );
  };

  const onPrint = () => {
    if (!liveEvent) return;
    Alert.alert(
      "Print at this pop-up?",
      `₱${(liveEvent.print_price_cents / 100).toFixed(0)} per print, paid at the booth. This uploads your strip so staff can print it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Get print code",
          onPress: async () => {
            setPrinting(true);
            try {
              const pass = await createPrintPass(client, strip.uri, liveEvent.id, strip.templateId, null);
              router.push({
                pathname: "/session/pass",
                params: { code: pass.code, price: String(pass.price_cents), expiresAt: pass.expires_at, event: liveEvent.title },
              });
            } catch (e) {
              Alert.alert("Couldn't create print pass", e instanceof Error ? e.message : "Please try again.");
            } finally {
              setPrinting(false);
            }
          },
        },
      ],
    );
  };

  const onDelete = () => {
    Alert.alert("Delete strip?", "This removes it from the app. Copies you already saved or shared stay.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(strip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.surface.DEFAULT }}>‹</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Delete</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 10 }}>
        <Image source={{ uri: strip.uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
      </View>

      <ScrollView
        style={{ maxHeight: 260 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {liveEvent ? (
          <Pressable
            onPress={onPrint}
            disabled={printing}
            style={{ backgroundColor: colors.amber, paddingVertical: 15, alignItems: "center", opacity: printing ? 0.5 : 1 }}
          >
            <Text weight="bold" style={{ color: colors.ink, letterSpacing: 0.5 }}>
              {printing ? "Preparing…" : `Print at this pop-up · ₱${(liveEvent.print_price_cents / 100).toFixed(0)}`}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable onPress={onShare} style={{ flex: 1, borderWidth: 1, borderColor: colors.surface.DEFAULT, paddingVertical: 14, alignItems: "center" }}>
            <Text weight="bold" style={{ color: colors.surface.DEFAULT, letterSpacing: 0.5 }}>Share…</Text>
          </Pressable>
          <Pressable onPress={onSave} style={{ flex: 1, borderWidth: 1, borderColor: colors.surface.DEFAULT, paddingVertical: 14, alignItems: "center" }}>
            <Text weight="bold" style={{ color: colors.surface.DEFAULT, letterSpacing: 0.5 }}>Save to device</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onCreateLink}
          disabled={linking}
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", paddingVertical: 14, alignItems: "center", opacity: linking ? 0.5 : 1 }}
        >
          <Text weight="bold" style={{ color: colors.surface.DEFAULT, letterSpacing: 0.5 }}>
            {linking ? "Creating link…" : "Create a share link"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
