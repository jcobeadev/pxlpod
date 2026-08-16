import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

/**
 * The small form controls the session-setup, effect and finishing screens
 * share. Kept in one file so the flow's chips, toggles and segmented pickers
 * stay visually identical. Every Pressable uses a plain object style — a
 * function style is silently dropped on this stack (see StartSessionHero).
 */

export interface SegmentedOption<T extends string | number> {
  label: string;
  value: T;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  stretch = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Fill the parent width with equal-width segments (vs. hugging content). */
  stretch?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.ink,
        alignSelf: stretch ? "stretch" : "flex-start",
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={{
              flex: stretch ? 1 : undefined,
              paddingHorizontal: stretch ? 8 : 18,
              paddingVertical: 11,
              alignItems: "center",
              backgroundColor: active ? colors.ink : "transparent",
              borderLeftWidth: i === 0 ? 0 : 1,
              borderLeftColor: colors.ink,
            }}
          >
            <Text
              weight="bold"
              style={{
                fontSize: 13,
                letterSpacing: 0.4,
                color: active ? colors.surface.DEFAULT : colors.ink,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface["4"],
        gap: 16,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="semibold" style={{ fontSize: 15 }}>
          {label}
        </Text>
        {hint ? <Text style={{ fontSize: 12.5, color: colors.muted.DEFAULT }}>{hint}</Text> : null}
      </View>
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          padding: 3,
          backgroundColor: value ? colors.amber : colors.surface["3"],
          alignItems: value ? "flex-end" : "flex-start",
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: value ? colors.ink : colors.surface.DEFAULT }} />
      </View>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: active ? colors.ink : "transparent",
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.surface["3"],
      }}
    >
      <Text
        weight="semibold"
        style={{ fontSize: 13, color: active ? colors.surface.DEFAULT : colors.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
