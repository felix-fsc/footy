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
    onClosePublicProfile: () => profileState.setShowPublicProfile(false),
    onCloseChat: matchActions.closeChat,
    onClosePreview: () => matchDraft.setShowPreview(false),
    onCloseCalendar: () => matchDraft.setShowCalendar(false),
    onStopProfileEditing: profileState.stopEditing,
    onClearSelectedMatch: () => matchesState.setSelectedMatchId(null),
    onBackToCreate: navigation.backToCreate,
    onCloseMatchEditor: navigation.closeMatchEditor,
    onHome: navigation.goHome,
  });

  if (showIntroVideo) {
    return <IntroVideoOverlay onDone={() => setShowIntroVideo(false)} />;
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
        profile={profileState.profile}
        userName={userName}
        isAdmin={isAdmin}
        loading={loading}
        profileEditing={profileState.editing}
        profileUsername={profileState.username}
        profileFullName={profileState.fullName}
        profileCity={profileState.city}
        profilePosition={profileState.position}
        profileBio={profileState.bio}
        victoryStreak={matchesState.victoryStreak}
        myMatches={matchesState.myMatches}
        nextMyMatch={matchesState.nextMyMatch}
        savedFields={adminFields.savedFields}
        adminFieldEditingId={adminFields.editingId}
        adminFieldName={adminFields.name}
        adminFieldAddress={adminFields.address}
        adminFieldCity={adminFields.city}
        adminFieldLatitude={adminFields.latitude}
        adminFieldLongitude={adminFields.longitude}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onHome={navigation.goHome}
        onCreate={navigation.startMatchCreate}
        onProfile={navigation.openProfile}
        onLogout={authActions.logout}
        onToggleProfileEditing={profileState.toggleEditing}
        onProfileUsernameChange={profileState.setUsername}
        onProfileFullNameChange={profileState.setFullName}
        onProfileCityChange={profileState.setCity}
        onProfilePositionChange={profileState.setPosition}
        onProfileBioChange={profileState.setBio}
        onSaveProfile={profileActions.saveProfile}
        onStartAdminFieldCreate={adminFields.startCreate}
        onStartAdminFieldEdit={adminFields.startEdit}
        onSaveAdminField={adminFields.save}
        onDeleteAdminField={adminFields.remove}
        onAdminFieldNameChange={adminFields.setName}
        onAdminFieldAddressChange={adminFields.setAddress}
        onAdminFieldCityChange={adminFields.setCity}
        onAdminFieldLatitudeChange={adminFields.setLatitude}
        onAdminFieldLongitudeChange={adminFields.setLongitude}
        onOpenMatch={navigation.openDetail}
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
        onLocationChange={(location, address) => {
          matchDraft.applyLocation(location, address, matchDraftCity);
        }}
      />
    );
  }
  if (navigation.appTab === "create") {
    return (
      <CreateMatchScreen
        editingMatchId={matchDraft.editingMatchId}
        selectedMatch={matchesState.selectedMatch}
        loading={loading}
        title={matchDraft.title}
        fieldName={matchDraft.fieldName}
        city={matchDraft.city}
        date={matchDraft.date}
        time={matchDraft.time}
        maxPlayers={matchDraft.maxPlayers}
        pricePerPerson={matchDraft.pricePerPerson}
        latitude={matchDraft.latitude}
        longitude={matchDraft.longitude}
        selectedSavedFieldId={matchDraft.selectedSavedFieldId}
        savedFields={adminFields.savedFields}
        showCalendar={matchDraft.showCalendar}
        showPreview={matchDraft.showPreview}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onClose={
          matchDraft.editingMatchId
            ? navigation.closeMatchEditor
            : navigation.goHome
        }
        onHome={navigation.goHome}
        onCreateTab={navigation.startMatchCreate}
        onProfile={navigation.openProfile}
        onTitleChange={matchDraft.setTitle}
        onFieldNameChange={matchDraft.setFieldName}
        onOpenLocationPicker={navigation.openLocationPicker}
        onSelectSavedField={matchDraft.selectSavedField}
        onToggleCalendar={matchDraft.toggleCalendar}
        onDateChange={matchDraft.setDate}
        onTimeChange={matchDraft.setTime}
        onMaxPlayersChange={matchDraft.setMaxPlayers}
        onPricePerPersonChange={matchDraft.setPricePerPerson}
        onOpenPreview={matchEditorActions.openCreatePreview}
        onClosePreview={() => matchDraft.setShowPreview(false)}
        onSubmit={matchEditorActions.createMatch}
      />
    );
  }

  if (navigation.appTab === "detail") {
    return (
      <MatchDetailScreen
        match={matchesState.selectedMatch}
        isAdmin={isAdmin}
        loading={loading}
        selectedIsParticipant={selectedMatchViewerState.isParticipant}
        selectedIsOwner={selectedMatchViewerState.isOwner}
        selectedIsOpen={selectedMatchViewerState.isOpen}
        messages={matchActions.messages}
        messageText={matchActions.messageText}
        showMatchChat={matchActions.showMatchChat}
        showPublicProfile={profileState.showPublicProfile}
        publicProfile={profileState.publicProfile}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onHome={navigation.goHome}
        onCreate={navigation.startMatchCreate}
        onProfile={navigation.openProfile}
        onEditMatch={navigation.startMatchEdit}
        onCancelMatch={matchActions.cancelMatch}
        onDeleteMatch={matchActions.deleteMatch}
        onRemovePlayer={matchActions.removeMatchPlayer}
        onLeaveMatch={matchActions.leaveMatch}
        onJoinMatch={matchActions.joinMatch}
        onOpenDirections={openMatchDirections}
        onOpenProfile={profileActions.openPublicProfile}
        onOpenChat={matchActions.openChat}
        onCloseChat={matchActions.closeChat}
        onRefreshMessages={matchActions.loadMessages}
        onMessageTextChange={matchActions.setMessageText}
        onSendMessage={matchActions.sendMessage}
        onQuickMessage={matchActions.sendMatchMessage}
        onClosePublicProfile={() => profileState.setShowPublicProfile(false)}
      />
    );
  }

  return (
    <HomeScreen
      homeMode={navigation.homeMode}
      matches={matchesState.visibleMatches}
      myMatches={matchesState.myMatches}
      selectedMatch={matchesState.selectedMatch}
      selectedMatchId={matchesState.selectedMatchId}
      currentUserId={currentUserId}
      searchQuery={matchesState.searchQuery}
      userCity={userCity}
      victoryStreak={matchesState.victoryStreak}
      loading={loading}
      topInset={safeInsets.top}
      onHomeModeChange={navigation.setHomeMode}
      onSearchQueryChange={matchesState.setSearchQuery}
      onRefresh={homeActions.refreshMatches}
      onSelectMatch={matchesState.setSelectedMatchId}
      onOpenDetail={navigation.openDetail}
      onHome={navigation.goHome}
      onCreate={navigation.startMatchCreate}
      onProfile={navigation.openProfile}
    />
  );
}
