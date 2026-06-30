import type { PlayerProfileResponse } from "../types/domain";

const DEFAULT_APP_CITY = "Huelva";

export function getUserCity({
  profile,
  profileCity,
}: {
  profile: PlayerProfileResponse | null;
  profileCity: string;
}) {
  return profile?.city || profileCity || DEFAULT_APP_CITY;
}

export function getMatchDraftCity({
  draftCity,
  profile,
  profileCity,
}: {
  draftCity: string;
  profile: PlayerProfileResponse | null;
  profileCity: string;
}) {
  return profile?.city || profileCity || draftCity || DEFAULT_APP_CITY;
}
