import { useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  datePartsFromOffset,
  getCalendarMonth,
  monthDateParts,
} from "../../utils/matchUtils";

export function CalendarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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

export function TimeWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [currentHour = "19", currentMinute = "00"] = value.split(":");
  const hourScrollRef = useRef<ScrollView | null>(null);
  const minuteScrollRef = useRef<ScrollView | null>(null);
  const hours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0"),
  );
  const minutes = ["00", "15", "30", "45"];
  const wheelItemHeight = 40;

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  function selectFromScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    values: string[],
    currentOtherValue: string,
    type: "hour" | "minute",
  ) {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / wheelItemHeight);
    const index = Math.max(0, Math.min(values.length - 1, rawIndex));
    const selected = values[index];
    if (type === "hour") {
      updateTime(selected, currentOtherValue);
      return;
    }
    updateTime(currentOtherValue, selected);
  }

  useEffect(() => {
    const hourIndex = Math.max(0, hours.indexOf(currentHour));
    const minuteIndex = Math.max(0, minutes.indexOf(currentMinute));
    hourScrollRef.current?.scrollTo({
      y: hourIndex * wheelItemHeight,
      animated: false,
    });
    minuteScrollRef.current?.scrollTo({
      y: minuteIndex * wheelItemHeight,
      animated: false,
    });
  }, [currentHour, currentMinute]);

  return (
    <View style={styles.timeWheelBlock}>
      <Text style={styles.fieldLabel}>Hora</Text>
      <View style={styles.timeWheelCard}>
        <View style={styles.timeWheelColumn}>
          <Text style={styles.timeWheelLabel}>Hora</Text>
          <ScrollView
            ref={hourScrollRef}
            style={styles.timeWheelScroll}
            contentContainerStyle={styles.timeWheelContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            snapToInterval={wheelItemHeight}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, hours, currentMinute, "hour")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, hours, currentMinute, "hour")
            }
          >
            {hours.map((hour) => {
              const active = hour === currentHour;
              return (
                <Pressable
                  key={hour}
                  style={[styles.timeWheelItem, active && styles.timeWheelItemActive]}
                  onPress={() => updateTime(hour, currentMinute)}
                >
                  <Text
                    style={[
                      styles.timeWheelText,
                      active && styles.timeWheelTextActive,
                    ]}
                  >
                    {hour}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.timeWheelSeparator}>:</Text>
        <View style={styles.timeWheelColumn}>
          <Text style={styles.timeWheelLabel}>Min</Text>
          <ScrollView
            ref={minuteScrollRef}
            style={styles.timeWheelScroll}
            contentContainerStyle={styles.timeWheelContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            snapToInterval={wheelItemHeight}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, minutes, currentHour, "minute")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, minutes, currentHour, "minute")
            }
          >
            {minutes.map((minute) => {
              const active = minute === currentMinute;
              return (
                <Pressable
                  key={minute}
                  style={[styles.timeWheelItem, active && styles.timeWheelItemActive]}
                  onPress={() => updateTime(currentHour, minute)}
                >
                  <Text
                    style={[
                      styles.timeWheelText,
                      active && styles.timeWheelTextActive,
                    ]}
                  >
                    {minute}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
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
  timeWheelBlock: { gap: 7 },
  timeWheelCard: {
    minHeight: 160,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  timeWheelColumn: { flex: 1, gap: 7 },
  timeWheelLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
  },
  timeWheelScroll: { height: 120, maxHeight: 120 },
  timeWheelContent: { gap: 0, paddingVertical: 40 },
  timeWheelItem: {
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  timeWheelItemActive: { backgroundColor: "#8FEA6A" },
  timeWheelText: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  timeWheelTextActive: { color: "#0A110E" },
  timeWheelSeparator: {
    color: "#8FEA6A",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
  },
});
