import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import { formatPriceFromCents } from "../../utils/matchUtils";
import { platformShadow } from "../../utils/styleUtils";
import { MatchImageBackground, OccupancyBar } from "../matches/MatchMedia";
import { StatusBadge } from "../ui/FormControls";

const POPUP_EDGE_PADDING = 10;

type SelectedPopupProps = {
  match: MatchResponse;
  matches: MatchResponse[];
  onOpenDetail: (id: string) => void;
  loading: boolean;
};

export function SelectedPopup({
  match,
  matches,
  onOpenDetail,
  loading,
}: SelectedPopupProps) {
  const groupedMatches = matches.length > 0 ? matches : [match];
  const hasMultipleMatches = groupedMatches.length > 1;
  const fieldName = match.field?.name ?? "Campo por confirmar";
  const fieldCity = match.field?.city ?? "Sin ciudad";
  const fieldTitle = fieldCity ? `${fieldName} - ${fieldCity}` : fieldName;
  const popupEventProps =
    Platform.OS === "web"
      ? ({
          onWheel: (event: {
            stopPropagation?: () => void;
            nativeEvent?: { stopPropagation?: () => void };
          }) => {
            event.stopPropagation?.();
            event.nativeEvent?.stopPropagation?.();
          },
        } as object)
      : {};

  const popupContent = (
    <>
      {hasMultipleMatches ? (
        <View style={styles.popupHeaderRow}>
          <View style={styles.popupHeaderText}>
            <Text style={styles.popupLabel}>
              {groupedMatches.length} partidos
            </Text>
            <Text style={styles.popupHeaderTitle} numberOfLines={1}>
              {fieldTitle}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={styles.popupBody}>
        {hasMultipleMatches ? (
          <ScrollView
            style={styles.popupMatchList}
            contentContainerStyle={styles.popupMatchListContent}
            showsVerticalScrollIndicator={false}
          >
            {groupedMatches.map((item) => (
              <Pressable
                key={item.id}
                style={styles.popupMatchOption}
                onPress={() => onOpenDetail(item.id)}
                disabled={loading}
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
        ) : (
          <Pressable
            style={styles.popupSingleOption}
            onPress={() => onOpenDetail(match.id)}
            disabled={loading}
          >
            <PopupMatchContent match={match} showField showTitleLocation />
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <View
      style={[styles.popupCard, hasMultipleMatches && styles.popupCardMultiple]}
      {...popupEventProps}
    >
      {hasMultipleMatches ? (
        <View style={styles.popupPlainWrap}>{popupContent}</View>
      ) : (
        <MatchImageBackground
          match={match}
          style={styles.popupImageWrap}
          imageStyle={styles.popupImage}
        >
          <View style={styles.popupImageOverlay} />
          {popupContent}
        </MatchImageBackground>
      )}
    </View>
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
  popupCard: {
    position: "absolute",
    left: Platform.OS === "web" ? "50%" : POPUP_EDGE_PADDING,
    right: Platform.OS === "web" ? undefined : POPUP_EDGE_PADDING,
    width: Platform.OS === "web" ? 420 : undefined,
    transform: Platform.OS === "web" ? [{ translateX: -210 }] : undefined,
    bottom: Platform.OS === "android" ? 112 : 108,
    maxHeight: Platform.OS === "web" ? 520 : "72%",
    borderRadius: 26,
    backgroundColor: "#0A110E",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    ...platformShadow({ opacity: 0.32, radius: 24, y: 14 }),
    zIndex: 22,
  },
  popupCardMultiple: {
    top: Platform.OS === "web" ? 42 : 34,
    maxHeight: undefined,
  },
  popupImageWrap: {
    minHeight: 0,
    padding: 12,
    justifyContent: "flex-start",
    gap: 10,
  },
  popupPlainWrap: {
    flex: 1,
    minHeight: 0,
    padding: 12,
    justifyContent: "flex-start",
    gap: 10,
    backgroundColor: "rgba(10,17,14,0.94)",
  },
  popupImage: { borderRadius: 26, opacity: 0.82 },
  popupImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.48)",
  },
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
