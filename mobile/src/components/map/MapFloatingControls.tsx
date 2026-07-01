import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LocationTargetIcon } from "../icons/AppIcons";
import { platformShadow } from "../../utils/styleUtils";

type MapFloatingControlsProps = {
  loading: boolean;
  onUseMyLocation: () => void;
};

export function MapFloatingControls({
  loading,
  onUseMyLocation,
}: MapFloatingControlsProps) {
  return (
    <>
      <Pressable style={styles.mapLocationButton} onPress={onUseMyLocation}>
        <LocationTargetIcon />
      </Pressable>

      {loading ? (
        <View style={styles.mapLoadingPill}>
          <ActivityIndicator color="#0A110E" />
          <Text style={styles.mapLoadingText}>Actualizando</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  mapLocationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: "rgba(7,16,10,0.92)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
    ...platformShadow({ opacity: 0.3, radius: 18, y: 10 }),
    zIndex: 18,
  },
  mapLoadingPill: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#8FEA6A",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  mapLoadingText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
});
