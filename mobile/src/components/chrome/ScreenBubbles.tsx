import { StyleSheet, View } from "react-native";

export function ScreenBubbles() {
  return (
    <View pointerEvents="none" style={styles.screenBubbles}>
      <View style={styles.screenBubbleOne} />
      <View style={styles.screenBubbleTwo} />
      <View style={styles.screenBubbleThree} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenBubbles: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  screenBubbleOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -130,
    top: 20,
    backgroundColor: "rgba(179,243,81,0.08)",
  },
  screenBubbleTwo: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    left: -110,
    bottom: 140,
    backgroundColor: "rgba(227,219,208,0.045)",
  },
  screenBubbleThree: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: 34,
    bottom: 52,
    backgroundColor: "rgba(179,243,81,0.045)",
  },
});
