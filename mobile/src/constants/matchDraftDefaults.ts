import { DEFAULT_CITY } from "./locations";
import { DEFAULT_MAP_CENTER } from "../utils/mapUtils";

export const DEFAULT_MATCH_DRAFT = {
  title: "Partido Footy",
  fieldName: "Campo Municipal Saladillo",
  address: "Calle Hermanos Alvarez Quintero 13",
  city: DEFAULT_CITY,
  time: "19:00",
  maxPlayers: "5",
  pricePerPerson: "3.50",
  latitude: DEFAULT_MAP_CENTER.latitude,
  longitude: DEFAULT_MAP_CENTER.longitude,
} as const;
