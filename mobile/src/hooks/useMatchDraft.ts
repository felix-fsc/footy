import { useState } from "react";
import type { MapLocation, MatchResponse, SavedFieldResponse } from "../types/domain";
import { draftValuesFromMatch } from "../utils/matchDraftUtils";
import {
  dateInputFromInstant,
  timeInputFromInstant,
  tomorrowDateParts,
} from "../utils/matchUtils";
import { DEFAULT_MAP_CENTER } from "../utils/mapUtils";

const DEFAULT_FIELD_NAME = "Campo Municipal Saladillo";
const DEFAULT_FIELD_ADDRESS = "Calle Hermanos Alvarez Quintero 13";
const DEFAULT_CITY = "Huelva";

export function useMatchDraft() {
  const [title, setTitle] = useState("Partido Footy");
  const [fieldName, setFieldNameState] = useState(DEFAULT_FIELD_NAME);
  const [address, setAddress] = useState(DEFAULT_FIELD_ADDRESS);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [date, setDateState] = useState(tomorrowDateParts());
  const [time, setTime] = useState("19:00");
  const [maxPlayers, setMaxPlayers] = useState("5");
  const [pricePerPerson, setPricePerPerson] = useState("3.50");
  const [latitude, setLatitude] = useState(37.26142);
  const [longitude, setLongitude] = useState(-6.94472);
  const [selectedSavedFieldId, setSelectedSavedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  function reset() {
    setEditingMatchId(null);
    setTitle("Partido Footy");
    setFieldNameState(DEFAULT_FIELD_NAME);
    setAddress(DEFAULT_FIELD_ADDRESS);
    setCity(DEFAULT_CITY);
    setDateState(tomorrowDateParts());
    setTime("19:00");
    setMaxPlayers("5");
    setPricePerPerson("3.50");
    setLatitude(37.26142);
    setLongitude(-6.94472);
    setSelectedSavedFieldId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }

  function closePanels() {
    setEditingMatchId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }

  function startCreate() {
    reset();
  }

  function startEdit(match: MatchResponse) {
    const draftValues = draftValuesFromMatch(match);
    setEditingMatchId(match.id);
    setTitle(draftValues.title);
    setFieldNameState(draftValues.fieldName);
    setAddress(draftValues.address);
    setCity(draftValues.city);
    setDateState(dateInputFromInstant(match.startsAt));
    setTime(timeInputFromInstant(match.startsAt));
    setMaxPlayers(draftValues.maxPlayers);
    setPricePerPerson(draftValues.pricePerPerson);
    setLatitude(match.field?.latitude ?? DEFAULT_MAP_CENTER.latitude);
    setLongitude(match.field?.longitude ?? DEFAULT_MAP_CENTER.longitude);
    setSelectedSavedFieldId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }

  function selectSavedField(field: SavedFieldResponse | null) {
    setSelectedSavedFieldId(field?.id ?? null);
    if (!field) {
      return;
    }
    setFieldNameState(field.name);
    setAddress(field.address ?? "");
    setCity(field.city ?? "");
    if (typeof field.latitude === "number") {
      setLatitude(field.latitude);
    }
    if (typeof field.longitude === "number") {
      setLongitude(field.longitude);
    }
  }

  function setFieldName(value: string) {
    setSelectedSavedFieldId(null);
    setFieldNameState(value);
  }

  function setDate(value: string) {
    setDateState(value);
    setShowCalendar(false);
  }

  function applyLocation(location: MapLocation, nextAddress?: string, nextCity?: string) {
    setSelectedSavedFieldId(null);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    if (nextAddress) {
      setAddress(nextAddress);
    }
    if (nextCity) {
      setCity(nextCity);
    }
  }

  return {
    title,
    fieldName,
    address,
    city,
    date,
    time,
    maxPlayers,
    pricePerPerson,
    latitude,
    longitude,
    selectedSavedFieldId,
    showPreview,
    showCalendar,
    editingMatchId,
    setTitle,
    setFieldName,
    setDate,
    setTime,
    setMaxPlayers,
    setPricePerPerson,
    setShowPreview,
    setShowCalendar,
    toggleCalendar: () => setShowCalendar((current) => !current),
    closePanels,
    reset,
    startCreate,
    startEdit,
    selectSavedField,
    applyLocation,
    clearSelectedSavedField: () => setSelectedSavedFieldId(null),
    clearEditing: () => setEditingMatchId(null),
  };
}
