import { Platform, StyleSheet, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import { platformShadow } from "../../utils/styleUtils";
import { MatchImageBackground } from "../matches/MatchMedia";
import { SelectedPopupContent } from "./SelectedPopupContent";

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
    <SelectedPopupContent
      fieldTitle={fieldTitle}
      groupedMatches={groupedMatches}
      hasMultipleMatches={hasMultipleMatches}
      loading={loading}
      match={match}
      onOpenDetail={onOpenDetail}
    />
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
});
