import { useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type TimeWheelProps = {
  value: string;
  onChange: (value: string) => void;
};

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = ["00", "15", "30", "45"];
const WHEEL_ITEM_HEIGHT = 40;

export function TimeWheel({ value, onChange }: TimeWheelProps) {
  const [currentHour = "19", currentMinute = "00"] = value.split(":");
  const hourScrollRef = useRef<ScrollView | null>(null);
  const minuteScrollRef = useRef<ScrollView | null>(null);

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  function selectFromScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    values: string[],
    currentOtherValue: string,
    type: "hour" | "minute",
  ) {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const index = Math.max(0, Math.min(values.length - 1, rawIndex));
    const selected = values[index];
    if (type === "hour") {
      updateTime(selected, currentOtherValue);
      return;
    }
    updateTime(currentOtherValue, selected);
  }

  useEffect(() => {
    const hourIndex = Math.max(0, HOURS.indexOf(currentHour));
    const minuteIndex = Math.max(0, MINUTES.indexOf(currentMinute));
    hourScrollRef.current?.scrollTo({
      y: hourIndex * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
    minuteScrollRef.current?.scrollTo({
      y: minuteIndex * WHEEL_ITEM_HEIGHT,
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
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, HOURS, currentMinute, "hour")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, HOURS, currentMinute, "hour")
            }
          >
            {HOURS.map((hour) => {
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
            snapToInterval={WHEEL_ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, MINUTES, currentHour, "minute")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, MINUTES, currentHour, "minute")
            }
          >
            {MINUTES.map((minute) => {
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
