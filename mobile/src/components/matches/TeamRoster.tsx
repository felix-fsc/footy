import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  MatchPlayerResponse,
  MatchResponse,
  TeamSide,
} from "../../types/domain";
import { isTeamFull, publicHandle } from "../../utils/matchUtils";

type TeamRosterProps = {
  match: MatchResponse;
  loading?: boolean;
  selectedIsOpen?: boolean;
  selectedIsParticipant?: boolean;
  onJoinTeam?: (teamSide: TeamSide) => void;
  onOpenProfile?: (userId: string) => void;
  canRemovePlayers?: boolean;
  onRemovePlayer?: (userId: string, playerName?: string) => void;
};

type TeamColumnProps = {
  title: string;
  teamSide: TeamSide;
  value: number;
  max: number;
  match: MatchResponse;
  players: MatchPlayerResponse[];
  loading: boolean;
  selectedIsOpen: boolean;
  selectedIsParticipant: boolean;
  onJoinTeam?: (teamSide: TeamSide) => void;
  onOpenProfile?: (userId: string) => void;
  canRemovePlayers?: boolean;
  onRemovePlayer?: (userId: string, playerName?: string) => void;
};

export function TeamRoster({
  match,
  loading = false,
  selectedIsOpen = false,
  selectedIsParticipant = false,
  onJoinTeam,
  onOpenProfile,
  canRemovePlayers = false,
  onRemovePlayer,
}: TeamRosterProps) {
  const teamA = match.teams?.teamA ?? [];
  const teamB = match.teams?.teamB ?? [];
  const occupancy = match.occupancy;
  const max = occupancy?.maxPlayersPerTeam ?? match.maxPlayersPerTeam;
  const teamAPlayers = occupancy?.teamAPlayers ?? 0;
  const teamBPlayers = occupancy?.teamBPlayers ?? 0;

  return (
    <View style={styles.rosterGrid}>
      <TeamColumn
        title="Equipo A"
        teamSide="A"
        value={teamAPlayers}
        max={max}
        match={match}
        players={teamA}
        loading={loading}
        selectedIsOpen={selectedIsOpen}
        selectedIsParticipant={selectedIsParticipant}
        onJoinTeam={onJoinTeam}
        onOpenProfile={onOpenProfile}
        canRemovePlayers={canRemovePlayers}
        onRemovePlayer={onRemovePlayer}
      />
      <TeamColumn
        title="Equipo B"
        teamSide="B"
        value={teamBPlayers}
        max={max}
        match={match}
        players={teamB}
        loading={loading}
        selectedIsOpen={selectedIsOpen}
        selectedIsParticipant={selectedIsParticipant}
        onJoinTeam={onJoinTeam}
        onOpenProfile={onOpenProfile}
        canRemovePlayers={canRemovePlayers}
        onRemovePlayer={onRemovePlayer}
      />
    </View>
  );
}

function TeamColumn({
  title,
  teamSide,
  value,
  max,
  match,
  players,
  loading,
  selectedIsOpen,
  selectedIsParticipant,
  onJoinTeam,
  onOpenProfile,
  canRemovePlayers,
  onRemovePlayer,
}: TeamColumnProps) {
  const full = isTeamFull(match, teamSide);
  const canJoin = !loading && selectedIsOpen && !selectedIsParticipant && !full;
  const actionText = selectedIsParticipant
    ? "Dentro"
    : full
      ? "Completo"
      : selectedIsOpen
        ? ""
        : "No disponible";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rosterColumn,
        full && styles.rosterColumnFull,
        canJoin && styles.rosterColumnJoinable,
        pressed && canJoin && styles.rosterColumnPressed,
      ]}
      onPress={() => {
        if (canJoin) {
          onJoinTeam?.(teamSide);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`Unirse al ${title}`}
      android_ripple={
        canJoin
          ? { color: "rgba(143,234,106,0.22)", borderless: false }
          : undefined
      }
    >
      <View style={styles.teamHeader}>
        <View>
          <Text style={styles.rosterTitle}>{title}</Text>
          {actionText ? (
            <Text style={[styles.teamBoxMeta, canJoin && styles.teamBoxMetaJoinable]}>
              {actionText}
            </Text>
          ) : null}
        </View>
        <Text style={styles.teamBoxValue}>{value}/{max}</Text>
      </View>
      <View style={styles.rosterDivider} />
      {players.length === 0 ? (
        <Text style={styles.rosterEmpty}>Sin jugadores</Text>
      ) : (
        players.map((player) => (
          <View key={player.participationId} style={styles.rosterPlayer}>
            <Pressable
              style={({ pressed }) => [
                styles.rosterPlayerProfile,
                pressed && styles.rosterPlayerProfilePressed,
              ]}
              onPress={() => onOpenProfile?.(player.userId)}
              android_ripple={{ color: "rgba(143,234,106,0.16)", borderless: false }}
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
            {canRemovePlayers ? (
              <Pressable
                style={({ pressed }) => [
                  styles.rosterRemoveButton,
                  pressed && styles.rosterRemoveButtonPressed,
                ]}
                onPress={() => onRemovePlayer?.(player.userId, publicHandle(player))}
                accessibilityRole="button"
                accessibilityLabel={`Quitar a ${publicHandle(player)} del partido`}
                android_ripple={{ color: "rgba(217,88,88,0.22)", borderless: true }}
              >
                <Text style={styles.rosterRemoveText}>X</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rosterGrid: { flexDirection: "row", gap: 10, marginTop: 4 },
  rosterColumn: {
    flex: 1,
    minHeight: 154,
    borderRadius: 20,
    backgroundColor: "rgba(10,17,14,0.34)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    padding: 12,
    gap: 8,
  },
  rosterColumnJoinable: {
    borderColor: "rgba(143,234,106,0.26)",
  },
  rosterColumnPressed: {
    backgroundColor: "rgba(143,234,106,0.24)",
    borderColor: "rgba(143,234,106,0.86)",
    shadowColor: "#8FEA6A",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    transform: [{ scale: 0.98 }],
  },
  rosterColumnFull: { borderColor: "rgba(247,241,232,0.06)" },
  teamHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rosterTitle: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  teamBoxValue: { color: "#F7F1E8", fontSize: 21, fontWeight: "900" },
  teamBoxMeta: { color: "#8FEA6A", fontSize: 10, fontWeight: "900", marginTop: 2 },
  teamBoxMetaJoinable: { color: "#B7FF8A" },
  rosterDivider: {
    height: 1,
    backgroundColor: "rgba(247,241,232,0.10)",
  },
  rosterEmpty: {
    color: "rgba(247,241,232,0.54)",
    fontSize: 12,
    fontWeight: "800",
  },
  rosterPlayer: { flexDirection: "row", alignItems: "center", gap: 8 },
  rosterPlayerProfile: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
  },
  rosterPlayerProfilePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
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
  rosterRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(217,88,88,0.22)",
    borderWidth: 1,
    borderColor: "rgba(217,88,88,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  rosterRemoveButtonPressed: {
    backgroundColor: "rgba(217,88,88,0.34)",
    borderColor: "rgba(217,88,88,0.70)",
    transform: [{ scale: 0.92 }],
  },
  rosterRemoveText: { color: "#FFD1D1", fontSize: 12, fontWeight: "900" },
});
