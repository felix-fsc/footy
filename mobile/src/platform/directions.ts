import { Alert, Linking } from "react-native";
import type { MatchResponse } from "../types/domain";
import { getMatchLocation } from "../utils/mapUtils";

export async function openMatchDirections(match: MatchResponse) {
  const location = getMatchLocation(match);
  const fallbackQuery = [
    match.field?.name,
    match.field?.address,
    match.field?.city,
  ]
    .filter(Boolean)
    .join(", ");
  const query = location
    ? `${location.latitude},${location.longitude}`
    : fallbackQuery;

  if (!query) {
    Alert.alert("Ubicacion no disponible", "Este partido no tiene destino.");
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  await Linking.openURL(url);
}
