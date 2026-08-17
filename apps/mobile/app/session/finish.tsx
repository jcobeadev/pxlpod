import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { ToggleRow } from "../../src/components/session/controls";
import { useSession } from "../../src/session/store";

/** 12 Finishing touches — all optional, prominently skippable. */
export default function FinishingTouches() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const finishing = useSession((s) => s.finishing);
  const setFinishing = useSession((s) => s.setFinishing);
  const template = useSession((s) => s.template);

  if (!template) {
    router.replace("/session");
    return null;
  }

  const next = () => router.push("/session/photos");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>‹</Text>
        </Pressable>
        <Pressable onPress={next} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Skip this</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 100 }}>
        <Text variant="display" style={{ fontSize: 32, textTransform: "uppercase", marginTop: 6, marginBottom: 22 }}>
          {"Finishing\ntouches"}
        </Text>

        <View style={{ gap: 10, marginBottom: 22 }}>
          <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Caption line</Text>
          <TextInput
            value={finishing.caption}
            onChangeText={(caption) => setFinishing({ caption })}
            placeholder="night market, 11 pm"
            placeholderTextColor={colors.faint.DEFAULT}
            maxLength={40}
            style={{ borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Poppins-Regular", color: colors.ink }}
          />
        </View>

        <ToggleRow label="Date stamp" hint="08.15.26 in the corner" value={finishing.dateStamp} onChange={(dateStamp) => setFinishing({ dateStamp })} />

        <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.surface["4"], opacity: 0.5 }}>
          <Text weight="semibold" style={{ fontSize: 15 }}>Sticker layer</Text>
          <Text style={{ fontSize: 12.5, color: colors.muted.DEFAULT }}>Coming soon</Text>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 22, right: 22, bottom: insets.bottom + 16 }}>
        <Button label="Continue" onPress={next} />
      </View>
    </View>
  );
}
