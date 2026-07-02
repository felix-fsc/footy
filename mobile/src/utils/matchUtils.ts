import type {
  DateFilter,
  MatchFilter,
  MatchResponse,
  PlayerPosition,
  TeamSide,
} from "../types/domain";

const DEFAULT_MATCH_DURATION_MINUTES = 90;

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

export function datePartsFromOffset(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function tomorrowDateParts() {
  return datePartsFromOffset(1);
}

export function monthDateParts(year: number, month: number, day: number) {
  const yyyy = String(year);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getCalendarMonth(offset: number) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function formatPriceFromCents(value: number | null | undefined) {
  const cents = value ?? 0;
  if (cents <= 0) {
    return "Gratis";
  }
  return `${(cents / 100).toFixed(2)} EUR`;
}

export function formatDraftPrice(value: string) {
  const price = Number(value.replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) {
    return "Gratis";
  }
  return `${price.toFixed(2)} EUR`;
}

export function formatDurationMinutes(value: number | null | undefined) {
  const minutes = value ?? DEFAULT_MATCH_DURATION_MINUTES;
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

export function dateInputFromInstant(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return tomorrowDateParts();
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function timeInputFromInstant(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "19:00";
  }
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function getRandomMatchCover() {
  const index = Math.floor(Math.random() * MATCH_COVER_IMAGES.length);
  return MATCH_COVER_IMAGES[index] ?? DEFAULT_MATCH_COVER;
}

export function getFallbackMatchCover(match: MatchResponse) {
  const seed = match.id || match.title || match.startsAt;
  const hash = Array.from(seed).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return MATCH_COVER_IMAGES[hash % MATCH_COVER_IMAGES.length] ?? DEFAULT_MATCH_COVER;
}

export function getMatchCover(match: MatchResponse) {
  return match.coverImageUrl || getFallbackMatchCover(match);
}

export function publicHandle(user?: {
  displayName?: string | null;
  username?: string | null;
}) {
  const username = user?.username?.trim();
  if (username) {
    return `@${username}`;
  }
  return user?.displayName?.trim() || "Jugador";
}

export function filterMatchByDate(
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

export function getVisibleMatches({
  matches,
  myMatches,
  searchQuery,
  matchFilter,
  dateFilter,
  onlyAvailable,
  now = new Date(),
}: {
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  searchQuery: string;
  matchFilter: MatchFilter;
  dateFilter: DateFilter;
  onlyAvailable: boolean;
  now?: Date;
}) {
  const query = searchQuery.trim().toLowerCase();

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
}

export function getUpcomingRegisteredMatches({
  matches,
  currentUserId,
  now = new Date(),
}: {
  matches: MatchResponse[];
  currentUserId: string | null;
  now?: Date;
}) {
  if (!currentUserId) {
    return [];
  }

  return matches
    .filter((match) => {
      const matchDate = new Date(match.startsAt);
      const isFutureOrNow =
        Number.isFinite(matchDate.getTime()) && matchDate >= now;

      return isFutureOrNow && userParticipatesInMatch(match, currentUserId);
    })
    .sort(
      (first, second) =>
        new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
    );
}

export function getPlayedRegisteredMatchesCount({
  matches,
  currentUserId,
  now = new Date(),
}: {
  matches: MatchResponse[];
  currentUserId: string | null;
  now?: Date;
}) {
  if (!currentUserId) {
    return 0;
  }

  return matches.filter((match) => {
    const matchDate = new Date(match.startsAt);
    const isPast = Number.isFinite(matchDate.getTime()) && matchDate < now;

    return isPast && userParticipatesInMatch(match, currentUserId);
  }).length;
}

export function isMatchOpen(match: MatchResponse) {
  return match.status === "OPEN";
}

export function positionLabel(position: PlayerPosition | null | undefined) {
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

export function userParticipatesInMatch(match: MatchResponse, userId: string) {
  return Boolean(
    match.teams?.teamA.some((player) => player.userId === userId) ||
      match.teams?.teamB.some((player) => player.userId === userId),
  );
}

export function getMatchViewerState(
  match: MatchResponse | null,
  currentUserId: string | null,
) {
  const isParticipant = Boolean(
    match &&
      currentUserId &&
      userParticipatesInMatch(match, currentUserId),
  );
  const isOwner = Boolean(match && currentUserId === match.createdBy.id);
  const isOpen = match?.status === "OPEN";

  return {
    isParticipant,
    isOwner,
    isOpen,
  };
}

export function isTeamFull(match: MatchResponse, team: TeamSide) {
  const occupancy = match.occupancy;
  const max = occupancy?.maxPlayersPerTeam ?? match.maxPlayersPerTeam;
  const players =
    team === "A"
      ? (occupancy?.teamAPlayers ?? 0)
      : (occupancy?.teamBPlayers ?? 0);
  return players >= max;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
