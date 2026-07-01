import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  AppTab,
  MatchResponse,
  MessageResponse,
  TeamSide,
} from "../types/domain";
import type { ApiRequest } from "../types/api";
import type { ShowFeedback } from "../types/feedback";
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
  showFeedback?: ShowFeedback;
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
  showFeedback,
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
        showFeedback?.({
          kind: "success",
          title: "Partido borrado",
          message: "El partido se ha eliminado correctamente.",
        });
      } catch (error) {
        showFeedback?.({
          kind: "error",
          title: "No se pudo borrar",
          message: matchMutationErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setAppTab, setLoading, setSelectedMatchId, showFeedback],
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
        showFeedback?.({
          kind: "success",
          title: "Jugador quitado",
          message: "La plaza ha quedado libre en el partido.",
        });
      } catch (error) {
        showFeedback?.({
          kind: "error",
          title: "No se pudo quitar",
          message: matchMutationErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading, setSelectedMatchId, showFeedback],
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
        showFeedback?.({
          kind: "success",
          title: "Te has unido",
          message: `Ya apareces en el equipo ${teamSide}.`,
        });
      } catch (error) {
        showFeedback?.({
          kind: "error",
          title: "No se pudo unir",
          message: error instanceof Error ? error.message : "Error inesperado",
        });
      } finally {
        setLoading(false);
      }
    },
    [appTab, loadMatches, loadMessages, request, setLoading, showFeedback],
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
        showFeedback?.({
          kind: "success",
          title: "Partido cancelado",
          message: "Los jugadores veran el partido como cancelado.",
        });
      } catch (error) {
        showFeedback?.({
          kind: "error",
          title: "No se pudo cancelar",
          message: error instanceof Error ? error.message : "Error inesperado",
        });
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading, setSelectedMatchId, showFeedback],
  );

  const leaveMatch = useCallback(
    async (matchId: string) => {
      setLoading(true);
      try {
        await request(`/api/matches/${matchId}/leave`, { method: "DELETE" });
        await loadMatches();
        setMessages([]);
        showFeedback?.({
          kind: "success",
          title: "Has salido",
          message: "Tu plaza vuelve a estar disponible.",
        });
      } catch (error) {
        showFeedback?.({
          kind: "error",
          title: "No se pudo salir",
          message: error instanceof Error ? error.message : "Error inesperado",
        });
      } finally {
        setLoading(false);
      }
    },
    [loadMatches, request, setLoading, showFeedback],
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
        showFeedback?.({
          kind: "error",
          title: "No se pudo enviar",
          message:
            error instanceof Error
              ? error.message
              : "Unete al partido antes de escribir.",
        });
      } finally {
        setLoading(false);
      }
    },
    [loadMessages, request, selectedMatch, setLoading, showFeedback],
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
