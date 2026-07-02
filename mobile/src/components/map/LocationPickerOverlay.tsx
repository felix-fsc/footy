import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Entrance, motionStyles } from "../ui/Motion";

const LOCATION_PICKER_EDGE_PADDING = 10;

type LocationPickerOverlayProps = {
  city: string;
  fieldName: string;
  locationSearch: string;
  locationSearching: boolean;
  onLocationSearchChange: (value: string) => void;
  onSearchLocation: () => void;
};

export function LocationPickerOverlay({
  city,
  fieldName,
  locationSearch,
  locationSearching,
  onLocationSearchChange,
  onSearchLocation,
}: LocationPickerOverlayProps) {
  return (
    <>
      <Entrance style={styles.locationSearchPanel} distance={12}>
        <TextInput
          style={styles.locationSearchInput}
          value={locationSearch}
          onChangeText={onLocationSearchChange}
          placeholder={`Buscar calle cerca de ${fieldName || city || "la pista"}`}
          placeholderTextColor="rgba(227,219,208,0.62)"
          returnKeyType="search"
          onSubmitEditing={onSearchLocation}
        />
        <Pressable
          style={({ pressed }) => [
            styles.locationSearchButton,
            pressed && motionStyles.pressGlow,
          ]}
          onPress={onSearchLocation}
          disabled={locationSearching}
          android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
        >
          {locationSearching ? (
            <ActivityIndicator color="#0A110E" />
          ) : (
            <Text style={styles.locationSearchButtonText}>Buscar</Text>
          )}
        </Pressable>
      </Entrance>
      <Entrance style={styles.locationPickerHint} delay={70} distance={10}>
        <Text style={styles.locationPickerHintText}>
          Toca el mapa para fijar la pista
        </Text>
      </Entrance>
    </>
  );
}

const styles = StyleSheet.create({
  locationSearchPanel: {
    position: "absolute",
    top: 14,
    left: LOCATION_PICKER_EDGE_PADDING,
    right: LOCATION_PICKER_EDGE_PADDING,
    zIndex: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  locationSearchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(10,17,14,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    color: "#F7F1E8",
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "800",
  },
  locationSearchButton: {
    minHeight: 44,
    minWidth: 82,
    borderRadius: 14,
    backgroundColor: "#B7F36B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationSearchButtonText: {
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  locationPickerHint: {
    position: "absolute",
    left: 18,
    top: 70,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10,17,14,0.78)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickerHintText: { color: "#E3DBD0", fontSize: 12, fontWeight: "900" },
});
