import { useCallback } from "react";
import { Alert } from "react-native";
import type { ApiRequest } from "../types/api";
import type { useAuthSession } from "./useAuthSession";
import type { useMatchActions } from "./useMatchActions";
import type { useMatches } from "./useMatches";
import type { useProfile } from "./useProfile";

type AuthSessionState = ReturnType<typeof useAuthSession>;
type MatchActionsState = ReturnType<typeof useMatchActions>;
type MatchesState = ReturnType<typeof useMatches>;
type ProfileState = ReturnType<typeof useProfile>;

export function useAuthActions({
  authSession,
  matchActions,
  matchesState,
  onAuthenticated,
  profileState,
  request,
  setLoading,
}: {
  authSession: AuthSessionState;
  matchActions: MatchActionsState;
  matchesState: MatchesState;
  onAuthenticated: (accessToken: string) => Promise<void> | void;
  profileState: ProfileState;
  request: ApiRequest;
  setLoading: (loading: boolean) => void;
}) {
  const submitAuth = useCallback(async () => {
    setLoading(true);
    try {
      await authSession.submitAuth({
        request,
        onAuthenticated,
      });
    } finally {
      setLoading(false);
    }
  }, [authSession.submitAuth, onAuthenticated, request, setLoading]);

  const submitGoogleToken = useCallback(
    async (idToken: string) => {
      setLoading(true);
      try {
        await authSession.submitGoogleToken({
          request,
          idToken,
          onAuthenticated,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error inesperado";
        Alert.alert("No se pudo entrar con Google", message);
      } finally {
        setLoading(false);
      }
    },
    [authSession.submitGoogleToken, onAuthenticated, request, setLoading],
  );

  const logout = useCallback(() => {
    authSession.clearSession();
    matchesState.clearUserMatches();
    matchActions.clearMessages();
    profileState.clear();
  }, [
    authSession.clearSession,
    matchActions.clearMessages,
    matchesState.clearUserMatches,
    profileState.clear,
  ]);

  return {
    logout,
    submitAuth,
    submitGoogleToken,
  };
}
