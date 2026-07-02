import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import { formatDate, formatDurationMinutes } from "../../utils/matchUtils";
import { greenRipple, motionStyles } from "../ui/Motion";
import { MatchImageBackground } from "./MatchMedia";

export function CompactMatch({
  match,
  onPress,
}: {
  match: MatchResponse;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.compactMatch,
        pressed && motionStyles.pressGlow,
      ]}
      onPress={onPress}
      android_ripple={greenRipple}
    >
      <MatchImageBackground
        match={match}
        imageStyle={styles.compactMatchImage}
        style={styles.compactMatchImageWrap}
      >
        <View style={styles.compactMatchOverlay} />
        <View style={styles.compactMatchContent}>
          <Text style={styles.compactMatchTitle}>{match.title}</Text>
          <Text style={styles.compactMatchMeta}>
            {formatDate(match.startsAt)} -{" "}
            {formatDurationMinutes(match.durationMinutes)}
          </Text>
          <Text style={styles.compactMatchPlace}>
            {match.field?.name ?? "Campo pendiente"} -{" "}
            {match.field?.city ?? "Sin ciudad"}
          </Text>
        </View>
      </MatchImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactMatch: {
    minHeight: 118,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#0A110E",
  },
  compactMatchImageWrap: {
    flex: 1,
    minHeight: 118,
    justifyContent: "flex-end",
  },
  compactMatchImage: { borderRadius: 26, opacity: 0.46 },
  compactMatchOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.56)",
  },
  compactMatchContent: { padding: 16, gap: 4 },
  compactMatchTitle: { color: "#F7F1E8", fontSize: 18, fontWeight: "900" },
  compactMatchMeta: { color: "rgba(227,219,208,0.82)", fontSize: 13 },
  compactMatchPlace: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
});
