import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEventListener } from "expo";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();
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
  BackHandler,
  Image,
  ImageBackground,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
type DateFilter = "today" | "tomorrow" | "week" | "all";
type AppTab = "home" | "create" | "detail" | "profile" | "location";
type TeamSide = "A" | "B";
type UserRole = "PLAYER" | "ADMIN";
type PlayerPosition = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";
type MapLocation = { latitude: number; longitude: number };
type MapPoint = { x: number; y: number };
type MapTile = { key: string; x: number; y: number; uri: string };
type GeocodeResult = { lat: string; lon: string; display_name: string };
type NotificationsModule = typeof import("expo-notifications");

type AuthResponse = {
  accessToken: string;
  expiresAt?: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    username?: string | null;
    role?: UserRole | null;
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
  username?: string | null;
  teamSide: TeamSide;
  joinedAt: string;
};

type MatchResponse = {
  id: string;
  title: string;
  startsAt: string;
  maxPlayersPerTeam: number;
  pricePerPersonCents: number;
  coverImageUrl?: string | null;
  status: string;
  createdBy: {
    id: string;
    displayName: string;
    username?: string | null;
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

type FieldMatchGroup = {
  key: string;
  fieldName: string;
  latitude: number;
  longitude: number;
  matches: MatchResponse[];
};




type MessageResponse = {
  id: string;
  matchId: string;
  author: {
    id: string;
    displayName: string;
    username?: string | null;
  };
  content: string;
  sentAt: string;
};

type SavedFieldResponse = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PlayerProfileResponse = {
  id: string | null;
  userId?: string | null;
  displayName: string;
  username?: string | null;
  email: string;
  fullName: string | null;
  bio: string | null;
  preferredPosition: PlayerPosition | null;
  city: string | null;
};

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8080"
    : "https://footy-backend-576b.onrender.com";

const SESSION_STORAGE_KEY = "footy.session.v1";
const INTRO_VIDEO = require("./assets/intro.mp4");
const MATCH_COVER_IMAGES = [
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1504016798967-59a258e9386d?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=72",
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1000&q=72",
];
const DEFAULT_MATCH_COVER = MATCH_COVER_IMAGES[0];

declare const process: {
  env: {
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  };
};

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function getBrowserStorage() {
  return (globalThis as { localStorage?: BrowserStorage }).localStorage;
}

const sessionStorageAdapter = {
  async get() {
    try {
      if (Platform.OS !== "web") {
        return await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
      }
      return getBrowserStorage()?.getItem(SESSION_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  },
  async set(session: StoredSession) {
    const value = JSON.stringify(session);
    try {
      if (Platform.OS !== "web") {
        await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
        return;
      }
      getBrowserStorage()?.setItem(SESSION_STORAGE_KEY, value);
    } catch {
      // Ignore unavailable storage.
    }
  },
  async clear() {
    try {
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
        return;
      }
      getBrowserStorage()?.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  },
};

async function requestAppPermissions() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    const locationPermission = await Location.getForegroundPermissionsAsync();
    if (!locationPermission.granted && locationPermission.canAskAgain) {
      await Location.requestForegroundPermissionsAsync();
    }
  } catch {
    // Permission prompts can fail on unsupported builds; app usage continues.
  }

  try {
    const Notifications = (
      eval("require") as (moduleName: string) => NotificationsModule
    )("expo-notifications");

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Footy",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8FEA6A",
      });
    }

    const notificationPermission = await Notifications.getPermissionsAsync();
    if (!notificationPermission.granted && notificationPermission.canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // Expo Go and some simulators do not support the full notifications stack.
  }
}

function IntroVideoOverlay({ onDone }: { onDone: () => void }) {
  const finished = useRef(false);
  const player = useVideoPlayer(INTRO_VIDEO, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = true;
    nextPlayer.play();
  });

  const finish = useCallback(() => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onDone();
  }, [onDone]);

  useEventListener(player, "playToEnd", finish);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") {
      finish();
    }
  });

  useEffect(() => {
    const fallback = setTimeout(finish, 6500);
    return () => clearTimeout(fallback);
  }, [finish]);

  return (
    <View style={styles.introScreen}>
      <StatusBar style="light" />
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={styles.introVideo}
      />
      <Pressable style={styles.introSkipButton} onPress={finish}>
        <Text style={styles.introSkipText}>Saltar</Text>
      </Pressable>
    </View>
  );
}

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
const MARKER_SIZE = 44;
const MAP_TILE_SIZE = 256;
const MAP_DEFAULT_ZOOM = 13;
const MAP_MIN_ZOOM = 11;
const MAP_MAX_ZOOM = 17;
const DEFAULT_MAP_CENTER = { latitude: 37.26142, longitude: -6.94472 };

