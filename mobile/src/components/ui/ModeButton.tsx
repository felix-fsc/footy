import { Pressable, StyleSheet, Text, View } from "react-native";

export function ModeButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: "map" | "list" | "login" | "register";
  active: boolean;
  onPress: () => void;
}) {
  const resolvedIcon = icon ?? (label === "Mapa" ? "map" : "list");

  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
    >
      <View style={styles.modeIconBox}>
        {resolvedIcon === "map" ? (
          <>
            <View style={styles.modeMapPin} />
            <View style={styles.modeMapDot} />
          </>
        ) : resolvedIcon === "login" ? (
          <>
            <View style={styles.modeLoginDoor} />
            <Text style={styles.modeLoginArrow}>{">"}</Text>
          </>
        ) : resolvedIcon === "register" ? (
          <>
            <View style={styles.modeRegisterHead} />
            <View style={styles.modeRegisterBody} />
            <Text style={styles.modeRegisterPlus}>+</Text>
          </>
        ) : (
          <>
            <View style={styles.modeListLine} />
            <View style={styles.modeListLine} />
            <View style={styles.modeListLineShort} />
          </>
        )}
      </View>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    flexDirection: "row",
    gap: 7,
  },
  modeButtonActive: {
    backgroundColor: "rgba(127,239,155,0.20)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.38)",
  },
  modeIconBox: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modeMapPin: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(227,219,208,0.76)",
  },
  modeMapDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#7FEF9B",
    top: 6,
  },
  modeListLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(227,219,208,0.76)",
    marginVertical: 1,
  },
  modeListLineShort: {
    width: 11,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(227,219,208,0.76)",
    marginVertical: 1,
    alignSelf: "flex-start",
  },
  modeLoginDoor: {
    position: "absolute",
    width: 10,
    height: 15,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "rgba(227,219,208,0.76)",
    left: 1,
  },
  modeLoginArrow: {
    position: "absolute",
    right: 0,
    color: "#7FEF9B",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 16,
  },
  modeRegisterHead: {
    position: "absolute",
    top: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(227,219,208,0.76)",
  },
  modeRegisterBody: {
    position: "absolute",
    bottom: 1,
    width: 14,
    height: 7,
    borderRadius: 5,
    backgroundColor: "rgba(227,219,208,0.76)",
  },
  modeRegisterPlus: {
    position: "absolute",
    right: -3,
    top: -4,
    color: "#7FEF9B",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 14,
  },
  modeText: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 14,
    fontWeight: "900",
  },
  modeTextActive: { color: "#F7F1E8" },
});
