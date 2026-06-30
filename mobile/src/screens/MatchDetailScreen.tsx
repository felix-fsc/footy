import { StatusBar } from "expo-status-bar";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import { LocationTargetIcon, PencilIcon } from "../components/icons/AppIcons";
import { MatchChatModal } from "../components/matches/MatchChatModal";
import { MatchImageBackground } from "../components/matches/MatchMedia";
import { TeamOccupancy, TeamRoster } from "../components/matches/TeamRoster";
import { BottomNav } from "../components/navigation/BottomNav";
import { PublicProfileModal } from "../components/profile/PublicProfileModal";
import { StatusBadge } from "../components/ui/FormControls";
import type {
  MatchResponse,
  MessageResponse,
  PlayerProfileResponse,
  TeamSide,
} from "../types/domain";
import {
  formatDate,
  formatPriceFromCents,
  isTeamFull,
  publicHandle,
} from "../utils/matchUtils";
import { platformShadow } from "../utils/styleUtils";

type MatchDetailScreenProps = {
  actions: {
    onCancelMatch: (matchId: string) => void;
    onDeleteMatch: (matchId: string) => void;
    onEditMatch: (match: MatchResponse) => void;
    onJoinMatch: (matchId: string, teamSide: TeamSide) => void;
    onLeaveMatch: (matchId: string) => void;
    onOpenDirections: (match: MatchResponse) => void;
    onOpenProfile: (userId: string) => void;
    onRemovePlayer: (matchId: string, userId: string) => void;
  };
  chat: {
    messageText: string;
    messages: MessageResponse[];
    onCloseChat: () => void;
    onMessageTextChange: (value: string) => void;
    onOpenChat: (matchId: string) => void;
    onQuickMessage: (content: string) => void;
    onRefreshMessages: (matchId: string) => void;
    onSendMessage: () => void;
    showMatchChat: boolean;
  };
  layout: {
    bottomInset: number;
    topInset: number;
  };
  navigation: {
    onCreate: () => void;
    onHome: () => void;
    onProfile: () => void;
  };
  publicProfileState: {
    onClosePublicProfile: () => void;
    publicProfile: PlayerProfileResponse | null;
    showPublicProfile: boolean;
  };
  state: {
    isAdmin: boolean;
    loading: boolean;
    match: MatchResponse | null;
    selectedIsOpen: boolean;
    selectedIsOwner: boolean;
    selectedIsParticipant: boolean;
  };
};

