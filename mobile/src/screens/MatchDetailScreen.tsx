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
import { MatchChatModal } from "../components/matches/MatchChatModal";
import {
  MatchAdminActions,
  MatchChatLauncher,
  MatchHero,
  MatchInfoCards,
  MatchJoinPanel,
  MatchLocationCard,
  MatchPlayersSection,
  matchDetailSectionStyles,
} from "../components/matches/MatchDetailSections";
import { BottomNav } from "../components/navigation/BottomNav";
import { PublicProfileModal } from "../components/profile/PublicProfileModal";
import type {
  MatchResponse,
  MessageResponse,
  PlayerProfileResponse,
  TeamSide,
} from "../types/domain";

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
            <View style={matchDetailSectionStyles.detailHeroCard}>
              <MatchHero
                isAdmin={isAdmin}
                loading={loading}
                match={match}
                onEditMatch={actions.onEditMatch}
              />

              <View style={matchDetailSectionStyles.detailBody}>
                <MatchInfoCards match={match} />

                <MatchLocationCard
                  match={match}
                  onOpenDirections={actions.onOpenDirections}
                  onOpenProfile={actions.onOpenProfile}
                />

                {isAdmin ? (
                  <MatchAdminActions
                    loading={loading}
                    match={match}
                    onCancelMatch={actions.onCancelMatch}
                    onDeleteMatch={actions.onDeleteMatch}
                  />
                ) : null}

                <MatchPlayersSection
                  isAdmin={isAdmin}
                  match={match}
                  onOpenProfile={actions.onOpenProfile}
                  onRemovePlayer={actions.onRemovePlayer}
                />

                <MatchJoinPanel
                  isAdmin={isAdmin}
                  loading={loading}
                  match={match}
                  selectedIsOpen={selectedIsOpen}
                  selectedIsOwner={selectedIsOwner}
                  selectedIsParticipant={selectedIsParticipant}
                  onCancelMatch={actions.onCancelMatch}
                  onJoinMatch={actions.onJoinMatch}
                  onLeaveMatch={actions.onLeaveMatch}
                />

                <MatchChatLauncher
                  matchId={match.id}
                  messages={chat.messages}
                  selectedIsParticipant={selectedIsParticipant}
                  onOpenChat={chat.onOpenChat}
                />
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
  emptyPanel: {
    backgroundColor: "rgba(156,163,175,0.10)",
    borderRadius: 18,
    padding: 10,
  },
  emptyTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#BDB6AE", fontSize: 14, marginTop: 6 },
});
