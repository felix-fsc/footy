import { useCallback, useState } from "react";
import { DEFAULT_MATCH_DRAFT } from "../constants/matchDraftDefaults";
import type {
  MapLocation,
  MatchLocationMode,
  MatchResponse,
  SavedFieldResponse,
} from "../types/domain";
import { draftValuesFromMatch } from "../utils/matchDraftUtils";
import {
  dateInputFromInstant,
  timeInputFromInstant,
  tomorrowDateParts,
} from "../utils/matchUtils";
import { DEFAULT_MAP_CENTER } from "../utils/mapUtils";

export function useMatchDraft() {
  const [title, setTitle] = useState<string>(DEFAULT_MATCH_DRAFT.title);
  const [fieldName, setFieldNameState] = useState<string>(
    DEFAULT_MATCH_DRAFT.fieldName,
  );
  const [address, setAddress] = useState<string>(DEFAULT_MATCH_DRAFT.address);
  const [city, setCity] = useState<string>(DEFAULT_MATCH_DRAFT.city);
  const [date, setDateState] = useState(tomorrowDateParts());
  const [time, setTime] = useState<string>(DEFAULT_MATCH_DRAFT.time);
  const [durationMinutes, setDurationMinutes] = useState<string>(
    DEFAULT_MATCH_DRAFT.durationMinutes,
  );
  const [maxPlayers, setMaxPlayers] = useState<string>(
    DEFAULT_MATCH_DRAFT.maxPlayers,
  );
  const [pricePerPerson, setPricePerPerson] = useState<string>(
    DEFAULT_MATCH_DRAFT.pricePerPerson,
  );
  const [latitude, setLatitude] = useState<number>(DEFAULT_MATCH_DRAFT.latitude);
  const [longitude, setLongitude] = useState<number>(
    DEFAULT_MATCH_DRAFT.longitude,
  );
  const [selectedSavedFieldId, setSelectedSavedFieldId] = useState<
    string | null
  >(null);
  const [locationMode, setLocationModeState] =
    useState<MatchLocationMode>("manual");
  const [showPreview, setShowPreview] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setEditingMatchId(null);
    setTitle(DEFAULT_MATCH_DRAFT.title);
    setFieldNameState(DEFAULT_MATCH_DRAFT.fieldName);
    setAddress(DEFAULT_MATCH_DRAFT.address);
    setCity(DEFAULT_MATCH_DRAFT.city);
    setDateState(tomorrowDateParts());
    setTime(DEFAULT_MATCH_DRAFT.time);
    setDurationMinutes(DEFAULT_MATCH_DRAFT.durationMinutes);
    setMaxPlayers(DEFAULT_MATCH_DRAFT.maxPlayers);
    setPricePerPerson(DEFAULT_MATCH_DRAFT.pricePerPerson);
    setLatitude(DEFAULT_MATCH_DRAFT.latitude);
    setLongitude(DEFAULT_MATCH_DRAFT.longitude);
    setLocationModeState("manual");
    setSelectedSavedFieldId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }, []);

  const closePanels = useCallback(() => {
    setEditingMatchId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }, []);

  const startCreate = useCallback(() => {
    reset();
  }, [reset]);

  const startEdit = useCallback((match: MatchResponse) => {
    const draftValues = draftValuesFromMatch(match);
    setEditingMatchId(match.id);
    setTitle(draftValues.title);
    setFieldNameState(draftValues.fieldName);
    setAddress(draftValues.address);
    setCity(draftValues.city);
    setDateState(dateInputFromInstant(match.startsAt));
    setTime(timeInputFromInstant(match.startsAt));
    setDurationMinutes(draftValues.durationMinutes);
    setMaxPlayers(draftValues.maxPlayers);
    setPricePerPerson(draftValues.pricePerPerson);
    setLatitude(match.field?.latitude ?? DEFAULT_MAP_CENTER.latitude);
    setLongitude(match.field?.longitude ?? DEFAULT_MAP_CENTER.longitude);
    setLocationModeState("manual");
    setSelectedSavedFieldId(null);
    setShowPreview(false);
    setShowCalendar(false);
  }, []);

  const selectSavedField = useCallback((field: SavedFieldResponse | null) => {
    setSelectedSavedFieldId(field?.id ?? null);
    if (!field) {
      setLocationModeState("manual");
      return;
    }
    setLocationModeState("saved");
    setFieldNameState(field.name);
    setAddress(field.address ?? "");
    setCity(field.city ?? "");
    if (typeof field.latitude === "number") {
      setLatitude(field.latitude);
    }
    if (typeof field.longitude === "number") {
      setLongitude(field.longitude);
    }
  }, []);

  const setFieldName = useCallback((value: string) => {
    setSelectedSavedFieldId(null);
    setLocationModeState("manual");
    setFieldNameState(value);
  }, []);

  const setDate = useCallback((value: string) => {
    setDateState(value);
    setShowCalendar(false);
  }, []);

  const applyLocation = useCallback(
    (location: MapLocation, nextAddress?: string, nextCity?: string) => {
      setSelectedSavedFieldId(null);
      setLocationModeState("manual");
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      if (nextAddress) {
        setAddress(nextAddress);
      }
      if (nextCity) {
        setCity(nextCity);
      }
    },
    [],
  );

  const toggleCalendar = useCallback(
    () => setShowCalendar((current) => !current),
    [],
  );
  const clearSelectedSavedField = useCallback(
    () => {
      setSelectedSavedFieldId(null);
      setLocationModeState("manual");
    },
    [],
  );
  const setLocationMode = useCallback((mode: MatchLocationMode) => {
    setLocationModeState(mode);
    if (mode === "manual") {
      setSelectedSavedFieldId(null);
    }
  }, []);
  const clearEditing = useCallback(() => setEditingMatchId(null), []);

  return {
    title,
    fieldName,
    address,
    city,
    date,
    time,
    durationMinutes,
    maxPlayers,
    pricePerPerson,
    latitude,
    longitude,
    locationMode,
    selectedSavedFieldId,
    showPreview,
    showCalendar,
    editingMatchId,
    setTitle,
    setFieldName,
    setDate,
    setTime,
    setDurationMinutes,
    setMaxPlayers,
    setPricePerPerson,
    setShowPreview,
    setShowCalendar,
    toggleCalendar,
    setLocationMode,
    closePanels,
    reset,
    startCreate,
    startEdit,
    selectSavedField,
    applyLocation,
    clearSelectedSavedField,
    clearEditing,
  };
}
