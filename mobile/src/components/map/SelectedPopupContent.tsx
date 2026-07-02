import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import {
  formatDurationMinutes,
  formatPriceFromCents,
} from "../../utils/matchUtils";
import { MatchImageBackground, OccupancyBar } from "../matches/MatchMedia";
import { StatusBadge } from "../ui/FormControls";
import { greenRipple, motionStyles } from "../ui/Motion";

type SelectedPopupContentProps = {
  fieldTitle: string;
  groupedMatches: MatchResponse[];
  hasMultipleMatches: boolean;
  loading: boolean;
  match: MatchResponse;
  onOpenDetail: (id: string) => void;
};

export function SelectedPopupContent({
  fieldTitle,
  groupedMatches,
  hasMultipleMatches,
  loading,
  match,
  onOpenDetail,
}: SelectedPopupContentProps) {
  return (
    <>
      {hasMultipleMatches ? (
        <View style={styles.popupHeaderRow}>
          <View style={styles.popupHeaderText}>
            <Text style={styles.popupLabel}>{groupedMatches.length} partidos</Text>
            <Text style={styles.popupHeaderTitle} numberOfLines={1}>
              {fieldTitle}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.popupBody}>
        {hasMultipleMatches ? (
          <MatchClusterList
            groupedMatches={groupedMatches}
            loading={loading}
            onOpenDetail={onOpenDetail}
          />
        ) : (
          <SingleMatchPopup
            loading={loading}
            match={match}
            onOpenDetail={onOpenDetail}
          />
        )}
      </View>
    </>
  );
}

function MatchClusterList({
  groupedMatches,
  loading,
  onOpenDetail,
}: {
  groupedMatches: MatchResponse[];
  loading: boolean;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <ScrollView
      style={styles.popupMatchList}
      contentContainerStyle={styles.popupMatchListContent}
      showsVerticalScrollIndicator={false}
    >
      {groupedMatches.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.popupMatchOption,
            pressed && motionStyles.pressGlow,
          ]}
          onPress={() => onOpenDetail(item.id)}
          disabled={loading}
          android_ripple={greenRipple}
        >
          <MatchImageBackground
            match={item}
            style={styles.popupMatchOptionImage}
            imageStyle={styles.popupMatchOptionImageStyle}
          >
            <View style={styles.popupMatchOptionOverlay} />
            <PopupMatchContent match={item} />
          </MatchImageBackground>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SingleMatchPopup({
  loading,
  match,
  onOpenDetail,
}: {
  loading: boolean;
  match: MatchResponse;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.popupSingleOption,
        pressed && motionStyles.pressGlow,
      ]}
      onPress={() => onOpenDetail(match.id)}
      disabled={loading}
      android_ripple={greenRipple}
    >
      <PopupMatchContent match={match} showField showTitleLocation />
    </Pressable>
  );
}

function PopupMatchContent({
  match,
  showField = false,
  showTitleLocation = false,
}: {
  match: MatchResponse;
  showField?: boolean;
  showTitleLocation?: boolean;
}) {
  const locationText = [match.field?.name, match.field?.city]
    .filter(Boolean)
    .join(" - ");
  const startDate = new Date(match.startsAt);
  const dateText = startDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
  const timeText = startDate.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <View style={styles.popupMatchTitleRow}>
        <View style={styles.popupMatchTitleBlock}>
          <Text style={styles.popupMatchTitle} numberOfLines={1}>
            {match.title}
          </Text>
        </View>
        <StatusBadge status={match.status} />
      </View>
      {showField && showTitleLocation ? (
        <Text style={styles.popupMatchPlace} numberOfLines={1}>
          {locationText || "Campo por confirmar"}
        </Text>
      ) : null}
      <View style={styles.popupMatchBubbleRow}>
        <View style={styles.popupMatchBubble}>
          <Text style={styles.popupMatchBubbleLabel}>Fecha</Text>
          <Text style={styles.popupMatchBubbleValue}>{dateText}</Text>
        </View>
        <View style={styles.popupMatchBubble}>
          <Text style={styles.popupMatchBubbleLabel}>Hora</Text>
          <Text style={styles.popupMatchBubbleValue}>{timeText}</Text>
        </View>
        <View style={styles.popupMatchBubble}>
          <Text style={styles.popupMatchBubbleLabel}>Duracion</Text>
          <Text style={styles.popupMatchBubbleValue}>
            {formatDurationMinutes(match.durationMinutes)}
          </Text>
        </View>
        <View style={styles.popupMatchBubble}>
          <Text style={styles.popupMatchBubbleLabel}>Precio</Text>
          <Text style={styles.popupMatchBubbleValue}>
            {formatPriceFromCents(match.pricePerPersonCents)}
          </Text>
        </View>
      </View>
      <OccupancyBar match={match} compact />
    </>
  );
}

const styles = StyleSheet.create({
  popupBody: { flex: 1, gap: 8, minHeight: 0 },
  popupHeaderRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  popupHeaderText: {
    flex: 1,
    gap: 2,
  },
  popupLabel: {
    color: "#8FEA6A",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  popupHeaderTitle: {
    color: "#F7F1E8",
    fontSize: 14,
    fontWeight: "900",
  },
  popupMatchList: {
    flex: 1,
    marginTop: 0,
  },
  popupMatchListContent: { gap: 8, paddingBottom: 2 },
  popupSingleOption: {
    gap: 5,
  },
  popupMatchOption: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: "rgba(10,17,14,0.48)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    overflow: "hidden",
  },
  popupMatchOptionImage: {
    minHeight: 96,
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 9,
    justifyContent: "flex-start",
  },
  popupMatchOptionImageStyle: {
    borderRadius: 18,
    opacity: 0.76,
  },
  popupMatchOptionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.44)",
  },
  popupMatchTitleRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  popupMatchTitleBlock: {
    flex: 1,
    gap: 0,
  },
  popupMatchTitle: {
    color: "#F7F1E8",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 17,
  },
  popupMatchPlace: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
    marginTop: -7,
  },
  popupMatchBubbleRow: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 4,
  },
  popupMatchBubble: {
    flex: 1,
    minWidth: 0,
    maxWidth: 104,
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: "rgba(10,17,14,0.72)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.22)",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  popupMatchBubbleLabel: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  popupMatchBubbleValue: {
    color: "#F7F1E8",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 0,
  },
});
