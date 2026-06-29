import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import { LocationPickerMap } from "../components/map/LocationPickerMap";
import type { MapLocation } from "../types/domain";

type LocationScreenProps = {
  latitude: number;
  longitude: number;
  city: string;
  fieldName: string;
  topInset: number;
  bottomInset: number;
  onBack: () => void;
  onUseLocation: () => void;
  onLocationChange: (location: MapLocation, address?: string) => void;
};

export function LocationScreen({
  latitude,
  longitude,
  city,
  fieldName,
  topInset,
  bottomInset,
  onBack,
  onUseLocation,
  onLocationChange,
}: LocationScreenProps) {
  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <View
        style={[
          styles.locationScreen,
          {
            paddingTop: topInset + 18,
            paddingBottom: bottomInset + 24,
          },
        ]}
      >
        <View style={styles.screenHeader}>
          <View>
            <Text style={styles.smallLabel}>Ubicacion del partido</Text>
            <Text style={styles.screenTitle}>Mapa</Text>
          </View>
          <Pressable style={styles.closePill} onPress={onBack}>
            <Text style={styles.closePillText}>Volver</Text>
          </Pressable>
        </View>
        <View style={styles.locationPickerShell}>
          <LocationPickerMap
            value={{ latitude, longitude }}
            city={city}
            fieldName={fieldName}
            onChange={onLocationChange}
          />
        </View>
        <View style={styles.locationSummaryCard}>
          <Text style={styles.locationSummaryTitle}>Punto seleccionado</Text>
          <Text style={styles.locationSummaryText}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
          <Pressable style={styles.authButton} onPress={onUseLocation}>
            <Text style={styles.authButtonText}>Usar esta ubicacion</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  locationScreen: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 920 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 10,
    gap: 16,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallLabel: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  screenTitle: { color: "#E3DBD0", fontSize: 30, fontWeight: "900" },
  closePill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.12)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
  locationPickerShell: {
    flex: 1,
    minHeight: 360,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.12)",
  },
  locationSummaryCard: {
    borderRadius: 18,
    backgroundColor: "#E3DBD0",
    padding: 16,
    gap: 10,
  },
  locationSummaryTitle: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  locationSummaryText: { color: "#4A4A4A", fontSize: 13, fontWeight: "800" },
  authButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
});
