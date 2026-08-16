import { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../src/components/ui";
import { colors } from "../src/theme";
import { usePoplabClient } from "./_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * 28 Book us. An inquiry form that lands in the operator's console pipeline.
 * Inserts directly as the anonymous guest — RLS lets anyone insert an inquiry
 * for an active tenant but never read them back, so bookings are staff-only.
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

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Name needed", "Please tell us your name.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert("Contact needed", "Add an email or a phone number so we can reach you.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await client
        .from("inquiries")
        .insert({
          tenant_id: TENANT_ID,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          event_type: eventType.trim() || null,
          preferred_date: date.trim() || null,
          location: location.trim() || null,
          guest_count: guests.trim() ? Number(guests) : null,
          notes: notes.trim() || null,
        })
        .select("reference")
        .single();
      if (error) throw error;
      setReference(data.reference);
    } catch (e) {
      Alert.alert("Couldn't send", e instanceof Error ? e.message : "Please try again.");
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: insets.bottom + 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 14, color: colors.muted.DEFAULT }}>
          Tell us about your event and we&apos;ll get back to you with a quote.
        </Text>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="Juan dela Cruz" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="0917 000 0000" keyboardType="phone-pad" />
        <Field label="Event type" value={eventType} onChangeText={setEventType} placeholder="Wedding, birthday, brand launch…" />
        <Field label="Preferred date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="City / venue" />
        <Field label="Guest count" value={guests} onChangeText={setGuests} placeholder="e.g. 100" keyboardType="number-pad" />
        <Field label="Anything else?" value={notes} onChangeText={setNotes} placeholder="Tell us more…" multiline />

        <Button label={busy ? "Sending…" : "Send request"} onPress={submit} />
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
          fontFamily: "Archivo",
          color: colors.ink,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
        {...rest}
      />
    </View>
  );
}
