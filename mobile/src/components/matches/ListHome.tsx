import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import {
  formatDate,
  formatDurationMinutes,
  userParticipatesInMatch,
} from "../../utils/matchUtils";
import { platformShadow } from "../../utils/styleUtils";
import { StatusBadge } from "../ui/FormControls";
import { greenRipple, motionStyles } from "../ui/Motion";
import { MatchImageBackground, OccupancyBar } from "./MatchMedia";

type ListHomeProps = {
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  currentUserId: string | null;
  selectedMatchId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  loading: boolean;
};

export function ListHome({
  matches,
  myMatches,
  currentUserId,
  selectedMatchId,
  onSelect,
  onOpenDetail,
  loading,
}: ListHomeProps) {
  const emptyTitle = "No hay partidos cerca";
  const emptyText = "Crea un partido con el boton central.";

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.listLoadingRow}>
          <ActivityIndicator color="#8FEA6A" />
          <Text style={styles.listLoadingText}>Actualizando partidos</Text>
        </View>
      ) : null}
      {matches.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        matches.map((match) => {
          const mine = myMatches.some((item) => item.id === match.id);
          const participating = Boolean(
            currentUserId && userParticipatesInMatch(match, currentUserId),
          );

          return (
            <Pressable
              key={match.id}
              style={({ pressed }) => [
                styles.listCard,
                match.id === selectedMatchId && styles.listCardSelected,
                pressed && motionStyles.pressGlow,
              ]}
              onPress={() => {
                onSelect(match.id);
                onOpenDetail(match.id);
              }}
              android_ripple={greenRipple}
            >
              <MatchImageBackground
                match={match}
                imageStyle={styles.listCardImage}
                style={styles.listCardImageWrap}
              >
                <View style={styles.listCardOverlay} />
                <View style={styles.listCardPressArea}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.listCardTitle} numberOfLines={1}>
                      {match.title}
                    </Text>
                    <StatusBadge status={match.status} />
                  </View>
                  <View style={styles.matchMetaRow}>
                    <Text style={styles.matchDatePill} numberOfLines={1}>
                      {formatDate(match.startsAt)}
                    </Text>
                    <Text style={styles.matchCityPill} numberOfLines={1}>
                      {match.field?.city ?? "Sin ciudad"}
                    </Text>
                    <Text style={styles.matchDurationPill} numberOfLines={1}>
                      {formatDurationMinutes(match.durationMinutes)}
                    </Text>
                    {mine || participating ? (
                      <Text style={styles.matchMinePill}>Apuntado</Text>
                    ) : null}
                  </View>
                  <Text style={styles.listCardMeta} numberOfLines={1}>
                    {match.field?.name ?? "Campo por confirmar"}
                  </Text>
                  <OccupancyBar match={match} />
                </View>
              </MatchImageBackground>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === "android" ? 116 : 104,
    gap: 10,
  },
  listLoadingRow: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listLoadingText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  listCard: {
    minHeight: 142,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  listCardImageWrap: {
    minHeight: 146,
    padding: 12,
    justifyContent: "space-between",
    gap: 8,
  },
  listCardImage: { borderRadius: 22, opacity: 0.42 },
  listCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.56)",
  },
  listCardPressArea: { gap: 6 },
  listCardSelected: {
    borderWidth: 2,
    borderColor: "#7FEF9B",
    ...platformShadow({
      color: "#7FEF9B",
      opacity: 0.18,
      radius: 18,
      y: 10,
    }),
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  listCardTitle: { flex: 1, color: "#F7F1E8", fontSize: 17, fontWeight: "900" },
  listCardMeta: {
    color: "rgba(227,219,208,0.86)",
    fontSize: 14,
    fontWeight: "800",
  },
  matchMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  matchDatePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#0A110E",
    color: "#E3DBD0",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchCityPill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#8FEA6A",
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchDurationPill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(247,241,232,0.14)",
    color: "#F7F1E8",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchMinePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(227,219,208,0.16)",
    color: "#E3DBD0",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyPanel: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.12)",
  },
  emptyTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#BDB6AE", fontSize: 14, marginTop: 6 },
});
