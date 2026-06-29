import type { MatchResponse } from "../types/domain";

export type MatchDraftValues = {
  title: string;
  fieldName: string;
  address: string;
  city: string;
  date: string;
  time: string;
  maxPlayers: string;
  pricePerPerson: string;
  latitude: number;
  longitude: number;
  selectedSavedFieldId: string | null;
  coverImageUrl: string;
};

export type MatchDraftValidation =
  | {
      ok: true;
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
  maxPlayers,
  pricePerPerson,
}: Pick<
  MatchDraftValues,
  "title" | "fieldName" | "date" | "time" | "maxPlayers" | "pricePerPerson"
>): MatchDraftValidation {
  if (!title.trim() || !fieldName.trim() || !date.trim() || !time.trim()) {
    return {
      ok: false,
      title: "Faltan datos",
      message: "Completa titulo, campo, fecha y hora.",
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
    maxPlayers: String(match.maxPlayersPerTeam),
    pricePerPerson: (match.pricePerPersonCents / 100).toFixed(2),
  };
}
