import { StyleSheet, Text, View } from "react-native";
import type { MatchResponse } from "../../types/domain";
import { PencilIcon } from "../icons/AppIcons";

type EditMatchBannerProps = {
  selectedMatch: MatchResponse | null;
  title: string;
};

export function EditMatchBanner({ selectedMatch, title }: EditMatchBannerProps) {
  return (
    <View style={styles.editModeBanner}>
      <View style={styles.editModeIcon}>
        <PencilIcon />
      </View>
      <View style={styles.editModeTextWrap}>
        <Text style={styles.editModeTitle} numberOfLines={1}>
          {selectedMatch?.title ?? title}
        </Text>
        <Text style={styles.editModeMeta} numberOfLines={1}>
          Los cambios se guardaran en el partido publicado
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.24)",
    padding: 12,
  },
  editModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(7,16,10,0.72)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  editModeTextWrap: { flex: 1, minWidth: 0, gap: 3 },
  editModeTitle: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  editModeMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 12,
    fontWeight: "800",
  },
});
