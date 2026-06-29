import type { MatchResponse } from "../types/domain";
import { API_BASE_URL } from "./config";

export async function fetchMatchesSnapshot(token: string) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [available, mine] = await Promise.all([
    fetch(`${API_BASE_URL}/api/matches`).then(
      (response) => response.json() as Promise<MatchResponse[]>,
    ),
    fetch(`${API_BASE_URL}/api/matches/me`, { headers }).then(
      (response) => response.json() as Promise<MatchResponse[]>,
    ),
  ]);

  return { available, mine };
}
