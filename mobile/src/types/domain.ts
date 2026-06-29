export type AuthMode = "login" | "register";
export type HomeMode = "map" | "list";
export type MatchFilter = "all" | "mine";
export type DateFilter = "today" | "tomorrow" | "week" | "all";
export type AppTab = "home" | "create" | "detail" | "profile" | "location";
export type TeamSide = "A" | "B";
export type UserRole = "PLAYER" | "ADMIN";
export type PlayerPosition =
  | "GOALKEEPER"
  | "DEFENDER"
  | "MIDFIELDER"
  | "FORWARD";

export type MapLocation = { latitude: number; longitude: number };
export type MapPoint = { x: number; y: number };
export type MapTile = { key: string; x: number; y: number; uri: string };
export type GeocodeResult = { lat: string; lon: string; display_name: string };
export type NotificationsModule = typeof import("expo-notifications");

export type AuthResponse = {
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

export type StoredSession = {
  accessToken: string;
  expiresAt?: string;
  user: AuthResponse["user"];
};

export type MatchPlayerResponse = {
  participationId: string;
  userId: string;
  displayName: string;
  username?: string | null;
  teamSide: TeamSide;
  joinedAt: string;
};

export type MatchResponse = {
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

export type FieldMatchGroup = {
  key: string;
  fieldName: string;
  latitude: number;
  longitude: number;
  matches: MatchResponse[];
};

export type MessageResponse = {
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

export type SavedFieldResponse = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlayerProfileResponse = {
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