function datePartsFromOffset(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function tomorrowDateParts() {
  return datePartsFromOffset(1);
}

function monthDateParts(year: number, month: number, day: number) {
  const yyyy = String(year);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCalendarMonth(offset: number) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function formatPriceFromCents(value: number | null | undefined) {
  const cents = value ?? 0;
  if (cents <= 0) {
    return "Gratis";
  }
  return `${(cents / 100).toFixed(2)} EUR`;
}

function formatDraftPrice(value: string) {
  const price = Number(value.replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return "Gratis";
  }
  return `${price.toFixed(2)} EUR`;
}

function getRandomMatchCover() {
  const index = Math.floor(Math.random() * MATCH_COVER_IMAGES.length);
  return MATCH_COVER_IMAGES[index] ?? DEFAULT_MATCH_COVER;
}

function getMatchCover(match: MatchResponse) {
  return match.coverImageUrl || DEFAULT_MATCH_COVER;
}

function publicHandle(user?: { displayName?: string | null; username?: string | null }) {
  const username = user?.username?.trim();
  if (username) {
    return `@${username}`;
  }
  return user?.displayName?.trim() || "Jugador";
}

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
  const [displayName, setDisplayName] = useState("Jugador Footy");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123");
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
  const googleLoginConfigured =
    Platform.OS === "web"
      ? Boolean(GOOGLE_WEB_CLIENT_ID)
      : Platform.OS === "android"
        ? Boolean(GOOGLE_ANDROID_CLIENT_ID)
        : Boolean(GOOGLE_IOS_CLIENT_ID);

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


function filterMatchByDate(
  match: MatchResponse,
  filter: DateFilter,
  now: Date,
) {
  const matchDate = new Date(match.startsAt);

  if (filter === "all") {
    return true;
  }

  if (filter === "today") {
    return isSameDay(matchDate, now);
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (filter === "tomorrow") {
    return isSameDay(matchDate, tomorrow);
  }

  if (filter === "week") {
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    return matchDate >= startOfDay(now) && matchDate <= end;
  }

  return true;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}



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
          void sessionStorageAdapter.clear();
          setToken(null);
          setUserName(null);
          setCurrentUserRole("PLAYER");
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
        if (appTab === "location") {
          setAppTab("create");
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
    profileEditing,
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

      await applyAuthenticatedSession(auth);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado";
      setNotice(message);
      Alert.alert("No se pudo entrar", message);
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
      const created = await request<MatchResponse>("/api/matches", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          startsAt: new Date(`${newDate}T${newTime}:00`).toISOString(),
          maxPlayersPerTeam: draft.maxPlayers,
          pricePerPersonCents: draft.pricePerPersonCents,
          coverImageUrl: getRandomMatchCover(),
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
        }),
      });
      await loadMatches();
      setSelectedMatchId(created.id);
      setNotice("Partido creado");
      setShowCreatePreview(false);
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
    setSelectedMatchId(null);
    setAppTab("home");
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
              <AppLogoImage size={Platform.OS === "android" ? 76 : 88} />
            </View>
            <Text style={styles.authBrand}>Footy</Text>
            <Text style={styles.authKicker}>Partidos cerca de ti</Text>
            <Text style={styles.authCopy}>
              Entra, encuentra equipo y organiza tus partidos en segundos.
            </Text>
          </View>

          <View style={styles.authCard}>
            <View pointerEvents="none" style={styles.authCardBubbleOne} />
            <View pointerEvents="none" style={styles.authCardBubbleTwo} />
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
              <Text style={styles.screenTitle}>Nuevo partido</Text>
            </View>
            <Pressable
              style={styles.closePill}
              onPress={goHome}
            >
              <Text style={styles.closePillText}>Cerrar</Text>
            </Pressable>
          </View>

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
              <Text style={styles.createPreviewButtonText}>Ver vista previa</Text>
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
          onClose={() => setShowCreatePreview(false)}
          onCreate={createMatch}
        />
        <BottomNav
          active="create"
          onHome={goHome}
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
                <ImageBackground
                  source={{ uri: getMatchCover(selectedMatch) }}
                  style={styles.detailCover}
                  imageStyle={styles.detailCoverImage}
                >
                  <View style={styles.detailCoverOverlay} />
                  <View style={styles.detailCoverTop}>
                    <StatusBadge status={selectedMatch.status} />
                    <Text style={styles.detailCoverPill}>
                      {formatPriceFromCents(selectedMatch.pricePerPersonCents)}
                    </Text>
                  </View>
                  <View style={styles.detailCoverContent}>
                    <Text style={styles.detailTitle} numberOfLines={2}>
                      {selectedMatch.title}
                    </Text>
                    <Text style={styles.detailSubtitle} numberOfLines={1}>
                      {selectedMatch.field?.name ?? "Campo por confirmar"}
                    </Text>
                  </View>
                </ImageBackground>

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
                    {selectedIsOwner && selectedMatch.status !== "CANCELLED" ? (
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
          onCreate={() => setAppTab("create")}
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
                onDirections={openDirections}
                onJoin={joinMatch}
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
                onJoin={joinMatch}
                onLeave={leaveMatch}
                loading={loading}
              />
            )}
          </View>
        </View>
      </View>
      <BottomNav
        active="home"
        onHome={goHome}
        onCreate={() => setAppTab("create")}
        onProfile={() => setAppTab("profile")}
      />
    </SafeAreaView>
  );
}

function ScreenBubbles() {
  return (
    <View pointerEvents="none" style={styles.screenBubbles}>
      <View style={styles.screenBubbleOne} />
      <View style={styles.screenBubbleTwo} />
      <View style={styles.screenBubbleThree} />
    </View>
  );
}
function AppLogoImage({ size = 42 }: { size?: number }) {
  return (
    <Image
      source={require("./assets/icon.png")}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
    />
  );
}

function GoogleAuthButton({
  configured,
  loading,
  onGoogleToken,
}: {
  configured: boolean;
  loading: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
}) {
  if (!configured) {
    return (
      <>
        <Pressable
          style={[styles.googleButton, styles.googleButtonDisabled]}
          onPress={() =>
            Alert.alert(
              "Google no esta configurado",
              "Falta configurar EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en mobile y APP_SECURITY_GOOGLE_CLIENT_IDS en backend.",
            )
          }
          disabled={loading}
        >
          <View style={styles.googleMark}>
            <Text style={styles.googleMarkText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </Pressable>
        <Text style={styles.googleHint}>
          Google queda listo al anadir tus Client IDs.
        </Text>
      </>
    );
  }

  return (
    <ConfiguredGoogleAuthButton
      loading={loading}
      onGoogleToken={onGoogleToken}
    />
  );
}

function ConfiguredGoogleAuthButton({
  loading,
  onGoogleToken,
}: {
  loading: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
}) {
  const [googleRequest, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    selectAccount: true,
  });

  async function submitGoogleAuth() {
    if (!googleRequest) {
      Alert.alert("Google no esta listo", "Espera un momento e intentalo de nuevo.");
      return;
    }

    const result = await promptGoogleSignIn();
    if (result.type !== "success") {
      return;
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      Alert.alert("Google no esta listo", "Google no devolvio id_token.");
      return;
    }

    await onGoogleToken(idToken);
  }

  return (
    <Pressable
      style={[
        styles.googleButton,
        (!googleRequest || loading) && styles.googleButtonDisabled,
      ]}
      onPress={submitGoogleAuth}
      disabled={loading}
    >
      <View style={styles.googleMark}>
        <Text style={styles.googleMarkText}>G</Text>
      </View>
      <Text style={styles.googleButtonText}>Continuar con Google</Text>
    </Pressable>
  );
}

function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <View
      style={[
        styles.logoMark,
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
      ]}
    >
      <View
        style={[
          styles.logoDot,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            left: size * 0.29,
            top: size * 0.17,
          },
        ]}
      />
      <View
        style={[
          styles.logoSlash,
          {
            width: size * 0.5,
            height: size * 0.2,
            left: size * 0.28,
            top: size * 0.5,
          },
        ]}
      />
    </View>
  );
}
function LocationTargetIcon() {
  return (
    <View style={styles.locationIcon}>
      <View style={styles.locationIconPoint} />
      <View style={styles.locationIconHead}>
        <View style={styles.locationIconHole} />
      </View>
    </View>
  );
}

function RefreshIcon() {
  return (
    <View style={styles.refreshIcon}>
      <View style={styles.refreshArrowTop}>
        <View style={styles.refreshArrowHeadTop} />
      </View>
      <View style={styles.refreshArrowBottom}>
        <View style={styles.refreshArrowHeadBottom} />
      </View>
    </View>
  );
}

function MapPickerIcon() {
  return (
    <View style={styles.mapPickerIcon}>
      <View style={styles.mapPickerRoadOne} />
      <View style={styles.mapPickerRoadTwo} />
      <View style={styles.mapPickerPinPoint} />
      <View style={styles.mapPickerPinHead}>
        <View style={styles.mapPickerPinHole} />
      </View>
    </View>
  );
}

function EditProfileIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <View style={styles.closeEditIcon}>
        <View style={[styles.closeEditLine, styles.closeEditLineOne]} />
        <View style={[styles.closeEditLine, styles.closeEditLineTwo]} />
      </View>
    );
  }

  return (
    <View style={styles.editIcon}>
      <View style={styles.editIconBody} />
      <View style={styles.editIconTip} />
    </View>
  );
}

