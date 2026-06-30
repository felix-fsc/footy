import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApiRequest } from "./api/useApiRequest";
import { IntroVideoOverlay } from "./components/intro/IntroVideoOverlay";
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
import { openMatchDirections } from "./platform/directions";
import { AuthScreen } from "./screens/AuthScreen";
import { CreateMatchScreen } from "./screens/CreateMatchScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { LocationScreen } from "./screens/LocationScreen";
import { MatchDetailScreen } from "./screens/MatchDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { getMatchDraftCity, getUserCity } from "./utils/appStateUtils";
import { getMatchViewerState } from "./utils/matchUtils";

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
  const selectedMatchViewerState = getMatchViewerState(
    matchesState.selectedMatch,
    currentUserId,
  );

  const adminFields = useAdminFields({
    request,
    userCity,
    draftLatitude: matchDraft.latitude,
    draftLongitude: matchDraft.longitude,
    selectedSavedFieldId: matchDraft.selectedSavedFieldId,
    onSelectSavedField: matchDraft.selectSavedField,
    onClearSelectedSavedField: matchDraft.clearSelectedSavedField,
    setLoading,
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
  });
  const matchEditorActions = useMatchEditorActions({
    request,
    matchDraft,
    selectedMatch: matchesState.selectedMatch,
    loadMatches: matchesState.loadMatches,
    setLoading,
    setSelectedMatchId: matchesState.setSelectedMatchId,
    setAppTab: navigation.setAppTab,
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

  if (navigation.appTab === "profile") {
    return (
      <ProfileScreen
        admin={{
          address: adminFields.address,
          city: adminFields.city,
          editingId: adminFields.editingId,
          isAdmin,
          latitude: adminFields.latitude,
          longitude: adminFields.longitude,
          name: adminFields.name,
          savedFields: adminFields.savedFields,
        }}
        adminActions={{
          onAddressChange: adminFields.setAddress,
          onCityChange: adminFields.setCity,
          onDeleteField: adminFields.remove,
          onLatitudeChange: adminFields.setLatitude,
          onLongitudeChange: adminFields.setLongitude,
          onNameChange: adminFields.setName,
          onSaveField: adminFields.save,
          onStartFieldCreate: adminFields.startCreate,
          onStartFieldEdit: adminFields.startEdit,
        }}
        layout={{
          bottomInset: safeInsets.bottom,
          topInset: safeInsets.top,
        }}
        navigation={{
          onCreate: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onOpenMatch: navigation.openDetail,
          onProfile: navigation.openProfile,
        }}
        profileActions={{
          onBioChange: profileState.setBio,
          onCityChange: profileState.setCity,
          onFullNameChange: profileState.setFullName,
          onLogout: authActions.logout,
          onPositionChange: profileState.setPosition,
          onSaveProfile: profileActions.saveProfile,
          onToggleEditing: profileState.toggleEditing,
          onUsernameChange: profileState.setUsername,
        }}
        profileData={{
          bio: profileState.bio,
          city: profileState.city,
          editing: profileState.editing,
          fullName: profileState.fullName,
          loading,
          myMatches: matchesState.myMatches,
          nextMyMatch: matchesState.nextMyMatch,
          position: profileState.position,
          profile: profileState.profile,
          userName,
          username: profileState.username,
          victoryStreak: matchesState.victoryStreak,
        }}
      />
    );
  }
  if (navigation.appTab === "location") {
    return (
      <LocationScreen
        latitude={matchDraft.latitude}
        longitude={matchDraft.longitude}
        city={matchDraftCity}
        fieldName={matchDraft.fieldName}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onBack={navigation.backToCreate}
        onUseLocation={navigation.backToCreate}
        onLocationChange={viewActions.applyLocationToDraft}
      />
    );
  }
  if (navigation.appTab === "create") {
    return (
      <CreateMatchScreen
        actions={{
          onClose: matchDraft.editingMatchId
            ? navigation.closeMatchEditor
            : navigation.goHome,
          onClosePreview: viewActions.closePreview,
          onDateChange: matchDraft.setDate,
          onFieldNameChange: matchDraft.setFieldName,
          onMaxPlayersChange: matchDraft.setMaxPlayers,
          onOpenLocationPicker: navigation.openLocationPicker,
          onOpenPreview: matchEditorActions.openCreatePreview,
          onPricePerPersonChange: matchDraft.setPricePerPerson,
          onSelectSavedField: matchDraft.selectSavedField,
          onSubmit: matchEditorActions.createMatch,
          onTimeChange: matchDraft.setTime,
          onTitleChange: matchDraft.setTitle,
          onToggleCalendar: matchDraft.toggleCalendar,
        }}
        draft={{
          city: matchDraft.city,
          date: matchDraft.date,
          fieldName: matchDraft.fieldName,
          latitude: matchDraft.latitude,
          longitude: matchDraft.longitude,
          maxPlayers: matchDraft.maxPlayers,
          pricePerPerson: matchDraft.pricePerPerson,
          selectedSavedFieldId: matchDraft.selectedSavedFieldId,
          time: matchDraft.time,
          title: matchDraft.title,
        }}
        editor={{
          editingMatchId: matchDraft.editingMatchId,
          loading,
          savedFields: adminFields.savedFields,
          selectedMatch: matchesState.selectedMatch,
          showCalendar: matchDraft.showCalendar,
          showPreview: matchDraft.showPreview,
        }}
        layout={{
          bottomInset: safeInsets.bottom,
          topInset: safeInsets.top,
        }}
        navigation={{
          onCreateTab: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onProfile: navigation.openProfile,
        }}
      />
    );
  }

  if (navigation.appTab === "detail") {
    return (
      <MatchDetailScreen
        actions={{
          onCancelMatch: matchActions.cancelMatch,
          onDeleteMatch: matchActions.deleteMatch,
          onEditMatch: navigation.startMatchEdit,
          onJoinMatch: matchActions.joinMatch,
          onLeaveMatch: matchActions.leaveMatch,
          onOpenDirections: openMatchDirections,
          onOpenProfile: profileActions.openPublicProfile,
          onRemovePlayer: matchActions.removeMatchPlayer,
        }}
        chat={{
          messageText: matchActions.messageText,
          messages: matchActions.messages,
          onCloseChat: matchActions.closeChat,
          onMessageTextChange: matchActions.setMessageText,
          onOpenChat: matchActions.openChat,
          onQuickMessage: matchActions.sendMatchMessage,
          onRefreshMessages: matchActions.loadMessages,
          onSendMessage: matchActions.sendMessage,
          showMatchChat: matchActions.showMatchChat,
        }}
        layout={{
          bottomInset: safeInsets.bottom,
          topInset: safeInsets.top,
        }}
        navigation={{
          onCreate: navigation.startMatchCreate,
          onHome: navigation.goHome,
          onProfile: navigation.openProfile,
        }}
        publicProfileState={{
          onClosePublicProfile: viewActions.closePublicProfile,
          publicProfile: profileState.publicProfile,
          showPublicProfile: profileState.showPublicProfile,
        }}
        state={{
          isAdmin,
          loading,
          match: matchesState.selectedMatch,
          selectedIsOpen: selectedMatchViewerState.isOpen,
          selectedIsOwner: selectedMatchViewerState.isOwner,
          selectedIsParticipant: selectedMatchViewerState.isParticipant,
        }}
      />
    );
  }

  return (
    <HomeScreen
      actions={{
        onHomeModeChange: navigation.setHomeMode,
        onOpenDetail: navigation.openDetail,
        onRefresh: homeActions.refreshMatches,
        onSearchQueryChange: matchesState.setSearchQuery,
        onSelectMatch: matchesState.setSelectedMatchId,
      }}
      data={{
        currentUserId,
        loading,
        matches: matchesState.visibleMatches,
        myMatches: matchesState.myMatches,
        searchQuery: matchesState.searchQuery,
        selectedMatch: matchesState.selectedMatch,
        selectedMatchId: matchesState.selectedMatchId,
        userCity,
        victoryStreak: matchesState.victoryStreak,
      }}
      layout={{
        topInset: safeInsets.top,
      }}
      navigation={{
        onCreate: navigation.startMatchCreate,
        onHome: navigation.goHome,
        onProfile: navigation.openProfile,
      }}
      view={{
        homeMode: navigation.homeMode,
      }}
    />
  );
}
