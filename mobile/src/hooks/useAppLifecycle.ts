import { useEffect } from "react";
import type { ApiRequest } from "../types/api";
import type { AppTab } from "../types/domain";
import { requestAppPermissions } from "../platform/permissions";
import type { useAdminFields } from "./useAdminFields";
import type { useMatchActions } from "./useMatchActions";
import type { useMatches } from "./useMatches";
import type { useProfile } from "./useProfile";

type AdminFieldsState = ReturnType<typeof useAdminFields>;
type MatchActionsState = ReturnType<typeof useMatchActions>;
type MatchesState = ReturnType<typeof useMatches>;
type ProfileState = ReturnType<typeof useProfile>;

export function useAppLifecycle({
  adminFields,
  appTab,
  matchActions,
  matchesState,
  profileState,
  request,
  restoringSession,
  showIntroVideo,
  token,
}: {
  adminFields: AdminFieldsState;
  appTab: AppTab;
  matchActions: MatchActionsState;
  matchesState: MatchesState;
  profileState: ProfileState;
  request: ApiRequest;
  restoringSession: boolean;
  showIntroVideo: boolean;
  token: string | null;
}) {
  useEffect(() => {
    if (showIntroVideo) {
      return;
    }

    requestAppPermissions().catch(() => undefined);
  }, [showIntroVideo]);

  useEffect(() => {
    adminFields.load().catch(() => adminFields.setSavedFields([]));
  }, [adminFields.load, adminFields.setSavedFields]);

  useEffect(() => {
    if (restoringSession) {
      return;
    }

    matchesState.loadMatches().catch(() => undefined);
  }, [matchesState.loadMatches, restoringSession]);

  useEffect(() => {
    if (appTab === "detail" && matchesState.selectedMatchId) {
      matchActions.loadMessages(matchesState.selectedMatchId).catch(() => {
        matchActions.clearMessages();
      });
    }
  }, [
    appTab,
    matchActions.clearMessages,
    matchActions.loadMessages,
    matchesState.selectedMatchId,
  ]);

  useEffect(() => {
    matchActions.closeChat();
  }, [matchActions.closeChat, matchesState.selectedMatchId]);

  useEffect(() => {
    if (!token || restoringSession) {
      return;
    }

    profileState.load(request).catch(() => undefined);
  }, [profileState.load, request, restoringSession, token]);
}
