import { ComponentProps, ReactNode, useState } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import { getFallbackMatchCover, getMatchCover } from "../../utils/matchUtils";

export function MatchImageBackground({
  match,
  style,
  imageStyle,
  children,
}: {
  match: MatchResponse;
  style: ComponentProps<typeof ImageBackground>["style"];
  imageStyle?: ComponentProps<typeof ImageBackground>["imageStyle"];
  children: ReactNode;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const source = useFallback ? getFallbackMatchCover(match) : getMatchCover(match);

  return (
    <ImageBackground
      source={{ uri: source }}
      style={style}
      imageStyle={imageStyle}
      onError={() => setUseFallback(true)}
    >
      {children}
    </ImageBackground>
  );
}

export function OccupancyBar({
  match,
  compact = false,
}: {
  match: MatchResponse;
  compact?: boolean;
}) {
  const occupancy = match.occupancy;
  const totalCapacity = occupancy?.totalCapacity ?? match.maxPlayersPerTeam * 2;
  const totalPlayers = occupancy?.totalPlayers ?? 0;
  const percentage =
    totalCapacity > 0 ? Math.min(100, (totalPlayers / totalCapacity) * 100) : 0;

  return (
    <View style={[styles.occupancyBlock, compact && styles.occupancyBlockCompact]}>
      <View style={styles.occupancyBarRow}>
        <View style={styles.occupancyTrack}>
          <View style={[styles.occupancyFill, { width: `${percentage}%` }]} />
        </View>
        {compact ? (
          <Text style={styles.occupancyInlineText}>
            {totalPlayers}/{totalCapacity}
          </Text>
        ) : null}
      </View>
      {compact ? null : (
        <Text style={styles.occupancyText}>
          {totalPlayers}/{totalCapacity} jugadores
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  occupancyBlock: { marginTop: 4, gap: 5 },
  occupancyBlockCompact: { marginTop: 0, gap: 0 },
  occupancyBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  occupancyTrack: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(227,219,208,0.24)",
    overflow: "hidden",
  },
  occupancyFill: { height: 8, borderRadius: 8, backgroundColor: "#8FEA6A" },
  occupancyText: {
    color: "rgba(227,219,208,0.90)",
    fontSize: 9,
    fontWeight: "900",
  },
  occupancyInlineText: {
    minWidth: 34,
    textAlign: "right",
    color: "rgba(247,241,232,0.92)",
    fontSize: 10,
    fontWeight: "900",
  },
});
