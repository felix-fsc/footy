import { Pressable, StyleSheet, Text, View } from "react-native";
import { greenRipple, motionStyles } from "../ui/Motion";

export function HomeMetric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.homeMetric}>
      <Text style={styles.homeMetricValue}>{value}</Text>
      <Text style={styles.homeMetricLabel}>{label}</Text>
    </View>
  );
}

export function QuickMessageButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickMessageButton,
        disabled && styles.quickMessageDisabled,
        pressed && !disabled && motionStyles.pressGlow,
      ]}
      onPress={onPress}
      disabled={disabled}
      android_ripple={greenRipple}
    >
      <Text style={styles.quickMessageText}>{label}</Text>
    </Pressable>
  );
}

export function ListStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.listStat}>
      <Text style={styles.listStatValue}>{value}</Text>
      <Text style={styles.listStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  homeMetric: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(227,219,208,0.09)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  homeMetricValue: { color: "#8FEA6A", fontSize: 22, fontWeight: "900" },
  homeMetricLabel: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 9,
    fontWeight: "900",
    marginTop: -1,
  },
  quickMessageButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.22)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickMessageDisabled: { opacity: 0.5 },
  quickMessageText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  listStat: {
    flex: 1,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.08)",
  },
  listStatValue: { color: "#8FEA6A", fontSize: 28, fontWeight: "900" },
  listStatLabel: {
    color: "#E3DBD0",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
