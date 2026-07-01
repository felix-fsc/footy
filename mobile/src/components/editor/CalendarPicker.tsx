import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  datePartsFromOffset,
  getCalendarMonth,
  monthDateParts,
} from "../../utils/matchUtils";

type CalendarPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const { year, month } = getCalendarMonth(monthOffset);
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayMondayBased = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayMondayBased });
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const today = datePartsFromOffset(0);
  const monthName = new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => setMonthOffset((current) => Math.max(0, current - 1))}
        >
          <Text style={styles.calendarNavText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.calendarTitle}>{monthName}</Text>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => setMonthOffset((current) => Math.min(2, current + 1))}
        >
          <Text style={styles.calendarNavText}>{">"}</Text>
        </Pressable>
      </View>
      <View style={styles.calendarWeekRow}>
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <Text key={day} style={styles.calendarWeekText}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {blanks.map((_, index) => (
          <View key={`blank-${index}`} style={styles.calendarDayBlank} />
        ))}
        {days.map((day) => {
          const dateValue = monthDateParts(year, month, day);
          const selected = value === dateValue;
          const past = dateValue < today;
          return (
            <Pressable
              key={dateValue}
              style={[
                styles.calendarDay,
                selected && styles.calendarDaySelected,
                past && styles.calendarDayDisabled,
              ]}
              onPress={() => !past && onChange(dateValue)}
              disabled={past}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  selected && styles.calendarDayTextSelected,
                  past && styles.calendarDayTextDisabled,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 9,
    gap: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(247,241,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavText: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  calendarTitle: {
    color: "#F7F1E8",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarWeekText: {
    width: "14.28%",
    color: "rgba(247,241,232,0.58)",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
  },
  calendarDayBlank: { width: "14.28%", height: 32 },
  calendarDay: {
    width: "14.28%",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  calendarDaySelected: { backgroundColor: "#8FEA6A" },
  calendarDayDisabled: { opacity: 0.28 },
  calendarDayText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  calendarDayTextSelected: { color: "#0A110E" },
  calendarDayTextDisabled: { color: "rgba(247,241,232,0.40)" },
});
