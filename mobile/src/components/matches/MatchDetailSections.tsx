import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LocationTargetIcon, PencilIcon } from "../icons/AppIcons";
import { StatusBadge } from "../ui/FormControls";
import type { MatchResponse, MessageResponse, TeamSide } from "../../types/domain";
import {
  formatDate,
  formatDurationMinutes,
  formatPriceFromCents,
  publicHandle,
} from "../../utils/matchUtils";
import { platformShadow } from "../../utils/styleUtils";
import { MatchImageBackground } from "./MatchMedia";
import { TeamRoster } from "./TeamRoster";

type MatchHeroProps = {
  isAdmin: boolean;
  loading: boolean;
  match: MatchResponse;
  onEditMatch: (match: MatchResponse) => void;
};

export function MatchHero({
  isAdmin,
  loading,
  match,
  onEditMatch,
}: MatchHeroProps) {
  return (
    <MatchImageBackground
      match={match}
      style={styles.detailCover}
      imageStyle={styles.detailCoverImage}
    >
      <View style={styles.detailCoverOverlay} />
      <View style={styles.detailCoverTop}>
        <View style={styles.detailCoverTopLeft}>
          <StatusBadge status={match.status} />
          {isAdmin ? <Text style={styles.adminInlinePill}>Admin</Text> : null}
        </View>
        <View style={styles.detailCoverTopActions}>
          <Text style={styles.detailCoverPill}>
            {formatPriceFromCents(match.pricePerPersonCents)}
          </Text>
          {isAdmin ? (
            <Pressable
              style={({ pressed }) => [
                styles.adminFloatingEditButton,
                pressed && styles.actionPressGlow,
              ]}
              onPress={() => onEditMatch(match)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Editar partido"
              android_ripple={{ color: "rgba(143,234,106,0.22)", borderless: true }}
            >
              <PencilIcon />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.detailCoverContent}>
        <Text style={styles.detailTitle} numberOfLines={2}>
          {match.title}
        </Text>
        <Text style={styles.detailSubtitle} numberOfLines={1}>
          {match.field?.name ?? "Campo por confirmar"}
        </Text>
      </View>
    </MatchImageBackground>
  );
}

export function MatchInfoCards({ match }: { match: MatchResponse }) {
  return (
    <View style={styles.detailInfoGrid}>
      <View style={styles.detailInfoCard}>
        <Text style={styles.detailInfoLabel}>Fecha</Text>
        <Text style={styles.detailInfoValue} numberOfLines={2}>
          {formatDate(match.startsAt)}
        </Text>
      </View>
      <View style={styles.detailInfoCard}>
        <Text style={styles.detailInfoLabel}>Formato</Text>
        <Text style={styles.detailInfoValue}>
          {match.maxPlayersPerTeam} vs {match.maxPlayersPerTeam}
        </Text>
      </View>
      <View style={styles.detailInfoCard}>
        <Text style={styles.detailInfoLabel}>Duracion</Text>
        <Text style={styles.detailInfoValue}>
          {formatDurationMinutes(match.durationMinutes)}
        </Text>
      </View>
    </View>
  );
}

type MatchLocationCardProps = {
  match: MatchResponse;
  onOpenDirections: (match: MatchResponse) => void;
  onOpenProfile: (userId: string) => void;
};

export function MatchLocationCard({
  match,
  onOpenDirections,
  onOpenProfile,
}: MatchLocationCardProps) {
  return (
    <View style={styles.detailLocationCard}>
      <View style={styles.detailLocationIcon}>
        <LocationTargetIcon />
      </View>
      <View style={styles.detailLocationTextWrap}>
        <Text style={styles.detailLocationTitle} numberOfLines={1}>
          {match.field?.name ?? "Campo por confirmar"}
        </Text>
        <Text style={styles.detailLocationMeta} numberOfLines={2}>
          {match.field?.address ?? "Direccion pendiente"} -{" "}
          {match.field?.city ?? "Sin ciudad"}
        </Text>
        <Pressable onPress={() => onOpenProfile(match.createdBy.id)}>
          <Text style={styles.detailOrganizer} numberOfLines={1}>
            Organiza {publicHandle(match.createdBy)}
          </Text>
        </Pressable>
      </View>
      <Pressable
        style={({ pressed }) => [styles.directionsButton, pressed && styles.actionPressGlow]}
        onPress={() => onOpenDirections(match)}
        android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
      >
        <Text style={styles.directionsButtonText}>Como llegar</Text>
      </Pressable>
    </View>
  );
}

type MatchAdminActionsProps = {
  loading: boolean;
  match: MatchResponse;
  onCancelMatch: (matchId: string) => void;
  onDeleteMatch: (matchId: string) => void;
};

export function MatchAdminActions({
  loading,
  match,
  onCancelMatch,
  onDeleteMatch,
}: MatchAdminActionsProps) {
  return (
    <View style={styles.detailAdminInlineActions}>
      {match.status !== "CANCELLED" ? (
        <Pressable
          style={({ pressed }) => [
            styles.adminInlineActionButton,
            pressed && styles.dangerPressGlow,
          ]}
          onPress={() => onCancelMatch(match.id)}
          disabled={loading}
          android_ripple={{ color: "rgba(217,88,88,0.20)", borderless: false }}
        >
          <Text style={styles.adminInlineActionText}>Cancelar</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          styles.adminInlineActionButton,
          styles.adminInlineDangerButton,
          pressed && styles.dangerPressGlow,
        ]}
        onPress={() => onDeleteMatch(match.id)}
        disabled={loading}
        android_ripple={{ color: "rgba(217,88,88,0.22)", borderless: false }}
      >
        <Text style={[styles.adminInlineActionText, styles.adminInlineDangerText]}>
          Borrar
        </Text>
      </Pressable>
    </View>
  );
}

type MatchPlayersSectionProps = {
  isAdmin: boolean;
  loading: boolean;
  match: MatchResponse;
  selectedIsOpen: boolean;
  selectedIsOwner: boolean;
  selectedIsParticipant: boolean;
  onCancelMatch: (matchId: string) => void;
  onJoinMatch: (matchId: string, teamSide: TeamSide) => void;
  onLeaveMatch: (matchId: string) => void;
  onOpenProfile: (userId: string) => void;
  onRemovePlayer: (matchId: string, userId: string, playerName?: string) => void;
};

export function MatchPlayersSection({
  isAdmin,
  loading,
  match,
  selectedIsOpen,
  selectedIsOwner,
  selectedIsParticipant,
  onCancelMatch,
  onJoinMatch,
  onLeaveMatch,
  onOpenProfile,
  onRemovePlayer,
}: MatchPlayersSectionProps) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailSectionHeader}>
        <Text style={styles.detailSectionTitle}>Equipos</Text>
        <Text style={styles.detailSectionMeta}>
          {(match.occupancy?.totalPlayers ?? 0)}/
          {match.occupancy?.totalCapacity ?? match.maxPlayersPerTeam * 2}
        </Text>
      </View>
      <TeamRoster
        match={match}
        loading={loading}
        selectedIsOpen={selectedIsOpen}
        selectedIsParticipant={selectedIsParticipant}
        onJoinTeam={(teamSide) => onJoinMatch(match.id, teamSide)}
        onOpenProfile={onOpenProfile}
        canRemovePlayers={isAdmin}
        onRemovePlayer={(userId, playerName) =>
          onRemovePlayer(match.id, userId, playerName)
        }
      />
      <MatchParticipationActions
        isAdmin={isAdmin}
        loading={loading}
        match={match}
        selectedIsOwner={selectedIsOwner}
        selectedIsParticipant={selectedIsParticipant}
        onCancelMatch={onCancelMatch}
        onLeaveMatch={onLeaveMatch}
      />
    </View>
  );
}

