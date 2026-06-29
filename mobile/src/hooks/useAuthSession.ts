import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { hasGoogleClientId } from "../api/config";
import { sessionStorageAdapter } from "../platform/sessionStorage";
import type { AuthMode, AuthResponse, StoredSession, UserRole } from "../types/domain";
import {
  authErrorMessage,
  validateAuthForm,
} from "../utils/authUtils";

type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

type SubmitOptions = {
  request: ApiRequest;
  onAuthenticated: (accessToken: string) => Promise<void> | void;
};

export function useAuthSession() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [displayName, setDisplayNameState] = useState("");
  const [email, setEmailState] = useState("");
  const [password, setPasswordState] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("PLAYER");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  const clearSession = useCallback(() => {
    void sessionStorageAdapter.clear();
    setToken(null);
    setUserName(null);
    setCurrentUserRole("PLAYER");
    setCurrentUserId(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedSession = await sessionStorageAdapter.get();
      if (!active) {
        return;
      }
      if (!storedSession) {
        setRestoringSession(false);
        return;
      }

      try {
        const session = JSON.parse(storedSession) as StoredSession;
        setToken(session.accessToken);
        setUserName(session.user.displayName);
        setCurrentUserRole(session.user.role ?? "PLAYER");
        setCurrentUserId(session.user.id);
        setEmailState(session.user.email);
      } catch {
        await sessionStorageAdapter.clear();
      } finally {
        if (active) {
          setRestoringSession(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const applyAuthenticatedSession = useCallback(
    async (auth: AuthResponse, onAuthenticated: SubmitOptions["onAuthenticated"]) => {
      setToken(auth.accessToken);
      setUserName(auth.user.displayName);
      setCurrentUserRole(auth.user.role ?? "PLAYER");
      setCurrentUserId(auth.user.id);
      setEmailState(auth.user.email);
      void sessionStorageAdapter.set({
        accessToken: auth.accessToken,
        expiresAt: auth.expiresAt,
        user: auth.user,
      });

      await onAuthenticated(auth.accessToken);
    },
    [],
  );

  function switchAuthMode(nextMode: AuthMode) {
    if (nextMode === authMode) {
      return;
    }

    setAuthMode(nextMode);
    setEmailState("");
    setPasswordState("");
    setDisplayNameState("");
    setAuthError(null);
  }

  async function submitAuth({ request, onAuthenticated }: SubmitOptions) {
    const normalizedEmail = email.trim();
    const validationError = validateAuthForm({
      authMode,
      displayName,
      email: normalizedEmail,
      password,
    });

    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setAuthError(null);
    try {
      const path =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        authMode === "login"
          ? { email: normalizedEmail, password }
          : {
              email: normalizedEmail,
              password,
              displayName: displayName.trim(),
            };
      const auth = await request<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      await applyAuthenticatedSession(auth, onAuthenticated);
    } catch (error) {
      const message = authErrorMessage(error, authMode);
      setAuthError(message);
    }
  }

  async function submitGoogleToken({
    request,
    onAuthenticated,
    idToken,
  }: SubmitOptions & { idToken: string }) {
    try {
      const auth = await request<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      await applyAuthenticatedSession(auth, onAuthenticated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      throw new Error(message);
    }
  }

  function setDisplayName(value: string) {
    setDisplayNameState(value);
    setAuthError(null);
  }

  function setEmail(value: string) {
    setEmailState(value);
    setAuthError(null);
  }

  function setPassword(value: string) {
    setPasswordState(value);
    setAuthError(null);
  }

  return {
    authMode,
    displayName,
    email,
    password,
    authError,
    token,
    userName,
    currentUserRole,
    currentUserId,
    restoringSession,
    isLoggedIn: Boolean(token),
    isAdmin: currentUserRole === "ADMIN",
    googleLoginConfigured: hasGoogleClientId(Platform.OS),
    clearSession,
    handleUnauthorized: clearSession,
    switchAuthMode,
    submitAuth,
    submitGoogleToken,
    setDisplayName,
    setEmail,
    setPassword,
  };
}
