import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ApiRequest } from "../types/api";
import type { AppTab, MatchResponse } from "../types/domain";
import type { ShowFeedback } from "../types/feedback";
import { matchMutationErrorMessage } from "../utils/authUtils";
import {
  buildMatchRequestBody,
  validateMatchDraftValues,
} from "../utils/matchDraftUtils";
import { getRandomMatchCover } from "../utils/matchUtils";
import type { useMatchDraft } from "./useMatchDraft";

type MatchDraftState = ReturnType<typeof useMatchDraft>;

type UseMatchEditorActionsOptions = {
  request: ApiRequest;
  matchDraft: MatchDraftState;
  selectedMatch: MatchResponse | null;
  loadMatches: () => Promise<void>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setSelectedMatchId: Dispatch<SetStateAction<string | null>>;
  setAppTab: Dispatch<SetStateAction<AppTab>>;
  showFeedback?: ShowFeedback;
};

export function useMatchEditorActions({
  request,
  matchDraft,
  selectedMatch,
  loadMatches,
  setLoading,
  setSelectedMatchId,
  setAppTab,
  showFeedback,
}: UseMatchEditorActionsOptions) {
  const {
    title,
    fieldName,
    address,
    city,
    date,
    time,
    durationMinutes,
    maxPlayers,
    pricePerPerson,
    latitude,
    longitude,
    locationMode,
    selectedSavedFieldId,
    editingMatchId,
    setShowPreview,
    clearEditing,
  } = matchDraft;

  const validateMatchDraft = useCallback(() => {
    const validation = validateMatchDraftValues({
      title,
      fieldName,
      date,
      time,
      durationMinutes,
      maxPlayers,
      pricePerPerson,
      locationMode,
      selectedSavedFieldId,
    });

    if (!validation.ok) {
      showFeedback?.({
        kind: "warning",
        title: validation.title,
        message: validation.message,
      });
      return null;
    }

    return validation;
  }, [
    date,
    durationMinutes,
    fieldName,
    locationMode,
    maxPlayers,
    pricePerPerson,
    selectedSavedFieldId,
    showFeedback,
    time,
    title,
  ]);

  const openCreatePreview = useCallback(() => {
    if (!validateMatchDraft()) {
      return;
    }
    setShowPreview(true);
  }, [setShowPreview, validateMatchDraft]);

  const createMatch = useCallback(async () => {
    const draft = validateMatchDraft();
    if (!draft) {
      return;
    }

    setLoading(true);
    try {
      const matchBody = buildMatchRequestBody(
        {
          title,
          fieldName,
          address,
          city,
          date,
          time,
          durationMinutes,
          maxPlayers,
          pricePerPerson,
          latitude,
          longitude,
          locationMode,
          selectedSavedFieldId,
          coverImageUrl:
            (editingMatchId && selectedMatch?.coverImageUrl) ||
            getRandomMatchCover(),
        },
        draft,
      );
      const saved = await request<MatchResponse>(
        editingMatchId
          ? `/api/matches/${editingMatchId}`
          : "/api/matches",
        {
          method: editingMatchId ? "PUT" : "POST",
          body: JSON.stringify(matchBody),
        },
      );
      await loadMatches();
      setSelectedMatchId(saved.id);
      clearEditing();
      setShowPreview(false);
      setAppTab("detail");
      showFeedback?.({
        kind: "success",
        title: editingMatchId ? "Cambios guardados" : "Partido creado",
        message: editingMatchId
          ? "La informacion del partido se ha actualizado."
          : "El partido ya esta publicado.",
      });
    } catch (error) {
      showFeedback?.({
        kind: "error",
        title: editingMatchId ? "No se pudo editar" : "No se pudo crear",
        message: matchMutationErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [
    address,
    city,
    clearEditing,
    date,
    durationMinutes,
    editingMatchId,
    fieldName,
    latitude,
    locationMode,
    loadMatches,
    longitude,
    maxPlayers,
    pricePerPerson,
    request,
    selectedMatch?.coverImageUrl,
    selectedSavedFieldId,
    setAppTab,
    setLoading,
    setSelectedMatchId,
    setShowPreview,
    showFeedback,
    time,
    title,
    validateMatchDraft,
  ]);

  return {
    openCreatePreview,
    createMatch,
  };
}
