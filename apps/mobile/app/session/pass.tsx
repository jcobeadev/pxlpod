import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";

/**
 * 18 Print pass. Shows the six-character code the guest reads to the booth
 * staff, tonight's price, and the countdown to when the pass expires (the end
 * of the event plus its grace window).
 */
export default function PrintPass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { code, price, expiresAt, event } = useLocalSearchParams<{
    code: string;
    price: string;
    expiresAt: string;
    event: string;
  }>();

  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("Expired");
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setRemaining(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const pesos = price ? (Number(price) / 100).toFixed(0) : "0";

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, paddingTop: insets.top }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 18 }}>
        <Text weight="bold" style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: colors.amber }}>
          Show this at the booth
        </Text>

        <View style={{ backgroundColor: colors.surface.DEFAULT, paddingVertical: 28, paddingHorizontal: 40, alignItems: "center", gap: 6 }}>
          <Text variant="display" style={{ fontSize: 56, letterSpacing: 8, color: colors.ink }}>
            {code}
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 3 }}>
          {event ? <Text style={{ color: colors.surface.DEFAULT, fontSize: 16, fontWeight: "600" }}>{event}</Text> : null}
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>₱{pesos} · pay at the booth</Text>
          <Text style={{ color: colors.amber, fontSize: 13, fontWeight: "700", marginTop: 4 }}>{remaining}</Text>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12.5, textAlign: "center", maxWidth: 280, marginTop: 6 }}>
          Read the code to our staff. They&apos;ll print your strip and take payment. This pass is saved under My Photos.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}>
        <Button label="Done" onPress={() => router.replace("/(tabs)")} />
      </View>
    </View>
  );
}
