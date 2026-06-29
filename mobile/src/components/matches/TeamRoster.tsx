import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MatchPlayerResponse, MatchResponse } from "../../types/domain";
import { publicHandle } from "../../utils/matchUtils";

type TeamRosterProps = {
  match: MatchResponse;
  onOpenProfile?: (userId: string) => void;
  canRemovePlayers?: boolean;
  onRemovePlayer?: (userId: string) => void;
};

type RosterColumnProps = {
  title: string;
  players: MatchPlayerResponse[];
  onOpenProfile?: (userId: string) => void;
  canRemovePlayers?: boolean;
  onRemovePlayer?: (userId: string) => void;
};

export function TeamRoster({
  match,
  onOpenProfile,
  canRemovePlayers = false,
  onRemovePlayer,
}: TeamRosterProps) {
  const teamA = match.teams?.teamA ?? [];
  const teamB = match.teams?.teamB ?? [];

  return (
    <View style={styles.rosterGrid}>
      <RosterColumn
        title="Equipo A"
        players={teamA}
        onOpenProfile={onOpenProfile}
        canRemovePlayers={canRemovePlayers}
        onRemovePlayer={onRemovePlayer}
      />
      <RosterColumn
        title="Equipo B"
        players={teamB}
        onOpenProfile={onOpenProfile}
        canRemovePlayers={canRemovePlayers}
        onRemovePlayer={onRemovePlayer}
      />
    </View>
  );
}

export function TeamOccupancy({ match }: { match: MatchResponse }) {
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

function RosterColumn({
  title,
  players,
  onOpenProfile,
  canRemovePlayers,
  onRemovePlayer,
}: RosterColumnProps) {
  return (
    <View style={styles.rosterColumn}>
      <Text style={styles.rosterTitle}>{title}</Text>
      {players.length === 0 ? (
        <Text style={styles.rosterEmpty}>Sin jugadores</Text>
      ) : (
        players.map((player) => (
          <View key={player.participationId} style={styles.rosterPlayer}>
            <Pressable
              style={styles.rosterPlayerProfile}
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
            {canRemovePlayers ? (
              <Pressable
                style={styles.rosterRemoveButton}
                onPress={() => onRemovePlayer?.(player.userId)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar a ${publicHandle(player)} del partido`}
              >
                <Text style={styles.rosterRemoveText}>X</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
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

const styles = StyleSheet.create({
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
  teamBoxLabel: {
    color: "rgba(247,241,232,0.62)",
    fontSize: 12,
    fontWeight: "900",
  },
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
  rosterRemoveText: { color: "#FFD1D1", fontSize: 12, fontWeight: "900" },
});
