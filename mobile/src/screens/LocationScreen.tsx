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
import { Entrance, greenRipple, motionStyles } from "../components/ui/Motion";
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
        <Entrance style={styles.screenHeader} distance={10}>
          <View>
            <Text style={styles.smallLabel}>Ubicacion del partido</Text>
            <Text style={styles.screenTitle}>Mapa</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.closePill, pressed && styles.closePillPressed]}
            onPress={onBack}
            android_ripple={greenRipple}
          >
            <Text style={styles.closePillText}>Volver</Text>
          </Pressable>
        </Entrance>
        <Entrance style={styles.locationPickerShell} delay={70} distance={16}>
          <LocationPickerMap
            value={{ latitude, longitude }}
            city={city}
            fieldName={fieldName}
            onChange={onLocationChange}
          />
        </Entrance>
        <Entrance style={styles.locationSummaryCard} delay={120} distance={14}>
          <Text style={styles.locationSummaryTitle}>Punto seleccionado</Text>
          <Text style={styles.locationSummaryText}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.authButton, pressed && styles.authButtonPressed]}
            onPress={onUseLocation}
            android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
          >
            <Text style={styles.authButtonText}>Usar esta ubicacion</Text>
          </Pressable>
        </Entrance>
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
  closePillPressed: motionStyles.pressGlow,
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
  authButtonPressed: motionStyles.pressGlow,
  authButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
});
