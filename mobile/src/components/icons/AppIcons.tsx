import { StyleSheet, View } from "react-native";

export function LocationTargetIcon() {
  return (
    <View style={styles.locationIcon}>
      <View style={styles.locationIconPoint} />
      <View style={styles.locationIconHead}>
        <View style={styles.locationIconHole} />
      </View>
    </View>
  );
}

export function RefreshIcon() {
  return (
    <View style={styles.refreshIcon}>
      <View style={styles.refreshArrowTop}>
        <View style={styles.refreshArrowHeadTop} />
      </View>
      <View style={styles.refreshArrowBottom}>
        <View style={styles.refreshArrowHeadBottom} />
      </View>
    </View>
  );
}

export function MapPickerIcon() {
  return (
    <View style={styles.mapPickerIcon}>
      <View style={styles.mapPickerRoadOne} />
      <View style={styles.mapPickerRoadTwo} />
      <View style={styles.mapPickerPinPoint} />
      <View style={styles.mapPickerPinHead}>
        <View style={styles.mapPickerPinHole} />
      </View>
    </View>
  );
}

export function EditProfileIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <View style={styles.closeEditIcon}>
        <View style={[styles.closeEditLine, styles.closeEditLineOne]} />
        <View style={[styles.closeEditLine, styles.closeEditLineTwo]} />
      </View>
    );
  }

  return (
    <View style={styles.editIcon}>
      <View style={styles.editIconBody} />
      <View style={styles.editIconTip} />
    </View>
  );
}

export function PencilIcon() {
  return (
    <View style={styles.pencilIcon}>
      <View style={styles.pencilIconCore}>
        <View style={styles.pencilIconEraser} />
        <View style={styles.pencilIconBody} />
        <View style={styles.pencilIconTip} />
      </View>
      <View style={styles.pencilIconStroke} />
    </View>
  );
}

const styles = StyleSheet.create({
  locationIcon: {
    width: 22,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconHead: {
    position: "absolute",
    width: 16,
    height: 19,
    borderRadius: 8,
    backgroundColor: "#149BFF",
    alignItems: "center",
    justifyContent: "center",
    top: 1,
    zIndex: 2,
  },
  locationIconPoint: {
    position: "absolute",
    width: 0,
    height: 0,
    top: 18,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#149BFF",
    zIndex: 1,
  },
  locationIconHole: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#07100A",
  },
  refreshIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshArrowTop: {
    position: "absolute",
    width: 14,
    height: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#7FEF9B",
    borderTopLeftRadius: 9,
    left: 3,
    top: 4,
  },
  refreshArrowHeadTop: {
    position: "absolute",
    width: 7,
    height: 7,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#7FEF9B",
    right: -2,
    top: -5,
    transform: [{ rotate: "45deg" }],
  },
  refreshArrowBottom: {
    position: "absolute",
    width: 14,
    height: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#7FEF9B",
    borderBottomRightRadius: 9,
    right: 3,
    bottom: 4,
  },
  refreshArrowHeadBottom: {
    position: "absolute",
    width: 7,
    height: 7,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#7FEF9B",
    left: -2,
    bottom: -5,
    transform: [{ rotate: "45deg" }],
  },
  mapPickerIcon: {
    width: 28,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPickerRoadOne: {
    position: "absolute",
    width: 25,
    height: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(184,255,208,0.95)",
    transform: [{ rotate: "-14deg" }],
  },
  mapPickerRoadTwo: {
    position: "absolute",
    width: 20,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(127,239,155,0.58)",
    transform: [{ rotate: "18deg" }],
  },
  mapPickerPinHead: {
    position: "absolute",
    width: 13,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#7FEF9B",
    alignItems: "center",
    justifyContent: "center",
    top: 3,
  },
  mapPickerPinPoint: {
    position: "absolute",
    width: 0,
    height: 0,
    top: 16,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#7FEF9B",
  },
  mapPickerPinHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#07100A",
  },
  editIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-38deg" }],
  },
  editIconBody: {
    width: 15,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#F7F1E8",
  },
  editIconTip: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#8FEA6A",
    marginLeft: -1,
  },
  closeEditIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeEditLine: {
    position: "absolute",
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F7F1E8",
  },
  closeEditLineOne: { transform: [{ rotate: "45deg" }] },
  closeEditLineTwo: { transform: [{ rotate: "-45deg" }] },
  pencilIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  pencilIconCore: {
    width: 22,
    height: 8,
    flexDirection: "row",
    alignItems: "center",
    transform: [{ rotate: "-34deg" }],
  },
  pencilIconEraser: {
    width: 5,
    height: 8,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    backgroundColor: "#E3DBD0",
  },
  pencilIconBody: {
    width: 12,
    height: 8,
    backgroundColor: "#8FEA6A",
  },
  pencilIconTip: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#F7F1E8",
  },
  pencilIconStroke: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(247,241,232,0.55)",
    marginTop: 7,
    marginLeft: 7,
    transform: [{ rotate: "-34deg" }],
  },
});
