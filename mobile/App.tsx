import { StatusBar } from 'expo-status-bar';
import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AuthMode = 'login' | 'register';
type HomeMode = 'map' | 'list';
type AppTab = 'home' | 'create' | 'detail' | 'profile';
type TeamSide = 'A' | 'B';
type PlayerPosition = 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';

type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
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
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

const markerPositions = [
  { left: '20%', top: '33%' },
  { left: '74%', top: '26%' },
  { left: '36%', top: '58%' },
  { left: '78%', top: '78%' },
  { left: '50%', top: '45%' },
] as const;

function tomorrowDateParts() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [homeMode, setHomeMode] = useState<HomeMode>('map');
  const [appTab, setAppTab] = useState<AppTab>('home');
  const [displayName, setDisplayName] = useState('Jugador Footy');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123');
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myMatches, setMyMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Conectado a localhost:8080');
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePosition, setProfilePosition] = useState<PlayerPosition>('MIDFIELDER');

  const [newTitle, setNewTitle] = useState('Partido Footy');
  const [newFieldName, setNewFieldName] = useState('Campo Municipal Norte');
  const [newAddress, setNewAddress] = useState('Calle del Deporte 12');
  const [newCity, setNewCity] = useState('Madrid');
  const [newDate, setNewDate] = useState(tomorrowDateParts());
  const [newTime, setNewTime] = useState('19:00');
  const [newMaxPlayers, setNewMaxPlayers] = useState('5');

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

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? visibleMatches[0] ?? matches[0] ?? null;
  const selectedIsMine = selectedMatch ? myMatches.some((match) => match.id === selectedMatch.id) : false;

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
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
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [authHeaders],
  );

  const loadMatches = useCallback(async () => {
    const [available, mine] = await Promise.all([
      request<MatchResponse[]>('/api/matches'),
      token ? request<MatchResponse[]>('/api/matches/me') : Promise.resolve([]),
    ]);
    setMatches(available);
    setMyMatches(mine);
    setSelectedMatchId((current) => current ?? available[0]?.id ?? null);
  }, [request, token]);

  const loadMessages = useCallback(
    async (matchId: string) => {
      if (!token) {
        setMessages([]);
        return;
      }
      const nextMessages = await request<MessageResponse[]>(`/api/matches/${matchId}/messages`);
      setMessages(nextMessages);
    },
    [request, token],
  );

  useEffect(() => {
    loadMatches().catch(() => setNotice('Arranca el backend para ver datos reales'));
  }, [loadMatches]);

  useEffect(() => {
    if (appTab === 'detail' && selectedMatchId) {
      loadMessages(selectedMatchId).catch(() => setMessages([]));
    }
  }, [appTab, loadMessages, selectedMatchId]);

  function applyProfile(nextProfile: PlayerProfileResponse) {
    setProfile(nextProfile);
    setProfileFullName(nextProfile.fullName ?? nextProfile.displayName ?? '');
    setProfileCity(nextProfile.city ?? '');
    setProfileBio(nextProfile.bio ?? '');
    setProfilePosition(nextProfile.preferredPosition ?? 'MIDFIELDER');
  }

  async function loadProfile() {
    const nextProfile = await request<PlayerProfileResponse>('/api/profile/me');
    applyProfile(nextProfile);
  }

  async function saveProfile() {
    setLoading(true);
    try {
      const nextProfile = await request<PlayerProfileResponse>('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profileFullName,
          city: profileCity,
          bio: profileBio,
          preferredPosition: profilePosition,
        }),
      });
      applyProfile(nextProfile);
      setNotice('Perfil actualizado');
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function submitAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Introduce email y password.');
      return;
    }

    setLoading(true);
    try {
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login' ? { email, password } : { email, password, displayName };
      const auth = await request<AuthResponse>(path, { method: 'POST', body: JSON.stringify(body) });

      setToken(auth.accessToken);
      setUserName(auth.user.displayName);
      setNotice(`Sesion iniciada como ${auth.user.displayName}`);
      setAppTab('home');
      setHomeMode('map');

      const nextHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessToken}` };
      const [available, mine] = await Promise.all([
        fetch(`${API_BASE_URL}/api/matches`).then((response) => response.json() as Promise<MatchResponse[]>),
        fetch(`${API_BASE_URL}/api/matches/me`, { headers: nextHeaders }).then(
          (response) => response.json() as Promise<MatchResponse[]>,
        ),
      ]);
      setMatches(available);
      setMyMatches(mine);
      setSelectedMatchId(available[0]?.id ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      setNotice(message);
      Alert.alert('No se pudo entrar', message);
    } finally {
      setLoading(false);
    }
  }

  async function createMatch() {
    if (!newTitle.trim() || !newFieldName.trim() || !newDate.trim() || !newTime.trim()) {
      Alert.alert('Faltan datos', 'Completa titulo, campo, fecha y hora.');
      return;
    }

    const maxPlayers = Number(newMaxPlayers);
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 11) {
      Alert.alert('Revisa plazas', 'El maximo por equipo debe estar entre 1 y 11.');
      return;
    }

    setLoading(true);
    try {
      const created = await request<MatchResponse>('/api/matches', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          startsAt: new Date(`${newDate}T${newTime}:00`).toISOString(),
          maxPlayersPerTeam: maxPlayers,
          field: {
            name: newFieldName.trim(),
            address: newAddress.trim() || null,
            city: newCity.trim() || null,
            latitude: 40.416775,
            longitude: -3.70379,
          },
        }),
      });
      await loadMatches();
      setSelectedMatchId(created.id);
      setNotice('Partido creado');
      setAppTab('detail');
    } catch (error) {
      Alert.alert('No se pudo crear', error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function joinMatch(matchId: string, teamSide: TeamSide) {
    setLoading(true);
    try {
      await request(`/api/matches/${matchId}/join`, { method: 'POST', body: JSON.stringify({ teamSide }) });
      setNotice(`Te has unido al equipo ${teamSide}`);
      await loadMatches();
      if (appTab === 'detail') {
        await loadMessages(matchId).catch(() => setMessages([]));
      }
    } catch (error) {
      Alert.alert('No se pudo unir', error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function leaveMatch(matchId: string) {
    setLoading(true);
    try {
      await request(`/api/matches/${matchId}/leave`, { method: 'DELETE' });
      setNotice('Has salido del partido');
      await loadMatches();
      setMessages([]);
    } catch (error) {
      Alert.alert('No se pudo salir', error instanceof Error ? error.message : 'Error inesperado');
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
        method: 'POST',
        body: JSON.stringify({ content: messageText.trim() }),
      });
      setMessageText('');
      await loadMessages(selectedMatch.id);
    } catch (error) {
      Alert.alert('No se pudo enviar', error instanceof Error ? error.message : 'Unete al partido antes de escribir.');
    } finally {
      setLoading(false);
    }
  }

  function openDetail(matchId: string) {
    setSelectedMatchId(matchId);
    setAppTab('detail');
  }

  function logout() {
    setToken(null);
    setUserName(null);
    setMyMatches([]);
    setMessages([]);
    setProfile(null);
    setSelectedMatchId(matches[0]?.id ?? null);
    setNotice('Sesion cerrada');
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <View style={styles.authHeroMark}>
            <Text style={styles.authHeroLetter}>F</Text>
          </View>
          <Text style={styles.authBrand}>Footy</Text>
          <Text style={styles.authCopy}>Encuentra partidos cerca, unete a un equipo y organiza tu semana de futbol.</Text>

          <View style={styles.authCard}>
            <View style={styles.modeSwitchLight}>
              <ModeButton label="Entrar" active={authMode === 'login'} onPress={() => setAuthMode('login')} />
              <ModeButton label="Registro" active={authMode === 'register'} onPress={() => setAuthMode('register')} />
            </View>
            {authMode === 'register' ? (
              <Field label="Nombre" value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre visible" />
            ) : null}
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="email@footy.local" keyboardType="email-address" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Pressable style={styles.authButton} onPress={submitAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#0A110E" /> : <Text style={styles.authButtonText}>{authMode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</Text>}
            </Pressable>
            <Text style={styles.authNotice}>{notice}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (appTab === 'profile') {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.profileContent}>
          <TopStatus />
          <View style={styles.profileHeader}>
            <Pressable style={styles.backButton} onPress={() => setAppTab('home')}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.profileTitle}>Profile</Text>
            <Pressable style={styles.logoutPill} onPress={logout}>
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>

          <View style={styles.profileHero}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCore}>
                <Text style={styles.avatarInitial}>{(profile?.fullName || userName || 'F').charAt(0).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{profile?.fullName || userName}</Text>
            <Text style={styles.profileMeta}>{profile?.city ? `${profile.city} - ${positionLabel(profile.preferredPosition)}` : email || 'Jugador Footy'}</Text>
          </View>

          <View style={styles.profileEditor}>
            <Text style={styles.profileSectionTitle}>Datos de jugador</Text>
            <Field label="Nombre completo" value={profileFullName} onChangeText={setProfileFullName} placeholder="Tu nombre" />
            <Field label="Ciudad" value={profileCity} onChangeText={setProfileCity} placeholder="Madrid" />
            <View style={styles.positionGrid}>
              <PositionButton label="POR" value="GOALKEEPER" active={profilePosition === 'GOALKEEPER'} onPress={setProfilePosition} />
              <PositionButton label="DEF" value="DEFENDER" active={profilePosition === 'DEFENDER'} onPress={setProfilePosition} />
              <PositionButton label="MED" value="MIDFIELDER" active={profilePosition === 'MIDFIELDER'} onPress={setProfilePosition} />
              <PositionButton label="DEL" value="FORWARD" active={profilePosition === 'FORWARD'} onPress={setProfilePosition} />
            </View>
            <Field label="Bio" value={profileBio} onChangeText={setProfileBio} placeholder="Como juegas, disponibilidad, pierna buena..." multiline />
            <Pressable style={styles.authButton} onPress={saveProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#0A110E" /> : <Text style={styles.authButtonText}>Guardar perfil</Text>}
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
              <Text style={styles.profileEmpty}>Aun no tienes partidos activos.</Text>
            ) : (
              myMatches.map((match) => <CompactMatch key={match.id} match={match} onPress={() => openDetail(match.id)} />)
            )}
          </View>
        </ScrollView>
        <BottomNav active="profile" onHome={() => setAppTab('home')} onCreate={() => setAppTab('create')} onProfile={() => setAppTab('profile')} />
      </SafeAreaView>
    );
  }

  if (appTab === 'create') {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.createContent} keyboardShouldPersistTaps="handled">
          <TopStatus />
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Nuevo partido</Text>
              <Text style={styles.screenTitle}>Crear</Text>
            </View>
            <Pressable style={styles.closePill} onPress={() => setAppTab('home')}>
              <Text style={styles.closePillText}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={styles.createCard}>
            <Field label="Titulo" value={newTitle} onChangeText={setNewTitle} placeholder="Partido Footy" />
            <Field label="Campo" value={newFieldName} onChangeText={setNewFieldName} placeholder="Nombre del campo" />
            <Field label="Direccion" value={newAddress} onChangeText={setNewAddress} placeholder="Calle, numero" />
            <Field label="Ciudad" value={newCity} onChangeText={setNewCity} placeholder="Madrid" />
            <View style={styles.formRow}>
              <View style={styles.formHalf}><Field label="Fecha" value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" /></View>
              <View style={styles.formHalf}><Field label="Hora" value={newTime} onChangeText={setNewTime} placeholder="HH:mm" /></View>
            </View>
            <Field label="Jugadores por equipo" value={newMaxPlayers} onChangeText={setNewMaxPlayers} keyboardType="number-pad" placeholder="5" />
            <Pressable style={styles.authButton} onPress={createMatch} disabled={loading}>
              {loading ? <ActivityIndicator color="#0A110E" /> : <Text style={styles.authButtonText}>Crear partido</Text>}
            </Pressable>
          </View>
        </ScrollView>
        <BottomNav active="create" onHome={() => setAppTab('home')} onCreate={() => setAppTab('create')} onProfile={() => setAppTab('profile')} />
      </SafeAreaView>
    );
  }

  if (appTab === 'detail') {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
          <TopStatus />
          <View style={styles.screenHeader}>
            <View>
              <Text style={styles.smallLabel}>Detalle</Text>
              <Text style={styles.screenTitle}>Partido</Text>
            </View>
            <Pressable style={styles.closePill} onPress={() => setAppTab('home')}>
              <Text style={styles.closePillText}>Volver</Text>
            </Pressable>
          </View>

          {selectedMatch ? (
            <>
              <View style={styles.detailHeroCard}>
                <Text style={styles.detailTitle}>{selectedMatch.title}</Text>
                <Text style={styles.detailMeta}>{formatDate(selectedMatch.startsAt)}</Text>
                <Text style={styles.detailMeta}>{selectedMatch.field?.name ?? 'Campo por confirmar'} - {selectedMatch.field?.city ?? 'Sin ciudad'}</Text>
                <Text style={styles.detailMeta}>Organiza {selectedMatch.createdBy.displayName} - {selectedMatch.maxPlayersPerTeam} por equipo</Text>
                <TeamOccupancy match={selectedMatch} />
                {selectedIsMine ? (
                  <Pressable style={styles.ghostDangerButton} onPress={() => leaveMatch(selectedMatch.id)} disabled={loading}>
                    <Text style={styles.ghostDangerText}>Salir del partido</Text>
                  </Pressable>
                ) : (
                  <View style={styles.cardActions}>
                    <Pressable style={styles.darkJoinButton} onPress={() => joinMatch(selectedMatch.id, 'A')} disabled={loading || isTeamFull(selectedMatch, 'A')}>
                      <Text style={styles.darkJoinText}>{isTeamFull(selectedMatch, 'A') ? 'Completo' : 'Equipo A'}</Text>
                    </Pressable>
                    <Pressable style={styles.limeJoinButton} onPress={() => joinMatch(selectedMatch.id, 'B')} disabled={loading || isTeamFull(selectedMatch, 'B')}>
                      <Text style={styles.limeJoinText}>{isTeamFull(selectedMatch, 'B') ? 'Completo' : 'Equipo B'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.chatPanel}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatTitle}>Chat</Text>
                  <Pressable onPress={() => loadMessages(selectedMatch.id)} disabled={loading}>
                    <Text style={styles.refreshText}>Actualizar</Text>
                  </Pressable>
                </View>
                {messages.length === 0 ? (
                  <Text style={styles.profileEmpty}>{selectedIsMine ? 'Todavia no hay mensajes.' : 'Unete al partido para escribir en el chat.'}</Text>
                ) : (
                  messages.map((message) => (
                    <View key={message.id} style={styles.messageBubble}>
                      <Text style={styles.messageAuthor}>{message.author.displayName}</Text>
                      <Text style={styles.messageContent}>{message.content}</Text>
                      <Text style={styles.messageTime}>{formatTime(message.sentAt)}</Text>
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
                    editable={selectedIsMine && !loading}
                  />
                  <Pressable style={[styles.sendButton, !selectedIsMine && styles.sendButtonDisabled]} onPress={sendMessage} disabled={!selectedIsMine || loading}>
                    <Text style={styles.sendButtonText}>Enviar</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No hay partido seleccionado</Text>
              <Text style={styles.emptyText}>Vuelve al mapa o crea uno nuevo.</Text>
            </View>
          )}
        </ScrollView>
        <BottomNav active="home" onHome={() => setAppTab('home')} onCreate={() => setAppTab('create')} onProfile={() => setAppTab('profile')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <View style={styles.homeShell}>
        <TopStatus />
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.smallLabel}>Nearby matches</Text>
            <Text style={styles.homeTitle}>Footy</Text>
          </View>
          <Pressable style={styles.profileShortcut} onPress={() => setAppTab('profile')}>
            <Text style={styles.profileShortcutText}>{(userName ?? 'F').charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>

        <View style={styles.homeToolbar}>
          <View style={styles.modeSwitchDark}>
            <ModeButton label="Mapa" active={homeMode === 'map'} onPress={() => setHomeMode('map')} />
            <ModeButton label="Lista" active={homeMode === 'list'} onPress={() => setHomeMode('list')} />
          </View>
          <Pressable style={styles.createMiniButton} onPress={() => setAppTab('create')}>
            <Text style={styles.createMiniText}>+</Text>
          </Pressable>
        </View>

        {homeMode === 'map' ? (
          <MapHome
            matches={visibleMatches}
            selectedMatch={selectedMatch}
            selectedMatchId={selectedMatchId}
            onSelect={setSelectedMatchId}
            onOpenDetail={openDetail}
            onJoin={joinMatch}
            loading={loading}
          />
        ) : (
          <ListHome
            matches={visibleMatches}
            myMatches={myMatches}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedMatchId={selectedMatchId}
            onSelect={setSelectedMatchId}
            onOpenDetail={openDetail}
            onJoin={joinMatch}
            onLeave={leaveMatch}
            loading={loading}
          />
        )}
      </View>
      <BottomNav active="home" onHome={() => setAppTab('home')} onCreate={() => setAppTab('create')} onProfile={() => setAppTab('profile')} />
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

function MapHome({
  matches,
  selectedMatch,
  selectedMatchId,
  onSelect,
  onOpenDetail,
  onJoin,
  loading,
}: {
  matches: MatchResponse[];
  selectedMatch: MatchResponse | null;
  selectedMatchId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  loading: boolean;
}) {
  return (
    <View style={styles.mapStage}>
      <MapLines />
      {matches.slice(0, markerPositions.length).map((match, index) => {
        const position = markerPositions[index];
        const active = match.id === selectedMatchId;
        return (
          <Pressable key={match.id} style={[styles.mapMarkerWrap, position]} onPress={() => onSelect(match.id)}>
            <View style={[styles.mapMarkerHalo, active && styles.mapMarkerHaloActive]} />
            <View style={[styles.mapMarker, active && styles.mapMarkerActive]} />
          </Pressable>
        );
      })}
      {selectedMatch ? <SelectedPopup match={selectedMatch} onOpenDetail={onOpenDetail} onJoin={onJoin} loading={loading} /> : <EmptyPopup />}
    </View>
  );
}

function ListHome({
  matches,
  myMatches,
  searchQuery,
  selectedMatchId,
  onSelect,
  onOpenDetail,
  onSearchChange,
  onJoin,
  onLeave,
  loading,
}: {
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedMatchId: string | null;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onJoin: (id: string, team: TeamSide) => void;
  onLeave: (id: string) => void;
  loading: boolean;
}) {
  return (
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      <View style={styles.searchPill}>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Buscar partido, campo o ciudad"
          placeholderTextColor="rgba(227,219,208,0.72)"
          style={styles.searchInput}
        />
      </View>
      <View style={styles.listStatsRow}>
        <ListStat value={matches.length} label="Disponibles" />
        <ListStat value={myMatches.length} label="Mis partidos" />
      </View>
      {matches.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyTitle}>No hay partidos cerca</Text>
          <Text style={styles.emptyText}>Crea un partido con el boton central.</Text>
        </View>
      ) : (
        matches.map((match) => {
          const mine = myMatches.some((item) => item.id === match.id);
          return (
            <View key={match.id} style={[styles.listCard, match.id === selectedMatchId && styles.listCardSelected]}>
              <Pressable onPress={() => { onSelect(match.id); onOpenDetail(match.id); }}>
                <Text style={styles.listCardTitle}>{match.title}</Text>
                <Text style={styles.listCardMeta}>{formatDate(match.startsAt)}</Text>
                <Text style={styles.listCardMeta}>{match.field?.name ?? 'Campo por confirmar'}</Text>
                <OccupancyBar match={match} />
              </Pressable>
              {mine ? (
                <Pressable style={styles.ghostDangerButton} onPress={() => onLeave(match.id)} disabled={loading}>
                  <Text style={styles.ghostDangerText}>Salir</Text>
                </Pressable>
              ) : (
                <View style={styles.cardActions}>
                  <Pressable style={styles.darkJoinButton} onPress={() => onJoin(match.id, 'A')} disabled={loading || isTeamFull(match, 'A')}>
                    <Text style={styles.darkJoinText}>{isTeamFull(match, 'A') ? 'Completo' : 'Equipo A'}</Text>
                  </Pressable>
                  <Pressable style={styles.limeJoinButton} onPress={() => onJoin(match.id, 'B')} disabled={loading || isTeamFull(match, 'B')}>
                    <Text style={styles.limeJoinText}>{isTeamFull(match, 'B') ? 'Completo' : 'Equipo B'}</Text>
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

function SelectedPopup({ match, onOpenDetail, onJoin, loading }: { match: MatchResponse; onOpenDetail: (id: string) => void; onJoin: (id: string, team: TeamSide) => void; loading: boolean }) {
  return (
    <View style={styles.popupCard}>
      <View style={styles.popupAccent} />
      <View style={styles.popupBody}>
        <Text style={styles.popupLabel}>Partido seleccionado</Text>
        <Text style={styles.popupTitle}>{match.title}</Text>
        <Text style={styles.popupMeta}>{formatDate(match.startsAt)}</Text>
        <Text style={styles.popupMeta}>{match.field?.name ?? 'Campo por confirmar'} - {match.field?.city ?? 'Sin ciudad'}</Text>
        <OccupancyBar match={match} />
        <View style={styles.popupActions}>
          <Pressable style={styles.popupDarkButton} onPress={() => onOpenDetail(match.id)} disabled={loading}>
            <Text style={styles.popupDarkText}>Detalle</Text>
          </Pressable>
          <Pressable style={styles.popupLimeButton} onPress={() => onJoin(match.id, 'A')} disabled={loading || isTeamFull(match, 'A')}>
            <Text style={styles.popupLimeText}>Equipo A</Text>
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
        <Text style={styles.popupMeta}>Crea el primer partido desde el boton central.</Text>
      </View>
    </View>
  );
}

function MapLines() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.roadLine, { top: '16%', left: '-20%', width: '85%', transform: [{ rotate: '-18deg' }] }]} />
      <View style={[styles.roadLine, { top: '30%', left: '18%', width: '105%', transform: [{ rotate: '28deg' }] }]} />
      <View style={[styles.roadLine, { top: '48%', left: '-12%', width: '95%', transform: [{ rotate: '12deg' }] }]} />
      <View style={[styles.roadLine, { top: '64%', left: '18%', width: '100%', transform: [{ rotate: '-31deg' }] }]} />
      <View style={[styles.roadLineThin, { top: '22%', left: '44%', height: '70%', transform: [{ rotate: '5deg' }] }]} />
      <View style={[styles.roadLineThin, { top: '5%', left: '12%', height: '86%', transform: [{ rotate: '-10deg' }] }]} />
    </View>
  );
}

function OccupancyBar({ match }: { match: MatchResponse }) {
  const occupancy = match.occupancy;
  const totalCapacity = occupancy?.totalCapacity ?? match.maxPlayersPerTeam * 2;
  const totalPlayers = occupancy?.totalPlayers ?? 0;
  const percentage = totalCapacity > 0 ? Math.min(100, (totalPlayers / totalCapacity) * 100) : 0;

  return (
    <View style={styles.occupancyBlock}>
      <View style={styles.occupancyTrack}>
        <View style={[styles.occupancyFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.occupancyText}>{totalPlayers}/{totalCapacity} jugadores</Text>
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

function TeamBox({ label, value, max }: { label: string; value: number; max: number }) {
  const full = value >= max;
  return (
    <View style={[styles.teamBox, full && styles.teamBoxFull]}>
      <Text style={styles.teamBoxLabel}>{label}</Text>
      <Text style={styles.teamBoxValue}>{value}/{max}</Text>
      <Text style={styles.teamBoxMeta}>{full ? 'Completo' : `${max - value} plazas`}</Text>
    </View>
  );
}

function BottomNav({ active, onHome, onCreate, onProfile }: { active: AppTab; onHome: () => void; onCreate: () => void; onProfile: () => void }) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={[styles.navItem, active === 'home' && styles.navItemActive]} onPress={onHome}>
        <Text style={[styles.navIcon, active === 'home' && styles.navIconActive]}>H</Text>
        <Text style={[styles.navLabel, active === 'home' && styles.navLabelActive]}>Home</Text>
      </Pressable>
      <Pressable style={[styles.navCreateItem, active === 'create' && styles.navCreateItemActive]} onPress={onCreate}>
        <Text style={styles.navCreateIcon}>+</Text>
      </Pressable>
      <Pressable style={[styles.navItem, active === 'profile' && styles.navItemActive]} onPress={onProfile}>
        <Text style={[styles.navIcon, active === 'profile' && styles.navIconActive]}>P</Text>
        <Text style={[styles.navLabel, active === 'profile' && styles.navLabelActive]}>Profile</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} autoCapitalize="none" placeholderTextColor="#8A8F8B" style={styles.input} />
    </View>
  );
}

function PositionButton({ label, value, active, onPress }: { label: string; value: PlayerPosition; active: boolean; onPress: (value: PlayerPosition) => void }) {
  return (
    <Pressable style={[styles.positionButton, active && styles.positionButtonActive]} onPress={() => onPress(value)}>
      <Text style={[styles.positionButtonText, active && styles.positionButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
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

function ProfileStat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.profileStat}>
      <Text style={styles.profileStatValue}>{value}</Text>
      <Text style={styles.profileStatLabel}>{label}</Text>
    </View>
  );
}

function CompactMatch({ match, onPress }: { match: MatchResponse; onPress: () => void }) {
  return (
    <Pressable style={styles.compactMatch} onPress={onPress}>
      <Text style={styles.compactMatchTitle}>{match.title}</Text>
      <Text style={styles.compactMatchMeta}>{formatDate(match.startsAt)} - {match.field?.name ?? 'Campo pendiente'}</Text>
    </Pressable>
  );
}

function positionLabel(position: PlayerPosition | null | undefined) {
  switch (position) {
    case 'GOALKEEPER':
      return 'Portero';
    case 'DEFENDER':
      return 'Defensa';
    case 'MIDFIELDER':
      return 'Medio';
    case 'FORWARD':
      return 'Delantero';
    default:
      return 'Sin posicion';
  }
}

function isTeamFull(match: MatchResponse, team: TeamSide) {
  const occupancy = match.occupancy;
  const max = occupancy?.maxPlayersPerTeam ?? match.maxPlayersPerTeam;
  const players = team === 'A' ? occupancy?.teamAPlayers ?? 0 : occupancy?.teamBPlayers ?? 0;
  return players >= max;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  authScreen: { flex: 1, backgroundColor: '#343434' },
  darkScreen: { flex: 1, backgroundColor: '#343434' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18 },
  authHeroMark: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  authHeroLetter: { color: '#0A110E', fontSize: 34, fontWeight: '900' },
  authBrand: { color: '#E3DBD0', fontSize: 48, fontWeight: '900', letterSpacing: 0 },
  authCopy: { color: '#BDB6AE', fontSize: 17, lineHeight: 24, maxWidth: 360 },
  authCard: { backgroundColor: '#E3DBD0', borderRadius: 28, padding: 18, gap: 14 },
  modeSwitchLight: { height: 54, borderRadius: 27, backgroundColor: 'rgba(156,163,175,0.18)', flexDirection: 'row', padding: 6 },
  modeSwitchDark: { flex: 1, height: 54, borderRadius: 27, backgroundColor: 'rgba(156,163,175,0.12)', flexDirection: 'row', padding: 6 },
  modeButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  modeButtonActive: { backgroundColor: '#B3F351' },
  modeText: { color: '#9CA3AF', fontSize: 15, fontWeight: '800' },
  modeTextActive: { color: '#0A110E' },
  fieldBlock: { gap: 7 },
  fieldLabel: { color: '#0A110E', fontSize: 13, fontWeight: '900' },
  input: { minHeight: 50, borderRadius: 16, paddingHorizontal: 14, backgroundColor: '#F6F1EA', color: '#0A110E', fontSize: 15 },
  authButton: { minHeight: 54, borderRadius: 27, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  authButtonText: { color: '#0A110E', fontSize: 16, fontWeight: '900' },
  authNotice: { color: '#4A4A4A', fontSize: 13 },
  homeShell: { flex: 1, paddingTop: 8 },
  statusBarMock: { height: 44, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTime: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalIcon: { width: 18, height: 12, borderRadius: 3, backgroundColor: '#FFFFFF' },
  wifiIcon: { width: 17, height: 12, borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  batteryIcon: { width: 26, height: 12, borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF' },
  homeHeader: { paddingHorizontal: 28, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '800' },
  homeTitle: { color: '#E3DBD0', fontSize: 40, fontWeight: '900', letterSpacing: 0 },
  screenTitle: { color: '#E3DBD0', fontSize: 38, fontWeight: '900', letterSpacing: 0 },
  profileShortcut: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  profileShortcutText: { color: '#0A110E', fontSize: 19, fontWeight: '900' },
  homeToolbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22 },
  createMiniButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  createMiniText: { color: '#0A110E', fontSize: 30, fontWeight: '900', marginTop: -2 },
  mapStage: { flex: 1, marginTop: 18, overflow: 'hidden' },
  roadLine: { position: 'absolute', height: 10, borderRadius: 10, backgroundColor: '#4A4A4A' },
  roadLineThin: { position: 'absolute', width: 10, borderRadius: 10, backgroundColor: '#4A4A4A' },
  mapMarkerWrap: { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  mapMarkerHalo: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(179,243,81,0.20)' },
  mapMarkerHaloActive: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(179,243,81,0.30)' },
  mapMarker: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#B3F351' },
  mapMarkerActive: { borderWidth: 5, borderColor: '#FFFFFF' },
  popupCard: { position: 'absolute', left: 22, right: 22, bottom: 104, borderRadius: 28, backgroundColor: '#E3DBD0', overflow: 'hidden' },
  popupAccent: { height: 8, backgroundColor: '#B3F351' },
  popupBody: { padding: 20, gap: 8 },
  popupLabel: { color: '#6C716D', fontSize: 12, fontWeight: '900' },
  popupTitle: { color: '#0A110E', fontSize: 24, fontWeight: '900' },
  popupMeta: { color: '#4A4A4A', fontSize: 14, lineHeight: 20 },
  popupActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  popupDarkButton: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#0A110E', alignItems: 'center', justifyContent: 'center' },
  popupDarkText: { color: '#E3DBD0', fontWeight: '900' },
  popupLimeButton: { flex: 1, minHeight: 48, borderRadius: 24, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  popupLimeText: { color: '#0A110E', fontWeight: '900' },
  listContent: { padding: 22, paddingBottom: 120, gap: 14 },
  searchPill: { minHeight: 52, borderRadius: 26, borderWidth: 1, borderColor: '#E3DBD0', justifyContent: 'center', paddingHorizontal: 20 },
  searchText: { color: '#E3DBD0', opacity: 0.78, fontSize: 14, fontWeight: '700' },
  searchInput: { color: '#E3DBD0', fontSize: 14, fontWeight: '800', paddingVertical: 0 },
  listStatsRow: { flexDirection: 'row', gap: 12 },
  listStat: { flex: 1, padding: 16, borderRadius: 22, backgroundColor: 'rgba(156,163,175,0.10)' },
  listStatValue: { color: '#B3F351', fontSize: 28, fontWeight: '900' },
  listStatLabel: { color: '#E3DBD0', fontSize: 12, fontWeight: '800', marginTop: 2 },
  listCard: { backgroundColor: '#E3DBD0', borderRadius: 28, padding: 18, gap: 12 },
  listCardSelected: { borderWidth: 3, borderColor: '#B3F351' },
  listCardTitle: { color: '#0A110E', fontSize: 22, fontWeight: '900' },
  listCardMeta: { color: '#4A4A4A', fontSize: 14, marginTop: 4 },
  occupancyBlock: { marginTop: 12, gap: 7 },
  occupancyTrack: { height: 8, borderRadius: 8, backgroundColor: 'rgba(10,17,14,0.14)', overflow: 'hidden' },
  occupancyFill: { height: 8, borderRadius: 8, backgroundColor: '#B3F351' },
  occupancyText: { color: '#0A110E', fontSize: 12, fontWeight: '900' },
  cardActions: { flexDirection: 'row', gap: 10 },
  darkJoinButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: '#0A110E', alignItems: 'center', justifyContent: 'center' },
  darkJoinText: { color: '#E3DBD0', fontWeight: '900' },
  limeJoinButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  limeJoinText: { color: '#0A110E', fontWeight: '900' },
  ghostDangerButton: { minHeight: 46, borderRadius: 23, borderWidth: 1, borderColor: '#0A110E', alignItems: 'center', justifyContent: 'center' },
  ghostDangerText: { color: '#0A110E', fontWeight: '900' },
  emptyPanel: { backgroundColor: 'rgba(156,163,175,0.10)', borderRadius: 24, padding: 18 },
  emptyTitle: { color: '#E3DBD0', fontSize: 20, fontWeight: '900' },
  emptyText: { color: '#BDB6AE', fontSize: 14, marginTop: 6 },
  bottomNav: { position: 'absolute', left: 22, right: 22, bottom: 22, minHeight: 72, borderRadius: 36, backgroundColor: '#0A110E', flexDirection: 'row', padding: 8, gap: 8 },
  navItem: { flex: 1, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  navItemActive: { backgroundColor: '#B3F351' },
  navCreateItem: { width: 58, borderRadius: 30, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  navCreateItemActive: { backgroundColor: '#E3DBD0' },
  navCreateIcon: { color: '#0A110E', fontSize: 30, fontWeight: '900', marginTop: -2 },
  navIcon: { color: '#E3DBD0', fontSize: 18, fontWeight: '900' },
  navIconActive: { color: '#0A110E' },
  navLabel: { color: '#E3DBD0', fontSize: 11, fontWeight: '800', marginTop: 2 },
  navLabelActive: { color: '#0A110E' },
  profileContent: { padding: 22, paddingBottom: 120, gap: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(227,219,208,0.12)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#E3DBD0', fontSize: 30, fontWeight: '700' },
  profileTitle: { color: '#E3DBD0', fontSize: 24, fontWeight: '900' },
  logoutPill: { paddingHorizontal: 14, height: 44, borderRadius: 22, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#0A110E', fontWeight: '900' },
  profileHero: { alignItems: 'center', paddingTop: 20, gap: 10 },
  avatarRing: { width: 142, height: 142, borderRadius: 71, borderWidth: 3, borderColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  avatarCore: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#E3DBD0', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#0A110E', fontSize: 50, fontWeight: '900' },
  profileName: { color: '#E3DBD0', fontSize: 30, fontWeight: '900' },
  profileMeta: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },
  profileEditor: { backgroundColor: '#E3DBD0', borderRadius: 28, padding: 18, gap: 14 },
  positionGrid: { flexDirection: 'row', gap: 8 },
  positionButton: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: '#F6F1EA', alignItems: 'center', justifyContent: 'center' },
  positionButtonActive: { backgroundColor: '#B3F351' },
  positionButtonText: { color: '#4A4A4A', fontSize: 12, fontWeight: '900' },
  positionButtonTextActive: { color: '#0A110E' },
  profileStats: { flexDirection: 'row', gap: 12 },
  profileStat: { flex: 1, borderRadius: 24, backgroundColor: 'rgba(156,163,175,0.10)', padding: 14, alignItems: 'center' },
  profileStatValue: { color: '#B3F351', fontSize: 24, fontWeight: '900' },
  profileStatLabel: { color: '#E3DBD0', fontSize: 11, fontWeight: '800', marginTop: 4 },
  profileSection: { gap: 12 },
  profileSectionTitle: { color: '#E3DBD0', fontSize: 20, fontWeight: '900' },
  profileEmpty: { color: '#9CA3AF', fontSize: 14 },
  compactMatch: { borderRadius: 22, backgroundColor: '#E3DBD0', padding: 16 },
  compactMatchTitle: { color: '#0A110E', fontSize: 17, fontWeight: '900' },
  compactMatchMeta: { color: '#4A4A4A', marginTop: 4, fontSize: 13 },
  createContent: { padding: 22, paddingBottom: 120, gap: 18 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closePill: { paddingHorizontal: 14, height: 44, borderRadius: 22, backgroundColor: 'rgba(227,219,208,0.12)', alignItems: 'center', justifyContent: 'center' },
  closePillText: { color: '#E3DBD0', fontWeight: '900' },
  createCard: { backgroundColor: '#E3DBD0', borderRadius: 28, padding: 18, gap: 14 },
  formRow: { flexDirection: 'row', gap: 10 },
  formHalf: { flex: 1 },
  detailContent: { padding: 22, paddingBottom: 120, gap: 18 },
  detailHeroCard: { backgroundColor: '#E3DBD0', borderRadius: 28, padding: 18, gap: 10 },
  detailTitle: { color: '#0A110E', fontSize: 28, fontWeight: '900' },
  detailMeta: { color: '#4A4A4A', fontSize: 14, lineHeight: 20 },
  teamGrid: { flexDirection: 'row', gap: 10, marginTop: 4 },
  teamBox: { flex: 1, borderRadius: 18, backgroundColor: '#F6F1EA', padding: 12, gap: 3 },
  teamBoxFull: { opacity: 0.62 },
  teamBoxLabel: { color: '#4A4A4A', fontSize: 12, fontWeight: '900' },
  teamBoxValue: { color: '#0A110E', fontSize: 24, fontWeight: '900' },
  teamBoxMeta: { color: '#6C716D', fontSize: 11, fontWeight: '800' },
  chatPanel: { gap: 12 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatTitle: { color: '#E3DBD0', fontSize: 22, fontWeight: '900' },
  refreshText: { color: '#B3F351', fontSize: 13, fontWeight: '900' },
  messageBubble: { backgroundColor: 'rgba(227,219,208,0.12)', borderRadius: 18, padding: 14, gap: 4 },
  messageAuthor: { color: '#B3F351', fontSize: 12, fontWeight: '900' },
  messageContent: { color: '#E3DBD0', fontSize: 15, lineHeight: 21 },
  messageTime: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
  messageComposer: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  messageInput: { flex: 1, minHeight: 50, borderRadius: 25, paddingHorizontal: 16, backgroundColor: '#E3DBD0', color: '#0A110E', fontSize: 15 },
  sendButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 25, backgroundColor: '#B3F351', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: '#0A110E', fontWeight: '900' },
});