type MatchParticipationActionsProps = {
  isAdmin: boolean;
  loading: boolean;
  match: MatchResponse;
  selectedIsOwner: boolean;
  selectedIsParticipant: boolean;
  onCancelMatch: (matchId: string) => void;
  onLeaveMatch: (matchId: string) => void;
};

function MatchParticipationActions({
  isAdmin,
  loading,
  match,
  selectedIsOwner,
  selectedIsParticipant,
  onCancelMatch,
  onLeaveMatch,
}: MatchParticipationActionsProps) {
  return (
    <View style={styles.detailInlinePanel}>
      {selectedIsParticipant && match.status !== "CANCELLED" ? (
        <Pressable
          style={({ pressed }) => [
            styles.ghostDangerButton,
            pressed && styles.dangerPressGlow,
          ]}
          onPress={() => onLeaveMatch(match.id)}
          disabled={loading}
          android_ripple={{ color: "rgba(217,88,88,0.18)", borderless: false }}
        >
          <Text style={styles.ghostDangerText}>Salir del partido</Text>
        </Pressable>
      ) : match.status !== "OPEN" ? (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>
            {match.status === "FULL" ? "Partido completo" : "Partido cancelado"}
          </Text>
        </View>
      ) : null}
      {selectedIsOwner && !isAdmin && match.status !== "CANCELLED" ? (
        <Pressable
          style={({ pressed }) => [
            styles.cancelMatchButton,
            pressed && styles.dangerPressGlow,
          ]}
          onPress={() => onCancelMatch(match.id)}
          disabled={loading}
          android_ripple={{ color: "rgba(255,255,255,0.18)", borderless: false }}
        >
          <Text style={styles.cancelMatchText}>Cancelar partido</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type MatchChatLauncherProps = {
  matchId: string;
  messages: MessageResponse[];
  selectedIsParticipant: boolean;
  onOpenChat: (matchId: string) => void;
};

export function MatchChatLauncher({
  matchId,
  messages,
  selectedIsParticipant,
  onOpenChat,
}: MatchChatLauncherProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.detailChatLauncher,
        pressed && styles.actionPressGlow,
      ]}
      onPress={() => onOpenChat(matchId)}
      android_ripple={{ color: "rgba(143,234,106,0.18)", borderless: false }}
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
  );
}

export const matchDetailSectionStyles = StyleSheet.create({
  detailHeroCard: {
    backgroundColor: "rgba(7,12,9,0.94)",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    ...platformShadow({ opacity: 0.24, radius: 24, y: 14 }),
  },
  detailBody: { padding: 12, gap: 12 },
});

const styles = StyleSheet.create({
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
  detailCoverTopLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailCoverTopActions: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  adminInlinePill: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "rgba(7,16,10,0.72)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.34)",
    color: "#8FEA6A",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 7,
    textTransform: "uppercase",
  },
  adminFloatingEditButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(7,16,10,0.78)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.24)",
    alignItems: "center",
    justifyContent: "center",
    ...platformShadow({ opacity: 0.22, radius: 12, y: 8 }),
  },
  actionPressGlow: {
    backgroundColor: "rgba(143,234,106,0.24)",
    borderColor: "rgba(143,234,106,0.86)",
    shadowColor: "#8FEA6A",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    transform: [{ scale: 0.98 }],
  },
  dangerPressGlow: {
    backgroundColor: "rgba(217,88,88,0.28)",
    borderColor: "rgba(217,88,88,0.78)",
    shadowColor: "#D95858",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    transform: [{ scale: 0.98 }],
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
  detailInfoGrid: { flexDirection: "row", gap: 8 },
  detailInfoCard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: "rgba(247,241,232,0.075)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  detailInfoLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
    textAlign: "center",
  },
  detailInfoValue: {
    color: "#F7F1E8",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textAlign: "center",
  },
  detailLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  directionsButton: {
    minWidth: 92,
    minHeight: 42,
    borderRadius: 18,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  directionsButtonText: {
    color: "#0A110E",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  detailAdminInlineActions: { flexDirection: "row", gap: 8 },
  adminInlineActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 17,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  adminInlineDangerButton: {
    backgroundColor: "rgba(217,88,88,0.22)",
    borderColor: "rgba(217,88,88,0.40)",
  },
  adminInlineActionText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  adminInlineDangerText: { color: "#FFD1D1" },
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
  detailInlinePanel: { gap: 8 },
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
});