export function MatchDetailScreen({
  actions,
  chat,
  layout,
  navigation,
  publicProfileState,
  state,
}: MatchDetailScreenProps) {
  const {
    isAdmin,
    loading,
    match,
    selectedIsOpen,
    selectedIsOwner,
    selectedIsParticipant,
  } = state;

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <ScrollView
        contentContainerStyle={[
          styles.detailContent,
          {
            paddingTop: layout.topInset + 18,
            paddingBottom: layout.bottomInset + 112,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.screenHeader}>
          <View>
            <Text style={styles.smallLabel}>Detalle</Text>
            <Text style={styles.screenTitle}>Partido</Text>
          </View>
          <Pressable style={styles.closePill} onPress={navigation.onHome}>
            <Text style={styles.closePillText}>Volver</Text>
          </Pressable>
        </View>

        {match ? (
          <>
            <View style={styles.detailHeroCard}>
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
                          pressed && styles.adminFloatingButtonPressed,
                        ]}
                        onPress={() => actions.onEditMatch(match)}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Editar partido"
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

              <View style={styles.detailBody}>
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
                </View>

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
                    <Pressable
                      onPress={() => actions.onOpenProfile(match.createdBy.id)}
                    >
                      <Text style={styles.detailOrganizer} numberOfLines={1}>
                        Organiza {publicHandle(match.createdBy)}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={styles.directionsButton}
                  onPress={() => actions.onOpenDirections(match)}
                >
                  <Text style={styles.directionsButtonText}>Como llegar</Text>
                </Pressable>

                {isAdmin ? (
                  <View style={styles.detailAdminInlineActions}>
                    {match.status !== "CANCELLED" ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.adminInlineActionButton,
                          pressed && styles.inlineActionPressed,
                        ]}
                        onPress={() => actions.onCancelMatch(match.id)}
                        disabled={loading}
                      >
                        <Text style={styles.adminInlineActionText}>Cancelar</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={({ pressed }) => [
                        styles.adminInlineActionButton,
                        styles.adminInlineDangerButton,
                        pressed && styles.inlineActionPressed,
                      ]}
                      onPress={() => actions.onDeleteMatch(match.id)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.adminInlineActionText,
                          styles.adminInlineDangerText,
                        ]}
                      >
                        Borrar
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.detailSection}>
                  <View style={styles.detailSectionHeader}>
                    <Text style={styles.detailSectionTitle}>Jugadores</Text>
                    <Text style={styles.detailSectionMeta}>
                      {(match.occupancy?.totalPlayers ?? 0)}/
                      {match.occupancy?.totalCapacity ?? match.maxPlayersPerTeam * 2}
                    </Text>
                  </View>
                  <TeamOccupancy match={match} />
                  <TeamRoster
                    match={match}
                    onOpenProfile={actions.onOpenProfile}
                    canRemovePlayers={isAdmin}
                    onRemovePlayer={(userId) =>
                      actions.onRemovePlayer(match.id, userId)
                    }
                  />
                </View>

                <View style={styles.detailActionPanel}>
                  {selectedIsParticipant && match.status !== "CANCELLED" ? (
                    <Pressable
                      style={styles.ghostDangerButton}
                      onPress={() => actions.onLeaveMatch(match.id)}
                      disabled={loading}
                    >
                      <Text style={styles.ghostDangerText}>Salir del partido</Text>
                    </Pressable>
                  ) : match.status !== "OPEN" ? (
                    <View style={styles.statusBanner}>
                      <Text style={styles.statusBannerText}>
                        {match.status === "FULL"
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
                            (loading || !selectedIsOpen || isTeamFull(match, "A")) &&
                              styles.actionButtonDisabled,
                          ]}
                          onPress={() => actions.onJoinMatch(match.id, "A")}
                          disabled={loading || !selectedIsOpen || isTeamFull(match, "A")}
                        >
                          <Text style={styles.darkJoinText}>
                            {isTeamFull(match, "A") ? "Completo" : "Equipo A"}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.limeJoinButton,
                            (loading || !selectedIsOpen || isTeamFull(match, "B")) &&
                              styles.actionButtonDisabled,
                          ]}
                          onPress={() => actions.onJoinMatch(match.id, "B")}
                          disabled={loading || !selectedIsOpen || isTeamFull(match, "B")}
                        >
                          <Text style={styles.limeJoinText}>
                            {isTeamFull(match, "B") ? "Completo" : "Equipo B"}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                  {selectedIsOwner && !isAdmin && match.status !== "CANCELLED" ? (
                    <Pressable
                      style={styles.cancelMatchButton}
                      onPress={() => actions.onCancelMatch(match.id)}
                      disabled={loading}
                    >
                      <Text style={styles.cancelMatchText}>Cancelar partido</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  style={styles.detailChatLauncher}
                  onPress={() => chat.onOpenChat(match.id)}
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
                        ? chat.messages.length > 0
                          ? `${chat.messages.length} mensajes`
                          : "Coordina con tu equipo"
                        : "Unete al partido para escribir"}
                    </Text>
                  </View>
                  <Text style={styles.detailChatOpenText}>Abrir</Text>
                </Pressable>
              </View>
            </View>

            <MatchChatModal
              visible={chat.showMatchChat}
              loading={loading}
              bottomInset={layout.bottomInset}
              messages={chat.messages}
              messageText={chat.messageText}
              participant={selectedIsParticipant}
              onClose={chat.onCloseChat}
              onRefresh={() => chat.onRefreshMessages(match.id)}
              onOpenProfile={actions.onOpenProfile}
              onMessageTextChange={chat.onMessageTextChange}
              onSend={chat.onSendMessage}
              onQuickMessage={chat.onQuickMessage}
            />
            <PublicProfileModal
              visible={publicProfileState.showPublicProfile}
              profile={publicProfileState.publicProfile}
              onClose={publicProfileState.onClosePublicProfile}
            />
          </>
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No hay partido seleccionado</Text>
            <Text style={styles.emptyText}>Vuelve al mapa o crea uno nuevo.</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav
        active="home"
        onHome={navigation.onHome}
        onCreate={navigation.onCreate}
        onProfile={navigation.onProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  detailContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 820 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 10,
    gap: 16,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallLabel: {
    color: "#8FEA6A",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  screenTitle: {
    color: "#E3DBD0",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
  },
  closePill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.12)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
  detailHeroCard: {
    backgroundColor: "rgba(7,12,9,0.94)",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    ...platformShadow({ opacity: 0.24, radius: 24, y: 14 }),
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
  adminFloatingButtonPressed: { opacity: 0.78, transform: [{ scale: 0.96 }] },
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
  inlineActionPressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  adminInlineActionText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  adminInlineDangerText: { color: "#FFD1D1" },
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
  actionButtonDisabled: { opacity: 0.46 },
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
  emptyPanel: {
    backgroundColor: "rgba(156,163,175,0.10)",
    borderRadius: 18,
    padding: 10,
  },
  emptyTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#BDB6AE", fontSize: 14, marginTop: 6 },
});
