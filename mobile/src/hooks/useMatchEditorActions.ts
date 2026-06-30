import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import type { ApiRequest } from "../types/api";
import type { AppTab, MatchResponse } from "../types/domain";
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
};

export function useMatchEditorActions({
  request,
  matchDraft,
  selectedMatch,
  loadMatches,
  setLoading,
  setSelectedMatchId,
  setAppTab,
}: UseMatchEditorActionsOptions) {
  const {
    title,
    fieldName,
    address,
    city,
    date,
    time,
    maxPlayers,
    pricePerPerson,
    latitude,
    longitude,
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
      maxPlayers,
      pricePerPerson,
    });

    if (!validation.ok) {
      Alert.alert(validation.title, validation.message);
      return null;
    }

    return validation;
  }, [
    date,
    fieldName,
    maxPlayers,
    pricePerPerson,
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
          maxPlayers,
          pricePerPerson,
          latitude,
          longitude,
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
    } catch (error) {
      Alert.alert(
        editingMatchId ? "No se pudo editar" : "No se pudo crear",
        matchMutationErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }, [
    address,
    city,
    clearEditing,
    date,
    editingMatchId,
    fieldName,
    latitude,
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
    time,
    title,
    validateMatchDraft,
  ]);

  return {
    openCreatePreview,
    createMatch,
  };
}
