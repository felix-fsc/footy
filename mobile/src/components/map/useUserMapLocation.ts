import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import type { MapLocation } from "../../types/domain";

export function useUserMapLocation(onLocationResolved?: () => void) {
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);

  const useMyLocation = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        if (!("geolocation" in navigator)) {
          Alert.alert(
            "Ubicacion no disponible",
            "Este navegador no expone geolocalizacion.",
          );
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            onLocationResolved?.();
          },
          () => {
            Alert.alert(
              "No se pudo usar tu ubicacion",
              "Revisa permisos de ubicacion del navegador.",
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso de ubicacion necesario",
          "Activa la ubicacion para centrar el mapa en tu posicion.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      onLocationResolved?.();
    } catch {
      Alert.alert(
        "No se pudo usar tu ubicacion",
        "Revisa que la ubicacion del dispositivo este activada.",
      );
    }
  }, [onLocationResolved]);

  return { userLocation, useMyLocation };
}
