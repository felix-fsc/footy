import type { MatchLocationMode, MatchResponse } from "../types/domain";

const DEFAULT_MATCH_DURATION_MINUTES = 90;
const MIN_MATCH_DURATION_MINUTES = 30;
const MAX_MATCH_DURATION_MINUTES = 240;

export type MatchDraftValues = {
  title: string;
  fieldName: string;
  address: string;
  city: string;
  date: string;
  time: string;
  durationMinutes: string;
  maxPlayers: string;
  pricePerPerson: string;
  latitude: number;
  longitude: number;
  locationMode: MatchLocationMode;
  selectedSavedFieldId: string | null;
  coverImageUrl: string;
};

export type MatchDraftValidation =
  | {
      ok: true;
      durationMinutes: number;
      maxPlayers: number;
      pricePerPersonCents: number;
    }
  | {
      ok: false;
      title: string;
      message: string;
    };

export function validateMatchDraftValues({
  title,
  fieldName,
  date,
  time,
  durationMinutes,
  maxPlayers,
  pricePerPerson,
  locationMode,
  selectedSavedFieldId,
}: Pick<
  MatchDraftValues,
  | "title"
  | "fieldName"
  | "date"
  | "time"
  | "durationMinutes"
  | "maxPlayers"
  | "pricePerPerson"
  | "locationMode"
  | "selectedSavedFieldId"
>): MatchDraftValidation {
  if (!title.trim() || !fieldName.trim() || !date.trim() || !time.trim()) {
    return {
      ok: false,
      title: "Faltan datos",
      message: "Completa titulo, campo, fecha y hora.",
    };
  }

  if (locationMode === "saved" && !selectedSavedFieldId) {
    return {
      ok: false,
      title: "Elige una pista",
      message: "Selecciona una pista guardada o cambia a ubicacion manual.",
    };
  }

  const durationValue = Number(durationMinutes);
  if (
    !Number.isInteger(durationValue) ||
    durationValue < MIN_MATCH_DURATION_MINUTES ||
    durationValue > MAX_MATCH_DURATION_MINUTES
  ) {
    return {
      ok: false,
      title: "Revisa la duracion",
      message: `La duracion debe estar entre ${MIN_MATCH_DURATION_MINUTES} y ${MAX_MATCH_DURATION_MINUTES} minutos.`,
    };
  }

  const maxPlayersValue = Number(maxPlayers);
  if (
    !Number.isInteger(maxPlayersValue) ||
    maxPlayersValue < 1 ||
    maxPlayersValue > 11
  ) {
    return {
      ok: false,
      title: "Revisa plazas",
      message: "El maximo por equipo debe estar entre 1 y 11.",
    };
  }

  const priceValue = Number(pricePerPerson.replace(",", "."));
  if (!Number.isFinite(priceValue) || priceValue < 0 || priceValue > 100) {
    return {
      ok: false,
      title: "Revisa el precio",
      message: "El precio por persona debe estar entre 0 y 100 euros.",
    };
  }

  return {
    ok: true,
    durationMinutes: durationValue,
    maxPlayers: maxPlayersValue,
    pricePerPersonCents: Math.round(priceValue * 100),
  };
}

export function buildMatchRequestBody(
  values: MatchDraftValues,
  validation: Extract<MatchDraftValidation, { ok: true }>,
) {
  return {
    title: values.title.trim(),
    startsAt: new Date(`${values.date}T${values.time}:00`).toISOString(),
    durationMinutes: validation.durationMinutes,
    maxPlayersPerTeam: validation.maxPlayers,
    pricePerPersonCents: validation.pricePerPersonCents,
    coverImageUrl: values.coverImageUrl,
    fieldId: values.selectedSavedFieldId,
    field: values.selectedSavedFieldId
      ? null
      : {
          name: values.fieldName.trim(),
          address: values.address.trim() || null,
          city: values.city.trim() || null,
          latitude: values.latitude,
          longitude: values.longitude,
        },
  };
}

export function draftValuesFromMatch(match: MatchResponse) {
  return {
    title: match.title,
    fieldName: match.field?.name ?? "Campo por confirmar",
    address: match.field?.address ?? "",
    city: match.field?.city ?? "",
    durationMinutes: String(
      match.durationMinutes ?? DEFAULT_MATCH_DURATION_MINUTES,
    ),
    maxPlayers: String(match.maxPlayersPerTeam),
    pricePerPerson: (match.pricePerPersonCents / 100).toFixed(2),
  };
}
