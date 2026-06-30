import { useCallback, useState } from "react";
import type { AppTab, HomeMode, MatchResponse } from "../types/domain";
import type { useMatchDraft } from "./useMatchDraft";
import type { useMatches } from "./useMatches";

type MatchDraftState = ReturnType<typeof useMatchDraft>;
type MatchesState = ReturnType<typeof useMatches>;

export function useAppNavigation({
  matchDraft,
  matchesState,
}: {
  matchDraft: MatchDraftState;
  matchesState: MatchesState;
}) {
  const [homeMode, setHomeMode] = useState<HomeMode>("map");
  const [appTab, setAppTab] = useState<AppTab>("home");

  const openDetail = useCallback(
    (matchId: string) => {
      matchesState.setSelectedMatchId(matchId);
      setAppTab("detail");
    },
    [matchesState.setSelectedMatchId],
  );

  const goHome = useCallback(() => {
    matchDraft.closePanels();
    matchesState.setSelectedMatchId(null);
    setAppTab("home");
  }, [matchDraft.closePanels, matchesState.setSelectedMatchId]);

  const closeMatchEditor = useCallback(() => {
    const matchId = matchDraft.editingMatchId;
    matchDraft.reset();
    if (matchId) {
      matchesState.setSelectedMatchId(matchId);
      setAppTab("detail");
      return;
    }
    goHome();
  }, [
    goHome,
    matchDraft.editingMatchId,
    matchDraft.reset,
    matchesState.setSelectedMatchId,
  ]);

  const startMatchCreate = useCallback(() => {
    matchDraft.startCreate();
    setAppTab("create");
  }, [matchDraft.startCreate]);

  const startMatchEdit = useCallback(
    (match: MatchResponse) => {
      matchDraft.startEdit(match);
      setAppTab("create");
    },
    [matchDraft.startEdit],
  );

  const openProfile = useCallback(() => {
    setAppTab("profile");
  }, []);

  const backToCreate = useCallback(() => {
    setAppTab("create");
  }, []);

  const openLocationPicker = useCallback(() => {
    matchDraft.clearSelectedSavedField();
    setAppTab("location");
  }, [matchDraft.clearSelectedSavedField]);

  const loadAfterAuthenticatedSession = useCallback(
    async (accessToken: string) => {
      setAppTab("home");
      setHomeMode("map");
      await matchesState.loadAfterAuthenticatedSession(accessToken);
    },
    [matchesState.loadAfterAuthenticatedSession],
  );

  return {
    appTab,
    homeMode,
    setAppTab,
    setHomeMode,
    openDetail,
    goHome,
    closeMatchEditor,
    startMatchCreate,
    startMatchEdit,
    openProfile,
    backToCreate,
    openLocationPicker,
    loadAfterAuthenticatedSession,
  };
}
