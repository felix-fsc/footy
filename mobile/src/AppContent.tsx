import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApiRequest } from "./api/useApiRequest";
import { AppTabRenderer } from "./components/app/AppTabRenderer";
import { IntroVideoOverlay } from "./components/intro/IntroVideoOverlay";
import { FeedbackToast } from "./components/ui/FeedbackToast";
import { useAdminFields } from "./hooks/useAdminFields";
import { useAndroidBackHandler } from "./hooks/useAndroidBackHandler";
import { useAppLifecycle } from "./hooks/useAppLifecycle";
import { useAppNavigation } from "./hooks/useAppNavigation";
import { useAuthActions } from "./hooks/useAuthActions";
import { useAuthSession } from "./hooks/useAuthSession";
import { useHomeActions } from "./hooks/useHomeActions";
import { useMatchActions } from "./hooks/useMatchActions";
import { useMatchDraft } from "./hooks/useMatchDraft";
import { useMatchEditorActions } from "./hooks/useMatchEditorActions";
import { useMatches } from "./hooks/useMatches";
import { useProfile } from "./hooks/useProfile";
import { useProfileActions } from "./hooks/useProfileActions";
import { useAppViewActions } from "./hooks/useAppViewActions";
import { useFeedback } from "./hooks/useFeedback";
import { AuthScreen } from "./screens/AuthScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { getMatchDraftCity, getUserCity } from "./utils/appStateUtils";

export function AppContent() {
  const safeInsets = useSafeAreaInsets();
  const authSession = useAuthSession();
  const {
    token,
    userName,
    currentUserId,
    restoringSession,
    isLoggedIn,
    isAdmin,
    googleLoginConfigured,
  } = authSession;
  const [loading, setLoading] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const feedback = useFeedback();
  const profileState = useProfile();

  const matchDraft = useMatchDraft();
  const userCity = getUserCity({
    profile: profileState.profile,
    profileCity: profileState.city,
  });
  const matchDraftCity = getMatchDraftCity({
    draftCity: matchDraft.city,
    profile: profileState.profile,
    profileCity: profileState.city,
  });
  const handleUnauthorized = useCallback(() => {
    authSession.handleUnauthorized();
    profileState.clear();
  }, [authSession.handleUnauthorized, profileState.clear]);

  const request = useApiRequest({ token, onUnauthorized: handleUnauthorized });

  const matchesState = useMatches({ request, token });
  const navigation = useAppNavigation({ matchDraft, matchesState });

  const adminFields = useAdminFields({
    request,
    userCity,
    draftLatitude: matchDraft.latitude,
    draftLongitude: matchDraft.longitude,
    selectedSavedFieldId: matchDraft.selectedSavedFieldId,
    onSelectSavedField: matchDraft.selectSavedField,
    onClearSelectedSavedField: matchDraft.clearSelectedSavedField,
    setLoading,
    showFeedback: feedback.showFeedback,
  });

  const matchActions = useMatchActions({
    request,
    token,
    selectedMatch: matchesState.selectedMatch,
    appTab: navigation.appTab,
    loadMatches: matchesState.loadMatches,
    setLoading,
    setSelectedMatchId: matchesState.setSelectedMatchId,
    setAppTab: navigation.setAppTab,
    showFeedback: feedback.showFeedback,
  });
  const matchEditorActions = useMatchEditorActions({
    request,
    matchDraft,
    selectedMatch: matchesState.selectedMatch,
    loadMatches: matchesState.loadMatches,
    setLoading,
    setSelectedMatchId: matchesState.setSelectedMatchId,
    setAppTab: navigation.setAppTab,
    showFeedback: feedback.showFeedback,
  });
  const profileActions = useProfileActions({
    request,
    profileState,
    setLoading,
  });
  const homeActions = useHomeActions({
    loadMatches: matchesState.loadMatches,
    setLoading,
  });
  const authActions = useAuthActions({
    authSession,
    matchActions,
    matchesState,
    onAuthenticated: navigation.loadAfterAuthenticatedSession,
    profileState,
    request,
    setLoading,
  });
  const viewActions = useAppViewActions({
    matchDraft,
    matchDraftCity,
    matchesState,
    profileState,
    setShowIntroVideo,
  });

  useAppLifecycle({
    adminFields,
    appTab: navigation.appTab,
    matchActions,
    matchesState,
    profileState,
    request,
    restoringSession,
    showIntroVideo,
    token,
  });

  useAndroidBackHandler({
    appTab: navigation.appTab,
    selectedMatchId: matchesState.selectedMatchId,
    showPublicProfile: profileState.showPublicProfile,
    showMatchChat: matchActions.showMatchChat,
    showPreview: matchDraft.showPreview,
    showCalendar: matchDraft.showCalendar,
    profileEditing: profileState.editing,
    editingMatchId: matchDraft.editingMatchId,
    onClosePublicProfile: viewActions.closePublicProfile,
    onCloseChat: matchActions.closeChat,
    onClosePreview: viewActions.closePreview,
    onCloseCalendar: viewActions.closeCalendar,
    onStopProfileEditing: profileState.stopEditing,
    onClearSelectedMatch: viewActions.clearSelectedMatch,
    onBackToCreate: navigation.backToCreate,
    onCloseMatchEditor: navigation.closeMatchEditor,
    onHome: navigation.goHome,
  });

  if (showIntroVideo) {
    return <IntroVideoOverlay onDone={viewActions.finishIntroVideo} />;
  }

  if (restoringSession) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <AuthScreen
        authMode={authSession.authMode}
        displayName={authSession.displayName}
        email={authSession.email}
        password={authSession.password}
        authError={authSession.authError}
        loading={loading}
        googleLoginConfigured={googleLoginConfigured}
        onAuthModeChange={authSession.switchAuthMode}
        onDisplayNameChange={authSession.setDisplayName}
        onEmailChange={authSession.setEmail}
        onPasswordChange={authSession.setPassword}
        onSubmit={authActions.submitAuth}
        onGoogleToken={authActions.submitGoogleToken}
      />
    );
  }

  return (
    <>
      <AppTabRenderer
        adminFields={adminFields}
        bottomInset={safeInsets.bottom}
        currentUserId={currentUserId}
        homeActions={homeActions}
        isAdmin={isAdmin}
        loading={loading}
        matchActions={matchActions}
        matchDraft={matchDraft}
        matchDraftCity={matchDraftCity}
        matchEditorActions={matchEditorActions}
        matchesState={matchesState}
        navigation={navigation}
        onLogout={authActions.logout}
        profileActions={profileActions}
        profileState={profileState}
        topInset={safeInsets.top}
        userCity={userCity}
        userName={userName}
        viewActions={viewActions}
      />
      <FeedbackToast
        feedback={feedback.feedback}
        topInset={safeInsets.top}
        onDismiss={feedback.clearFeedback}
      />
    </>
  );
}
