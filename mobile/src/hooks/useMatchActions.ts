import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import type {
  AppTab,
  MatchResponse,
  MessageResponse,
  TeamSide,
} from "../types/domain";
import type { ApiRequest } from "../types/api";
import { matchMutationErrorMessage } from "../utils/authUtils";

type UseMatchActionsOptions = {
  request: ApiRequest;
  token: string | null;
  selectedMatch: MatchResponse | null;
  appTab: AppTab;
  loadMatches: () => Promise<void>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setSelectedMatchId: Dispatch<SetStateAction<string | null>>;
  setAppTab: Dispatch<SetStateAction<AppTab>>;
};

export function useMatchActions({
  request,
  token,
  selectedMatch,
  appTab,
  loadMatches,
  setLoading,
  setSelectedMatchId,
  setAppTab,
}: UseMatchActionsOptions) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showMatchChat, setShowMatchChat] = useState(false);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadMessages = useCallback(
    async (matchId: string) => {
      if (!token) {
        setMessages([]);
        return;
      }
      const nextMessages = await request<MessageResponse[]>(
        `/api/matches/${matchId}/messages`,
      );
      setMessages(nextMessages);
    },
    [request, token],
  );

  const openChat = useCallback(
    (matchId: string) => {
      setShowMatchChat(true);
      loadMessages(matchId).catch(() => setMessages([]));
    },
    [loadMessages],
  );

  const closeChat = useCallback(() => {
    setShowMatchChat(false);
  }, []);

  const deleteMatch = useCallback(
    async (matchId: string) => {
      setLoading(true);
      try {
        await request(`/api/matches/${matchId}`, {
          method: "DELETE",
        });
        await loadMatches();
        setSelectedMatchId(null);
        setMessages([]);
        setAppTab("home");
      } catch (error) {
        Alert.alert("No se pudo borrar", matchMutationErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setAppTab, setLoading, setSelectedMatchId],
  );

  const removeMatchPlayer = useCallback(
    async (matchId: string, userId: string) => {
      setLoading(true);
      try {
        const updated = await request<MatchResponse>(
          `/api/matches/${matchId}/players/${userId}`,
          { method: "DELETE" },
        );
        await loadMatches();
        setSelectedMatchId(updated.id);
      } catch (error) {
        Alert.alert("No se pudo quitar", matchMutationErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading, setSelectedMatchId],
  );

  const joinMatch = useCallback(
    async (matchId: string, teamSide: TeamSide) => {
      setLoading(true);
      try {
        await request(`/api/matches/${matchId}/join`, {
          method: "POST",
          body: JSON.stringify({ teamSide }),
        });
        await loadMatches();
        if (appTab === "detail") {
          await loadMessages(matchId).catch(() => setMessages([]));
        }
      } catch (error) {
        Alert.alert(
          "No se pudo unir",
          error instanceof Error ? error.message : "Error inesperado",
        );
      } finally {
        setLoading(false);
      }
    },
    [appTab, loadMatches, loadMessages, request, setLoading],
  );

  const cancelMatch = useCallback(
    async (matchId: string) => {
      setLoading(true);
      try {
        const cancelled = await request<MatchResponse>(
          `/api/matches/${matchId}/cancel`,
          {
            method: "PATCH",
          },
        );
        await loadMatches();
        setSelectedMatchId(cancelled.id);
      } catch (error) {
        Alert.alert(
          "No se pudo cancelar",
          error instanceof Error ? error.message : "Error inesperado",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading, setSelectedMatchId],
  );

  const leaveMatch = useCallback(
    async (matchId: string) => {
      setLoading(true);
      try {
        await request(`/api/matches/${matchId}/leave`, { method: "DELETE" });
        await loadMatches();
        setMessages([]);
      } catch (error) {
        Alert.alert(
          "No se pudo salir",
          error instanceof Error ? error.message : "Error inesperado",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading],
  );

  const sendMatchMessage = useCallback(
    async (content: string) => {
      if (!selectedMatch || !content.trim()) {
        return;
      }

      setLoading(true);
      try {
        await request(`/api/matches/${selectedMatch.id}/messages`, {
          method: "POST",
          body: JSON.stringify({ content: content.trim() }),
        });
        setMessageText("");
        await loadMessages(selectedMatch.id);
      } catch (error) {
        Alert.alert(
          "No se pudo enviar",
          error instanceof Error
            ? error.message
            : "Unete al partido antes de escribir.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadMessages, request, selectedMatch, setLoading],
  );

  const sendMessage = useCallback(async () => {
    await sendMatchMessage(messageText);
  }, [messageText, sendMatchMessage]);

  return {
    messages,
    messageText,
    showMatchChat,
    setMessageText,
    clearMessages,
    loadMessages,
    openChat,
    closeChat,
    deleteMatch,
    removeMatchPlayer,
    joinMatch,
    cancelMatch,
    leaveMatch,
    sendMatchMessage,
    sendMessage,
  };
}
