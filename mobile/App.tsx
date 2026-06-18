import { StatusBar } from "expo-status-bar";
import {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type AuthMode = "login" | "register";
type HomeMode = "map" | "list";
type MatchFilter = "all" | "mine";
type AppTab = "home" | "create" | "detail" | "profile" | "location";
type TeamSide = "A" | "B";
type PlayerPosition = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";
type MapLocation = { latitude: number; longitude: number };
type MapPoint = { x: number; y: number };
type MapTile = { key: string; x: number; y: number; uri: string };
type GeocodeResult = { lat: string; lon: string; display_name: string };

type AuthResponse = {
  accessToken: string;
  expiresAt?: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

type StoredSession = {
  accessToken: string;
  expiresAt?: string;
  user: AuthResponse["user"];
};

type MatchPlayerResponse = {
  participationId: string;
  userId: string;
  displayName: string;
  teamSide: TeamSide;
  joinedAt: string;
};

type MatchResponse = {
  id: string;
  title: string;
  startsAt: string;
  maxPlayersPerTeam: number;
  status: string;
  createdBy: {
    id: string;
    displayName: string;
  };
  field: null | {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  occupancy: {
    teamAPlayers: number;
    teamBPlayers: number;
    maxPlayersPerTeam: number;
    totalPlayers: number;
    totalCapacity: number;
    remainingTeamA: number;
    remainingTeamB: number;
  };
  teams?: {
    teamA: MatchPlayerResponse[];
    teamB: MatchPlayerResponse[];
  };
};
type MessageResponse = {
  id: string;
  matchId: string;
  author: {
    id: string;
    displayName: string;
  };
  content: string;
  sentAt: string;
};

type PlayerProfileResponse = {
  id: string | null;
  displayName: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  preferredPosition: PlayerPosition | null;
  city: string | null;
};
const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:8080",
  default: "http://localhost:8080",
});

const SESSION_STORAGE_KEY = "footy.session.v1";

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getBrowserStorage() {
  return (globalThis as { localStorage?: BrowserStorage }).localStorage;
}

const sessionStorageAdapter = {
  get() {
    try {
      return getBrowserStorage()?.getItem(SESSION_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  },
  set(session: StoredSession) {
    try {
      getBrowserStorage()?.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
    } catch {
      // Native persistence will be added with AsyncStorage when building device auth.
    }
  },
  clear() {
    try {
      getBrowserStorage()?.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  },
};

const markerPositions = [
  { left: 20, top: 33 },
  { left: 74, top: 26 },
  { left: 36, top: 58 },
  { left: 78, top: 78 },
  { left: 50, top: 45 },
  { left: 17, top: 72 },
  { left: 63, top: 63 },
  { left: 86, top: 48 },
] as const;

const FOOTY_MAP_WIDTH = 6000;
const FOOTY_MAP_HEIGHT = 6000;
const FOOTY_MAP_PADDING = 120;
const MARKER_SIZE = 64;
const MAP_TILE_SIZE = 256;
const MAP_DEFAULT_ZOOM = 13;
const MAP_MIN_ZOOM = 11;
const MAP_MAX_ZOOM = 17;
const DEFAULT_MAP_CENTER = { latitude: 37.26142, longitude: -6.94472 };

function tomorrowDateParts() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [homeMode, setHomeMode] = useState<HomeMode>("map");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [appTab, setAppTab] = useState<AppTab>("home");
  const [displayName, setDisplayName] = useState("Jugador Footy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123");
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myMatches, setMyMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [notice, setNotice] = useState("Conectado a localhost:8080");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [profileFullName, setProfileFullName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profilePosition, setProfilePosition] =
    useState<PlayerPosition>("MIDFIELDER");

  const [newTitle, setNewTitle] = useState("Partido Footy");
  const [newFieldName, setNewFieldName] = useState("Campo Municipal Saladillo");
  const [newAddress, setNewAddress] = useState(
    "Calle Hermanos Alvarez Quintero 13",
  );
  const [newCity, setNewCity] = useState("Huelva");
  const [newDate, setNewDate] = useState(tomorrowDateParts());
  const [newTime, setNewTime] = useState("19:00");
  const [newMaxPlayers, setNewMaxPlayers] = useState("5");
  const [newLatitude, setNewLatitude] = useState(37.26142);
  const [newLongitude, setNewLongitude] = useState(-6.94472);

  const isLoggedIn = Boolean(token);
  const visibleMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return matches;
    }

    return matches.filter((match) => {
      const field = match.field;
      return [match.title, field?.name, field?.city, field?.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [matches, searchQuery]);

  const selectedMatch = selectedMatchId
    ? (matches.find((match) => match.id === selectedMatchId) ?? null)
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
  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options.headers ?? {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401 && token) {
          sessionStorageAdapter.clear();
          setToken(null);
          setUserName(null);
          setCurrentUserId(null);
          setMyMatches([]);
          setMessages([]);
          setProfile(null);
          setNotice("Sesion caducada, vuelve a entrar");
          throw new Error("Sesion caducada, vuelve a entrar");
        }

        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [authHeaders, token],
  );

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
    const storedSession = sessionStorageAdapter.get();
    if (!storedSession) {
      setRestoringSession(false);
      return;
    }

    try {
      const session = JSON.parse(storedSession) as StoredSession;
      if (
        session.expiresAt &&
        new Date(session.expiresAt).getTime() <= Date.now()
      ) {
        sessionStorageAdapter.clear();
        setNotice("Sesion caducada");
      } else {
        setToken(session.accessToken);
        setUserName(session.user.displayName);
        setCurrentUserId(session.user.id);
        setEmail(session.user.email);
        setNotice(`Sesion restaurada como ${session.user.displayName}`);
      }
    } catch {
      sessionStorageAdapter.clear();
      setNotice("Sesion local reiniciada");
    } finally {
      setRestoringSession(false);
    }
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
    if (!token || restoringSession) {
      return;
    }

    loadProfile().catch(() => setNotice("No se pudo cargar el perfil"));
  }, [token, restoringSession]);

  function applyProfile(nextProfile: PlayerProfileResponse) {
    setProfile(nextProfile);
    setProfileFullName(nextProfile.fullName ?? nextProfile.displayName ?? "");
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

  async function submitAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Introduce email y password.");
      return;
    }

    setLoading(true);
    try {
      const path =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        authMode === "login"
          ? { email, password }
          : { email, password, displayName };
      const auth = await request<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setToken(auth.accessToken);
      setUserName(auth.user.displayName);
      setCurrentUserId(auth.user.id);
      setEmail(auth.user.email);
      sessionStorageAdapter.set({
        accessToken: auth.accessToken,
        expiresAt: auth.expiresAt,
        user: auth.user,
      });
      setNotice(`Sesion iniciada como ${auth.user.displayName}`);
      setAppTab("home");
      setHomeMode("map");

      const nextHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      };
      const [available, mine] = await Promise.all([
        fetch(`${API_BASE_URL}/api/matches`).then(
          (response) => response.json() as Promise<MatchResponse[]>,
        ),
        fetch(`${API_BASE_URL}/api/matches/me`, { headers: nextHeaders }).then(
          (response) => response.json() as Promise<MatchResponse[]>,
        ),
      ]);
      setMatches(available);
      setMyMatches(mine);
      setSelectedMatchId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      setNotice(message);
      Alert.alert("No se pudo entrar", message);
    } finally {
      setLoading(false);
    }
  }

  async function createMatch() {
    if (
      !newTitle.trim() ||
      !newFieldName.trim() ||
      !newDate.trim() ||
      !newTime.trim()
    ) {
      Alert.alert("Faltan datos", "Completa titulo, campo, fecha y hora.");
      return;
    }

    const maxPlayers = Number(newMaxPlayers);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 11) {
      Alert.alert(
        "Revisa plazas",
        "El maximo por equipo debe estar entre 1 y 11.",
      );
      return;
    }

    setLoading(true);
    try {
      const created = await request<MatchResponse>("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          startsAt: new Date(`${newDate}T${newTime}:00`).toISOString(),
          maxPlayersPerTeam: maxPlayers,
          field: {
            name: newFieldName.trim(),
            address: newAddress.trim() || null,
            city: newCity.trim() || null,
            latitude: newLatitude,
            longitude: newLongitude,
          },
        }),
      });
      await loadMatches();
      setSelectedMatchId(created.id);
      setNotice("Partido creado");
      setAppTab("detail");
    } catch (error) {
      Alert.alert(
        "No se pudo crear",
        error instanceof Error ? error.message : "Error inesperado",
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

  async function sendMessage() {
    if (!selectedMatch || !messageText.trim()) {
      return;
    }

    setLoading(true);
    try {
      await request(`/api/matches/${selectedMatch.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: messageText.trim() }),
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

  function openDetail(matchId: string) {
    setSelectedMatchId(matchId);
    setAppTab("detail");
  }

  function logout() {
    sessionStorageAdapter.clear();
    setToken(null);
    setUserName(null);
    setCurrentUserId(null);
    setMyMatches([]);
    setMessages([]);
    setProfile(null);
    setSelectedMatchId(null);
    setNotice("Sesion cerrada");
  }

  if (restoringSession) {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#B3F351" />
          <Text style={styles.loadingText}>Cargando sesion</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeroMark}>
            <Text style={styles.authHeroLetter}>F</Text>
          </View>
          <Text style={styles.authBrand}>Footy</Text>
          <Text style={styles.authCopy}>
            Encuentra partidos cerca, unete a un equipo y organiza tu semana de
            futbol.
          </Text>

          <View style={styles.authCard}>
            <View style={styles.modeSwitchLight}>
              <ModeButton
                label="Entrar"
                active={authMode === "login"}
                onPress={() => setAuthMode("login")}
              />
              <ModeButton
                label="Registro"
                active={authMode === "register"}
                onPress={() => setAuthMode("register")}
              />
            </View>
            {authMode === "register" ? (
              <Field
                label="Nombre"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tu nombre visible"
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@footy.local"
              keyboardType="email-address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
            <Pressable
              style={styles.authButton}
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
            <Text style={styles.authNotice}>{notice}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (appTab === "profile") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.profileContent}>
          <TopStatus />
          <View style={styles.profileHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => setAppTab("home")}
            >
              <Text style={styles.backButtonText}>{"<"}</Text>
            </Pressable>
            <Text style={styles.profileTitle}>Perfil</Text>
            <Pressable style={styles.logoutPill} onPress={logout}>
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>

          <View style={styles.profileHero}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCore}>
                <Text style={styles.avatarInitial}>
                  {(profile?.fullName || userName || "F")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.profileName}>
              {profile?.fullName || userName}
            </Text>
            <Text style={styles.profileMeta}>
              {profile?.city
                ? `${profile.city} - ${positionLabel(profile.preferredPosition)}`
                : email || "Jugador Footy"}
            </Text>
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

          <View style={styles.profileEditor}>
            <Text style={styles.profileSectionTitle}>Datos de jugador</Text>
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
              placeholder="Madrid"
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
                <Text style={styles.authButtonText}>Guardar perfil</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.profileStats}>
            <ProfileStat value={myMatches.length} label="Partidos" />
            <ProfileStat value="5" label="Nivel" />
            <ProfileStat value="84%" label="Asistencia" />
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
          onHome={() => setAppTab("home")}
          onCreate={() => setAppTab("create")}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }

  if (appTab === "location") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <View style={styles.locationScreen}>
          <TopStatus />
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
        <ScrollView
          contentContainerStyle={styles.createContent}
          keyboardShouldPersistTaps="handled"
        >
          <TopStatus />
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Nuevo partido</Text>
              <Text style={styles.screenTitle}>Crear</Text>
            </View>
            <Pressable
              style={styles.closePill}
              onPress={() => setAppTab("home")}
            >
              <Text style={styles.closePillText}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={styles.createCard}>
            <Field
              label="Titulo"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Partido Footy"
            />
            <Field
              label="Campo"
              value={newFieldName}
              onChangeText={setNewFieldName}
              placeholder="Nombre del campo"
            />
            <View style={styles.locationCreateCard}>
              <View>
                <Text style={styles.locationCreateTitle}>Ubicacion</Text>
                <Text style={styles.locationCreateMeta}>
                  {newLatitude.toFixed(5)}, {newLongitude.toFixed(5)}
                </Text>
              </View>
              <Pressable
                style={styles.locationPickButton}
                onPress={() => setAppTab("location")}
              >
                <Text style={styles.locationPickText}>Elegir en mapa</Text>
              </Pressable>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Field
                  label="Fecha"
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.formHalf}>
                <Field
                  label="Hora"
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="HH:mm"
                />
              </View>
            </View>
            <Field
              label="Jugadores por equipo"
              value={newMaxPlayers}
              onChangeText={setNewMaxPlayers}
              keyboardType="number-pad"
              placeholder="5"
            />
            <Pressable
              style={styles.authButton}
              onPress={createMatch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A110E" />
              ) : (
                <Text style={styles.authButtonText}>Crear partido</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
        <BottomNav
          active="create"
          onHome={() => setAppTab("home")}
          onCreate={() => setAppTab("create")}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }

  if (appTab === "detail") {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.detailContent}
          keyboardShouldPersistTaps="handled"
        >
          <TopStatus />
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Detalle</Text>
              <Text style={styles.screenTitle}>Partido</Text>
            </View>
            <Pressable
              style={styles.closePill}
              onPress={() => setAppTab("home")}
            >
              <Text style={styles.closePillText}>Volver</Text>
            </Pressable>
          </View>

          {selectedMatch ? (
            <>
              <View style={styles.detailHeroCard}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.detailTitle}>{selectedMatch.title}</Text>
                  <StatusBadge status={selectedMatch.status} />
                </View>
                <Text style={styles.detailMeta}>
                  {formatDate(selectedMatch.startsAt)}
                </Text>
                <Text style={styles.detailMeta}>
                  {selectedMatch.field?.name ?? "Campo por confirmar"} -{" "}
                  {selectedMatch.field?.city ?? "Sin ciudad"}
                </Text>
                <Text style={styles.detailMeta}>
                  Organiza {selectedMatch.createdBy.displayName} -{" "}
                  {selectedMatch.maxPlayersPerTeam} por equipo
                </Text>
                <TeamOccupancy match={selectedMatch} />
                <TeamRoster match={selectedMatch} />
                {selectedMatch.status !== "OPEN" ? (
                  <View style={styles.statusBanner}>
                    <Text style={styles.statusBannerText}>
                      Partido cancelado
                    </Text>
                  </View>
                ) : selectedIsParticipant ? (
                  <Pressable
                    style={styles.ghostDangerButton}
                    onPress={() => leaveMatch(selectedMatch.id)}
                    disabled={loading}
                  >
                    <Text style={styles.ghostDangerText}>
                      Salir del partido
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.darkJoinButton}
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
                      style={styles.limeJoinButton}
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
                )}
                {selectedIsOwner && selectedIsOpen ? (
                  <Pressable
                    style={styles.cancelMatchButton}
                    onPress={() => cancelMatch(selectedMatch.id)}
                    disabled={loading}
                  >
                    <Text style={styles.cancelMatchText}>Cancelar partido</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.chatPanel}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>Chat</Text>
                  <Pressable
                    onPress={() => loadMessages(selectedMatch.id)}
                    disabled={loading}
                  >
                    <Text style={styles.refreshText}>Actualizar</Text>
                  </Pressable>
                </View>
                {messages.length === 0 ? (
                  <Text style={styles.profileEmpty}>
                    {selectedIsParticipant
                      ? "Todavia no hay mensajes."
                      : "Unete al partido para escribir en el chat."}
                  </Text>
                ) : (
                  messages.map((message) => (
                    <View key={message.id} style={styles.messageBubble}>
                      <Text style={styles.messageAuthor}>
                        {message.author.displayName}
                      </Text>
                      <Text style={styles.messageContent}>
                        {message.content}
                      </Text>
                      <Text style={styles.messageTime}>
                        {formatTime(message.sentAt)}
                      </Text>
                    </View>
                  ))
                )}
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
              </View>
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
          onHome={() => setAppTab("home")}
          onCreate={() => setAppTab("create")}
          onProfile={() => setAppTab("profile")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <View style={styles.homeShell}>
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.smallLabel}>Encuentra partido</Text>
            <Text style={styles.homeTitle}>Footy</Text>
            <Text style={styles.homeSubtitle}>
              {visibleMatches.length} partidos disponibles
            </Text>
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
            onJoin={joinMatch}
            loading={loading}
          />
        ) : (
          <ListHome
            matches={visibleMatches}
            myMatches={myMatches}
            currentUserId={currentUserId}
            matchFilter={matchFilter}
            searchQuery={searchQuery}
            onFilterChange={setMatchFilter}
            selectedMatchId={selectedMatchId}
            onSelect={setSelectedMatchId}
            onOpenDetail={openDetail}
            onJoin={joinMatch}
            onLeave={leaveMatch}
            loading={loading}
          />
        )}
      </View>
      <BottomNav
        active="home"
        onHome={() => setAppTab("home")}
        onCreate={() => setAppTab("create")}
        onProfile={() => setAppTab("profile")}
      />
    </SafeAreaView>
  );
}

function TopStatus() {
  return (
    <View style={styles.statusBarMock}>
      <Text style={styles.statusTime}>18:49</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signalIcon} />
        <View style={styles.wifiIcon} />
        <View style={styles.batteryIcon} />
      </View>
    </View>
  );
}

function getCityMapCenter(city: string | null | undefined): MapLocation {
  const normalized = (city ?? "").trim().toLowerCase();
  if (normalized.includes("huelva")) {
    return { latitude: 37.26142, longitude: -6.94472 };
  }
  if (normalized.includes("madrid")) {
    return { latitude: 40.416775, longitude: -3.70379 };
  }
  return DEFAULT_MAP_CENTER;
}

async function geocodePlace(query: string, city?: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return null;
  }

  const scopedQuery = city?.trim()
    ? `${normalizedQuery}, ${city.trim()}, Espana`
    : `${normalizedQuery}, Espana`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(scopedQuery)}`,
  );
  if (!response.ok) {
    throw new Error("No se pudo buscar la direccion");
  }

  const results = (await response.json()) as GeocodeResult[];
  const first = results[0];
  if (!first) {
    return null;
  }

  return {
    location: {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    },
    address: first.display_name,
  };
}
function getMatchLocation(match: MatchResponse) {
  const latitude = match.field?.latitude;
  const longitude = match.field?.longitude;
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude };
  }
  return null;
}

function getMapCenter(
  matches: MatchResponse[],
  userLocation: MapLocation | null,
): MapLocation {
  if (userLocation) {
    return userLocation;
  }

  const locations = matches
    .map(getMatchLocation)
    .filter(Boolean) as MapLocation[];
  if (locations.length === 0) {
    return DEFAULT_MAP_CENTER;
  }

  return {
    latitude:
      locations.reduce((sum, location) => sum + location.latitude, 0) /
      locations.length,
    longitude:
      locations.reduce((sum, location) => sum + location.longitude, 0) /
      locations.length,
  };
}

function latLonToWorld(location: MapLocation, zoom: number) {
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((location.latitude * Math.PI) / 180);
  return {
    x: ((location.longitude + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function worldToLatLon(point: MapPoint, zoom: number): MapLocation {
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const longitude = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const latitude =
    (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

function getVisibleTiles(
  center: MapLocation,
  zoom: number,
  width: number,
  height: number,
) {
  const centerWorld = latLonToWorld(center, zoom);
  const topLeft = {
    x: centerWorld.x - width / 2,
    y: centerWorld.y - height / 2,
  };
  const startX = Math.floor(topLeft.x / MAP_TILE_SIZE);
  const endX = Math.ceil((topLeft.x + width) / MAP_TILE_SIZE);
  const startY = Math.floor(topLeft.y / MAP_TILE_SIZE);
  const endY = Math.ceil((topLeft.y + height) / MAP_TILE_SIZE);
  const maxTile = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) {
        continue;
      }
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        key: `${zoom}-${wrappedX}-${y}`,
        x: x * MAP_TILE_SIZE - topLeft.x,
        y: y * MAP_TILE_SIZE - topLeft.y,
        uri: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
      });
    }
  }

  return { tiles, topLeft, width, height };
}

function projectLocation(
  location: MapLocation,
  topLeft: MapPoint,
  zoom: number,
) {
  const world = latLonToWorld(location, zoom);
  return {
    left: world.x - topLeft.x,
    top: world.y - topLeft.y,
  };
}

function getFallbackMapPoint(index: number, width: number, height: number) {
  const fallback = markerPositions[index % markerPositions.length];
  return {
    left: (fallback.left / 100) * width,
    top: (fallback.top / 100) * height,
  };
}

function MapHome({
  matches,
  selectedMatch,
  selectedMatchId,
  searchQuery,
  userCity,
  onSelect,
  onClearSelection,
  onOpenDetail,
  onJoin,
  loading,
}: {
  matches: MatchResponse[];
  selectedMatch: MatchResponse | null;
  selectedMatchId: string | null;
  searchQuery: string;
  userCity: string;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  loading: boolean;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MAP_DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const suggestedCenter = useMemo(
    () => getMapCenter(matches, userLocation),
    [matches, userLocation],
  );
  const [mapCenter, setMapCenter] = useState<MapLocation>(suggestedCenter);
  const initializedCenter = useRef(false);
  const previousSearchQuery = useRef(searchQuery);
  const panStart = useRef(dragOffset);
  const movedDuringGesture = useRef(false);
  const latestDragOffset = useRef(dragOffset);

  useEffect(() => {
    if (!initializedCenter.current || userLocation) {
      setMapCenter(userLocation ?? getCityMapCenter(userCity));
      initializedCenter.current = true;
    }
  }, [userCity, userLocation]);

  useEffect(() => {
    const selectedLocation = selectedMatch
      ? getMatchLocation(selectedMatch)
      : null;
    if (selectedLocation) {
      setMapCenter(selectedLocation);
      setDragOffset({ x: 0, y: 0 });
      previousSearchQuery.current = searchQuery;
      return;
    }

    const currentQuery = searchQuery.trim();
    const previousQuery = previousSearchQuery.current.trim();
    if (currentQuery && matches.length > 0) {
      setMapCenter(getMapCenter(matches, null));
      setDragOffset({ x: 0, y: 0 });
    } else if (!currentQuery && previousQuery) {
      setMapCenter(getCityMapCenter(userCity));
      setDragOffset({ x: 0, y: 0 });
    }
    previousSearchQuery.current = searchQuery;
  }, [matches, searchQuery, selectedMatch, userCity]);

  useEffect(() => {
    latestDragOffset.current = dragOffset;
  }, [dragOffset]);

  const canvasWidth = Math.max(viewport.width + 768, 1200);
  const canvasHeight = Math.max(viewport.height + 768, 1200);
  const canvasLeft = (viewport.width - canvasWidth) / 2;
  const canvasTop = (viewport.height - canvasHeight) / 2;
  const mapData = useMemo(
    () => getVisibleTiles(mapCenter, zoom, canvasWidth, canvasHeight),
    [canvasHeight, canvasWidth, mapCenter, zoom],
  );
  const markerCoordinates = useMemo(
    () =>
      matches.map((match, index) => {
        const location = getMatchLocation(match);
        return location
          ? projectLocation(location, mapData.topLeft, zoom)
          : getFallbackMapPoint(index, canvasWidth, canvasHeight);
      }),
    [canvasHeight, canvasWidth, mapData.topLeft, matches, zoom],
  );

  function commitDrag(nextOffset: { x: number; y: number }) {
    if (nextOffset.x === 0 && nextOffset.y === 0) {
      return;
    }
    const centerWorld = latLonToWorld(mapCenter, zoom);
    setMapCenter(
      worldToLatLon(
        {
          x: centerWorld.x - nextOffset.x,
          y: centerWorld.y - nextOffset.y,
        },
        zoom,
      ),
    );
    setDragOffset({ x: 0, y: 0 });
  }

  function selectNearestMarker(locationX: number, locationY: number) {
    const point = {
      x: locationX - canvasLeft - latestDragOffset.current.x,
      y: locationY - canvasTop - latestDragOffset.current.y,
    };
    const hitIndex = markerCoordinates.findIndex((coordinate) => {
      const dx = coordinate.left - point.x;
      const dy = coordinate.top - point.y;
      return Math.sqrt(dx * dx + dy * dy) <= 42;
    });

    if (hitIndex >= 0) {
      onSelect(matches[hitIndex].id);
      return;
    }

    onClearSelection();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          movedDuringGesture.current = false;
          panStart.current = latestDragOffset.current;
        },
        onPanResponderMove: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2) {
            movedDuringGesture.current = true;
          }
          setDragOffset({
            x: panStart.current.x + gesture.dx,
            y: panStart.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (event) => {
          if (movedDuringGesture.current) {
            commitDrag(latestDragOffset.current);
            return;
          }
          selectNearestMarker(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
        },
      }),
    [canvasLeft, canvasTop, mapCenter, markerCoordinates, matches, zoom],
  );

  function zoomIn() {
    setZoom((current) => Math.min(MAP_MAX_ZOOM, current + 1));
    setDragOffset({ x: 0, y: 0 });
  }

  function zoomOut() {
    setZoom((current) => Math.max(MAP_MIN_ZOOM, current - 1));
    setDragOffset({ x: 0, y: 0 });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      Alert.alert(
        "Ubicacion no disponible",
        "Este navegador no expone geolocalizacion.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setDragOffset({ x: 0, y: 0 });
      },
      () => {
        Alert.alert(
          "No se pudo usar tu ubicacion",
          "Revisa permisos de ubicacion del navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <View
      style={styles.mapStage}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <View
          style={[
            styles.mapCanvas,
            {
              left: canvasLeft,
              top: canvasTop,
              width: canvasWidth,
              height: canvasHeight,
              transform: [
                { translateX: dragOffset.x },
                { translateY: dragOffset.y },
              ],
            },
          ]}
        >
          {mapData.tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.uri }}
              style={[
                styles.mapTile,
                {
                  left: tile.x,
                  top: tile.y,
                  width: MAP_TILE_SIZE,
                  height: MAP_TILE_SIZE,
                },
              ]}
            />
          ))}
          <View pointerEvents="none" style={styles.mapOverlay} />
          {matches.map((match, index) => {
            const coordinate = markerCoordinates[index];
            const active = match.id === selectedMatchId;
            return (
              <View
                key={match.id}
                pointerEvents="none"
                style={[
                  styles.mapMarkerWrap,
                  {
                    left: coordinate.left - MARKER_SIZE / 2,
                    top: coordinate.top - MARKER_SIZE / 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.mapMarkerHalo,
                    active && styles.mapMarkerHaloActive,
                  ]}
                />
                <View
                  style={[styles.mapMarker, active && styles.mapMarkerActive]}
                />
              </View>
            );
          })}
          {userLocation ? (
            <View
              pointerEvents="none"
              style={[
                styles.userLocationMarker,
                {
                  left:
                    projectLocation(userLocation, mapData.topLeft, zoom).left -
                    11,
                  top:
                    projectLocation(userLocation, mapData.topLeft, zoom).top -
                    11,
                },
              ]}
            />
          ) : null}
        </View>
      </View>
      <Pressable style={styles.mapLocationButton} onPress={useMyLocation}>
        <Text style={styles.mapLocationText}>Mi ubicacion</Text>
      </Pressable>
      <View style={styles.mapZoomControls}>
        <Pressable style={styles.mapZoomButton} onPress={zoomIn}>
          <Text style={styles.mapZoomText}>+</Text>
        </Pressable>
        <Pressable style={styles.mapZoomButton} onPress={zoomOut}>
          <Text style={styles.mapZoomText}>-</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.mapLoadingPill}>
          <ActivityIndicator color="#0A110E" />
          <Text style={styles.mapLoadingText}>Actualizando</Text>
        </View>
      ) : null}
      {selectedMatch ? (
        <SelectedPopup
          match={selectedMatch}
          onOpenDetail={onOpenDetail}
          onJoin={onJoin}
          loading={loading}
        />
      ) : null}
    </View>
  );
}
function LocationPickerMap({
  value,
  city,
  fieldName,
  onChange,
}: {
  value: MapLocation;
  city: string;
  fieldName: string;
  onChange: (location: MapLocation, address?: string) => void;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState<MapLocation>(value);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(15);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);
  const panStart = useRef(dragOffset);
  const movedDuringGesture = useRef(false);
  const latestDragOffset = useRef(dragOffset);

  useEffect(() => {
    latestDragOffset.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    setCenter(value);
  }, [value.latitude, value.longitude]);

  const canvasWidth = Math.max(viewport.width + 768, 1200);
  const canvasHeight = Math.max(viewport.height + 768, 1200);
  const canvasLeft = (viewport.width - canvasWidth) / 2;
  const canvasTop = (viewport.height - canvasHeight) / 2;
  const mapData = useMemo(
    () => getVisibleTiles(center, zoom, canvasWidth, canvasHeight),
    [canvasHeight, canvasWidth, center, zoom],
  );
  const selectedPoint = projectLocation(value, mapData.topLeft, zoom);

  function commitDrag(nextOffset: { x: number; y: number }) {
    if (nextOffset.x === 0 && nextOffset.y === 0) {
      return;
    }
    const centerWorld = latLonToWorld(center, zoom);
    setCenter(
      worldToLatLon(
        {
          x: centerWorld.x - nextOffset.x,
          y: centerWorld.y - nextOffset.y,
        },
        zoom,
      ),
    );
    setDragOffset({ x: 0, y: 0 });
  }

  function pickPoint(locationX: number, locationY: number) {
    const worldPoint = {
      x:
        mapData.topLeft.x + locationX - canvasLeft - latestDragOffset.current.x,
      y: mapData.topLeft.y + locationY - canvasTop - latestDragOffset.current.y,
    };
    const nextLocation = worldToLatLon(worldPoint, zoom);
    onChange(nextLocation);
    setCenter(nextLocation);
    setDragOffset({ x: 0, y: 0 });
  }

  async function searchLocation() {
    const query = locationSearch.trim();
    if (!query) {
      const fallback = getCityMapCenter(city);
      setCenter(fallback);
      onChange(fallback, city || undefined);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    setLocationSearching(true);
    try {
      const result = await geocodePlace(query, city);
      if (!result) {
        Alert.alert("Sin resultados", "No he encontrado esa direccion.");
        return;
      }
      setCenter(result.location);
      onChange(result.location, result.address);
      setDragOffset({ x: 0, y: 0 });
    } catch (error) {
      Alert.alert(
        "No se pudo buscar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLocationSearching(false);
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          movedDuringGesture.current = false;
          panStart.current = latestDragOffset.current;
        },
        onPanResponderMove: (_event, gesture) => {
          if (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2) {
            movedDuringGesture.current = true;
          }
          setDragOffset({
            x: panStart.current.x + gesture.dx,
            y: panStart.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (event) => {
          if (movedDuringGesture.current) {
            commitDrag(latestDragOffset.current);
            return;
          }
          pickPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
      }),
    [canvasLeft, canvasTop, center, mapData.topLeft, onChange, zoom],
  );

  return (
    <View
      style={styles.locationPickerMap}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <View
          style={[
            styles.mapCanvas,
            {
              left: canvasLeft,
              top: canvasTop,
              width: canvasWidth,
              height: canvasHeight,
              transform: [
                { translateX: dragOffset.x },
                { translateY: dragOffset.y },
              ],
            },
          ]}
        >
          {mapData.tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.uri }}
              style={[
                styles.mapTile,
                {
                  left: tile.x,
                  top: tile.y,
                  width: MAP_TILE_SIZE,
                  height: MAP_TILE_SIZE,
                },
              ]}
            />
          ))}
          <View pointerEvents="none" style={styles.mapOverlay} />
          <View
            pointerEvents="none"
            style={[
              styles.locationPickedMarker,
              {
                left: selectedPoint.left - 18,
                top: selectedPoint.top - 36,
              },
            ]}
          >
            <View style={styles.locationPickedDot} />
          </View>
        </View>
      </View>
      <View style={styles.locationSearchPanel}>
        <TextInput
          style={styles.locationSearchInput}
          value={locationSearch}
          onChangeText={setLocationSearch}
          placeholder={`Buscar calle cerca de ${fieldName || city || "la pista"}`}
          placeholderTextColor="rgba(227,219,208,0.62)"
          returnKeyType="search"
          onSubmitEditing={searchLocation}
        />
        <Pressable
          style={styles.locationSearchButton}
          onPress={searchLocation}
          disabled={locationSearching}
        >
          {locationSearching ? (
            <ActivityIndicator color="#0A110E" />
          ) : (
            <Text style={styles.locationSearchButtonText}>Buscar</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.locationPickerHint}>
        <Text style={styles.locationPickerHintText}>
          Toca el mapa para fijar la pista
        </Text>
      </View>
      <View style={styles.locationPickerZoom}>
        <Pressable
          style={styles.mapZoomButton}
          onPress={() =>
            setZoom((current) => Math.min(MAP_MAX_ZOOM, current + 1))
          }
        >
          <Text style={styles.mapZoomText}>+</Text>
        </Pressable>
        <Pressable
          style={styles.mapZoomButton}
          onPress={() =>
            setZoom((current) => Math.max(MAP_MIN_ZOOM, current - 1))
          }
        >
          <Text style={styles.mapZoomText}>-</Text>
        </Pressable>
      </View>
    </View>
  );
}
function ListHome({
  matches,
  myMatches,
  currentUserId,
  matchFilter,
  searchQuery,
  selectedMatchId,
  onSelect,
  onOpenDetail,
  onFilterChange,
  onJoin,
  onLeave,
  loading,
}: {
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  currentUserId: string | null;
  matchFilter: MatchFilter;
  searchQuery: string;
  onFilterChange: (value: MatchFilter) => void;
  selectedMatchId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  onLeave: (id: string) => void;
  loading: boolean;
}) {
  const filteredMyMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return myMatches;
    }

    return myMatches.filter((match) => {
      const field = match.field;
      return [match.title, field?.name, field?.city, field?.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [myMatches, searchQuery]);
  const renderedMatches = matchFilter === "mine" ? filteredMyMatches : matches;
  const emptyTitle =
    matchFilter === "mine" ? "Aun no tienes partidos" : "No hay partidos cerca";
  const emptyText =
    matchFilter === "mine"
      ? "Unete a un equipo o crea tu primer partido."
      : "Crea un partido con el boton central.";

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.listFilterRow}>
        <FilterButton
          label="Todos"
          active={matchFilter === "all"}
          onPress={() => onFilterChange("all")}
        />
        <FilterButton
          label="Mios"
          active={matchFilter === "mine"}
          onPress={() => onFilterChange("mine")}
        />
      </View>
      <View style={styles.listStatsRow}>
        <ListStat value={matches.length} label="Disponibles" />
        <ListStat value={filteredMyMatches.length} label="Mis partidos" />
      </View>
      {loading ? (
        <View style={styles.listLoadingRow}>
          <ActivityIndicator color="#B3F351" />
          <Text style={styles.listLoadingText}>Actualizando partidos</Text>
        </View>
      ) : null}
      {renderedMatches.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        renderedMatches.map((match) => {
          const mine = myMatches.some((item) => item.id === match.id);
          const participating = Boolean(
            currentUserId && userParticipatesInMatch(match, currentUserId),
          );
          return (
            <View
              key={match.id}
              style={[
                styles.listCard,
                match.id === selectedMatchId && styles.listCardSelected,
              ]}
            >
              <Pressable
                onPress={() => {
                  onSelect(match.id);
                  onOpenDetail(match.id);
                }}
              >
                <View style={styles.cardTitleRow}>
                  <Text style={styles.listCardTitle}>{match.title}</Text>
                  <StatusBadge status={match.status} />
                </View>
                <View style={styles.matchMetaRow}>
                  <Text style={styles.matchDatePill}>
                    {formatDate(match.startsAt)}
                  </Text>
                  <Text style={styles.matchCityPill}>
                    {match.field?.city ?? "Sin ciudad"}
                  </Text>
                </View>
                <Text style={styles.listCardMeta}>
                  {match.field?.name ?? "Campo por confirmar"}
                </Text>
                <OccupancyBar match={match} />
              </Pressable>
              {mine ? (
                <Pressable
                  style={styles.ghostDangerButton}
                  onPress={() => onLeave(match.id)}
                  disabled={loading}
                >
                  <Text style={styles.ghostDangerText}>Salir</Text>
                </Pressable>
              ) : (
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.darkJoinButton}
                    onPress={() => onJoin(match.id, "A")}
                    disabled={
                      loading || !isMatchOpen(match) || isTeamFull(match, "A")
                    }
                  >
                    <Text style={styles.darkJoinText}>
                      {!isMatchOpen(match)
                        ? "Cerrado"
                        : isTeamFull(match, "A")
                          ? "Completo"
                          : "Equipo A"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.limeJoinButton}
                    onPress={() => onJoin(match.id, "B")}
                    disabled={
                      loading || !isMatchOpen(match) || isTeamFull(match, "B")
                    }
                  >
                    <Text style={styles.limeJoinText}>
                      {!isMatchOpen(match)
                        ? "Cerrado"
                        : isTeamFull(match, "B")
                          ? "Completo"
                          : "Equipo B"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function SelectedPopup({
  match,
  onOpenDetail,
  onJoin,
  loading,
}: {
  match: MatchResponse;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.popupCard}>
      <View style={styles.popupAccent} />
      <View style={styles.popupBody}>
        <Text style={styles.popupLabel}>Partido seleccionado</Text>
        <View style={styles.cardTitleRow}>
          <Text style={styles.popupTitle}>{match.title}</Text>
          <StatusBadge status={match.status} />
        </View>
        <Text style={styles.popupMeta}>{formatDate(match.startsAt)}</Text>
        <Text style={styles.popupMeta}>
          {match.field?.name ?? "Campo por confirmar"} -{" "}
          {match.field?.city ?? "Sin ciudad"}
        </Text>
        <OccupancyBar match={match} />
        <View style={styles.popupActions}>
          <Pressable
            style={styles.popupDarkButton}
            onPress={() => onOpenDetail(match.id)}
            disabled={loading}
          >
            <Text style={styles.popupDarkText}>Detalle</Text>
          </Pressable>
          <Pressable
            style={styles.popupLimeButton}
            onPress={() => onJoin(match.id, "A")}
            disabled={loading || !isMatchOpen(match) || isTeamFull(match, "A")}
          >
            <Text style={styles.popupLimeText}>
              {isMatchOpen(match) ? "Equipo A" : "Cerrado"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function EmptyPopup() {
  return (
    <View style={styles.popupCard}>
      <View style={styles.popupBody}>
        <Text style={styles.popupTitle}>Sin partidos disponibles</Text>
        <Text style={styles.popupMeta}>
          Crea el primer partido desde el boton central.
        </Text>
      </View>
    </View>
  );
}

function MapLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.roadLine,
          {
            top: "16%",
            left: "-20%",
            width: "85%",
            transform: [{ rotate: "-18deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLine,
          {
            top: "30%",
            left: "18%",
            width: "105%",
            transform: [{ rotate: "28deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLine,
          {
            top: "48%",
            left: "-12%",
            width: "95%",
            transform: [{ rotate: "12deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLine,
          {
            top: "64%",
            left: "18%",
            width: "100%",
            transform: [{ rotate: "-31deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLineThin,
          {
            top: "22%",
            left: "44%",
            height: "70%",
            transform: [{ rotate: "5deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLineThin,
          {
            top: "5%",
            left: "12%",
            height: "86%",
            transform: [{ rotate: "-10deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLine,
          {
            top: "82%",
            left: "-18%",
            width: "122%",
            transform: [{ rotate: "-11deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.roadLineThin,
          {
            top: "2%",
            left: "50%",
            height: "58%",
            transform: [{ rotate: "31deg" }],
          },
        ]}
      />
    </View>
  );
}

function OccupancyBar({ match }: { match: MatchResponse }) {
  const occupancy = match.occupancy;
  const totalCapacity = occupancy?.totalCapacity ?? match.maxPlayersPerTeam * 2;
  const totalPlayers = occupancy?.totalPlayers ?? 0;
  const percentage =
    totalCapacity > 0 ? Math.min(100, (totalPlayers / totalCapacity) * 100) : 0;

  return (
    <View style={styles.occupancyBlock}>
      <View style={styles.occupancyTrack}>
        <View style={[styles.occupancyFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.occupancyText}>
        {totalPlayers}/{totalCapacity} jugadores
      </Text>
    </View>
  );
}

function TeamRoster({ match }: { match: MatchResponse }) {
  const teamA = match.teams?.teamA ?? [];
  const teamB = match.teams?.teamB ?? [];

  return (
    <View style={styles.rosterGrid}>
      <RosterColumn title="Equipo A" players={teamA} />
      <RosterColumn title="Equipo B" players={teamB} />
    </View>
  );
}

function RosterColumn({
  title,
  players,
}: {
  title: string;
  players: MatchPlayerResponse[];
}) {
  return (
    <View style={styles.rosterColumn}>
      <Text style={styles.rosterTitle}>{title}</Text>
      {players.length === 0 ? (
        <Text style={styles.rosterEmpty}>Sin jugadores</Text>
      ) : (
        players.map((player) => (
          <View key={player.participationId} style={styles.rosterPlayer}>
            <View style={styles.rosterAvatar}>
              <Text style={styles.rosterAvatarText}>
                {player.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.rosterName} numberOfLines={1}>
              {player.displayName}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function TeamOccupancy({ match }: { match: MatchResponse }) {
  const occupancy = match.occupancy;
  const max = occupancy?.maxPlayersPerTeam ?? match.maxPlayersPerTeam;
  const teamA = occupancy?.teamAPlayers ?? 0;
  const teamB = occupancy?.teamBPlayers ?? 0;

  return (
    <View style={styles.teamGrid}>
      <TeamBox label="Equipo A" value={teamA} max={max} />
      <TeamBox label="Equipo B" value={teamB} max={max} />
    </View>
  );
}

function TeamBox({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const full = value >= max;
  return (
    <View style={[styles.teamBox, full && styles.teamBoxFull]}>
      <Text style={styles.teamBoxLabel}>{label}</Text>
      <Text style={styles.teamBoxValue}>
        {value}/{max}
      </Text>
      <Text style={styles.teamBoxMeta}>
        {full ? "Completo" : `${max - value} plazas`}
      </Text>
    </View>
  );
}

function BottomNav({
  active,
  onHome,
  onCreate,
  onProfile,
}: {
  active: AppTab;
  onHome: () => void;
  onCreate: () => void;
  onProfile: () => void;
}) {
  return (
    <View style={styles.bottomNav}>
      <Pressable
        style={[styles.navItem, active === "home" && styles.navItemActive]}
        onPress={onHome}
      >
        <Text
          style={[styles.navIcon, active === "home" && styles.navIconActive]}
        >
          H
        </Text>
        <Text
          style={[styles.navLabel, active === "home" && styles.navLabelActive]}
        >
          Home
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.navItem,
          styles.navCreateItem,
          active === "create" && styles.navItemActive,
        ]}
        onPress={onCreate}
      >
        <Text
          style={[
            styles.navCreateIcon,
            active === "create" && styles.navIconActive,
          ]}
        >
          +
        </Text>
        <Text
          style={[
            styles.navLabel,
            active === "create" && styles.navLabelActive,
          ]}
        >
          Crear partido
        </Text>
      </Pressable>
      <Pressable
        style={[styles.navItem, active === "profile" && styles.navItemActive]}
        onPress={onProfile}
      >
        <Text
          style={[styles.navIcon, active === "profile" && styles.navIconActive]}
        >
          P
        </Text>
        <Text
          style={[
            styles.navLabel,
            active === "profile" && styles.navLabelActive,
          ]}
        >
          Perfil
        </Text>
      </Pressable>
    </View>
  );
}
function Field({
  label,
  ...props
}: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        autoCapitalize="none"
        placeholderTextColor="#8A8F8B"
        style={styles.input}
      />
    </View>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PositionButton({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: PlayerPosition;
  active: boolean;
  onPress: (value: PlayerPosition) => void;
}) {
  return (
    <Pressable
      style={[styles.positionButton, active && styles.positionButtonActive]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.positionButtonText,
          active && styles.positionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.modeButton, active && styles.modeButtonActive]}
    >
      <Text style={[styles.modeText, active && styles.modeTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ListStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.listStat}>
      <Text style={styles.listStatValue}>{value}</Text>
      <Text style={styles.listStatLabel}>{label}</Text>
    </View>
  );
}

function ProfileStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatValue}>{value}</Text>
      <Text style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

function CompactMatch({
  match,
  onPress,
}: {
  match: MatchResponse;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.compactMatch} onPress={onPress}>
      <Text style={styles.compactMatchTitle}>{match.title}</Text>
      <Text style={styles.compactMatchMeta}>
        {formatDate(match.startsAt)} - {match.field?.name ?? "Campo pendiente"}
      </Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const open = status === "OPEN";
  return (
    <View style={[styles.statusPill, !open && styles.statusPillClosed]}>
      <Text
        style={[styles.statusPillText, !open && styles.statusPillTextClosed]}
      >
        {matchStatusLabel(status)}
      </Text>
    </View>
  );
}

function matchStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Abierto";
    case "CANCELLED":
      return "Cancelado";
    case "FINISHED":
      return "Finalizado";
    case "FULL":
      return "Completo";
    default:
      return status;
  }
}

function isMatchOpen(match: MatchResponse) {
  return match.status === "OPEN";
}

function positionLabel(position: PlayerPosition | null | undefined) {
  switch (position) {
    case "GOALKEEPER":
      return "Portero";
    case "DEFENDER":
      return "Defensa";
    case "MIDFIELDER":
      return "Medio";
    case "FORWARD":
      return "Delantero";
    default:
      return "Sin posicion";
  }
}

function userParticipatesInMatch(match: MatchResponse, userId: string) {
  return Boolean(
    match.teams?.teamA.some((player) => player.userId === userId) ||
    match.teams?.teamB.some((player) => player.userId === userId),
  );
}

function isTeamFull(match: MatchResponse, team: TeamSide) {
  const occupancy = match.occupancy;
  const max = occupancy?.maxPlayersPerTeam ?? match.maxPlayersPerTeam;
  const players =
    team === "A"
      ? (occupancy?.teamAPlayers ?? 0)
      : (occupancy?.teamBPlayers ?? 0);
  return players >= max;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  authScreen: { flex: 1, backgroundColor: "#343434" },
  darkScreen: { flex: 1, backgroundColor: "#343434" },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#E3DBD0", fontSize: 14, fontWeight: "900" },
  authContent: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 18 },
  authHeroMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  authHeroLetter: { color: "#0A110E", fontSize: 34, fontWeight: "900" },
  authBrand: {
    color: "#E3DBD0",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 0,
  },
  authCopy: { color: "#BDB6AE", fontSize: 17, lineHeight: 24, maxWidth: 360 },
  authCard: {
    backgroundColor: "#E3DBD0",
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  modeSwitchLight: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(156,163,175,0.18)",
    flexDirection: "row",
    padding: 6,
  },
  modeSwitchDark: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(156,163,175,0.12)",
    flexDirection: "row",
    padding: 6,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },
  modeButtonActive: { backgroundColor: "#B3F351" },
  modeText: { color: "#9CA3AF", fontSize: 15, fontWeight: "800" },
  modeTextActive: { color: "#0A110E" },
  fieldBlock: { gap: 7 },
  fieldLabel: { color: "#0A110E", fontSize: 13, fontWeight: "900" },
  input: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#F6F1EA",
    color: "#0A110E",
    fontSize: 15,
  },
  authButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  authNotice: { color: "#4A4A4A", fontSize: 13 },
  homeShell: { flex: 1, paddingTop: 0, backgroundColor: "#343434" },
  statusBarMock: {
    height: 44,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusTime: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  statusIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
  signalIcon: {
    width: 18,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  wifiIcon: {
    width: 17,
    height: 12,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  batteryIcon: {
    width: 26,
    height: 12,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  homeHeader: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallLabel: {
    color: "#B3F351",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  homeTitle: {
    color: "#F7F1E8",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 46,
  },
  homeSubtitle: {
    color: "rgba(227,219,208,0.68)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  screenTitle: {
    color: "#E3DBD0",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
  },
  homeSearchWrap: { paddingHorizontal: 22, paddingBottom: 10 },
  homeSearchPill: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    backgroundColor: "rgba(10,17,14,0.42)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
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
    borderColor: "#B3F351",
  },
  homeSearchHandle: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#B3F351",
    transform: [{ rotate: "45deg" }],
  },
  homeSearchInput: {
    flex: 1,
    color: "#E3DBD0",
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },
  homeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  refreshMiniButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.22)",
    backgroundColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshMiniText: { color: "#E3DBD0", fontSize: 18, fontWeight: "900" },
  createMiniButton: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  createMiniText: {
    color: "#0A110E",
    fontSize: 30,
    fontWeight: "900",
    marginTop: -2,
  },
  mapStage: {
    flex: 1,
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 108,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#343434",
  },
  mapCanvas: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
    backgroundColor: "#C8D2C4",
  },
  mapTile: { position: "absolute" },
  mapOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(52,52,52,0.08)",
  },
  mapLocationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: "#B3F351",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 18,
  },
  mapLocationText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  mapZoomControls: {
    position: "absolute",
    top: 66,
    right: 16,
    gap: 8,
    zIndex: 18,
  },
  mapZoomButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(10,17,14,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapZoomText: { color: "#E3DBD0", fontSize: 22, fontWeight: "900" },
  userLocationMarker: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2979FF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  roadLine: {
    position: "absolute",
    height: 13,
    borderRadius: 13,
    backgroundColor: "#505050",
  },
  roadLineThin: {
    position: "absolute",
    width: 13,
    borderRadius: 13,
    backgroundColor: "#505050",
  },
  mapLoadingPill: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#B3F351",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  mapLoadingText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  mapMarkerWrap: {
    position: "absolute",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  mapMarkerHalo: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(179,243,81,0.20)",
  },
  mapMarkerHaloActive: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(179,243,81,0.30)",
  },
  mapMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#B3F351",
  },
  mapMarkerActive: { borderWidth: 5, borderColor: "#FFFFFF" },
  popupCard: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 104,
    borderRadius: 28,
    backgroundColor: "#E3DBD0",
    overflow: "hidden",
  },
  popupAccent: { height: 8, backgroundColor: "#B3F351" },
  popupBody: { padding: 20, gap: 8 },
  popupLabel: { color: "#6C716D", fontSize: 12, fontWeight: "900" },
  popupTitle: { color: "#0A110E", fontSize: 24, fontWeight: "900" },
  popupMeta: { color: "#4A4A4A", fontSize: 14, lineHeight: 20 },
  popupActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  popupDarkButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
  },
  popupDarkText: { color: "#E3DBD0", fontWeight: "900" },
  popupLimeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  popupLimeText: { color: "#0A110E", fontWeight: "900" },
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 14,
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
  listLoadingRow: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listLoadingText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  listFilterRow: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 5,
    gap: 6,
  },
  filterButton: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: { backgroundColor: "#B3F351" },
  filterButtonText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  filterButtonTextActive: { color: "#0A110E" },
  listStatsRow: { flexDirection: "row", gap: 12 },
  listStat: {
    flex: 1,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.08)",
  },
  listStatValue: { color: "#B3F351", fontSize: 28, fontWeight: "900" },
  listStatLabel: {
    color: "#E3DBD0",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  listCard: {
    backgroundColor: "#E3DBD0",
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  listCardSelected: { borderWidth: 3, borderColor: "#B3F351" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  listCardTitle: { flex: 1, color: "#0A110E", fontSize: 22, fontWeight: "900" },
  statusPill: {
    paddingHorizontal: 10,
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillClosed: { backgroundColor: "rgba(217,88,88,0.18)" },
  statusPillText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  statusPillTextClosed: { color: "#8F2727" },
  listCardMeta: { color: "#4A4A4A", fontSize: 14, marginTop: 4 },
  matchMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  matchDatePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#0A110E",
    color: "#E3DBD0",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchCityPill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#B3F351",
    color: "#0A110E",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  occupancyBlock: { marginTop: 12, gap: 7 },
  occupancyTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(10,17,14,0.14)",
    overflow: "hidden",
  },
  occupancyFill: { height: 8, borderRadius: 8, backgroundColor: "#B3F351" },
  occupancyText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  cardActions: { flexDirection: "row", gap: 10 },
  darkJoinButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
  },
  darkJoinText: { color: "#E3DBD0", fontWeight: "900" },
  limeJoinButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  limeJoinText: { color: "#0A110E", fontWeight: "900" },
  ghostDangerButton: {
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostDangerText: { color: "#0A110E", fontWeight: "900" },
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
    borderRadius: 22,
    backgroundColor: "rgba(217,88,88,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D95858",
  },
  statusBannerText: { color: "#8F2727", fontWeight: "900" },
  emptyPanel: {
    backgroundColor: "rgba(156,163,175,0.10)",
    borderRadius: 24,
    padding: 18,
  },
  emptyTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#BDB6AE", fontSize: 14, marginTop: 6 },
  bottomNav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    minHeight: 84,
    borderRadius: 30,
    backgroundColor: "rgba(10,17,14,0.92)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 8,
    gap: 8,
  },
  navItem: {
    flex: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navItemActive: { backgroundColor: "#B3F351" },
  navCreateItem: {},
  navCreateIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: -1,
  },
  navIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 18,
    fontWeight: "900",
  },
  navIconActive: { color: "#0A110E" },
  navLabel: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  navLabelActive: { color: "#0A110E" },
  profileContent: { padding: 22, paddingBottom: 120, gap: 20 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(227,219,208,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#E3DBD0", fontSize: 30, fontWeight: "700" },
  profileTitle: { color: "#E3DBD0", fontSize: 24, fontWeight: "900" },
  logoutPill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#0A110E", fontWeight: "900" },
  profileHero: { alignItems: "center", paddingTop: 20, gap: 10 },
  avatarRing: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 3,
    borderColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCore: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#E3DBD0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#0A110E", fontSize: 50, fontWeight: "900" },
  profileName: { color: "#E3DBD0", fontSize: 30, fontWeight: "900" },
  profileMeta: { color: "#9CA3AF", fontSize: 14, fontWeight: "700" },
  nextMatchCard: {
    borderRadius: 24,
    backgroundColor: "#B3F351",
    padding: 18,
    gap: 6,
  },
  nextMatchEyebrow: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  nextMatchTitle: { color: "#0A110E", fontSize: 22, fontWeight: "900" },
  nextMatchMeta: {
    color: "#263126",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  profileEditor: {
    backgroundColor: "#E3DBD0",
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  positionGrid: { flexDirection: "row", gap: 8 },
  positionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#F6F1EA",
    alignItems: "center",
    justifyContent: "center",
  },
  positionButtonActive: { backgroundColor: "#B3F351" },
  positionButtonText: { color: "#4A4A4A", fontSize: 12, fontWeight: "900" },
  positionButtonTextActive: { color: "#0A110E" },
  profileStats: { flexDirection: "row", gap: 12 },
  profileStat: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "rgba(156,163,175,0.10)",
    padding: 14,
    alignItems: "center",
  },
  profileStatValue: { color: "#B3F351", fontSize: 24, fontWeight: "900" },
  profileStatLabel: {
    color: "#E3DBD0",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  profileSection: { gap: 12 },
  profileSectionTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  profileEmpty: { color: "#9CA3AF", fontSize: 14 },
  compactMatch: { borderRadius: 22, backgroundColor: "#E3DBD0", padding: 16 },
  compactMatchTitle: { color: "#0A110E", fontSize: 17, fontWeight: "900" },
  compactMatchMeta: { color: "#4A4A4A", marginTop: 4, fontSize: 13 },
  createContent: { padding: 22, paddingBottom: 120, gap: 18 },
  locationScreen: { flex: 1, padding: 22, paddingBottom: 24, gap: 16 },
  locationPickerShell: {
    flex: 1,
    minHeight: 360,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#C8D2C4",
  },
  locationPickerMap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#C8D2C4",
  },
  locationSearchPanel: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  locationSearchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: "rgba(10,17,14,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    color: "#F7F1E8",
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "800",
  },
  locationSearchButton: {
    minHeight: 44,
    minWidth: 82,
    borderRadius: 16,
    backgroundColor: "#B7F36B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationSearchButtonText: {
    color: "#0A110E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  locationPickerHint: {
    position: "absolute",
    left: 18,
    top: 70,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10,17,14,0.78)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickerHintText: { color: "#E3DBD0", fontSize: 12, fontWeight: "900" },
  locationPickerZoom: { position: "absolute", right: 18, top: 70, gap: 8 },
  locationPickedMarker: {
    position: "absolute",
    width: 36,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#B3F351",
    borderWidth: 4,
    borderColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A110E",
  },
  locationSummaryCard: {
    borderRadius: 24,
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
    borderRadius: 22,
    backgroundColor: "rgba(227,219,208,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
  createCard: {
    backgroundColor: "#E3DBD0",
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  locationCreateCard: {
    borderRadius: 20,
    backgroundColor: "#F6F1EA",
    padding: 14,
    gap: 12,
  },
  locationCreateTitle: { color: "#0A110E", fontSize: 14, fontWeight: "900" },
  locationCreateMeta: {
    color: "#4A4A4A",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  locationPickButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  formRow: { flexDirection: "row", gap: 10 },
  formHalf: { flex: 1 },
  detailContent: { padding: 22, paddingBottom: 120, gap: 18 },
  detailHeroCard: {
    backgroundColor: "#E3DBD0",
    borderRadius: 28,
    padding: 18,
    gap: 10,
  },
  detailTitle: { color: "#0A110E", fontSize: 28, fontWeight: "900" },
  detailMeta: { color: "#4A4A4A", fontSize: 14, lineHeight: 20 },
  teamGrid: { flexDirection: "row", gap: 10, marginTop: 4 },
  teamBox: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#F6F1EA",
    padding: 12,
    gap: 3,
  },
  teamBoxFull: { opacity: 0.62 },
  teamBoxLabel: { color: "#4A4A4A", fontSize: 12, fontWeight: "900" },
  teamBoxValue: { color: "#0A110E", fontSize: 24, fontWeight: "900" },
  teamBoxMeta: { color: "#6C716D", fontSize: 11, fontWeight: "800" },
  rosterGrid: { flexDirection: "row", gap: 10, marginTop: 2 },
  rosterColumn: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(10,17,14,0.08)",
    padding: 12,
    gap: 8,
  },
  rosterTitle: { color: "#0A110E", fontSize: 13, fontWeight: "900" },
  rosterEmpty: { color: "#6C716D", fontSize: 12, fontWeight: "800" },
  rosterPlayer: { flexDirection: "row", alignItems: "center", gap: 8 },
  rosterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  rosterAvatarText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  rosterName: { flex: 1, color: "#0A110E", fontSize: 12, fontWeight: "900" },
  chatPanel: { gap: 12 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatTitle: { color: "#E3DBD0", fontSize: 22, fontWeight: "900" },
  refreshText: { color: "#B3F351", fontSize: 13, fontWeight: "900" },
  messageBubble: {
    backgroundColor: "rgba(227,219,208,0.12)",
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  messageAuthor: { color: "#B3F351", fontSize: 12, fontWeight: "900" },
  messageContent: { color: "#E3DBD0", fontSize: 15, lineHeight: 21 },
  messageTime: { color: "#9CA3AF", fontSize: 11, fontWeight: "700" },
  messageComposer: { flexDirection: "row", gap: 10, alignItems: "center" },
  messageInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    backgroundColor: "#E3DBD0",
    color: "#0A110E",
    fontSize: 15,
  },
  sendButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: "#B3F351",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: "#0A110E", fontWeight: "900" },
});
