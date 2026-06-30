import { useCallback } from "react";
import { Alert } from "react-native";

export function useHomeActions({
  loadMatches,
  setLoading,
}: {
  loadMatches: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}) {
  const refreshMatches = useCallback(async () => {
    setLoading(true);
    try {
      await loadMatches();
    } catch (error) {
      Alert.alert(
        "No se pudo actualizar",
        error instanceof Error
          ? error.message
          : "Revisa que el backend este arrancado.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadMatches, setLoading]);

  return {
    refreshMatches,
  };
}
