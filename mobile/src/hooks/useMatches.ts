import { useCallback, useMemo, useState } from "react";
import { fetchMatchesSnapshot } from "../api/matches";
import type { ApiRequest } from "../types/api";
import type { MatchResponse } from "../types/domain";
import { getVisibleMatches } from "../utils/matchUtils";

export function useMatches({
  request,
  token,
}: {
  request: ApiRequest;
  token: string | null;
}) {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [myMatches, setMyMatches] = useState<MatchResponse[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const loadAfterAuthenticatedSession = useCallback(async (accessToken: string) => {
    const { available, mine } = await fetchMatchesSnapshot(accessToken);
    setMatches(available);
    setMyMatches(mine);
    setSelectedMatchId(null);
  }, []);

  const clearUserMatches = useCallback(() => {
    setMyMatches([]);
    setSelectedMatchId(null);
  }, []);

  return {
    matches,
    myMatches,
    visibleMatches,
    selectedMatch,
    selectedMatchId,
    searchQuery,
    nextMyMatch: myMatches[0] ?? null,
    victoryStreak: Math.max(3, Math.min(9, myMatches.length + 3)),
    setMatches,
    setMyMatches,
    setSelectedMatchId,
    setSearchQuery,
    loadMatches,
    loadAfterAuthenticatedSession,
    clearUserMatches,
  };
}
