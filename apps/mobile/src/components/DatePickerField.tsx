import { useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { Text } from "./ui";
import { colors } from "../theme";

/**
 * A self-contained month calendar — no native module, so it works in the
 * existing dev build without an EAS rebuild. Value and onChange speak the
 * `YYYY-MM-DD` strings the `date` column wants; an empty string means unset.
 */
export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  minToday = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minToday?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = value ? parseISODate(value) : null;
  const display = selected
    ? selected.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
    : placeholder;

  return (
    <View style={{ gap: 6 }}>
      <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: colors.ink,
          paddingHorizontal: 14,
          paddingVertical: 13,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 15, color: selected ? colors.ink : colors.faint.DEFAULT }}>{display}</Text>
        <Text style={{ fontSize: 16, color: colors.muted.DEFAULT }}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(20,20,15,0.45)", justifyContent: "center", padding: 24 }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface.DEFAULT, borderWidth: 1, borderColor: colors.ink, padding: 18 }}
          >
            <Calendar
              selected={selected}
              minToday={minToday}
              onPick={(d) => {
                onChange(toISODate(d));
                setOpen(false);
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
              <Pressable onPress={() => { onChange(""); setOpen(false); }} hitSlop={8}>
                <Text weight="bold" style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Clear</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text weight="bold" style={{ fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase", color: colors.ink }}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function Calendar({ selected, minToday, onPick }: { selected: Date | null; minToday: boolean; onPick: (d: Date) => void }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => new Date((selected ?? today).getFullYear(), (selected ?? today).getMonth(), 1));

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = cursor.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.ink }}>‹</Text>
        </Pressable>
        <Text weight="bold" style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>{monthLabel}</Text>
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.ink }}>›</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row" }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, color: colors.faint.DEFAULT }}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((d, i) => {
          const disabled = !d || (minToday && d < today);
          const isSelected = d && selected && sameDay(d, selected);
          const isToday = d && sameDay(d, today);
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              {d ? (
                <Pressable
                  onPress={() => !disabled && onPick(d)}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? colors.ink : "transparent",
                    borderWidth: isToday && !isSelected ? 1 : 0,
                    borderColor: colors.amber,
                    opacity: disabled ? 0.28 : 1,
                  }}
                >
                  <Text style={{ fontSize: 14, color: isSelected ? colors.surface.DEFAULT : colors.ink }}>{d.getDate()}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Parse `YYYY-MM-DD` as a local date (not UTC, so the day never shifts). */
function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
