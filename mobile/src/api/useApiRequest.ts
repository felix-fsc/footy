import { useCallback, useMemo } from "react";
import { API_BASE_URL } from "./config";
import { ApiRequestError } from "./errors";

export function useApiRequest({
  token,
  onUnauthorized,
}: {
  token: string | null;
  onUnauthorized: () => void;
}) {
  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  return useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers ?? {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401 && token) {
          onUnauthorized();
          throw new Error("Sesion caducada, vuelve a entrar");
        }

        const errorText = await response.text();
        throw new ApiRequestError(response.status, errorText);
      }
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [authHeaders, onUnauthorized, token],
  );
}
