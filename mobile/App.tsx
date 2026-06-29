import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchMatchesSnapshot } from "./src/api/matches";
import { useApiRequest } from "./src/api/useApiRequest";
import { hasGoogleClientId } from "./src/api/config";
import { GoogleAuthButton } from "./src/components/auth/GoogleAuthButton";
import { AppLogoImage, LogoMark } from "./src/components/branding/Branding";
import { ScreenBubbles } from "./src/components/chrome/ScreenBubbles";
import {
  EditProfileIcon,
  LocationTargetIcon,
  MapPickerIcon,
  PencilIcon,
  RefreshIcon,
} from "./src/components/icons/AppIcons";
import {
  CalendarPicker,
  CreatePreviewModal,
  TimeWheel,
} from "./src/components/editor/MatchEditorControls";
import { HomeMetric, ListStat, QuickMessageButton } from "./src/components/home/HomeWidgets";
import { IntroVideoOverlay } from "./src/components/intro/IntroVideoOverlay";
import { LocationPickerMap } from "./src/components/map/LocationPickerMap";
import { MapHome } from "./src/components/map/MapHome";
import { CompactMatch } from "./src/components/matches/CompactMatch";
import { ListHome } from "./src/components/matches/ListHome";
import { MatchImageBackground, OccupancyBar } from "./src/components/matches/MatchMedia";
import { TeamOccupancy, TeamRoster } from "./src/components/matches/TeamRoster";
import { BottomNav } from "./src/components/navigation/BottomNav";
import { ProfileStat } from "./src/components/profile/ProfileWidgets";
import {
  Field,
  FilterButton,
  PasswordField,
  PositionButton,
  QuickChip,
  StatusBadge,
} from "./src/components/ui/FormControls";
import { ModeButton } from "./src/components/ui/ModeButton";
import { requestAppPermissions } from "./src/platform/permissions";
import { sessionStorageAdapter } from "./src/platform/sessionStorage";
import type {
  AppTab,
  AuthMode,
  AuthResponse,
  DateFilter,
  HomeMode,
  MapLocation,
  MatchFilter,
  MatchResponse,
  MessageResponse,
  PlayerPosition,
  PlayerProfileResponse,
  SavedFieldResponse,
  StoredSession,
  TeamSide,
  UserRole,
} from "./src/types/domain";
import {
  authErrorMessage,
  matchMutationErrorMessage,
  validateAuthForm,
} from "./src/utils/authUtils";
import {
  dateInputFromInstant,
  filterMatchByDate,
  formatDate,
  formatPriceFromCents,
  formatTime,
  getRandomMatchCover,
  isMatchOpen,
  isTeamFull,
  positionLabel,
  publicHandle,
  timeInputFromInstant,
  tomorrowDateParts,
  userParticipatesInMatch,
} from "./src/utils/matchUtils";
import {
  DEFAULT_MAP_CENTER,
  getMatchLocation,
} from "./src/utils/mapUtils";

