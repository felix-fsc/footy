import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { MapLocation } from "../types/domain";
import { geocodePlace, getCityMapCenter } from "../utils/mapUtils";

export function useLocationSearch({
  city,
  onChange,
  onLocationFound,
}: {
  city: string;
  onChange: (location: MapLocation, address?: string) => void;
  onLocationFound: (location: MapLocation) => void;
}) {
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);

  const searchLocation = useCallback(async () => {
    const query = locationSearch.trim();
    if (!query) {
      const fallback = getCityMapCenter(city);
      onLocationFound(fallback);
      onChange(fallback, city || undefined);
      return;
    }

    setLocationSearching(true);
    try {
      const result = await geocodePlace(query, city);
      if (!result) {
        Alert.alert("Sin resultados", "No he encontrado esa direccion.");
        return;
      }
      onLocationFound(result.location);
      onChange(result.location, result.address);
    } catch (error) {
      Alert.alert(
        "No se pudo buscar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLocationSearching(false);
    }
  }, [city, locationSearch, onChange, onLocationFound]);

  return {
    locationSearch,
    locationSearching,
    searchLocation,
    setLocationSearch,
  };
}