function TopStatus() {
  return <View style={styles.statusBarMock}></View>;
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
        uri: `https://api.maptiler.com/maps/streets-v2/${zoom}/${wrappedX}/${y}.png?key=2MmV019neQt8MfLPITjf`,
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

function clampMapZoom(value: number) {
  return Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, value));
}

function getTouchDistance(touches: { pageX: number; pageY: number }[]) {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt(dx * dx + dy * dy);
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
  onDirections,
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
  onDirections: (match: MatchResponse) => void;
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
  const suppressNextMapClear = useRef(false);
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(MAP_DEFAULT_ZOOM);
  const pinchActive = useRef(false);
  const lastWheelZoomAt = useRef(0);

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


const fieldGroups = useMemo(() => {
  const groups = new Map<string, FieldMatchGroup>();

  matches.forEach((match) => {
    const location = getMatchLocation(match);

    if (!location) {
      return;
    }

    const field = match.field;

    const key =
      field?.id ??
      `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;

    const current = groups.get(key);

    if (current) {
      current.matches.push(match);
      return;
    }

    groups.set(key, {
      key,
      fieldName: field?.name ?? "Pista sin nombre",
      latitude: location.latitude,
      longitude: location.longitude,
      matches: [match],
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    matches: group.matches.sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    ),
  }));
}, [matches]);



  const markerCoordinates = useMemo(
  () =>
    fieldGroups.map((group, index) => {
      const location = {
        latitude: group.latitude,
        longitude: group.longitude,
      };

      return projectLocation(location, mapData.topLeft, zoom);
    }),
  [fieldGroups, mapData.topLeft, zoom],
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
  const group = fieldGroups[hitIndex];
  onSelect(group.matches[0].id);
  return;
}

    onClearSelection();
  }

  function clearSelectionFromMap() {
    if (suppressNextMapClear.current) {
      suppressNextMapClear.current = false;
      return;
    }
    onClearSelection();
  }

  function applyZoomDelta(delta: number) {
    setZoom((current) => clampMapZoom(current + delta));
    setDragOffset({ x: 0, y: 0 });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (event, gesture) =>
          event.nativeEvent.touches.length >= 2 ||
          Math.abs(gesture.dx) > 5 ||
          Math.abs(gesture.dy) > 5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          movedDuringGesture.current = false;
          panStart.current = latestDragOffset.current;
          const touches = event.nativeEvent.touches;
          pinchActive.current = touches.length >= 2;
          pinchStartDistance.current = getTouchDistance(touches);
          pinchStartZoom.current = zoom;
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const distance = getTouchDistance(touches);
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = distance;
              pinchStartZoom.current = zoom;
            }
            if (distance > 0 && pinchStartDistance.current > 0) {
              movedDuringGesture.current = true;
              pinchActive.current = true;
              const zoomDelta = Math.round(
                Math.log2(distance / pinchStartDistance.current) * 2,
              );
              setZoom(clampMapZoom(pinchStartZoom.current + zoomDelta));
              setDragOffset({ x: 0, y: 0 });
            }
            return;
          }

          pinchActive.current = false;
          if (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2) {
            movedDuringGesture.current = true;
          }
          setDragOffset({
            x: panStart.current.x + gesture.dx,
            y: panStart.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (event) => {
          if (pinchActive.current) {
            pinchActive.current = false;
            pinchStartDistance.current = 0;
            return;
          }
          pinchStartDistance.current = 0;
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
    [canvasLeft, canvasTop, mapCenter, markerCoordinates, fieldGroups, zoom],
  );

  const mapWheelProps =
    Platform.OS === "web"
      ? ({
          onWheel: (event: {
            deltaY?: number;
            nativeEvent?: { deltaY?: number };
            preventDefault?: () => void;
          }) => {
            event.preventDefault?.();
            const deltaY = event.deltaY ?? event.nativeEvent?.deltaY ?? 0;
            if (Math.abs(deltaY) < 4) {
              return;
            }
            const now = Date.now();
            if (now - lastWheelZoomAt.current < 110) {
              return;
            }
            lastWheelZoomAt.current = now;
            applyZoomDelta(deltaY > 0 ? -1 : 1);
          },
        } as object)
      : {};

  async function useMyLocation() {
    try {
      if (Platform.OS === "web") {
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
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso de ubicacion necesario",
          "Activa la ubicacion para centrar el mapa en tu posicion.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setDragOffset({ x: 0, y: 0 });
    } catch {
      Alert.alert(
        "No se pudo usar tu ubicacion",
        "Revisa que la ubicacion del dispositivo este activada.",
      );
    }
  }

  return (
    <View
      style={styles.mapStage}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      {...mapWheelProps}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={clearSelectionFromMap}>
            <View pointerEvents="none" style={styles.mapOverlay} />
          </Pressable>
          {fieldGroups.map((group, index) => {
  const coordinate = markerCoordinates[index];
  const firstMatch = group.matches[0];
  const active = group.matches.some((match) => match.id === selectedMatchId);

  return (
    <Pressable
      key={group.key}
      onPress={() => {
        suppressNextMapClear.current = true;
        onSelect(firstMatch.id);
      }}
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
  style={[
    styles.mapMarkerPin,
    active && styles.mapMarkerPinActive,
    group.matches.length > 1 && styles.mapMarkerClusterPin,
  ]}
>
  {group.matches.length > 1 ? (
    <Text style={styles.mapMarkerCount}>{group.matches.length}</Text>
  ) : (
    <Text style={styles.mapMarkerBall}>⚽</Text>
  )}
</View>

<View
  style={[
    styles.mapMarkerTail,
    active && styles.mapMarkerTailActive,
  ]}
/>
              </Pressable>
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
        <LocationTargetIcon />
      </Pressable>

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
          onDirections={onDirections}
          onJoin={onJoin}
          onClose={onClearSelection}
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
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(15);
  const pinchActive = useRef(false);
  const skipNextCenterSync = useRef(false);
  const lastWheelZoomAt = useRef(0);

  useEffect(() => {
    latestDragOffset.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    if (skipNextCenterSync.current) {
      skipNextCenterSync.current = false;
      return;
    }
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
    skipNextCenterSync.current = true;
    onChange(nextLocation);
    setDragOffset({ x: 0, y: 0 });
  }

  function applyZoomDelta(delta: number) {
    setZoom((current) => clampMapZoom(current + delta));
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
        onMoveShouldSetPanResponder: (event, gesture) =>
          event.nativeEvent.touches.length >= 2 ||
          Math.abs(gesture.dx) > 5 ||
          Math.abs(gesture.dy) > 5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          movedDuringGesture.current = false;
          panStart.current = latestDragOffset.current;
          const touches = event.nativeEvent.touches;
          pinchActive.current = touches.length >= 2;
          pinchStartDistance.current = getTouchDistance(touches);
          pinchStartZoom.current = zoom;
        },
        onPanResponderMove: (_event, gesture) => {
          const touches = _event.nativeEvent.touches;
          if (touches.length >= 2) {
            const distance = getTouchDistance(touches);
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = distance;
              pinchStartZoom.current = zoom;
            }
            if (distance > 0 && pinchStartDistance.current > 0) {
              movedDuringGesture.current = true;
              pinchActive.current = true;
              const zoomDelta = Math.round(
                Math.log2(distance / pinchStartDistance.current) * 2,
              );
              setZoom(clampMapZoom(pinchStartZoom.current + zoomDelta));
            }
            setDragOffset({
              x: panStart.current.x + gesture.dx,
              y: panStart.current.y + gesture.dy,
            });
            return;
          }

          pinchActive.current = false;
        },
        onPanResponderRelease: (event) => {
          if (pinchActive.current) {
            pinchActive.current = false;
            pinchStartDistance.current = 0;
            commitDrag(latestDragOffset.current);
            return;
          }
          pinchStartDistance.current = 0;
          pickPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
      }),
    [canvasLeft, canvasTop, center, mapData.topLeft, onChange, zoom],
  );

  const mapWheelProps =
    Platform.OS === "web"
      ? ({
          onWheel: (event: {
            deltaY?: number;
            nativeEvent?: { deltaY?: number };
            preventDefault?: () => void;
          }) => {
            event.preventDefault?.();
            const deltaY = event.deltaY ?? event.nativeEvent?.deltaY ?? 0;
            if (Math.abs(deltaY) < 4) {
              return;
            }
            const now = Date.now();
            if (now - lastWheelZoomAt.current < 110) {
              return;
            }
            lastWheelZoomAt.current = now;
            applyZoomDelta(deltaY > 0 ? -1 : 1);
          },
        } as object)
      : {};

  return (
    <View
      style={styles.locationPickerMap}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      {...mapWheelProps}
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
                left: selectedPoint.left - 11,
                top: selectedPoint.top - 25,
              },
            ]}
          >
            <LocationTargetIcon />
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
    </View>
  );
}
function ListHome({
  matches,
  myMatches,
  currentUserId,
  selectedMatchId,
  onSelect,
  onOpenDetail,
  loading,
}: {
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  currentUserId: string | null;
  selectedMatchId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  onLeave: (id: string) => void;
  loading: boolean;
}) {
  const renderedMatches = matches;
  const emptyTitle = "No hay partidos cerca";
  const emptyText = "Crea un partido con el boton central.";

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.listLoadingRow}>
          <ActivityIndicator color="#8FEA6A" />
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
            <Pressable
              key={match.id}
              style={[
                styles.listCard,
                match.id === selectedMatchId && styles.listCardSelected,
              ]}
              onPress={() => {
                onSelect(match.id);
                onOpenDetail(match.id);
              }}
            >
              <ImageBackground
                source={{
                  uri: getMatchCover(match),
                }}
                imageStyle={styles.listCardImage}
                style={styles.listCardImageWrap}
              >
                <View style={styles.listCardOverlay} />
                <View style={styles.listCardPressArea}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.listCardTitle} numberOfLines={1}>
                      {match.title}
                    </Text>
                    <StatusBadge status={match.status} />
                  </View>
                  <View style={styles.matchMetaRow}>
                    <Text style={styles.matchDatePill} numberOfLines={1}>
                      {formatDate(match.startsAt)}
                    </Text>
                    <Text style={styles.matchCityPill} numberOfLines={1}>
                      {match.field?.city ?? "Sin ciudad"}
                    </Text>
                    {mine || participating ? (
                      <Text style={styles.matchMinePill}>Apuntado</Text>
                    ) : null}
                  </View>
                  <Text style={styles.listCardMeta} numberOfLines={1}>
                    {match.field?.name ?? "Campo por confirmar"}
                  </Text>
                  <OccupancyBar match={match} />
                </View>
                <View style={styles.listDetailButton}>
                  <Text style={styles.listDetailText}>Ver detalle</Text>
                </View>
              </ImageBackground>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
function SelectedPopup({
  match,
  onOpenDetail,
  onDirections,
  onJoin,
  onClose,
  loading,
}: {
  match: MatchResponse;
  onOpenDetail: (id: string) => void;
  onDirections: (match: MatchResponse) => void;
  onJoin: (id: string, team: TeamSide) => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.popupCard}>
      <ImageBackground
        source={{
          uri: getMatchCover(match),
        }}
        style={styles.popupImageWrap}
        imageStyle={styles.popupImage}
      >
        <View style={styles.popupImageOverlay} />
        <View style={styles.popupHeaderRow}>
          <View>
            <Text style={styles.popupLabel}>Partido seleccionado</Text>
            <Text style={styles.popupMetaLight}>{formatDate(match.startsAt)}</Text>
          </View>
          <View style={styles.popupHeaderActions}>
            <StatusBadge status={match.status} />
            <Pressable style={styles.popupCloseButton} onPress={onClose}>
              <Text style={styles.popupCloseText}>x</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.popupBody}>
          <Text style={styles.popupTitle}>{match.title}</Text>
          <Text style={styles.popupMeta}>
            {match.field?.name ?? "Campo por confirmar"} -{" "}
            {match.field?.city ?? "Sin ciudad"}
          </Text>
          <Text style={styles.popupPrice}>
            {formatPriceFromCents(match.pricePerPersonCents)} por persona
          </Text>
          <OccupancyBar match={match} />
          <View style={styles.popupActions}>
            <Pressable
              style={styles.popupDarkButton}
              onPress={() => onOpenDetail(match.id)}
              disabled={loading}
            >
              <Text style={styles.popupDarkText}>Ver detalle</Text>
            </Pressable>
            <Pressable
              style={styles.popupDarkButton}
              onPress={() => onDirections(match)}
              disabled={loading}
            >
              <Text style={styles.popupDarkText}>Como llegar</Text>
            </Pressable>
            <Pressable
              style={styles.popupLimeButton}
              onPress={() => onJoin(match.id, "A")}
              disabled={loading || !isMatchOpen(match) || isTeamFull(match, "A")}
            >
              <Text style={styles.popupLimeText}>
                {match.status === "FULL"
                  ? "Completo"
                  : isMatchOpen(match)
                    ? "Unirme"
                    : "Cerrado"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
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

function TeamRoster({
  match,
  onOpenProfile,
}: {
  match: MatchResponse;
  onOpenProfile?: (userId: string) => void;
}) {
  const teamA = match.teams?.teamA ?? [];
  const teamB = match.teams?.teamB ?? [];

  return (
    <View style={styles.rosterGrid}>
      <RosterColumn title="Equipo A" players={teamA} onOpenProfile={onOpenProfile} />
      <RosterColumn title="Equipo B" players={teamB} onOpenProfile={onOpenProfile} />
    </View>
  );
}

function RosterColumn({
  title,
  players,
  onOpenProfile,
}: {
  title: string;
  players: MatchPlayerResponse[];
  onOpenProfile?: (userId: string) => void;
}) {
  return (
    <View style={styles.rosterColumn}>
      <Text style={styles.rosterTitle}>{title}</Text>
      {players.length === 0 ? (
        <Text style={styles.rosterEmpty}>Sin jugadores</Text>
      ) : (
        players.map((player) => (
          <Pressable
            key={player.participationId}
            style={styles.rosterPlayer}
            onPress={() => onOpenProfile?.(player.userId)}
          >
            <View style={styles.rosterAvatar}>
              <Text style={styles.rosterAvatarText}>
                {(player.username || player.displayName).charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.rosterName} numberOfLines={1}>
              {publicHandle(player)}
            </Text>
          </Pressable>
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 4);

  return (
    <View style={[styles.bottomNav, { bottom: bottomInset + 2 }]}>
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

function CalendarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const { year, month } = getCalendarMonth(monthOffset);
  const firstDay = new Date(year, month, 1).getDay();
  const firstDayMondayBased = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDayMondayBased });
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const today = datePartsFromOffset(0);
  const monthName = new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => setMonthOffset((current) => Math.max(0, current - 1))}
        >
          <Text style={styles.calendarNavText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.calendarTitle}>{monthName}</Text>
        <Pressable
          style={styles.calendarNavButton}
          onPress={() => setMonthOffset((current) => Math.min(2, current + 1))}
        >
          <Text style={styles.calendarNavText}>{">"}</Text>
        </Pressable>
      </View>
      <View style={styles.calendarWeekRow}>
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <Text key={day} style={styles.calendarWeekText}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {blanks.map((_, index) => (
          <View key={`blank-${index}`} style={styles.calendarDayBlank} />
        ))}
        {days.map((day) => {
          const dateValue = monthDateParts(year, month, day);
          const selected = value === dateValue;
          const past = dateValue < today;
          return (
            <Pressable
              key={dateValue}
              style={[
                styles.calendarDay,
                selected && styles.calendarDaySelected,
                past && styles.calendarDayDisabled,
              ]}
              onPress={() => !past && onChange(dateValue)}
              disabled={past}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  selected && styles.calendarDayTextSelected,
                  past && styles.calendarDayTextDisabled,
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TimeWheel({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [currentHour = "19", currentMinute = "00"] = value.split(":");
  const hourScrollRef = useRef<ScrollView | null>(null);
  const minuteScrollRef = useRef<ScrollView | null>(null);
  const hours = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0"),
  );
  const minutes = ["00", "15", "30", "45"];
  const wheelItemHeight = 40;

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  function selectFromScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
    values: string[],
    currentOtherValue: string,
    type: "hour" | "minute",
  ) {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / wheelItemHeight);
    const index = Math.max(0, Math.min(values.length - 1, rawIndex));
    const selected = values[index];
    if (type === "hour") {
      updateTime(selected, currentOtherValue);
      return;
    }
    updateTime(currentOtherValue, selected);
  }

  useEffect(() => {
    const hourIndex = Math.max(0, hours.indexOf(currentHour));
    const minuteIndex = Math.max(0, minutes.indexOf(currentMinute));
    hourScrollRef.current?.scrollTo({
      y: hourIndex * wheelItemHeight,
      animated: false,
    });
    minuteScrollRef.current?.scrollTo({
      y: minuteIndex * wheelItemHeight,
      animated: false,
    });
  }, [currentHour, currentMinute]);

  return (
    <View style={styles.timeWheelBlock}>
      <Text style={styles.fieldLabel}>Hora</Text>
      <View style={styles.timeWheelCard}>
        <View style={styles.timeWheelColumn}>
          <Text style={styles.timeWheelLabel}>Hora</Text>
          <ScrollView
            ref={hourScrollRef}
            style={styles.timeWheelScroll}
            contentContainerStyle={styles.timeWheelContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            snapToInterval={wheelItemHeight}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, hours, currentMinute, "hour")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, hours, currentMinute, "hour")
            }
          >
            {hours.map((hour) => {
              const active = hour === currentHour;
              return (
                <Pressable
                  key={hour}
                  style={[styles.timeWheelItem, active && styles.timeWheelItemActive]}
                  onPress={() => updateTime(hour, currentMinute)}
                >
                  <Text
                    style={[
                      styles.timeWheelText,
                      active && styles.timeWheelTextActive,
                    ]}
                  >
                    {hour}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.timeWheelSeparator}>:</Text>
        <View style={styles.timeWheelColumn}>
          <Text style={styles.timeWheelLabel}>Min</Text>
          <ScrollView
            ref={minuteScrollRef}
            style={styles.timeWheelScroll}
            contentContainerStyle={styles.timeWheelContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            snapToInterval={wheelItemHeight}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
              selectFromScroll(event, minutes, currentHour, "minute")
            }
            onScrollEndDrag={(event) =>
              selectFromScroll(event, minutes, currentHour, "minute")
            }
          >
            {minutes.map((minute) => {
              const active = minute === currentMinute;
              return (
                <Pressable
                  key={minute}
                  style={[styles.timeWheelItem, active && styles.timeWheelItemActive]}
                  onPress={() => updateTime(currentHour, minute)}
                >
                  <Text
                    style={[
                      styles.timeWheelText,
                      active && styles.timeWheelTextActive,
                    ]}
                  >
                    {minute}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function CreatePreviewModal({
  visible,
  loading,
  title,
  fieldName,
  city,
  date,
  time,
  players,
  pricePerPerson,
  latitude,
  longitude,
  onClose,
  onCreate,
}: {
  visible: boolean;
  loading: boolean;
  title: string;
  fieldName: string;
  city: string;
  date: string;
  time: string;
  players: string;
  pricePerPerson: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewSheet}>
          <View style={styles.previewBubbleOne} />
          <View style={styles.previewBubbleTwo} />
          <View style={styles.previewHandle} />
          <Text style={styles.previewEyebrow}>Vista previa</Text>
          <Text style={styles.previewTitle}>{title.trim() || "Partido Footy"}</Text>
          <Text style={styles.previewMeta}>
            {fieldName.trim() || "Campo por confirmar"} -{" "}
            {city.trim() || "Ciudad pendiente"}
          </Text>
          <View style={styles.previewInfoGrid}>
            <PreviewInfo label="Fecha" value={`${date} - ${time}`} />
            <PreviewInfo label="Formato" value={`${players} vs ${players}`} />
            <PreviewInfo
              label="Precio"
              value={`${formatDraftPrice(pricePerPerson)} por persona`}
            />
            <PreviewInfo
              label="Ubicacion"
              value={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
            />
          </View>
          <View style={styles.previewActions}>
            <Pressable style={styles.previewSecondaryButton} onPress={onClose}>
              <Text style={styles.previewSecondaryText}>Editar</Text>
            </Pressable>
            <Pressable
              style={styles.previewPrimaryButton}
              onPress={onCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A110E" />
              ) : (
                <Text style={styles.previewPrimaryText}>Crear partido</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewInfoCard}>
      <Text style={styles.previewInfoLabel}>{label}</Text>
      <Text style={styles.previewInfoValue}>{value}</Text>
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

function QuickChip({
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
      style={[styles.quickChip, active && styles.quickChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
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
      <View style={styles.modeIconBox}>
        {label === "Mapa" ? (
          <>
            <View style={styles.modeMapPin} />
            <View style={styles.modeMapDot} />
          </>
        ) : (
          <>
            <View style={styles.modeListLine} />
            <View style={styles.modeListLine} />
            <View style={styles.modeListLineShort} />
          </>
        )}
      </View>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}
function HomeMetric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.homeMetric}>
      <Text style={styles.homeMetricValue}>{value}</Text>
      <Text style={styles.homeMetricLabel}>{label}</Text>
    </View>
  );
}

function QuickMessageButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      style={[styles.quickMessageButton, disabled && styles.quickMessageDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.quickMessageText}>{label}</Text>
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
      <ImageBackground
        source={{
          uri: getMatchCover(match),
        }}
        imageStyle={styles.compactMatchImage}
        style={styles.compactMatchImageWrap}
      >
        <View style={styles.compactMatchOverlay} />
        <View style={styles.compactMatchContent}>
          <Text style={styles.compactMatchTitle}>{match.title}</Text>
          <Text style={styles.compactMatchMeta}>
            {formatDate(match.startsAt)} -{" "}
            {match.field?.name ?? "Campo pendiente"}
          </Text>
          <Text style={styles.compactMatchPlace}>
            {match.field?.city ?? "Sin ciudad"}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
function StatusBadge({ status }: { status: string }) {
  const open = status === "OPEN";
  const full = status === "FULL";
  return (
    <View
      style={[
        styles.statusPill,
        full && styles.statusPillFull,
        !open && !full && styles.statusPillClosed,
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          full && styles.statusPillTextFull,
          !open && !full && styles.statusPillTextClosed,
        ]}
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
  introScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  introVideo: {
    flex: 1,
    backgroundColor: "#000000",
  },
  introSkipButton: {
    position: "absolute",
    right: 18,
    top: Platform.OS === "android" ? 34 : 54,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  introSkipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  logoMark: {
    backgroundColor: "#8FEA6A",
    overflow: "hidden",
    position: "relative",
  },
  logoDot: {
    position: "absolute",
    backgroundColor: "#0B2915",
  },
  logoSlash: {
    position: "absolute",
    backgroundColor: "#0B2915",
    transform: [{ rotate: "-18deg" }],
  },
  authHeroBlock: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    gap: Platform.OS === "android" ? 7 : 9,
  },
  authLogoHalo: {
    width: Platform.OS === "android" ? 112 : 128,
    height: Platform.OS === "android" ? 112 : 128,
    borderRadius: Platform.OS === "android" ? 34 : 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,243,81,0.10)",
    borderWidth: 1,
    borderColor: "rgba(179,243,81,0.18)",
    overflow: "hidden",
  },
  authLogoBubbleOne: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    right: -24,
    top: -20,
    backgroundColor: "rgba(179,243,81,0.28)",
  },
  authLogoBubbleTwo: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    left: -18,
    bottom: -14,
    backgroundColor: "rgba(227,219,208,0.12)",
  },
  homeTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  screenBubbles: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  screenBubbleOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -130,
    top: 20,
    backgroundColor: "rgba(179,243,81,0.08)",
  },
  screenBubbleTwo: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    left: -110,
    bottom: 140,
    backgroundColor: "rgba(227,219,208,0.045)",
  },
  screenBubbleThree: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: 34,
    bottom: 52,
    backgroundColor: "rgba(179,243,81,0.045)",
  },
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
    paddingHorizontal: Platform.OS === "android" ? 18 : 24,
    paddingTop: Platform.OS === "android" ? 34 : 24,
    paddingBottom: 28,
    gap: Platform.OS === "android" ? 14 : 18,
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
    fontSize: Platform.OS === "android" ? 42 : 52,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  authKicker: {
    color: "#8FEA6A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
    textAlign: "center",
  },
  authCopy: {
    color: "#BDB6AE",
    fontSize: Platform.OS === "android" ? 15 : 17,
    lineHeight: Platform.OS === "android" ? 21 : 24,
    maxWidth: 360,
    textAlign: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "#E3DBD0",
    borderRadius: 18,
    padding: Platform.OS === "android" ? 12 : 14,
    gap: Platform.OS === "android" ? 12 : 14,
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
    backgroundColor: "rgba(179,243,81,0.22)",
  },
  authCardBubbleTwo: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    left: -44,
    bottom: -38,
    backgroundColor: "rgba(10,17,14,0.05)",
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
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 6,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    flexDirection: "row",
    gap: 7,
  },
  modeButtonActive: {
    backgroundColor: "rgba(127,239,155,0.20)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.38)",
  },
  modeIconBox: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modeMapPin: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(227,219,208,0.76)",
  },
  modeMapDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#7FEF9B",
  },
  modeListLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(227,219,208,0.76)",
    marginVertical: 1,
  },
  modeListLineShort: {
    width: 11,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(227,219,208,0.76)",
    marginVertical: 1,
    alignSelf: "flex-start",
  },
  modeIcon: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 17,
    fontWeight: "900",
  },
  modeText: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 14,
    fontWeight: "900",
  },
  modeTextActive: { color: "#F7F1E8" },
  fieldBlock: { gap: 5 },
  fieldLabel: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  input: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    color: "#F7F1E8",
    fontSize: 14,
  },
  authButton: {
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  authNotice: { color: "#4A4A4A", fontSize: 13 },
  authDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(10,17,14,0.12)",
  },
  authDividerText: {
    color: "rgba(10,17,14,0.54)",
    fontSize: 12,
    fontWeight: "900",
  },
  googleButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(10,17,14,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleButtonDisabled: { opacity: 0.62 },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(10,17,14,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleMarkText: { color: "#4285F4", fontSize: 17, fontWeight: "900" },
  googleButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
  googleHint: {
    color: "rgba(10,17,14,0.55)",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
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
  statusBarMock: {
    height: Platform.OS === "android" ? 10 : 18,
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
    paddingHorizontal: Platform.OS === "web" ? 0 : 14,
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
  homeMetric: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "rgba(227,219,208,0.09)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  homeMetricValue: { color: "#8FEA6A", fontSize: 22, fontWeight: "900" },
  homeMetricLabel: {
    color: "rgba(227,219,208,0.72)",
    fontSize: 9,
    fontWeight: "900",
    marginTop: -1,
  },
  screenTitle: {
    color: "#E3DBD0",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
  },
  homeSearchWrap: {
    paddingHorizontal: Platform.OS === "web" ? 0 : 14,
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
    paddingHorizontal: Platform.OS === "web" ? 0 : 14,
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
  mapStage: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderTopLeftRadius: Platform.OS === "web" ? 28 : 30,
    borderTopRightRadius: Platform.OS === "web" ? 28 : 30,
    borderBottomLeftRadius: Platform.OS === "web" ? 28 : 0,
    borderBottomRightRadius: Platform.OS === "web" ? 28 : 0,
    overflow: "hidden",
    backgroundColor: "#000000",
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
  mapBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
    backgroundColor: "rgba(10,17,14,0.54)",
    zIndex: 8,
    overflow: "hidden",
  },
  mapBottomCircleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -80,
    bottom: -140,
    backgroundColor: "rgba(143,234,106,0.10)",
  },
  mapBottomCircleTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    left: -70,
    bottom: -90,
    backgroundColor: "rgba(227,219,208,0.08)",
  },
  mapLocationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: "rgba(7,16,10,0.92)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    zIndex: 18,
  },
  locationIcon: {
    width: 22,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  locationIconHead: {
    position: "absolute",
    width: 16,
    height: 19,
    borderRadius: 8,
    backgroundColor: "#149BFF",
    alignItems: "center",
    justifyContent: "center",
    top: 1,
    zIndex: 2,
  },
  locationIconPoint: {
    position: "absolute",
    width: 0,
    height: 0,
    top: 18,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#149BFF",
    zIndex: 1,
  },
  locationIconHole: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#07100A",
  },
  mapPickerIcon: {
    width: 28,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPickerRoadOne: {
    position: "absolute",
    width: 25,
    height: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(184,255,208,0.95)",
    transform: [{ rotate: "-14deg" }],
  },
  mapPickerRoadTwo: {
    position: "absolute",
    width: 20,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(127,239,155,0.58)",
    transform: [{ rotate: "18deg" }],
  },
  mapPickerPinHead: {
    position: "absolute",
    width: 13,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#7FEF9B",
    alignItems: "center",
    justifyContent: "center",
    top: 3,
  },
  mapPickerPinPoint: {
    position: "absolute",
    width: 0,
    height: 0,
    top: 16,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#7FEF9B",
  },
  mapPickerPinHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#07100A",
  },
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
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.82)",
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
    backgroundColor: "#8FEA6A",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  mapLoadingText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  mapMarkerWrap: {
  position: "absolute",
  width: 44,
  height: 52,
  alignItems: "center",
  justifyContent: "center",
  zIndex: 12,
},

mapMarkerHalo: {
  position: "absolute",
  top: 3,
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(143,234,106,0.18)",
  borderWidth: 1,
  borderColor: "rgba(143,234,106,0.35)",
},

mapMarkerHaloActive: {
  width: 50,
  height: 50,
  borderRadius: 25,
  top: -1,
  backgroundColor: "rgba(143,234,106,0.28)",
  borderColor: "#8FEA6A",
},

mapMarkerPin: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: "#8FEA6A",
  borderWidth: 3,
  borderColor: "#0A110E",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 5 },
  elevation: 8,
},

mapMarkerPinActive: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: "#B8FFD0",
  borderColor: "#F7F1E8",
},

mapMarkerClusterPin: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: "#F7F1E8",
  borderColor: "#8FEA6A",
},

mapMarkerTail: {
  marginTop: -3,
  width: 0,
  height: 0,
  borderLeftWidth: 7,
  borderRightWidth: 7,
  borderTopWidth: 10,
  borderLeftColor: "transparent",
  borderRightColor: "transparent",
  borderTopColor: "#0A110E",
},

mapMarkerTailActive: {
  borderTopColor: "#F7F1E8",
},

mapMarkerDot: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#0A110E",
},

mapMarkerBall: {
  fontSize: 16,
  lineHeight: 18,
},

mapMarkerCount: {
  color: "#0A110E",
  fontSize: 15,
  fontWeight: "900",
},
  popupCard: {
    position: "absolute",
    left: Platform.OS === "web" ? "50%" : 16,
    right: Platform.OS === "web" ? undefined : 16,
    width: Platform.OS === "web" ? 420 : undefined,
    transform: Platform.OS === "web" ? [{ translateX: -210 }] : undefined,
    bottom: Platform.OS === "android" ? 82 : 78,
    borderRadius: 26,
    backgroundColor: "#0A110E",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    zIndex: 22,
  },
  popupImageWrap: { minHeight: 238, padding: 14, justifyContent: "space-between" },
  popupImage: { borderRadius: 26, opacity: 0.66 },
  popupImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.66)",
  },
  popupBody: { gap: 9 },
  popupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  popupHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  popupCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  popupCloseText: { color: "#F7F1E8", fontSize: 16, fontWeight: "900" },
  popupLabel: {
    color: "#8FEA6A",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  popupTitle: { color: "#F7F1E8", fontSize: 25, fontWeight: "900" },
  popupMeta: { color: "rgba(247,241,232,0.84)", fontSize: 13, lineHeight: 19 },
  popupPrice: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(143,234,106,0.16)",
    color: "#E4FFD8",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  popupMetaLight: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  popupActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  popupDarkButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.14)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  popupDarkText: { color: "#F7F1E8", fontWeight: "900" },
  popupLimeButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 20,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  popupLimeText: { color: "#0A110E", fontWeight: "900" },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === "android" ? 116 : 104,
    gap: 10,
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
    borderRadius: 18,
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
  filterButtonActive: {
    backgroundColor: "rgba(127,239,155,0.20)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.36)",
  },
  filterButtonText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  filterButtonTextActive: { color: "#F7F1E8" },
  listStatsRow: { flexDirection: "row", gap: 12 },
  listStat: {
    flex: 1,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.08)",
  },
  listStatValue: { color: "#8FEA6A", fontSize: 28, fontWeight: "900" },
  listStatLabel: {
    color: "#E3DBD0",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  listCard: {
    minHeight: 142,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  listCardImageWrap: {
    minHeight: 146,
    padding: 12,
    justifyContent: "space-between",
    gap: 8,
  },
  listCardImage: { borderRadius: 22, opacity: 0.42 },
  listCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.56)",
  },
  listCardPressArea: { gap: 6 },
  listCardSelected: {
    borderWidth: 2,
    borderColor: "#7FEF9B",
    shadowColor: "#7FEF9B",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  listCardTitle: { flex: 1, color: "#F7F1E8", fontSize: 17, fontWeight: "900" },
  statusPill: {
    paddingHorizontal: 10,
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillFull: { backgroundColor: "#8FEA6A" },
  statusPillClosed: { backgroundColor: "rgba(217,88,88,0.18)" },
  statusPillText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  statusPillTextFull: { color: "#051116" },
  statusPillTextClosed: { color: "#8F2727" },
  listCardMeta: {
    color: "rgba(227,219,208,0.86)",
    fontSize: 14,
    fontWeight: "800",
  },
  matchMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  matchDatePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#0A110E",
    color: "#E3DBD0",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchCityPill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#8FEA6A",
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchMinePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(227,219,208,0.16)",
    color: "#E3DBD0",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listDetailButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: 14,
    backgroundColor: "rgba(179,243,81,0.94)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listDetailText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  occupancyBlock: { marginTop: 4, gap: 5 },
  occupancyTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(227,219,208,0.24)",
    overflow: "hidden",
  },
  occupancyFill: { height: 8, borderRadius: 8, backgroundColor: "#8FEA6A" },
  occupancyText: {
    color: "rgba(227,219,208,0.90)",
    fontSize: 9,
    fontWeight: "900",
  },
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
  bottomNav: {
    position: "absolute",
    left: Platform.OS === "web" ? "50%" : 18,
    right: Platform.OS === "web" ? undefined : 18,
    width: Platform.OS === "web" ? 420 : undefined,
    transform: Platform.OS === "web" ? [{ translateX: -210 }] : undefined,
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.20)",
    flexDirection: "row",
    padding: 5,
    gap: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  navItem: {
    flex: 1,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navItemActive: { backgroundColor: "#8FEA6A" },
  navCreateItem: {},
  navCreateIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: -1,
  },
  navIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 14,
    fontWeight: "900",
  },
  navIconActive: { color: "#0A110E" },
  navLabel: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  navLabelActive: { color: "#0A110E" },
  profileContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 16,
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
  editIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-38deg" }],
  },
  editIconBody: {
    width: 15,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#F7F1E8",
  },
  editIconTip: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#8FEA6A",
    marginLeft: -1,
  },
  closeEditIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeEditLine: {
    position: "absolute",
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F7F1E8",
  },
  closeEditLineOne: { transform: [{ rotate: "45deg" }] },
  closeEditLineTwo: { transform: [{ rotate: "-45deg" }] },
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
  positionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 19,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  positionButtonActive: { backgroundColor: "#8FEA6A", borderColor: "#8FEA6A" },
  positionButtonText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  positionButtonTextActive: { color: "#0A110E" },
  profileStats: { flexDirection: "row", gap: 8 },
  profileStat: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(227,219,208,0.10)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.12)",
    padding: 12,
    alignItems: "center",
  },
  profileStatValue: { color: "#8FEA6A", fontSize: 20, fontWeight: "900" },
  profileStatLabel: {
    color: "#E3DBD0",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  profileSection: { gap: 12 },
  profileSectionTitle: { color: "#E3DBD0", fontSize: 17, fontWeight: "900" },
  profileEmpty: { color: "#9CA3AF", fontSize: 14 },
  compactMatch: {
    minHeight: 118,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#0A110E",
  },
  compactMatchImageWrap: {
    flex: 1,
    minHeight: 118,
    justifyContent: "flex-end",
  },
  compactMatchImage: { borderRadius: 26, opacity: 0.46 },
  compactMatchOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(10,17,14,0.56)",
  },
  compactMatchContent: { padding: 16, gap: 4 },
  compactMatchTitle: { color: "#F7F1E8", fontSize: 18, fontWeight: "900" },
  compactMatchMeta: { color: "rgba(227,219,208,0.82)", fontSize: 13 },
  compactMatchPlace: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  createContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 16,
    gap: 16,
  },
  locationScreen: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 920 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 22,
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
  locationPickerMap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
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
    borderRadius: 14,
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
    borderRadius: 14,
    backgroundColor: "#B7F36B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationSearchButtonText: {
    color: "#0A110E",
    fontSize: 9,
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
    width: 22,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
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
  calendarCard: {
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 9,
    gap: 8,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(247,241,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarNavText: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  calendarTitle: {
    color: "#F7F1E8",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarWeekText: {
    width: "14.28%",
    color: "rgba(247,241,232,0.58)",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
  },
  calendarDayBlank: { width: "14.28%", height: 32 },
  calendarDay: {
    width: "14.28%",
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  calendarDaySelected: { backgroundColor: "#8FEA6A" },
  calendarDayDisabled: { opacity: 0.28 },
  calendarDayText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  calendarDayTextSelected: { color: "#0A110E" },
  calendarDayTextDisabled: { color: "rgba(247,241,232,0.40)" },
  timeWheelBlock: { gap: 7 },
  timeWheelCard: {
    minHeight: 160,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  timeWheelColumn: { flex: 1, gap: 7 },
  timeWheelLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
  },
  timeWheelScroll: { height: 120, maxHeight: 120 },
  timeWheelContent: { gap: 0, paddingVertical: 40 },
  timeWheelItem: {
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  timeWheelItemActive: { backgroundColor: "#8FEA6A" },
  timeWheelText: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  timeWheelTextActive: { color: "#0A110E" },
  timeWheelSeparator: {
    color: "#8FEA6A",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
  },
  choiceBlock: { gap: 7 },
  quickChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipActive: {
    backgroundColor: "#8FEA6A",
    borderColor: "#8FEA6A",
  },
  quickChipText: { color: "rgba(247,241,232,0.78)", fontSize: 11, fontWeight: "900" },
  quickChipTextActive: { color: "#0A110E" },
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
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
  },
  previewSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#07120D",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.14)",
    overflow: "hidden",
    padding: 18,
    paddingBottom: 24,
    gap: 12,
  },
  previewBubbleOne: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -60,
    top: -74,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  previewBubbleTwo: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    left: -44,
    bottom: -42,
    backgroundColor: "rgba(143,234,106,0.10)",
  },
  previewHandle: {
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(247,241,232,0.22)",
    alignSelf: "center",
    marginBottom: 4,
  },
  previewEyebrow: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewTitle: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  previewMeta: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  previewInfoGrid: { gap: 8 },
  previewInfoCard: {
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 12,
    gap: 3,
  },
  previewInfoLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewInfoValue: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  previewActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  previewSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewSecondaryText: { color: "#F7F1E8", fontWeight: "900" },
  previewPrimaryButton: {
    flex: 1.25,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  previewPrimaryText: { color: "#0A110E", fontWeight: "900" },
  detailContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 820 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 16,
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
  teamGrid: { flexDirection: "row", gap: 10, marginTop: 4 },
  teamBox: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    gap: 3,
  },
  teamBoxFull: { opacity: 0.62 },
  teamBoxLabel: { color: "rgba(247,241,232,0.62)", fontSize: 12, fontWeight: "900" },
  teamBoxValue: { color: "#F7F1E8", fontSize: 24, fontWeight: "900" },
  teamBoxMeta: { color: "#8FEA6A", fontSize: 11, fontWeight: "800" },
  rosterGrid: { flexDirection: "row", gap: 10, marginTop: 2 },
  rosterColumn: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(10,17,14,0.34)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    padding: 12,
    gap: 8,
  },
  rosterTitle: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  rosterEmpty: { color: "rgba(247,241,232,0.54)", fontSize: 12, fontWeight: "800" },
  rosterPlayer: { flexDirection: "row", alignItems: "center", gap: 8 },
  rosterAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  rosterAvatarText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  rosterName: { flex: 1, color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  actionButtonDisabled: { opacity: 0.46 },
  publicProfileBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  refreshIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshArrowTop: {
    position: "absolute",
    width: 14,
    height: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#7FEF9B",
    borderTopLeftRadius: 9,
    left: 3,
    top: 4,
  },
  refreshArrowHeadTop: {
    position: "absolute",
    width: 7,
    height: 7,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#7FEF9B",
    right: -2,
    top: -5,
    transform: [{ rotate: "45deg" }],
  },
  refreshArrowBottom: {
    position: "absolute",
    width: 14,
    height: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#7FEF9B",
    borderBottomRightRadius: 9,
    right: 3,
    bottom: 4,
  },
  refreshArrowHeadBottom: {
    position: "absolute",
    width: 7,
    height: 7,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#7FEF9B",
    left: -2,
    bottom: -5,
    transform: [{ rotate: "45deg" }],
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
  quickMessageButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.22)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickMessageDisabled: { opacity: 0.5 },
  quickMessageText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
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