const MOBILE_EDGE_PADDING = 10;

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const safeInsets = useSafeAreaInsets();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [homeMode, setHomeMode] = useState<HomeMode>("map");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [appTab, setAppTab] = useState<AppTab>("home");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("PLAYER");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myMatches, setMyMatches] = useState<MatchResponse[]>([]);
  const [savedFields, setSavedFields] = useState<SavedFieldResponse[]>([]);
  const [selectedSavedFieldId, setSelectedSavedFieldId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showMatchChat, setShowMatchChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [notice, setNotice] = useState("Conectado a localhost:8080");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [publicProfile, setPublicProfile] = useState<PlayerProfileResponse | null>(null);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profilePosition, setProfilePosition] =
    useState<PlayerPosition>("MIDFIELDER");
  const [profileEditing, setProfileEditing] = useState(false);
  const googleLoginConfigured = hasGoogleClientId(Platform.OS);

  const [newTitle, setNewTitle] = useState("Partido Footy");
  const [newFieldName, setNewFieldName] = useState("Campo Municipal Saladillo");
  const [newAddress, setNewAddress] = useState(
    "Calle Hermanos Alvarez Quintero 13",
  );
  const [newCity, setNewCity] = useState("Huelva");
  const [newDate, setNewDate] = useState(tomorrowDateParts());
  const [newTime, setNewTime] = useState("19:00");
  const [newMaxPlayers, setNewMaxPlayers] = useState("5");
  const [newPricePerPerson, setNewPricePerPerson] = useState("3.50");
  const [newLatitude, setNewLatitude] = useState(37.26142);
  const [newLongitude, setNewLongitude] = useState(-6.94472);
  const [showCreatePreview, setShowCreatePreview] = useState(false);
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [adminFieldEditingId, setAdminFieldEditingId] = useState<string | null>(null);
  const [adminFieldName, setAdminFieldName] = useState("");
  const [adminFieldAddress, setAdminFieldAddress] = useState("");
  const [adminFieldCity, setAdminFieldCity] = useState("Huelva");
  const [adminFieldLatitude, setAdminFieldLatitude] = useState("");
  const [adminFieldLongitude, setAdminFieldLongitude] = useState("");

  const isLoggedIn = Boolean(token);
  const isAdmin = currentUserRole === "ADMIN";
  const visibleMatches = useMemo(() => {
  const query = searchQuery.trim().toLowerCase();
  const now = new Date();

  return matches.filter((match) => {
    const field = match.field;
    const matchDate = new Date(match.startsAt);

    const isFutureOrNow =
      Number.isFinite(matchDate.getTime()) && matchDate >= now;

    if (!isFutureOrNow) {
      return false;
    }

    const matchesText =
      !query ||
      [match.title, field?.name, field?.city, field?.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));

    const matchesMine =
      matchFilter === "all" ||
      myMatches.some((myMatch) => myMatch.id === match.id);

    const matchesDate = filterMatchByDate(match, dateFilter, now);

    const matchesAvailability =
      !onlyAvailable ||
      (match.status === "OPEN" &&
        match.occupancy.totalPlayers < match.occupancy.totalCapacity);

    return matchesText && matchesMine && matchesDate && matchesAvailability;
  });
}, [matches, myMatches, searchQuery, matchFilter, dateFilter, onlyAvailable]);


  const selectedMatch = selectedMatchId
    ? (visibleMatches.find((match) => match.id === selectedMatchId) ?? null)
    : null;
  const selectedIsMine = selectedMatch
    ? myMatches.some((match) => match.id === selectedMatch.id)
    : false;
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
  const handleUnauthorized = useCallback(() => {
    void sessionStorageAdapter.clear();
    setToken(null);
    setUserName(null);
    setCurrentUserRole("PLAYER");
    setCurrentUserId(null);
    setMyMatches([]);
    setMessages([]);
    setProfile(null);
    setNotice("Sesion caducada, vuelve a entrar");
  }, []);

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

  const loadSavedFields = useCallback(async () => {
    const fields = await request<SavedFieldResponse[]>("/api/fields");
    setSavedFields(fields);
  }, [request]);

  async function refreshMatches() {
    setLoading(true);
    try {
      await loadMatches();
      setNotice("Partidos actualizados");
    } catch (error) {
      setNotice("No se pudo actualizar");
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
    let active = true;

    async function restoreSession() {
      const storedSession = await sessionStorageAdapter.get();
      if (!active) {
        return;
      }
      if (!storedSession) {
        setRestoringSession(false);
        return;
      }

      try {
        const session = JSON.parse(storedSession) as StoredSession;
        setToken(session.accessToken);
        setUserName(session.user.displayName);
        setCurrentUserRole(session.user.role ?? "PLAYER");
        setCurrentUserId(session.user.id);
        setEmail(session.user.email);
        setNotice(`Sesion restaurada como ${session.user.displayName}`);
      } catch {
        await sessionStorageAdapter.clear();
        setNotice("Sesion local reiniciada");
      } finally {
        if (active) {
          setRestoringSession(false);
        }
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (showIntroVideo) {
      return;
    }

    requestAppPermissions().catch(() => undefined);
  }, [showIntroVideo]);

  useEffect(() => {
    loadSavedFields().catch(() => setSavedFields([]));
  }, [loadSavedFields]);

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

  useEffect(() => {
    if (restoringSession) {
      return;
    }

    loadMatches().catch(() =>
      setNotice("Arranca el backend para ver datos reales"),
    );
  }, [loadMatches, restoringSession]);

  useEffect(() => {
    if (appTab === "detail" && selectedMatchId) {
      loadMessages(selectedMatchId).catch(() => setMessages([]));
    }
  }, [appTab, loadMessages, selectedMatchId]);

  useEffect(() => {
    setShowMatchChat(false);
  }, [selectedMatchId]);

  useEffect(() => {
    if (!token || restoringSession) {
      return;
    }

    loadProfile().catch(() => setNotice("No se pudo cargar el perfil"));
  }, [token, restoringSession]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showPublicProfile) {
          setShowPublicProfile(false);
          return true;
        }
        if (showMatchChat) {
          setShowMatchChat(false);
          return true;
        }
        if (showCreatePreview) {
          setShowCreatePreview(false);
          return true;
        }
        if (showCreateCalendar) {
          setShowCreateCalendar(false);
          return true;
        }
        if (profileEditing) {
          setProfileEditing(false);
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
        if (appTab === "create" && editingMatchId) {
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
    editingMatchId,
    profileEditing,
    selectedMatchId,
    showCreateCalendar,
    showCreatePreview,
    showMatchChat,
    showPublicProfile,
  ]);

  function applyProfile(nextProfile: PlayerProfileResponse) {
    setProfile(nextProfile);
    setProfileFullName(nextProfile.fullName ?? nextProfile.displayName ?? "");
    setProfileUsername(nextProfile.username ?? "");
    setProfileCity(nextProfile.city ?? "");
    setProfileBio(nextProfile.bio ?? "");
    setProfilePosition(nextProfile.preferredPosition ?? "MIDFIELDER");
  }

  async function loadProfile() {
    const nextProfile = await request<PlayerProfileResponse>("/api/profile/me");
    applyProfile(nextProfile);
  }

  async function saveProfile() {
    setLoading(true);
    try {
      const nextProfile = await request<PlayerProfileResponse>(
        "/api/profile/me",
        {
          method: "PUT",
          body: JSON.stringify({
            username: profileUsername,
            fullName: profileFullName,
            city: profileCity,
            bio: profileBio,
            preferredPosition: profilePosition,
          }),
        },
      );
      applyProfile(nextProfile);
      setNotice("Perfil actualizado");
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
      const nextProfile = await request<PlayerProfileResponse>(
        `/api/profile/${userId}`,
      );
      setPublicProfile(nextProfile);
      setShowPublicProfile(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo abrir el perfil");
    } finally {
      setLoading(false);
    }
  }

  async function applyAuthenticatedSession(auth: AuthResponse) {
      setToken(auth.accessToken);
      setUserName(auth.user.displayName);
      setCurrentUserRole(auth.user.role ?? "PLAYER");
      setCurrentUserId(auth.user.id);
      setEmail(auth.user.email);
      void sessionStorageAdapter.set({
        accessToken: auth.accessToken,
        expiresAt: auth.expiresAt,
        user: auth.user,
      });
      setNotice(`Sesion iniciada como ${auth.user.displayName}`);
      setAppTab("home");
      setHomeMode("map");

      const { available, mine } = await fetchMatchesSnapshot(auth.accessToken);
      setMatches(available);
      setMyMatches(mine);
      setSelectedMatchId(null);
  }

  function switchAuthMode(nextMode: AuthMode) {
    if (nextMode === authMode) {
      return;
    }

    setAuthMode(nextMode);
    setEmail("");
    setPassword("");
    setDisplayName("");
    setAuthError(null);
  }

  async function submitAuth() {
    const normalizedEmail = email.trim();
    const validationError = validateAuthForm({
      authMode,
      displayName,
      email: normalizedEmail,
      password,
    });

    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const path =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        authMode === "login"
          ? { email: normalizedEmail, password }
          : {
              email: normalizedEmail,
              password,
              displayName: displayName.trim(),
            };
      const auth = await request<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      await applyAuthenticatedSession(auth);
    } catch (error) {
      const message = authErrorMessage(error, authMode);
      setNotice(message);
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  async function submitGoogleToken(idToken: string) {
    setLoading(true);
    try {
      const auth = await request<AuthResponse>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      await applyAuthenticatedSession(auth);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      setNotice(message);
      Alert.alert("No se pudo entrar con Google", message);
    } finally {
      setLoading(false);
    }
  }

  function selectSavedField(field: SavedFieldResponse | null) {
    setSelectedSavedFieldId(field?.id ?? null);
    if (!field) {
      return;
    }
    setNewFieldName(field.name);
    setNewAddress(field.address ?? "");
    setNewCity(field.city ?? "");
    if (typeof field.latitude === "number") {
      setNewLatitude(field.latitude);
    }
    if (typeof field.longitude === "number") {
      setNewLongitude(field.longitude);
    }
  }

  function startAdminFieldCreate() {
    setAdminFieldEditingId(null);
    setAdminFieldName("");
    setAdminFieldAddress("");
    setAdminFieldCity(profile?.city || profileCity || "Huelva");
    setAdminFieldLatitude(newLatitude.toFixed(6));
    setAdminFieldLongitude(newLongitude.toFixed(6));
  }

  function startAdminFieldEdit(field: SavedFieldResponse) {
    setAdminFieldEditingId(field.id);
    setAdminFieldName(field.name);
    setAdminFieldAddress(field.address ?? "");
    setAdminFieldCity(field.city ?? "");
    setAdminFieldLatitude(String(field.latitude ?? ""));
    setAdminFieldLongitude(String(field.longitude ?? ""));
  }

  async function saveAdminField() {
    const latitude = Number(adminFieldLatitude.replace(",", "."));
    const longitude = Number(adminFieldLongitude.replace(",", "."));
    if (!adminFieldName.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert("Revisa la pista", "Nombre, latitud y longitud son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const body = JSON.stringify({
        name: adminFieldName.trim(),
        address: adminFieldAddress.trim() || null,
        city: adminFieldCity.trim() || null,
        latitude,
        longitude,
      });
      const saved = await request<SavedFieldResponse>(
        adminFieldEditingId ? `/api/fields/${adminFieldEditingId}` : "/api/fields",
        {
          method: adminFieldEditingId ? "PUT" : "POST",
          body,
        },
      );
      await loadSavedFields();
      selectSavedField(saved);
      startAdminFieldCreate();
      setNotice("Pista guardada");
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAdminField(field: SavedFieldResponse) {
    setLoading(true);
    try {
      await request(`/api/fields/${field.id}`, { method: "DELETE" });
      if (selectedSavedFieldId === field.id) {
        setSelectedSavedFieldId(null);
      }
      await loadSavedFields();
      setNotice("Pista eliminada");
    } catch (error) {
      Alert.alert("No se pudo eliminar", error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function validateMatchDraft() {
    if (
      !newTitle.trim() ||
      !newFieldName.trim() ||
      !newDate.trim() ||
      !newTime.trim()
    ) {
      Alert.alert("Faltan datos", "Completa titulo, campo, fecha y hora.");
      return null;
    }

    const maxPlayers = Number(newMaxPlayers);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 11) {
      Alert.alert(
        "Revisa plazas",
        "El maximo por equipo debe estar entre 1 y 11.",
      );
      return null;
    }

    const priceValue = Number(newPricePerPerson.replace(",", "."));
    if (!Number.isFinite(priceValue) || priceValue < 0 || priceValue > 100) {
      Alert.alert(
        "Revisa el precio",
        "El precio por persona debe estar entre 0 y 100 euros.",
      );
      return null;
    }

    return {
      maxPlayers,
      pricePerPersonCents: Math.round(priceValue * 100),
    };
  }

  function openCreatePreview() {
    if (!validateMatchDraft()) {
      return;
    }
    setShowCreatePreview(true);
  }

  async function createMatch() {
    const draft = validateMatchDraft();
    if (!draft) {
      return;
    }

    setLoading(true);
    try {
      const matchBody = {
        title: newTitle.trim(),
        startsAt: new Date(`${newDate}T${newTime}:00`).toISOString(),
        maxPlayersPerTeam: draft.maxPlayers,
        pricePerPersonCents: draft.pricePerPersonCents,
        coverImageUrl:
          (editingMatchId && selectedMatch?.coverImageUrl) || getRandomMatchCover(),
        fieldId: selectedSavedFieldId,
        field: selectedSavedFieldId
          ? null
          : {
              name: newFieldName.trim(),
              address: newAddress.trim() || null,
              city: newCity.trim() || null,
              latitude: newLatitude,
              longitude: newLongitude,
            },
      };
      const saved = await request<MatchResponse>(
        editingMatchId ? `/api/matches/${editingMatchId}` : "/api/matches",
        {
          method: editingMatchId ? "PUT" : "POST",
          body: JSON.stringify(matchBody),
        },
      );
      await loadMatches();
      setSelectedMatchId(saved.id);
      setNotice(editingMatchId ? "Partido actualizado" : "Partido creado");
      setEditingMatchId(null);
      setShowCreatePreview(false);
      setAppTab("detail");
    } catch (error) {
      Alert.alert(
        editingMatchId ? "No se pudo editar" : "No se pudo crear",
        matchMutationErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteMatch(matchId: string) {
    setLoading(true);
    try {
      await request(`/api/matches/${matchId}`, {
        method: "DELETE",
      });
      await loadMatches();
      setSelectedMatchId(null);
      setMessages([]);
      setNotice("Partido borrado");
      setAppTab("home");
    } catch (error) {
      Alert.alert(
        "No se pudo borrar",
        matchMutationErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeMatchPlayer(matchId: string, userId: string) {
    setLoading(true);
    try {
      const updated = await request<MatchResponse>(
        `/api/matches/${matchId}/players/${userId}`,
        { method: "DELETE" },
      );
      await loadMatches();
      setSelectedMatchId(updated.id);
      setNotice("Jugador eliminado del partido");
    } catch (error) {
      Alert.alert(
        "No se pudo quitar",
        matchMutationErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinMatch(matchId: string, teamSide: TeamSide) {
    setLoading(true);
    try {
      await request(`/api/matches/${matchId}/join`, {
        method: "POST",
        body: JSON.stringify({ teamSide }),
      });
      setNotice(`Te has unido al equipo ${teamSide}`);
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
  }

  async function cancelMatch(matchId: string) {
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
      setNotice("Partido cancelado");
    } catch (error) {
      Alert.alert(
        "No se pudo cancelar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLoading(false);
    }
  }
  async function leaveMatch(matchId: string) {
    setLoading(true);
    try {
      await request(`/api/matches/${matchId}/leave`, { method: "DELETE" });
      setNotice("Has salido del partido");
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
  }

  async function sendMatchMessage(content: string) {
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
  }

  async function sendMessage() {
    await sendMatchMessage(messageText);
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
    setEditingMatchId(null);
    setShowCreatePreview(false);
    setShowCreateCalendar(false);
    setSelectedMatchId(null);
    setAppTab("home");
  }

  function closeMatchEditor() {
    const matchId = editingMatchId;
    resetMatchDraft();
    if (matchId) {
      setSelectedMatchId(matchId);
      setAppTab("detail");
      return;
    }
    goHome();
  }

  function resetMatchDraft() {
    setEditingMatchId(null);
    setNewTitle("Partido Footy");
    setNewFieldName("Campo Municipal Saladillo");
    setNewAddress("Calle Hermanos Alvarez Quintero 13");
    setNewCity("Huelva");
    setNewDate(tomorrowDateParts());
    setNewTime("19:00");
    setNewMaxPlayers("5");
    setNewPricePerPerson("3.50");
    setNewLatitude(37.26142);
    setNewLongitude(-6.94472);
    setSelectedSavedFieldId(null);
    setShowCreatePreview(false);
    setShowCreateCalendar(false);
  }

  function startMatchCreate() {
    resetMatchDraft();
    setAppTab("create");
  }

  function startMatchEdit(match: MatchResponse) {
    setEditingMatchId(match.id);
    setNewTitle(match.title);
    setNewFieldName(match.field?.name ?? "Campo por confirmar");
    setNewAddress(match.field?.address ?? "");
    setNewCity(match.field?.city ?? "");
    setNewDate(dateInputFromInstant(match.startsAt));
    setNewTime(timeInputFromInstant(match.startsAt));
    setNewMaxPlayers(String(match.maxPlayersPerTeam));
    setNewPricePerPerson((match.pricePerPersonCents / 100).toFixed(2));
    setNewLatitude(match.field?.latitude ?? DEFAULT_MAP_CENTER.latitude);
    setNewLongitude(match.field?.longitude ?? DEFAULT_MAP_CENTER.longitude);
    setSelectedSavedFieldId(null);
    setShowCreatePreview(false);
    setShowCreateCalendar(false);
    setAppTab("create");
  }

  function logout() {
    void sessionStorageAdapter.clear();
    setToken(null);
    setUserName(null);
    setCurrentUserRole("PLAYER");
    setCurrentUserId(null);
    setMyMatches([]);
    setMessages([]);
    setProfile(null);
    setSelectedMatchId(null);
    setNotice("Sesion cerrada");
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
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="light" />
      <ScreenBubbles />
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeroBlock}>
            <View style={styles.authLogoHalo}>
              <View style={styles.authLogoBubbleOne} />
              <View style={styles.authLogoBubbleTwo} />
              <AppLogoImage size={Platform.OS === "android" ? 58 : 64} />
            </View>
            <Text style={styles.authBrand}>Footy</Text>
          </View>

          <View style={styles.authCard}>
            <View pointerEvents="none" style={styles.authCardBubbleOne} />
            <View pointerEvents="none" style={styles.authCardBubbleTwo} />
            <View style={styles.modeSwitchLight}>
              <ModeButton
                label="Entrar"
                icon="login"
                active={authMode === "login"}
                onPress={() => switchAuthMode("login")}
              />
              <ModeButton
                label="Registro"
                icon="register"
                active={authMode === "register"}
                onPress={() => switchAuthMode("register")}
              />
            </View>
            <View style={styles.authFormHeading}>
              <Text style={styles.authFormTitle}>
                {authMode === "login" ? "Inicia sesion" : "Crea tu cuenta"}
              </Text>
            </View>
            {authMode === "register" ? (
              <Field
                label="Alias de jugador"
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setAuthError(null);
                }}
                placeholder="Ej. Felix10"
                autoCapitalize="none"
                error={
                  authError?.startsWith("Indica un alias") ||
                  authError?.startsWith("Este alias") ||
                  authError?.startsWith("El alias")
                }
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setAuthError(null);
              }}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoComplete="email"
              error={
                authError?.startsWith("Introduce tu email") ||
                authError?.startsWith("Introduce un email") ||
                authError?.startsWith("El email") ||
                authError?.startsWith("Email o contrasena")
              }
            />
            <PasswordField
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setAuthError(null);
              }}
              error={
                authError?.startsWith("Introduce tu contrasena") ||
                authError?.startsWith("La contrasena") ||
                authError?.startsWith("Email o contrasena")
              }
            />
            {authError ? (
              <View style={styles.authErrorBox} accessibilityLiveRegion="polite">
                <View style={styles.authErrorDot} />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            ) : null}
            <Pressable
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={submitAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A110E" />
              ) : (
                <Text style={styles.authButtonText}>
                  {authMode === "login" ? "Iniciar sesion" : "Crear cuenta"}
                </Text>
              )}
            </Pressable>
            <View style={styles.authDividerRow}>
              <View style={styles.authDividerLine} />
              <Text style={styles.authDividerText}>o continua con</Text>
              <View style={styles.authDividerLine} />
            </View>
            <GoogleAuthButton
              configured={googleLoginConfigured}
              loading={loading}
              onGoogleToken={submitGoogleToken}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (appTab === "profile") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
      <ScreenBubbles />
        <ScrollView
          contentContainerStyle={[
            styles.profileContent,
            {
              paddingTop: safeInsets.top + 18,
              paddingBottom: safeInsets.bottom + 104,
            },
          ]}
        >
          <View style={styles.profileHeader}>
            <Pressable
              style={styles.backButton}
              onPress={goHome}
            >
              <Text style={styles.backButtonText}>{"<"}</Text>
            </Pressable>
            <Text style={styles.profileTitle}>Perfil</Text>
            <Pressable style={styles.logoutPill} onPress={logout}>
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>

          <View style={styles.profileHeroCard}>
            <View style={styles.profileGlowMark} />
            <View style={styles.profileHeroTopline}>
              <Text style={styles.profileEyebrow}>
                {isAdmin ? "Administrador" : "Jugador"}
              </Text>
              <Pressable
                style={styles.editProfileButton}
                onPress={() => setProfileEditing((current) => !current)}
              >
                <EditProfileIcon active={profileEditing} />
              </Pressable>
            </View>
            <View style={styles.profileHeroBody}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarCore}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.fullName || userName || "F")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.profileIdentity}>
                <Text style={styles.profileName}>
                  {profile?.fullName || userName || "Jugador Footy"}
                </Text>
                <Text style={styles.profileHandle}>
                  {publicHandle(profile ?? { displayName: userName })}
                </Text>
                <Text style={styles.profileMeta}>
                  {profile?.city || profileCity || "Ciudad pendiente"} -{" "}
                  {positionLabel(profile?.preferredPosition ?? profilePosition)}
                </Text>
                {profile?.bio ? (
                  <Text style={styles.profileBioText}>{profile.bio}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.streakBanner}>
              <View style={styles.streakCircleLarge} />
              <View style={styles.streakCircleSmall} />
              <View style={styles.streakTextBlock}>
                <Text style={styles.streakLabel}>Racha de victorias</Text>
                <Text style={styles.streakSubLabel}>
                  Sigue sumando partidos
                </Text>
              </View>
              <Text style={styles.streakNumber}>{victoryStreak}</Text>
            </View>
          </View>

          {isAdmin ? (
            <View style={styles.adminPanel}>
              <View style={styles.adminPanelHeader}>
                <View>
                  <Text style={styles.adminEyebrow}>Admin</Text>
                  <Text style={styles.adminTitle}>Pistas guardadas</Text>
                </View>
                <Pressable style={styles.adminMiniButton} onPress={startAdminFieldCreate}>
                  <Text style={styles.adminMiniButtonText}>Nueva</Text>
                </Pressable>
              </View>
              <Field
                label="Nombre de pista"
                value={adminFieldName}
                onChangeText={setAdminFieldName}
                placeholder="Campo Municipal"
              />
              <Field
                label="Direccion"
                value={adminFieldAddress}
                onChangeText={setAdminFieldAddress}
                placeholder="Calle, barrio..."
              />
              <Field
                label="Ciudad"
                value={adminFieldCity}
                onChangeText={setAdminFieldCity}
                placeholder="Huelva"
              />
              <Field
                label="Latitud"
                value={adminFieldLatitude}
                onChangeText={setAdminFieldLatitude}
                keyboardType="decimal-pad"
                placeholder="37.261420"
              />
              <Field
                label="Longitud"
                value={adminFieldLongitude}
                onChangeText={setAdminFieldLongitude}
                keyboardType="decimal-pad"
                placeholder="-6.944720"
              />
              <Pressable
                style={styles.adminSaveButton}
                onPress={saveAdminField}
                disabled={loading}
              >
                <Text style={styles.adminSaveButtonText}>
                  {adminFieldEditingId ? "Guardar pista" : "Anadir pista"}
                </Text>
              </Pressable>
              <View style={styles.adminFieldList}>
                {savedFields.map((field) => (
                  <View key={field.id} style={styles.adminFieldItem}>
                    <View style={styles.adminFieldInfo}>
                      <Text style={styles.adminFieldName}>{field.name}</Text>
                      <Text style={styles.adminFieldMeta} numberOfLines={1}>
                        {field.address || "Sin direccion"} - {field.city || "Sin ciudad"}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.adminIconButton}
                      onPress={() => startAdminFieldEdit(field)}
                    >
                      <Text style={styles.adminIconButtonText}>Editar</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.adminIconButton, styles.adminDangerButton]}
                      onPress={() => deleteAdminField(field)}
                    >
                      <Text style={styles.adminIconButtonText}>Borrar</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {profileEditing ? (
            <View style={styles.profileEditor}>
              <Text style={styles.profileSectionTitle}>
                Editar perfil
              </Text>
              <Field
                label="Usuario"
                value={profileUsername}
                onChangeText={setProfileUsername}
                placeholder="tu_usuario"
                autoCapitalize="none"
              />
              <Field
                label="Nombre completo"
                value={profileFullName}
                onChangeText={setProfileFullName}
                placeholder="Tu nombre"
              />
              <Field
                label="Ciudad"
                value={profileCity}
                onChangeText={setProfileCity}
                placeholder="Huelva"
              />
              <View style={styles.positionGrid}>
                <PositionButton
                  label="POR"
                  value="GOALKEEPER"
                  active={profilePosition === "GOALKEEPER"}
                  onPress={setProfilePosition}
                />
                <PositionButton
                  label="DEF"
                  value="DEFENDER"
                  active={profilePosition === "DEFENDER"}
                  onPress={setProfilePosition}
                />
                <PositionButton
                  label="MED"
                  value="MIDFIELDER"
                  active={profilePosition === "MIDFIELDER"}
                  onPress={setProfilePosition}
                />
                <PositionButton
                  label="DEL"
                  value="FORWARD"
                  active={profilePosition === "FORWARD"}
                  onPress={setProfilePosition}
                />
              </View>
              <Field
                label="Bio"
                value={profileBio}
                onChangeText={setProfileBio}
                placeholder="Como juegas, disponibilidad, pierna buena..."
                multiline
              />
              <Pressable
                style={styles.authButton}
                onPress={saveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0A110E" />
                ) : (
                  <Text style={styles.authButtonText}>Guardar cambios</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.profileStats}>
            <ProfileStat value={myMatches.length} label="Partidos" />
            <ProfileStat value={victoryStreak} label="Racha" />
            <ProfileStat value="84%" label="Asistencia" />
          </View>

          <View style={styles.nextMatchCard}>
            <Text style={styles.nextMatchEyebrow}>Proximo partido</Text>
            {nextMyMatch ? (
              <Pressable onPress={() => openDetail(nextMyMatch.id)}>
                <Text style={styles.nextMatchTitle}>{nextMyMatch.title}</Text>
                <Text style={styles.nextMatchMeta}>
                  {formatDate(nextMyMatch.startsAt)} -{" "}
                  {nextMyMatch.field?.name ?? "Campo pendiente"}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.nextMatchMeta}>
                Unete a un partido para verlo aqui.
              </Text>
            )}
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.profileSectionTitle}>Mis partidos</Text>
            {myMatches.length === 0 ? (
              <Text style={styles.profileEmpty}>
                Aun no tienes partidos activos.
              </Text>
            ) : (
              myMatches.map((match) => (
                <CompactMatch
                  key={match.id}
                  match={match}
                  onPress={() => openDetail(match.id)}
                />
              ))
            )}
          </View>
        </ScrollView>
        <BottomNav
          active="profile"
          onHome={goHome}
          onCreate={startMatchCreate}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }
  if (appTab === "location") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
      <ScreenBubbles />
        <View
          style={[
            styles.locationScreen,
            {
              paddingTop: safeInsets.top + 18,
              paddingBottom: safeInsets.bottom + 24,
            },
          ]}
        >
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Ubicacion del partido</Text>
              <Text style={styles.screenTitle}>Mapa</Text>
            </View>
            <Pressable
              style={styles.closePill}
              onPress={() => setAppTab("create")}
            >
              <Text style={styles.closePillText}>Volver</Text>
            </Pressable>
          </View>
          <View style={styles.locationPickerShell}>
            <LocationPickerMap
              value={{ latitude: newLatitude, longitude: newLongitude }}
              city={profile?.city || profileCity || newCity || "Huelva"}
              fieldName={newFieldName}
              onChange={(location, address) => {
                setSelectedSavedFieldId(null);
                setNewLatitude(location.latitude);
                setNewLongitude(location.longitude);
                if (address) {
                  setNewAddress(address);
                }
                setNewCity(profile?.city || profileCity || newCity || "Huelva");
              }}
            />
          </View>
          <View style={styles.locationSummaryCard}>
            <Text style={styles.locationSummaryTitle}>Punto seleccionado</Text>
            <Text style={styles.locationSummaryText}>
              {newLatitude.toFixed(5)}, {newLongitude.toFixed(5)}
            </Text>
            <Pressable
              style={styles.authButton}
              onPress={() => setAppTab("create")}
            >
              <Text style={styles.authButtonText}>Usar esta ubicacion</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  if (appTab === "create") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
      <ScreenBubbles />
        <ScrollView
          contentContainerStyle={[
            styles.createContent,
            {
              paddingTop: safeInsets.top + 18,
              paddingBottom: safeInsets.bottom + 116,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.screenHeader}>
            <View>
              {editingMatchId ? (
                <Text style={styles.smallLabel}>Editando partido</Text>
              ) : null}
              <Text style={styles.screenTitle}>
                {editingMatchId ? "Editar partido" : "Nuevo partido"}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closePill,
                editingMatchId && styles.editClosePill,
                pressed && styles.closePillPressed,
              ]}
              onPress={editingMatchId ? closeMatchEditor : goHome}
            >
              <Text style={styles.closePillText}>
                {editingMatchId ? "Volver" : "Cerrar"}
              </Text>
            </Pressable>
          </View>

          {editingMatchId ? (
            <View style={styles.editModeBanner}>
              <View style={styles.editModeIcon}>
                <PencilIcon />
              </View>
              <View style={styles.editModeTextWrap}>
                <Text style={styles.editModeTitle} numberOfLines={1}>
                  {selectedMatch?.title ?? newTitle}
                </Text>
                <Text style={styles.editModeMeta} numberOfLines={1}>
                  Los cambios se guardaran en el partido publicado
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.createCard}>
            <View style={styles.createCardBubbleOne} />
            <View style={styles.createCardBubbleTwo} />
            <Field
              label="Titulo"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Partido Footy"
            />
            <Field
              label="Campo"
              value={newFieldName}
              onChangeText={(value) => {
                setSelectedSavedFieldId(null);
                setNewFieldName(value);
              }}
              placeholder="Nombre del campo"
            />
            <View style={styles.locationCreateCard}>
              <View>
                <Text style={styles.locationCreateTitle}>Ubicacion</Text>
                <Text style={styles.locationCreateMeta}>
                  {selectedSavedFieldId ? "Pista guardada" : "Punto manual"} -{" "}
                  {newLatitude.toFixed(5)}, {newLongitude.toFixed(5)}
                </Text>
              </View>
              <Pressable
                style={styles.locationPickButton}
                onPress={() => {
                  setSelectedSavedFieldId(null);
                  setAppTab("location");
                }}
              >
                <MapPickerIcon />
              </Pressable>
            </View>
            {savedFields.length > 0 ? (
              <View style={styles.savedFieldBlock}>
                <Text style={styles.fieldLabel}>Pistas guardadas</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedFieldScroller}
                >
                  <Pressable
                    style={[
                      styles.savedFieldChip,
                      !selectedSavedFieldId && styles.savedFieldChipActive,
                    ]}
                    onPress={() => selectSavedField(null)}
                  >
                    <Text
                      style={[
                        styles.savedFieldChipTitle,
                        !selectedSavedFieldId && styles.savedFieldChipTitleActive,
                      ]}
                    >
                      Punto manual
                    </Text>
                    <Text style={styles.savedFieldChipMeta}>Elegir en mapa</Text>
                  </Pressable>
                  {savedFields.map((field) => {
                    const active = selectedSavedFieldId === field.id;
                    return (
                      <Pressable
                        key={field.id}
                        style={[
                          styles.savedFieldChip,
                          active && styles.savedFieldChipActive,
                        ]}
                        onPress={() => selectSavedField(field)}
                      >
                        <Text
                          style={[
                            styles.savedFieldChipTitle,
                            active && styles.savedFieldChipTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {field.name}
                        </Text>
                        <Text style={styles.savedFieldChipMeta} numberOfLines={1}>
                          {field.city || field.address || "Pista guardada"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.calendarBlock}>
              <Text style={styles.fieldLabel}>Fecha</Text>
              <Pressable
                style={styles.dateSelectorCard}
                onPress={() => setShowCreateCalendar((current) => !current)}
              >
                <View>
                  <Text style={styles.dateSelectorLabel}>Fecha elegida</Text>
                  <Text style={styles.dateSelectorValue}>{newDate}</Text>
                </View>
                <Text style={styles.dateSelectorAction}>
                  {showCreateCalendar ? "Ocultar" : "Cambiar"}
                </Text>
              </Pressable>
              {showCreateCalendar ? (
                <CalendarPicker
                  value={newDate}
                  onChange={(value) => {
                    setNewDate(value);
                    setShowCreateCalendar(false);
                  }}
                />
              ) : null}
            </View>
            <TimeWheel value={newTime} onChange={setNewTime} />
            <View style={styles.choiceBlock}>
              <Text style={styles.fieldLabel}>Jugadores por equipo</Text>
              <View style={styles.quickChipRow}>
                {["5", "7", "11"].map((players) => (
                  <QuickChip
                    key={players}
                    label={`${players} vs ${players}`}
                    active={newMaxPlayers === players}
                    onPress={() => setNewMaxPlayers(players)}
                  />
                ))}
              </View>
            </View>
            <Field
              label="Precio por persona"
              value={newPricePerPerson}
              onChangeText={setNewPricePerPerson}
              keyboardType="decimal-pad"
              placeholder="3.50"
            />
            <Pressable
              style={styles.createPreviewButton}
              onPress={openCreatePreview}
              disabled={loading}
            >
              <Text style={styles.createPreviewButtonText}>
                {editingMatchId ? "Previsualizar cambios" : "Ver vista previa"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
        <CreatePreviewModal
          visible={showCreatePreview}
          loading={loading}
          title={newTitle}
          fieldName={newFieldName}
          city={newCity}
          date={newDate}
          time={newTime}
          players={newMaxPlayers}
          pricePerPerson={newPricePerPerson}
          latitude={newLatitude}
          longitude={newLongitude}
          editing={Boolean(editingMatchId)}
          onClose={() => setShowCreatePreview(false)}
          onCreate={createMatch}
        />
        <BottomNav
          active="create"
          onHome={goHome}
          onCreate={startMatchCreate}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }

  if (appTab === "detail") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
      <ScreenBubbles />
        <ScrollView
          contentContainerStyle={[
            styles.detailContent,
            {
              paddingTop: safeInsets.top + 18,
              paddingBottom: safeInsets.bottom + 112,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Detalle</Text>
              <Text style={styles.screenTitle}>Partido</Text>
            </View>
            <Pressable
              style={styles.closePill}
              onPress={goHome}
            >
              <Text style={styles.closePillText}>Volver</Text>
            </Pressable>
          </View>

          {selectedMatch ? (
            <>
              <View style={styles.detailHeroCard}>
                <MatchImageBackground
                  match={selectedMatch}
                  style={styles.detailCover}
                  imageStyle={styles.detailCoverImage}
                >
                  <View style={styles.detailCoverOverlay} />
                  <View style={styles.detailCoverTop}>
                    <View style={styles.detailCoverTopLeft}>
                      <StatusBadge status={selectedMatch.status} />
                      {isAdmin ? (
                        <Text style={styles.adminInlinePill}>Admin</Text>
                      ) : null}
                    </View>
                    <View style={styles.detailCoverTopActions}>
                      <Text style={styles.detailCoverPill}>
                        {formatPriceFromCents(selectedMatch.pricePerPersonCents)}
                      </Text>
                      {isAdmin ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.adminFloatingEditButton,
                            pressed && styles.adminFloatingButtonPressed,
                          ]}
                          onPress={() => startMatchEdit(selectedMatch)}
                          disabled={loading}
                          accessibilityRole="button"
                          accessibilityLabel="Editar partido"
                        >
                          <PencilIcon />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.detailCoverContent}>
                    <Text style={styles.detailTitle} numberOfLines={2}>
                      {selectedMatch.title}
                    </Text>
                    <Text style={styles.detailSubtitle} numberOfLines={1}>
                      {selectedMatch.field?.name ?? "Campo por confirmar"}
                    </Text>
                  </View>
                </MatchImageBackground>

                <View style={styles.detailBody}>
                  <View style={styles.detailInfoGrid}>
                    <View style={styles.detailInfoCard}>
                      <Text style={styles.detailInfoLabel}>Fecha</Text>
                      <Text style={styles.detailInfoValue} numberOfLines={2}>
                        {formatDate(selectedMatch.startsAt)}
                      </Text>
                    </View>
                    <View style={styles.detailInfoCard}>
                      <Text style={styles.detailInfoLabel}>Formato</Text>
                      <Text style={styles.detailInfoValue}>
                        {selectedMatch.maxPlayersPerTeam} vs{" "}
                        {selectedMatch.maxPlayersPerTeam}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailLocationCard}>
                    <View style={styles.detailLocationIcon}>
                      <LocationTargetIcon />
                    </View>
                    <View style={styles.detailLocationTextWrap}>
                      <Text style={styles.detailLocationTitle} numberOfLines={1}>
                        {selectedMatch.field?.name ?? "Campo por confirmar"}
                      </Text>
                      <Text style={styles.detailLocationMeta} numberOfLines={2}>
                        {selectedMatch.field?.address ?? "Direccion pendiente"} -{" "}
                        {selectedMatch.field?.city ?? "Sin ciudad"}
                      </Text>
                      <Pressable
                        onPress={() => openPublicProfile(selectedMatch.createdBy.id)}
                      >
                        <Text style={styles.detailOrganizer} numberOfLines={1}>
                          Organiza {publicHandle(selectedMatch.createdBy)}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={styles.directionsButton}
                    onPress={() => openDirections(selectedMatch)}
                  >
                    <Text style={styles.directionsButtonText}>Como llegar</Text>
                  </Pressable>

                  {isAdmin ? (
                    <View style={styles.detailAdminInlineActions}>
                      {selectedMatch.status !== "CANCELLED" ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.adminInlineActionButton,
                            pressed && styles.inlineActionPressed,
                          ]}
                          onPress={() => cancelMatch(selectedMatch.id)}
                          disabled={loading}
                        >
                          <Text style={styles.adminInlineActionText}>Cancelar</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        style={({ pressed }) => [
                          styles.adminInlineActionButton,
                          styles.adminInlineDangerButton,
                          pressed && styles.inlineActionPressed,
                        ]}
                        onPress={() => deleteMatch(selectedMatch.id)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.adminInlineActionText,
                            styles.adminInlineDangerText,
                          ]}
                        >
                          Borrar
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeader}>
                      <Text style={styles.detailSectionTitle}>Jugadores</Text>
                      <Text style={styles.detailSectionMeta}>
                        {(selectedMatch.occupancy?.totalPlayers ?? 0)}/
                        {selectedMatch.occupancy?.totalCapacity ??
                          selectedMatch.maxPlayersPerTeam * 2}
                      </Text>
                    </View>
                    <TeamOccupancy match={selectedMatch} />
                    <TeamRoster
                      match={selectedMatch}
                      onOpenProfile={openPublicProfile}
                      canRemovePlayers={isAdmin}
                      onRemovePlayer={(userId) =>
                        removeMatchPlayer(selectedMatch.id, userId)
                      }
                    />
                  </View>

                  <View style={styles.detailActionPanel}>
                    {selectedIsParticipant && selectedMatch.status !== "CANCELLED" ? (
                      <Pressable
                        style={styles.ghostDangerButton}
                        onPress={() => leaveMatch(selectedMatch.id)}
                        disabled={loading}
                      >
                        <Text style={styles.ghostDangerText}>
                          Salir del partido
                        </Text>
                      </Pressable>
                    ) : selectedMatch.status !== "OPEN" ? (
                      <View style={styles.statusBanner}>
                        <Text style={styles.statusBannerText}>
                          {selectedMatch.status === "FULL"
                            ? "Partido completo"
                            : "Partido cancelado"}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.detailActionTitle}>
                          Elige equipo para apuntarte
                        </Text>
                        <View style={styles.cardActions}>
                          <Pressable
                            style={[
                              styles.darkJoinButton,
                              (loading ||
                                !selectedIsOpen ||
                                isTeamFull(selectedMatch, "A")) &&
                                styles.actionButtonDisabled,
                            ]}
                            onPress={() => joinMatch(selectedMatch.id, "A")}
                            disabled={
                              loading ||
                              !selectedIsOpen ||
                              isTeamFull(selectedMatch, "A")
                            }
                          >
                            <Text style={styles.darkJoinText}>
                              {isTeamFull(selectedMatch, "A")
                                ? "Completo"
                                : "Equipo A"}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.limeJoinButton,
                              (loading ||
                                !selectedIsOpen ||
                                isTeamFull(selectedMatch, "B")) &&
                                styles.actionButtonDisabled,
                            ]}
                            onPress={() => joinMatch(selectedMatch.id, "B")}
                            disabled={
                              loading ||
                              !selectedIsOpen ||
                              isTeamFull(selectedMatch, "B")
                            }
                          >
                            <Text style={styles.limeJoinText}>
                              {isTeamFull(selectedMatch, "B")
                                ? "Completo"
                                : "Equipo B"}
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    )}
                    {selectedIsOwner && !isAdmin && selectedMatch.status !== "CANCELLED" ? (
                      <Pressable
                        style={styles.cancelMatchButton}
                        onPress={() => cancelMatch(selectedMatch.id)}
                        disabled={loading}
                      >
                        <Text style={styles.cancelMatchText}>Cancelar partido</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Pressable
                    style={styles.detailChatLauncher}
                    onPress={() => {
                      setShowMatchChat(true);
                      loadMessages(selectedMatch.id).catch(() => setMessages([]));
                    }}
                  >
                    <View style={styles.detailChatIcon}>
                      <View style={styles.detailChatBubbleShape}>
                        <View style={styles.detailChatDot} />
                        <View style={styles.detailChatDot} />
                      </View>
                    </View>
                    <View style={styles.detailChatTextWrap}>
                      <Text style={styles.detailChatTitle}>Chat del partido</Text>
                      <Text style={styles.detailChatMeta}>
                        {selectedIsParticipant
                          ? messages.length > 0
                            ? `${messages.length} mensajes`
                            : "Coordina con tu equipo"
                          : "Unete al partido para escribir"}
                      </Text>
                    </View>
                    <Text style={styles.detailChatOpenText}>Abrir</Text>
                  </Pressable>
                </View>
              </View>

              <Modal
                visible={showMatchChat}
                transparent
                animationType="slide"
                onRequestClose={() => setShowMatchChat(false)}
              >
                <Pressable
                  style={styles.chatModalBackdrop}
                  onPress={() => setShowMatchChat(false)}
                >
                  <Pressable
                    style={[
                      styles.chatSheet,
                      { paddingBottom: safeInsets.bottom + 14 },
                    ]}
                    onPress={(event) => event.stopPropagation()}
                  >
                    <View style={styles.chatHandle} />
                    <View style={styles.chatHeader}>
                      <View>
                        <Text style={styles.chatEyebrow}>Partido</Text>
                        <Text style={styles.chatTitle}>Chat</Text>
                      </View>
                      <View style={styles.chatHeaderActions}>
                        <Pressable
                          style={styles.chatIconButton}
                          onPress={() => loadMessages(selectedMatch.id)}
                          disabled={loading}
                        >
                          <RefreshIcon />
                        </Pressable>
                        <Pressable
                          style={styles.chatCloseButton}
                          onPress={() => setShowMatchChat(false)}
                        >
                          <Text style={styles.chatCloseText}>Cerrar</Text>
                        </Pressable>
                      </View>
                    </View>
                    <ScrollView
                      style={styles.chatMessages}
                      contentContainerStyle={styles.chatMessagesContent}
                      keyboardShouldPersistTaps="handled"
                    >
                      {messages.length === 0 ? (
                        <View style={styles.chatEmptyCard}>
                          <Text style={styles.chatEmptyTitle}>
                            {selectedIsParticipant
                              ? "Todavia no hay mensajes"
                              : "Chat solo para jugadores"}
                          </Text>
                          <Text style={styles.chatEmptyText}>
                            {selectedIsParticipant
                              ? "Escribe el primero y coordina la llegada."
                              : "Unete a un equipo para poder escribir aqui."}
                          </Text>
                        </View>
                      ) : (
                        messages.map((message) => (
                          <View key={message.id} style={styles.messageBubble}>
                            <Pressable
                              onPress={() => openPublicProfile(message.author.id)}
                            >
                              <Text style={styles.messageAuthor}>
                                {publicHandle(message.author)}
                              </Text>
                            </Pressable>
                            <Text style={styles.messageContent}>
                              {message.content}
                            </Text>
                            <Text style={styles.messageTime}>
                              {formatTime(message.sentAt)}
                            </Text>
                          </View>
                        ))
                      )}
                    </ScrollView>
                    {selectedIsParticipant ? (
                      <View style={styles.quickMessageRow}>
                        <QuickMessageButton
                          label="Voy llegando"
                          onPress={() => sendMatchMessage("Voy llegando")}
                          disabled={loading}
                        />
                        <QuickMessageButton
                          label="Confirmo"
                          onPress={() => sendMatchMessage("Confirmo asistencia")}
                          disabled={loading}
                        />
                        <QuickMessageButton
                          label="Necesito peto"
                          onPress={() => sendMatchMessage("Necesito peto")}
                          disabled={loading}
                        />
                      </View>
                    ) : null}
                    <View style={styles.messageComposer}>
                      <TextInput
                        value={messageText}
                        onChangeText={setMessageText}
                        placeholder="Escribe al equipo"
                        placeholderTextColor="#8A8F8B"
                        style={styles.messageInput}
                        editable={selectedIsParticipant && !loading}
                      />
                      <Pressable
                        style={[
                          styles.sendButton,
                          !selectedIsParticipant && styles.sendButtonDisabled,
                        ]}
                        onPress={sendMessage}
                        disabled={!selectedIsParticipant || loading}
                      >
                        <Text style={styles.sendButtonText}>Enviar</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
              <Modal
                visible={showPublicProfile}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPublicProfile(false)}
              >
                <Pressable
                  style={styles.publicProfileBackdrop}
                  onPress={() => setShowPublicProfile(false)}
                >
                  <Pressable
                    style={styles.publicProfileCard}
                    onPress={(event) => event.stopPropagation()}
                  >
                    <View style={styles.publicProfileTop}>
                      <View style={styles.publicProfileAvatar}>
                        <Text style={styles.publicProfileAvatarText}>
                          {(publicProfile?.username ||
                            publicProfile?.fullName ||
                            publicProfile?.displayName ||
                            "J")
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.publicProfileClose}
                        onPress={() => setShowPublicProfile(false)}
                      >
                        <Text style={styles.publicProfileCloseText}>Cerrar</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.publicProfileName}>
                      {publicProfile?.fullName ||
                        publicProfile?.displayName ||
                        "Jugador Footy"}
                    </Text>
                    <Text style={styles.publicProfileHandle}>
                      {publicHandle(publicProfile ?? undefined)}
                    </Text>
                    <View style={styles.publicProfileInfoGrid}>
                      <View style={styles.publicProfileInfoCard}>
                        <Text style={styles.publicProfileInfoLabel}>Posicion</Text>
                        <Text style={styles.publicProfileInfoValue}>
                          {positionLabel(publicProfile?.preferredPosition ?? null)}
                        </Text>
                      </View>
                      <View style={styles.publicProfileInfoCard}>
                        <Text style={styles.publicProfileInfoLabel}>Ciudad</Text>
                        <Text style={styles.publicProfileInfoValue}>
                          {publicProfile?.city || "Sin ciudad"}
                        </Text>
                      </View>
                    </View>
                    {publicProfile?.bio ? (
                      <Text style={styles.publicProfileBio}>{publicProfile.bio}</Text>
                    ) : (
                      <Text style={styles.publicProfileBioMuted}>
                        Este jugador todavia no ha escrito una bio.
                      </Text>
                    )}
                  </Pressable>
                </Pressable>
              </Modal>
            </>
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No hay partido seleccionado</Text>
              <Text style={styles.emptyText}>
                Vuelve al mapa o crea uno nuevo.
              </Text>
            </View>
          )}
        </ScrollView>
        <BottomNav
          active="home"
          onHome={goHome}
          onCreate={startMatchCreate}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <View style={[styles.homeShell, { paddingTop: safeInsets.top }]}>
        <View style={styles.homeContent}>
          <View style={styles.homeHeader}>
            <View style={styles.homeHeroBanner}>
              <View style={styles.homeBannerCircleOne} />
              <View style={styles.homeBannerCircleTwo} />
              <View style={styles.homeBannerTopline}>
                <View style={styles.homeTitleBlock}>
                  <View style={styles.homeTitleRow}>
                    <AppLogoImage size={36} />
                    <Text style={styles.homeTitle}>Footy</Text>
                  </View>
                  <Text style={styles.homeSubtitle}>
                    Encuentra partidos cerca y unete al equipo.
                  </Text>
                </View>
                <View style={styles.homeStreakPill}>
                  <Text style={styles.homeStreakNumber}>{victoryStreak}</Text>
                  <Text style={styles.homeStreakText}>racha</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.homeSearchWrap}>
            <View style={styles.homeSearchPill}>
              <View style={styles.homeSearchIcon}>
                <View style={styles.homeSearchCircle} />
                <View style={styles.homeSearchHandle} />
              </View>
              <TextInput
                style={styles.homeSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar partido o ciudad"
                placeholderTextColor="rgba(227,219,208,0.62)"
              />
            </View>
          </View>

          <View style={styles.homeToolbar}>
            <View style={styles.modeSwitchDark}>
              <ModeButton
                label="Mapa"
                active={homeMode === "map"}
                onPress={() => setHomeMode("map")}
              />
              <ModeButton
                label="Lista"
                active={homeMode === "list"}
                onPress={() => setHomeMode("list")}
              />
            </View>
            <Pressable
              style={styles.refreshMiniButton}
              onPress={refreshMatches}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#E3DBD0" />
              ) : (
                <Text style={styles.refreshMiniText}>R</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.homeBody}>
            {homeMode === "map" ? (
              <MapHome
                matches={visibleMatches}
                selectedMatch={selectedMatch}
                selectedMatchId={selectedMatchId}
                searchQuery={searchQuery}
                userCity={profile?.city || profileCity || "Huelva"}
                onSelect={setSelectedMatchId}
                onClearSelection={() => setSelectedMatchId(null)}
                onOpenDetail={openDetail}
                loading={loading}
              />
            ) : (
              <ListHome
                matches={visibleMatches}
                myMatches={myMatches}
                currentUserId={currentUserId}
                selectedMatchId={selectedMatchId}
                onSelect={setSelectedMatchId}
                onOpenDetail={openDetail}
                loading={loading}
              />
            )}
          </View>
        </View>
      </View>
      <BottomNav
        active="home"
        onHome={goHome}
        onCreate={startMatchCreate}
        onProfile={() => setAppTab("profile")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authHeroBlock: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
  },
  authLogoHalo: {
    width: Platform.OS === "android" ? 78 : 88,
    height: Platform.OS === "android" ? 78 : 88,
    borderRadius: Platform.OS === "android" ? 24 : 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,243,81,0.10)",
    borderWidth: 1,
    borderColor: "rgba(179,243,81,0.18)",
    overflow: "hidden",
  },
  authLogoBubbleOne: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    right: -18,
    top: -16,
    backgroundColor: "rgba(179,243,81,0.28)",
  },
  authLogoBubbleTwo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    left: -12,
    bottom: -10,
    backgroundColor: "rgba(227,219,208,0.12)",
  },
  homeTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  authScreen: { flex: 1, backgroundColor: "#000000" },
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#E3DBD0", fontSize: 14, fontWeight: "900" },
  authContent: {
    flexGrow: 1,
    justifyContent: Platform.OS === "android" ? "flex-start" : "center",
    paddingHorizontal:
      Platform.OS === "web" ? 18 : MOBILE_EDGE_PADDING,
    paddingTop: Platform.OS === "android" ? 18 : 16,
    paddingBottom: 18,
    gap: 10,
  },
  authHeroMark: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authHeroLetter: { color: "#0A110E", fontSize: 34, fontWeight: "900" },
  authBrand: {
    color: "#E3DBD0",
    fontSize: Platform.OS === "android" ? 34 : 38,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(18,31,24,0.94)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.18)",
    padding: Platform.OS === "android" ? 12 : 14,
    gap: Platform.OS === "android" ? 9 : 10,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
  },
  authCardBubbleOne: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -58,
    top: -62,
    backgroundColor: "rgba(179,243,81,0.13)",
  },
  authCardBubbleTwo: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    left: -44,
    bottom: -38,
    backgroundColor: "rgba(227,219,208,0.05)",
  },
  modeSwitchLight: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.07)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    flexDirection: "row",
    padding: 5,
  },
  authFormHeading: { paddingTop: 0 },
  authFormTitle: { color: "#F7F1E8", fontSize: 19, fontWeight: "900" },
  modeSwitchDark: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 6,
  },
  fieldLabel: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  authErrorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    padding: 9,
    borderRadius: 13,
    backgroundColor: "rgba(146,39,39,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,128,128,0.34)",
  },
  authErrorDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF8C8C", marginTop: 4 },
  authErrorText: { flex: 1, color: "#FFD1D1", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  authButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonDisabled: { opacity: 0.72 },
  authButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
  authDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(247,241,232,0.12)",
  },
  authDividerText: {
    color: "rgba(227,219,208,0.54)",
    fontSize: 12,
    fontWeight: "900",
  },
  homeShell: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 0,
    paddingBottom: 0,
  },
  homeContent: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1180 : undefined,
    alignSelf: "center",
    paddingTop: Platform.OS === "android" ? 8 : 14,
  },
  homeHeader: {
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingTop: Platform.OS === "android" ? 6 : 0,
    paddingBottom: 8,
  },
  homeHeroBanner: {
    minHeight: Platform.OS === "web" ? 88 : 78,
    borderRadius: Platform.OS === "web" ? 24 : 19,
    backgroundColor: "rgba(7,12,9,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    overflow: "hidden",
    paddingHorizontal: Platform.OS === "web" ? 18 : 12,
    paddingVertical: Platform.OS === "web" ? 14 : 10,
    justifyContent: "center",
  },
  homeBannerCircleOne: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    right: -72,
    top: -82,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  homeBannerCircleTwo: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    left: -38,
    bottom: -48,
    backgroundColor: "rgba(227,219,208,0.07)",
  },
  homeBannerTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  homeTitleBlock: { flex: 1, minWidth: 0 },
  homeStreakPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  homeStreakNumber: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  homeStreakText: {
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    marginTop: -3,
  },
  smallLabel: {
    color: "#8FEA6A",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  homeTitle: {
    color: "#F7F1E8",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 31,
  },
  homeSubtitle: {
    color: "rgba(227,219,208,0.68)",
    fontSize: Platform.OS === "web" ? 13 : 11,
    fontWeight: "800",
    marginTop: 3,
  },
  homeMetricRow: { flexDirection: "row", gap: 8 },
  screenTitle: {
    color: "#E3DBD0",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
  },
  homeSearchWrap: {
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 8,
  },
  homeSearchPill: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    backgroundColor: "rgba(10,17,14,0.42)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  homeSearchIcon: {
    width: 24,
    height: 24,
    position: "relative",
  },
  homeSearchCircle: {
    position: "absolute",
    left: 2,
    top: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#8FEA6A",
  },
  homeSearchHandle: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#8FEA6A",
    transform: [{ rotate: "45deg" }],
  },
  homeSearchInput: {
    flex: 1,
    color: "#E3DBD0",
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 0,
  },
  homeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 10,
  },
  refreshMiniButton: {
    width: 40,
    height: 40,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.22)",
    backgroundColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshMiniText: { color: "#E3DBD0", fontSize: 18, fontWeight: "900" },
  createMiniButton: {
    width: 40,
    height: 40,
    borderRadius: 17,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  createMiniText: {
    color: "#0A110E",
    fontSize: 22,
    fontWeight: "900",
    marginTop: -2,
  },
  homeBody: {
    flex: 1,
    minHeight: 0,
    marginBottom: 0,
    borderRadius: Platform.OS === "web" ? 28 : 0,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: Platform.OS === "web" ? 1 : 0,
    borderColor: "rgba(227,219,208,0.10)",
  },
  searchPill: {
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E3DBD0",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  searchText: {
    color: "#E3DBD0",
    opacity: 0.78,
    fontSize: 14,
    fontWeight: "700",
  },
  searchInput: {
    color: "#E3DBD0",
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 0,
  },
  listFilterRow: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 5,
    gap: 6,
  },
  listStatsRow: { flexDirection: "row", gap: 12 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 2 },
  darkJoinButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "rgba(10,17,14,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  darkJoinText: { color: "#F7F1E8", fontWeight: "900" },
  limeJoinButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  limeJoinText: { color: "#0A110E", fontWeight: "900" },
  ghostDangerButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.26)",
    backgroundColor: "rgba(10,17,14,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostDangerText: { color: "#F7F1E8", fontWeight: "900" },
  cancelMatchButton: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "#D95858",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelMatchText: { color: "#FFFFFF", fontWeight: "900" },
  statusBanner: {
    minHeight: 44,
    borderRadius: 19,
    backgroundColor: "rgba(217,88,88,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D95858",
  },
  statusBannerText: { color: "#8F2727", fontWeight: "900" },
  emptyPanel: {
    backgroundColor: "rgba(156,163,175,0.10)",
    borderRadius: 18,
    padding: 10,
  },
  emptyTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#BDB6AE", fontSize: 14, marginTop: 6 },
  profileContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : MOBILE_EDGE_PADDING,
    gap: 14,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#E3DBD0", fontSize: 30, fontWeight: "700" },
  profileTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  logoutPill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 19,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#F7F1E8", fontWeight: "900" },
  profileHeroCard: {
    minHeight: 238,
    borderRadius: 26,
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.16)",
    overflow: "hidden",
    padding: 16,
    gap: 14,
  },
  profileGlowMark: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -58,
    top: -58,
    backgroundColor: "rgba(143,234,106,0.14)",
  },
  profileHeroTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  profileEyebrow: {
    color: "#8FEA6A",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  editProfileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: { color: "#E3DBD0", fontSize: 12, fontWeight: "900" },
  streakBanner: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.24)",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  streakCircleLarge: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    right: -38,
    top: -44,
    backgroundColor: "rgba(143,234,106,0.14)",
  },
  streakCircleSmall: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    left: -18,
    bottom: -28,
    backgroundColor: "rgba(179,243,81,0.08)",
  },
  streakTextBlock: { gap: 2 },
  streakLabel: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  streakSubLabel: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 10,
    fontWeight: "800",
  },
  streakNumber: { color: "#8FEA6A", fontSize: 30, fontWeight: "900" },
  profileHeroBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileIdentity: { flex: 1, gap: 5 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(143,234,106,0.10)",
  },
  avatarCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#E3DBD0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#0A110E", fontSize: 30, fontWeight: "900" },
  profileName: {
    color: "#E3DBD0",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "left",
  },
  profileHandle: { color: "rgba(227,219,208,0.62)", fontSize: 12, fontWeight: "900" },
  profileMeta: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  profileBioText: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "left",
    maxWidth: 230,
  },
  nextMatchCard: {
    borderRadius: 26,
    backgroundColor: "rgba(143,234,106,0.16)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.26)",
    padding: 16,
    gap: 8,
    overflow: "hidden",
  },
  nextMatchEyebrow: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  nextMatchTitle: { color: "#F7F1E8", fontSize: 22, fontWeight: "900" },
  nextMatchMeta: {
    color: "rgba(247,241,232,0.78)",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 17,
  },
  adminPanel: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.22)",
    borderRadius: 24,
    padding: 14,
    gap: 12,
  },
  adminPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  adminEyebrow: {
    color: "#7FEF9B",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  adminTitle: { color: "#F7F1E8", fontSize: 20, fontWeight: "900" },
  adminMiniButton: {
    minHeight: 38,
    borderRadius: 17,
    backgroundColor: "rgba(127,239,155,0.18)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.34)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adminMiniButtonText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  adminSaveButton: {
    minHeight: 48,
    borderRadius: 20,
    backgroundColor: "#7FEF9B",
    alignItems: "center",
    justifyContent: "center",
  },
  adminSaveButtonText: { color: "#07100A", fontWeight: "900" },
  adminFieldList: { gap: 8 },
  adminFieldItem: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminFieldInfo: { flex: 1 },
  adminFieldName: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  adminFieldMeta: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  adminIconButton: {
    minHeight: 34,
    borderRadius: 14,
    backgroundColor: "rgba(127,239,155,0.16)",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  adminDangerButton: { backgroundColor: "rgba(217,88,88,0.24)" },
  adminIconButtonText: { color: "#F7F1E8", fontSize: 10, fontWeight: "900" },
  profileEditor: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    borderRadius: 24,
    padding: 14,
    gap: 14,
  },
  positionGrid: { flexDirection: "row", gap: 8 },
  profileStats: { flexDirection: "row", gap: 8 },
  profileSection: { gap: 12 },
  profileSectionTitle: { color: "#E3DBD0", fontSize: 17, fontWeight: "900" },
  profileEmpty: { color: "#9CA3AF", fontSize: 14 },
  createContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : MOBILE_EDGE_PADDING,
    gap: 16,
  },
  locationScreen: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 920 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : MOBILE_EDGE_PADDING,
    gap: 16,
  },
  locationPickerShell: {
    flex: 1,
    minHeight: 360,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.12)",
  },
  locationSummaryCard: {
    borderRadius: 18,
    backgroundColor: "#E3DBD0",
    padding: 16,
    gap: 10,
  },
  locationSummaryTitle: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  locationSummaryText: { color: "#4A4A4A", fontSize: 13, fontWeight: "800" },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closePill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.12)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  editClosePill: {
    backgroundColor: "rgba(143,234,106,0.13)",
    borderColor: "rgba(143,234,106,0.30)",
  },
  closePillPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
  editModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.24)",
    padding: 12,
  },
  editModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(7,16,10,0.72)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  editModeTextWrap: { flex: 1, minWidth: 0, gap: 3 },
  editModeTitle: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  editModeMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 12,
    fontWeight: "800",
  },
  createCard: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderRadius: 24,
    padding: 12,
    gap: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.14)",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  createCardBubbleOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -62,
    top: -70,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  createCardBubbleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -44,
    bottom: -40,
    backgroundColor: "rgba(227,219,208,0.08)",
  },
  locationCreateCard: {
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationCreateTitle: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  locationCreateMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  locationPickButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7F1E8",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  savedFieldBlock: { gap: 8 },
  savedFieldScroller: { gap: 8, paddingRight: 4 },
  savedFieldChip: {
    width: 150,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 10,
    justifyContent: "center",
  },
  savedFieldChipActive: {
    backgroundColor: "rgba(127,239,155,0.18)",
    borderColor: "rgba(127,239,155,0.42)",
  },
  savedFieldChipTitle: {
    color: "#E3DBD0",
    fontSize: 13,
    fontWeight: "900",
  },
  savedFieldChipTitleActive: { color: "#F7F1E8" },
  savedFieldChipMeta: {
    color: "rgba(227,219,208,0.62)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },
  formRow: { flexDirection: "row", gap: 10 },
  formHalf: { flex: 1 },
  calendarBlock: { gap: 7 },
  dateSelectorCard: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateSelectorLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dateSelectorValue: {
    color: "#F7F1E8",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  dateSelectorAction: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#8FEA6A",
    color: "#0A110E",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  choiceBlock: { gap: 7 },
  quickChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  createPreviewButton: {
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  createPreviewButtonText: {
    color: "#0A110E",
    fontSize: 16,
    fontWeight: "900",
  },
  detailContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 820 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : MOBILE_EDGE_PADDING,
    gap: 16,
  },
  detailHeroCard: {
    backgroundColor: "rgba(7,12,9,0.94)",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  detailCover: {
    minHeight: 238,
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#0A110E",
  },
  detailCoverImage: { opacity: 0.76 },
  detailCoverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(5,10,7,0.34)",
  },
  detailCoverTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  detailCoverTopLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailCoverTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailCoverPill: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(143,234,106,0.92)",
    color: "#0A110E",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  adminInlinePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(7,16,10,0.72)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.34)",
    color: "#8FEA6A",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 7,
    textTransform: "uppercase",
  },
  adminFloatingEditButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(7,16,10,0.78)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.24)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  adminFloatingButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  detailCoverContent: { gap: 7 },
  detailTitle: {
    color: "#F7F1E8",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  detailSubtitle: {
    color: "rgba(247,241,232,0.84)",
    fontSize: 14,
    fontWeight: "800",
  },
  detailBody: { padding: 12, gap: 12 },
  detailInfoGrid: { flexDirection: "row", gap: 10 },
  detailInfoCard: {
    flex: 1,
    minHeight: 74,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    justifyContent: "center",
    gap: 5,
  },
  detailInfoLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailInfoValue: {
    color: "#F7F1E8",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  detailLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.18)",
    padding: 12,
  },
  detailLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(7,16,10,0.92)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLocationTextWrap: { flex: 1, gap: 3 },
  detailLocationTitle: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  detailLocationMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  detailOrganizer: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  detailSection: {
    borderRadius: 24,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    gap: 10,
  },
  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailSectionTitle: { color: "#F7F1E8", fontSize: 18, fontWeight: "900" },
  detailSectionMeta: {
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "rgba(143,234,106,0.18)",
    color: "#8FEA6A",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  detailActionPanel: {
    borderRadius: 24,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    gap: 10,
  },
  detailAdminInlineActions: {
    flexDirection: "row",
    gap: 8,
  },
  adminInlineActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 17,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  adminInlineDangerButton: {
    backgroundColor: "rgba(217,88,88,0.22)",
    borderColor: "rgba(217,88,88,0.40)",
  },
  inlineActionPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  adminInlineActionText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  adminInlineDangerText: { color: "#FFD1D1" },
  detailActionTitle: {
    color: "rgba(247,241,232,0.78)",
    fontSize: 13,
    fontWeight: "900",
  },
  directionsButton: {
    minHeight: 46,
    borderRadius: 20,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  directionsButtonText: { color: "#0A110E", fontSize: 13, fontWeight: "900" },
  actionButtonDisabled: { opacity: 0.46 },
  publicProfileBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: MOBILE_EDGE_PADDING,
  },
  publicProfileCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    backgroundColor: "#07100A",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 18,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.30,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  publicProfileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  publicProfileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  publicProfileAvatarText: { color: "#0A110E", fontSize: 28, fontWeight: "900" },
  publicProfileClose: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  publicProfileCloseText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  publicProfileName: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  publicProfileHandle: { color: "#8FEA6A", fontSize: 14, fontWeight: "900" },
  publicProfileInfoGrid: { flexDirection: "row", gap: 10 },
  publicProfileInfoCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    gap: 4,
  },
  publicProfileInfoLabel: {
    color: "rgba(247,241,232,0.52)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  publicProfileInfoValue: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  publicProfileBio: {
    color: "rgba(247,241,232,0.76)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  publicProfileBioMuted: {
    color: "rgba(247,241,232,0.46)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  detailChatLauncher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
    borderRadius: 24,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.22)",
    paddingHorizontal: 12,
  },
  detailChatIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  detailChatBubbleShape: {
    width: 24,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0A110E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  detailChatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8FEA6A",
  },
  detailChatTextWrap: { flex: 1, gap: 3 },
  detailChatTitle: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  detailChatMeta: {
    color: "rgba(247,241,232,0.64)",
    fontSize: 12,
    fontWeight: "800",
  },
  detailChatOpenText: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  chatModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.56)",
    justifyContent: "flex-end",
  },
  chatSheet: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 640 : undefined,
    maxHeight: "82%",
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#07100A",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 16,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -12 },
  },
  chatHandle: {
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(247,241,232,0.18)",
    alignSelf: "center",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chatEyebrow: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  chatTitle: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  chatHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: "rgba(127,239,155,0.14)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCloseButton: {
    minHeight: 38,
    borderRadius: 18,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chatCloseText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  chatMessages: { maxHeight: Platform.OS === "web" ? 420 : 360 },
  chatMessagesContent: { gap: 10, paddingVertical: 4 },
  chatEmptyCard: {
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 16,
    gap: 6,
  },
  chatEmptyTitle: { color: "#F7F1E8", fontSize: 18, fontWeight: "900" },
  chatEmptyText: {
    color: "rgba(247,241,232,0.66)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  messageBubble: {
    backgroundColor: "rgba(247,241,232,0.10)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    padding: 12,
    gap: 5,
  },
  messageAuthor: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  messageContent: { color: "#F7F1E8", fontSize: 15, lineHeight: 21 },
  messageTime: { color: "rgba(247,241,232,0.46)", fontSize: 11, fontWeight: "700" },
  quickMessageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  messageComposer: { flexDirection: "row", gap: 10, alignItems: "center" },
  messageInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 12,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    color: "#F7F1E8",
    fontSize: 14,
  },
  sendButton: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 25,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: "#0A110E", fontWeight: "900" },
});
