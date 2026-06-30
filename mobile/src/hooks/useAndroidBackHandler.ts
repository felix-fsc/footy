import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import type { AppTab } from "../types/domain";

type UseAndroidBackHandlerOptions = {
  appTab: AppTab;
  selectedMatchId: string | null;
  showPublicProfile: boolean;
  showMatchChat: boolean;
  showPreview: boolean;
  showCalendar: boolean;
  profileEditing: boolean;
  editingMatchId: string | null;
  onClosePublicProfile: () => void;
  onCloseChat: () => void;
  onClosePreview: () => void;
  onCloseCalendar: () => void;
  onStopProfileEditing: () => void;
  onClearSelectedMatch: () => void;
  onBackToCreate: () => void;
  onCloseMatchEditor: () => void;
  onHome: () => void;
};

export function useAndroidBackHandler({
  appTab,
  selectedMatchId,
  showPublicProfile,
  showMatchChat,
  showPreview,
  showCalendar,
  profileEditing,
  editingMatchId,
  onClosePublicProfile,
  onCloseChat,
  onClosePreview,
  onCloseCalendar,
  onStopProfileEditing,
  onClearSelectedMatch,
  onBackToCreate,
  onCloseMatchEditor,
  onHome,
}: UseAndroidBackHandlerOptions) {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showPublicProfile) {
          onClosePublicProfile();
          return true;
        }
        if (showMatchChat) {
          onCloseChat();
          return true;
        }
        if (showPreview) {
          onClosePreview();
          return true;
        }
        if (showCalendar) {
          onCloseCalendar();
          return true;
        }
        if (profileEditing) {
          onStopProfileEditing();
          return true;
        }
        if (appTab === "home" && selectedMatchId) {
          onClearSelectedMatch();
          return true;
        }
        if (appTab === "location") {
          onBackToCreate();
          return true;
        }
        if (appTab === "create" && editingMatchId) {
          onCloseMatchEditor();
          return true;
        }
        if (appTab === "detail" || appTab === "create" || appTab === "profile") {
          onHome();
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [
    appTab,
    editingMatchId,
    onBackToCreate,
    onClearSelectedMatch,
    onCloseCalendar,
    onCloseChat,
    onCloseMatchEditor,
    onClosePreview,
    onClosePublicProfile,
    onHome,
    onStopProfileEditing,
    profileEditing,
    selectedMatchId,
    showCalendar,
    showMatchChat,
    showPreview,
    showPublicProfile,
  ]);
}
