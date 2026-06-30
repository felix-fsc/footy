import { useCallback } from "react";
import type { MapLocation } from "../types/domain";
import type { useMatchDraft } from "./useMatchDraft";
import type { useMatches } from "./useMatches";
import type { useProfile } from "./useProfile";

type MatchDraftState = ReturnType<typeof useMatchDraft>;
type MatchesState = ReturnType<typeof useMatches>;
type ProfileState = ReturnType<typeof useProfile>;

export function useAppViewActions({
  matchDraft,
  matchDraftCity,
  matchesState,
  profileState,
  setShowIntroVideo,
}: {
  matchDraft: MatchDraftState;
  matchDraftCity: string;
  matchesState: MatchesState;
  profileState: ProfileState;
  setShowIntroVideo: (show: boolean) => void;
}) {
  const finishIntroVideo = useCallback(() => {
    setShowIntroVideo(false);
  }, [setShowIntroVideo]);

  const closePublicProfile = useCallback(() => {
    profileState.setShowPublicProfile(false);
  }, [profileState.setShowPublicProfile]);

  const closePreview = useCallback(() => {
    matchDraft.setShowPreview(false);
  }, [matchDraft.setShowPreview]);

  const closeCalendar = useCallback(() => {
    matchDraft.setShowCalendar(false);
  }, [matchDraft.setShowCalendar]);

  const clearSelectedMatch = useCallback(() => {
    matchesState.setSelectedMatchId(null);
  }, [matchesState.setSelectedMatchId]);

  const applyLocationToDraft = useCallback(
    (location: MapLocation, address?: string) => {
      matchDraft.applyLocation(location, address, matchDraftCity);
    },
    [matchDraft.applyLocation, matchDraftCity],
  );

  return {
    applyLocationToDraft,
    clearSelectedMatch,
    closeCalendar,
    closePreview,
    closePublicProfile,
    finishIntroVideo,
  };
}
