import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContent } from "@poplab/api";

import { Text, Button } from "../src/components/ui";
import { DatePickerField } from "../src/components/DatePickerField";
import { colors } from "../src/theme";
import { usePoplabClient } from "./_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";
const MESSENGER_FALLBACK = (process.env.EXPO_PUBLIC_MESSENGER_URL ?? "").trim();

/**
 * 28 Book us. An inquiry form that lands in the operator's console pipeline.
 * The submit goes through the submit_inquiry RPC (SECURITY DEFINER): a guest may
 * create an inquiry but never read one back, so a plain insert().select() looked
 * like a failure even when the row was written — the RPC inserts and returns the
 * reference in one call. Guests who'd rather just chat get a Messenger shortcut.
 */
export default function BookUsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  // Operators set the Messenger link in the console (Content → Messenger link);
  // an env var is only a fallback for local testing.
  const content = useAppContent(client, TENANT_ID);
  const messengerFromConsole = (content.data?.messenger as { body?: string } | undefined)?.body?.trim();
  const messengerUrl = messengerFromConsole || MESSENGER_FALLBACK;

  const openMessenger = async () => {
    try {
      const ok = await Linking.canOpenURL(messengerUrl);
      if (!ok) throw new Error("no handler");
      await Linking.openURL(messengerUrl);
    } catch {
      Alert.alert("Couldn't open Messenger", "Please make sure Messenger is installed, or use the form below.");
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Name needed", "Please tell us your name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert("Contact needed", "Add an email or a phone number so we can reach you.");
      return;
    }
    const guestCount = guests.trim() ? Number(guests.replace(/[^0-9]/g, "")) : null;
    setBusy(true);
    try {
      const { data, error } = await client.rpc("submit_inquiry", {
        p_tenant_id: TENANT_ID,
        p_name: name.trim(),
        p_email: email.trim() || undefined,
        p_phone: phone.trim() || undefined,
        p_event_type: eventType.trim() || undefined,
        p_preferred_date: date || undefined,
        p_location: location.trim() || undefined,
        p_guest_count: guestCount && Number.isFinite(guestCount) ? guestCount : undefined,
        p_notes: notes.trim() || undefined,
      });
      if (error) throw error;
      setReference(data as string);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Please check your connection and try again.";
      Alert.alert("Couldn't send", msg);
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
        <Text variant="display" style={{ fontSize: 30, textTransform: "uppercase", textAlign: "center" }}>Request sent!</Text>
        <Text style={{ fontSize: 15, color: colors.muted.DEFAULT, textAlign: "center" }}>
          We&apos;ll be in touch soon. Your reference is
        </Text>
        <Text variant="display" style={{ fontSize: 26, letterSpacing: 2 }}>#{reference}</Text>
        <View style={{ marginTop: 10, alignSelf: "stretch" }}>
          <Button label="Done" onPress={() => router.replace("/(tabs)")} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="display" style={{ fontSize: 26, textTransform: "uppercase" }}>Book us</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ fontSize: 20 }}>✕</Text></Pressable>
      </View>

      {/* automaticallyAdjustKeyboardInsets lets the OS inset the scroll content
          exactly by the keyboard height — no manual padding, so no dead
          whitespace above the keyboard the way KeyboardAvoidingView produced. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: insets.bottom + 32, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={{ fontSize: 14, color: colors.muted.DEFAULT }}>
          Tell us about your event and we&apos;ll get back to you with a quote.
        </Text>

        {messengerUrl ? (
          <Pressable
            onPress={openMessenger}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 16, paddingVertical: 14 }}
          >
            <View style={{ flex: 1 }}>
              <Text weight="bold" style={{ fontSize: 15 }}>Chat on Messenger</Text>
              <Text style={{ fontSize: 12.5, color: colors.muted.DEFAULT }}>Talk to us right now instead</Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.ink }}>→</Text>
          </Pressable>
        ) : null}

        <Field label="Your name" value={name} onChangeText={setName} placeholder="Juan dela Cruz" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="0917 000 0000" keyboardType="phone-pad" />
        <Field label="Event type" value={eventType} onChangeText={setEventType} placeholder="Wedding, birthday, brand launch…" />
        <DatePickerField label="Preferred date" value={date} onChange={setDate} placeholder="Pick a date" />
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="City / venue" />
        <Field label="Guest count" value={guests} onChangeText={setGuests} placeholder="e.g. 100" keyboardType="number-pad" />
        <Field label="Anything else?" value={notes} onChangeText={setNotes} placeholder="Tell us more…" multiline />

        <Button label={busy ? "Sending…" : "Send request"} onPress={submit} disabled={busy} />
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  multiline,
  ...rest
}: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted.DEFAULT }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint.DEFAULT}
        multiline={multiline}
        style={{
          borderWidth: 1,
          borderColor: colors.ink,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          fontFamily: "Poppins-Regular",
          color: colors.ink,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
        {...rest}
      />
    </View>
  );
}
