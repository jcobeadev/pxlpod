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
import { createShareLink } from "../../src/session/shareLink";
import { createPrintPass } from "../../src/session/printPass";

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
  const variant = useSession((s) => s.variant);
  const filterId = useSession((s) => s.filterId);
  const outputKind = useSession((s) => s.outputKind);
  const shotCount = useSession((s) => s.shotCount);
  const { uri, isComposing } = useComposite();
  const liveEventQuery = useLiveEvent(client, TENANT_ID);
  const liveEvent = liveEventQuery.data ?? null;
  const commit = useLibrary((s) => s.commit);

  const [saving, setSaving] = useState(false);
  const committed = useRef(false);
  const logged = useRef(false);

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

  // Record one anonymous capture-session row for the operator's dashboard, once
  // per finished strip. Fire-and-forget: analytics must never block delivery, so
  // any failure (offline, RLS, a stale template id) is swallowed.
  useEffect(() => {
    if (logged.current || !ready || !template) return;
    logged.current = true;
    void (async () => {
      try {
        await client.rpc("log_session", {
          p_tenant_id: TENANT_ID,
          p_event_id: liveEvent?.id ?? undefined,
          p_template_id: template.id,
          p_variant: variant?.label ?? undefined,
          p_filter_id: filterId ?? undefined,
          p_shot_count: shotCount(),
        });
      } catch {
        // analytics is best-effort — never surface to the guest
      }
    })();
  }, [ready, template, liveEvent, variant, filterId, shotCount, client]);

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

  const [linking, setLinking] = useState(false);
  const onCreateLink = async () => {
    if (!uri) return;
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
              const { url } = await createShareLink(client, uri, TENANT_ID);
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

  const [printing, setPrinting] = useState(false);
  const onPrint = () => {
    if (!uri || !liveEvent) return;
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
              const pass = await createPrintPass(client, uri, liveEvent.id, template?.id ?? null, variant?.label ?? null);
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
        {liveEvent ? (
          <Route
            label="Print at this pop-up"
            hint={`Live · ${liveEvent.title} · ₱${(liveEvent.print_price_cents / 100).toFixed(0)}`}
            onPress={onPrint}
            disabled={!ready || printing}
            primary
          />
        ) : null}
        <Route label="Save to device" hint="Stays offline — never uploaded" onPress={onSave} disabled={!ready || saving} primary={!liveEvent} />
        <Route label="Share…" hint="Instagram, TikTok, Messenger" onPress={onShare} disabled={!ready} />
        <Route label="Create a share link" hint="A branded page anyone can open" onPress={onCreateLink} disabled={!ready || linking} />
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
