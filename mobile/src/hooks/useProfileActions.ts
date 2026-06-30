import { useCallback } from "react";
import { Alert } from "react-native";
import type { ApiRequest } from "../types/api";
import type { useProfile } from "./useProfile";

type ProfileState = ReturnType<typeof useProfile>;

export function useProfileActions({
  request,
  profileState,
  setLoading,
}: {
  request: ApiRequest;
  profileState: ProfileState;
  setLoading: (loading: boolean) => void;
}) {
  const saveProfile = useCallback(async () => {
    setLoading(true);
    try {
      await profileState.save(request);
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLoading(false);
    }
  }, [profileState.save, request, setLoading]);

  const openPublicProfile = useCallback(
    async (userId: string) => {
      if (!userId) {
        return;
      }
      try {
        setLoading(true);
        await profileState.openPublic(request, userId);
      } catch (error) {
        Alert.alert(
          "No se pudo abrir el perfil",
          error instanceof Error ? error.message : "Error inesperado",
        );
      } finally {
        setLoading(false);
      }
    },
    [profileState.openPublic, request, setLoading],
  );

  return {
    saveProfile,
    openPublicProfile,
  };
}
