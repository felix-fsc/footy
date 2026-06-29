import { useCallback, useState } from "react";
import type { PlayerPosition, PlayerProfileResponse } from "../types/domain";

type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

export function useProfile() {
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [publicProfile, setPublicProfile] =
    useState<PlayerProfileResponse | null>(null);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [position, setPosition] = useState<PlayerPosition>("MIDFIELDER");
  const [editing, setEditing] = useState(false);

  const applyProfile = useCallback((nextProfile: PlayerProfileResponse) => {
    setProfile(nextProfile);
    setFullName(nextProfile.fullName ?? nextProfile.displayName ?? "");
    setUsername(nextProfile.username ?? "");
    setCity(nextProfile.city ?? "");
    setBio(nextProfile.bio ?? "");
    setPosition(nextProfile.preferredPosition ?? "MIDFIELDER");
  }, []);

  const load = useCallback(async (request: ApiRequest) => {
    const nextProfile = await request<PlayerProfileResponse>("/api/profile/me");
    applyProfile(nextProfile);
  }, [applyProfile]);

  const save = useCallback(async (request: ApiRequest) => {
    const nextProfile = await request<PlayerProfileResponse>(
      "/api/profile/me",
      {
        method: "PUT",
        body: JSON.stringify({
          username,
          fullName,
          city,
          bio,
          preferredPosition: position,
        }),
      },
    );
    applyProfile(nextProfile);
  }, [applyProfile, bio, city, fullName, position, username]);

  const openPublic = useCallback(async (request: ApiRequest, userId: string) => {
    if (!userId) {
      return;
    }

    const nextProfile = await request<PlayerProfileResponse>(
      `/api/profile/${userId}`,
    );
    setPublicProfile(nextProfile);
    setShowPublicProfile(true);
  }, []);

  const clear = useCallback(() => {
    setProfile(null);
    setPublicProfile(null);
    setShowPublicProfile(false);
    setEditing(false);
  }, []);

  const toggleEditing = useCallback(
    () => setEditing((current) => !current),
    [],
  );
  const stopEditing = useCallback(() => setEditing(false), []);

  return {
    profile,
    publicProfile,
    showPublicProfile,
    fullName,
    username,
    city,
    bio,
    position,
    editing,
    load,
    save,
    openPublic,
    clear,
    setShowPublicProfile,
    toggleEditing,
    stopEditing,
    setUsername,
    setFullName,
    setCity,
    setBio,
    setPosition,
  };
}
