import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchMatchesSnapshot } from "./src/api/matches";
import { useApiRequest } from "./src/api/useApiRequest";
import { ScreenBubbles } from "./src/components/chrome/ScreenBubbles";
import { IntroVideoOverlay } from "./src/components/intro/IntroVideoOverlay";
import { useAdminFields } from "./src/hooks/useAdminFields";
import { useAuthSession } from "./src/hooks/useAuthSession";
import { useMatchActions } from "./src/hooks/useMatchActions";
import { useMatchDraft } from "./src/hooks/useMatchDraft";
import { useProfile } from "./src/hooks/useProfile";
import { requestAppPermissions } from "./src/platform/permissions";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CreateMatchScreen } from "./src/screens/CreateMatchScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LocationScreen } from "./src/screens/LocationScreen";
import { MatchDetailScreen } from "./src/screens/MatchDetailScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import type {
  AppTab,
  HomeMode,
  MatchResponse,
} from "./src/types/domain";
import {
  matchMutationErrorMessage,
} from "./src/utils/authUtils";
import {
  buildMatchRequestBody,
  validateMatchDraftValues,
} from "./src/utils/matchDraftUtils";
import {
  getVisibleMatches,
  getRandomMatchCover,
  userParticipatesInMatch,
} from "./src/utils/matchUtils";
import { getMatchLocation } from "./src/utils/mapUtils";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
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
  const [homeMode, setHomeMode] = useState<HomeMode>("map");
  const [appTab, setAppTab] = useState<AppTab>("home");
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myMatches, setMyMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const profileState = useProfile();

  const matchDraft = useMatchDraft();

  const visibleMatches = useMemo(
    () =>
      getVisibleMatches({
        matches,
        myMatches,
        searchQuery,
        matchFilter: "all",
        dateFilter: "all",
        onlyAvailable: false,
      }),
    [matches, myMatches, searchQuery],
  );


  const selectedMatch = selectedMatchId
    ? (visibleMatches.find((match) => match.id === selectedMatchId) ?? null)
    : null;
  const selectedIsParticipant = Boolean(
    selectedMatch &&
    currentUserId &&
    userParticipatesInMatch(selectedMatch, currentUserId),
  );
  const selectedIsOwner = Boolean(
    selectedMatch && currentUserId === selectedMatch.createdBy.id,
  );
  const selectedIsOpen = selectedMatch?.status === "OPEN";
  const nextMyMatch = myMatches[0] ?? null;
  const victoryStreak = Math.max(3, Math.min(9, myMatches.length + 3));
  const userCity = profileState.profile?.city || profileState.city || "Huelva";
  const matchDraftCity = profileState.profile?.city || profileState.city || matchDraft.city || "Huelva";
  const handleUnauthorized = useCallback(() => {
    authSession.handleUnauthorized();
    setMyMatches([]);
    profileState.clear();
  }, [authSession.handleUnauthorized, profileState.clear]);

  const request = useApiRequest({ token, onUnauthorized: handleUnauthorized });

  const loadMatches = useCallback(async () => {
    const [available, mine] = await Promise.all([
      request<MatchResponse[]>("/api/matches"),
      token ? request<MatchResponse[]>("/api/matches/me") : Promise.resolve([]),
    ]);
    setMatches(available);
    setMyMatches(mine);
    setSelectedMatchId((current) =>
      current && available.some((match) => match.id === current)
        ? current
        : null,
    );
  }, [request, token]);

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
    selectedMatch,
    appTab,
    loadMatches,
    setLoading,
    setSelectedMatchId,
    setAppTab,
  });

  async function refreshMatches() {
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
  }

  useEffect(() => {
    if (showIntroVideo) {
      return;
    }

    requestAppPermissions().catch(() => undefined);
  }, [showIntroVideo]);

  useEffect(() => {
    adminFields.load().catch(() => adminFields.setSavedFields([]));
  }, [adminFields.load, adminFields.setSavedFields]);

  useEffect(() => {
    if (restoringSession) {
      return;
    }

    loadMatches().catch(() => undefined);
  }, [loadMatches, restoringSession]);

  useEffect(() => {
    if (appTab === "detail" && selectedMatchId) {
      matchActions.loadMessages(selectedMatchId).catch(() => {
        matchActions.clearMessages();
      });
    }
  }, [appTab, matchActions.clearMessages, matchActions.loadMessages, selectedMatchId]);

  useEffect(() => {
    matchActions.closeChat();
  }, [matchActions.closeChat, selectedMatchId]);

  useEffect(() => {
    if (!token || restoringSession) {
      return;
    }

    profileState.load(request).catch(() => undefined);
  }, [profileState.load, request, restoringSession, token]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (profileState.showPublicProfile) {
          profileState.setShowPublicProfile(false);
          return true;
        }
        if (matchActions.showMatchChat) {
          matchActions.closeChat();
          return true;
        }
        if (matchDraft.showPreview) {
          matchDraft.setShowPreview(false);
          return true;
        }
        if (matchDraft.showCalendar) {
          matchDraft.setShowCalendar(false);
          return true;
        }
        if (profileState.editing) {
          profileState.stopEditing();
          return true;
        }
        if (appTab === "home" && selectedMatchId) {
          setSelectedMatchId(null);
          return true;
        }
        if (appTab === "location") {
          setAppTab("create");
          return true;
        }
        if (appTab === "create" && matchDraft.editingMatchId) {
          closeMatchEditor();
          return true;
        }
        if (appTab === "detail" || appTab === "create" || appTab === "profile") {
          goHome();
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [
    appTab,
    matchDraft.editingMatchId,
    matchDraft.setShowCalendar,
    matchDraft.setShowPreview,
    matchDraft.showCalendar,
    matchDraft.showPreview,
    profileState.editing,
    profileState.setShowPublicProfile,
    profileState.showPublicProfile,
    profileState.stopEditing,
    selectedMatchId,
    matchActions.closeChat,
    matchActions.showMatchChat,
  ]);

  async function saveProfile() {
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
  }

  async function openPublicProfile(userId: string) {
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
  }

  async function loadAfterAuthenticatedSession(accessToken: string) {
    setAppTab("home");
    setHomeMode("map");

    const { available, mine } = await fetchMatchesSnapshot(accessToken);
    setMatches(available);
    setMyMatches(mine);
    setSelectedMatchId(null);
  }

  async function submitAuth() {
    setLoading(true);
    try {
      await authSession.submitAuth({
        request,
        onAuthenticated: loadAfterAuthenticatedSession,
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitGoogleToken(idToken: string) {
    setLoading(true);
    try {
      await authSession.submitGoogleToken({
        request,
        idToken,
        onAuthenticated: loadAfterAuthenticatedSession,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      Alert.alert("No se pudo entrar con Google", message);
    } finally {
      setLoading(false);
    }
  }

  function validateMatchDraft() {
    const validation = validateMatchDraftValues({
      title: matchDraft.title,
      fieldName: matchDraft.fieldName,
      date: matchDraft.date,
      time: matchDraft.time,
      maxPlayers: matchDraft.maxPlayers,
      pricePerPerson: matchDraft.pricePerPerson,
    });

    if (!validation.ok) {
      Alert.alert(validation.title, validation.message);
      return null;
    }

    return validation;
  }

  function openCreatePreview() {
    if (!validateMatchDraft()) {
      return;
    }
    matchDraft.setShowPreview(true);
  }

  async function createMatch() {
    const draft = validateMatchDraft();
    if (!draft) {
      return;
    }

    setLoading(true);
    try {
      const matchBody = buildMatchRequestBody(
        {
          title: matchDraft.title,
          fieldName: matchDraft.fieldName,
          address: matchDraft.address,
          city: matchDraft.city,
          date: matchDraft.date,
          time: matchDraft.time,
          maxPlayers: matchDraft.maxPlayers,
          pricePerPerson: matchDraft.pricePerPerson,
          latitude: matchDraft.latitude,
          longitude: matchDraft.longitude,
          selectedSavedFieldId: matchDraft.selectedSavedFieldId,
          coverImageUrl:
            (matchDraft.editingMatchId && selectedMatch?.coverImageUrl) ||
            getRandomMatchCover(),
        },
        draft,
      );
      const saved = await request<MatchResponse>(
        matchDraft.editingMatchId
          ? `/api/matches/${matchDraft.editingMatchId}`
          : "/api/matches",
        {
          method: matchDraft.editingMatchId ? "PUT" : "POST",
          body: JSON.stringify(matchBody),
        },
      );
      await loadMatches();
      setSelectedMatchId(saved.id);
      matchDraft.clearEditing();
      matchDraft.setShowPreview(false);
      setAppTab("detail");
    } catch (error) {
      Alert.alert(
        matchDraft.editingMatchId ? "No se pudo editar" : "No se pudo crear",
        matchMutationErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  function openDetail(matchId: string) {
    setSelectedMatchId(matchId);
    setAppTab("detail");
  }

  async function openDirections(match: MatchResponse) {
    const location = getMatchLocation(match);
    const fallbackQuery = [
      match.field?.name,
      match.field?.address,
      match.field?.city,
    ]
      .filter(Boolean)
      .join(", ");
    const query = location
      ? `${location.latitude},${location.longitude}`
      : fallbackQuery;

    if (!query) {
      Alert.alert("Ubicacion no disponible", "Este partido no tiene destino.");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
    await Linking.openURL(url);
  }

  function goHome() {
    matchDraft.closePanels();
    setSelectedMatchId(null);
    setAppTab("home");
  }

  function closeMatchEditor() {
    const matchId = matchDraft.editingMatchId;
    matchDraft.reset();
    if (matchId) {
      setSelectedMatchId(matchId);
      setAppTab("detail");
      return;
    }
    goHome();
  }

  function startMatchCreate() {
    matchDraft.startCreate();
    setAppTab("create");
  }

  function startMatchEdit(match: MatchResponse) {
    matchDraft.startEdit(match);
    setAppTab("create");
  }

  function logout() {
    authSession.clearSession();
    setMyMatches([]);
    matchActions.clearMessages();
    profileState.clear();
    setSelectedMatchId(null);
  }

  if (showIntroVideo) {
    return <IntroVideoOverlay onDone={() => setShowIntroVideo(false)} />;
  }

  if (restoringSession) {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScreenBubbles />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#8FEA6A" />
          <Text style={styles.loadingText}>Cargando sesion</Text>
        </View>
      </SafeAreaView>
    );
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
        onSubmit={submitAuth}
        onGoogleToken={submitGoogleToken}
      />
    );
  }

  if (appTab === "profile") {
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
        victoryStreak={victoryStreak}
        myMatches={myMatches}
        nextMyMatch={nextMyMatch}
        savedFields={adminFields.savedFields}
        adminFieldEditingId={adminFields.editingId}
        adminFieldName={adminFields.name}
        adminFieldAddress={adminFields.address}
        adminFieldCity={adminFields.city}
        adminFieldLatitude={adminFields.latitude}
        adminFieldLongitude={adminFields.longitude}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onHome={goHome}
        onCreate={startMatchCreate}
        onProfile={() => setAppTab("profile")}
        onLogout={logout}
        onToggleProfileEditing={profileState.toggleEditing}
        onProfileUsernameChange={profileState.setUsername}
        onProfileFullNameChange={profileState.setFullName}
        onProfileCityChange={profileState.setCity}
        onProfilePositionChange={profileState.setPosition}
        onProfileBioChange={profileState.setBio}
        onSaveProfile={saveProfile}
        onStartAdminFieldCreate={adminFields.startCreate}
        onStartAdminFieldEdit={adminFields.startEdit}
        onSaveAdminField={adminFields.save}
        onDeleteAdminField={adminFields.remove}
        onAdminFieldNameChange={adminFields.setName}
        onAdminFieldAddressChange={adminFields.setAddress}
        onAdminFieldCityChange={adminFields.setCity}
        onAdminFieldLatitudeChange={adminFields.setLatitude}
        onAdminFieldLongitudeChange={adminFields.setLongitude}
        onOpenMatch={openDetail}
      />
    );
  }
  if (appTab === "location") {
    return (
      <LocationScreen
        latitude={matchDraft.latitude}
        longitude={matchDraft.longitude}
        city={matchDraftCity}
        fieldName={matchDraft.fieldName}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onBack={() => setAppTab("create")}
        onUseLocation={() => setAppTab("create")}
        onLocationChange={(location, address) => {
          matchDraft.applyLocation(
            location,
            address,
            matchDraftCity,
          );
        }}
      />
    );
  }
  if (appTab === "create") {
    return (
      <CreateMatchScreen
        editingMatchId={matchDraft.editingMatchId}
        selectedMatch={selectedMatch}
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
        onClose={matchDraft.editingMatchId ? closeMatchEditor : goHome}
        onHome={goHome}
        onCreateTab={startMatchCreate}
        onProfile={() => setAppTab("profile")}
        onTitleChange={matchDraft.setTitle}
        onFieldNameChange={matchDraft.setFieldName}
        onOpenLocationPicker={() => {
          matchDraft.clearSelectedSavedField();
          setAppTab("location");
        }}
        onSelectSavedField={matchDraft.selectSavedField}
        onToggleCalendar={matchDraft.toggleCalendar}
        onDateChange={matchDraft.setDate}
        onTimeChange={matchDraft.setTime}
        onMaxPlayersChange={matchDraft.setMaxPlayers}
        onPricePerPersonChange={matchDraft.setPricePerPerson}
        onOpenPreview={openCreatePreview}
        onClosePreview={() => matchDraft.setShowPreview(false)}
        onSubmit={createMatch}
      />
    );
  }

  if (appTab === "detail") {
    return (
      <MatchDetailScreen
        match={selectedMatch}
        isAdmin={isAdmin}
        loading={loading}
        selectedIsParticipant={selectedIsParticipant}
        selectedIsOwner={selectedIsOwner}
        selectedIsOpen={selectedIsOpen}
        messages={matchActions.messages}
        messageText={matchActions.messageText}
        showMatchChat={matchActions.showMatchChat}
        showPublicProfile={profileState.showPublicProfile}
        publicProfile={profileState.publicProfile}
        topInset={safeInsets.top}
        bottomInset={safeInsets.bottom}
        onHome={goHome}
        onCreate={startMatchCreate}
        onProfile={() => setAppTab("profile")}
        onEditMatch={startMatchEdit}
        onCancelMatch={matchActions.cancelMatch}
        onDeleteMatch={matchActions.deleteMatch}
        onRemovePlayer={matchActions.removeMatchPlayer}
        onLeaveMatch={matchActions.leaveMatch}
        onJoinMatch={matchActions.joinMatch}
        onOpenDirections={openDirections}
        onOpenProfile={openPublicProfile}
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
      homeMode={homeMode}
      matches={visibleMatches}
      myMatches={myMatches}
      selectedMatch={selectedMatch}
      selectedMatchId={selectedMatchId}
      currentUserId={currentUserId}
      searchQuery={searchQuery}
      userCity={userCity}
      victoryStreak={victoryStreak}
      loading={loading}
      topInset={safeInsets.top}
      onHomeModeChange={setHomeMode}
      onSearchQueryChange={setSearchQuery}
      onRefresh={refreshMatches}
      onSelectMatch={setSelectedMatchId}
      onOpenDetail={openDetail}
      onHome={goHome}
      onCreate={startMatchCreate}
      onProfile={() => setAppTab("profile")}
    />
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#E3DBD0", fontSize: 14, fontWeight: "900" },
});
