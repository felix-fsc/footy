import { StyleSheet, Text, View } from "react-native";

export function ProfileStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatValue}>{value}</Text>
      <Text style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileStat: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(227,219,208,0.10)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.12)",
    padding: 12,
    alignItems: "center",
  },
  profileStatValue: { color: "#8FEA6A", fontSize: 20, fontWeight: "900" },
  profileStatLabel: {
    color: "#E3DBD0",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
});
