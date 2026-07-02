import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { MessageResponse } from "../../types/domain";
import { formatTime, publicHandle } from "../../utils/matchUtils";
import { platformShadow } from "../../utils/styleUtils";
import { RefreshIcon } from "../icons/AppIcons";
import { QuickMessageButton } from "../home/HomeWidgets";
import { Entrance, greenRipple, motionStyles } from "../ui/Motion";

type MatchChatModalProps = {
  visible: boolean;
  loading: boolean;
  bottomInset: number;
  messages: MessageResponse[];
  messageText: string;
  participant: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenProfile: (userId: string) => void;
  onMessageTextChange: (value: string) => void;
  onSend: () => void;
  onQuickMessage: (content: string) => void;
};

export function MatchChatModal({
  visible,
  loading,
  bottomInset,
  messages,
  messageText,
  participant,
  onClose,
  onRefresh,
  onOpenProfile,
  onMessageTextChange,
  onSend,
  onQuickMessage,
}: MatchChatModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.chatModalBackdrop} onPress={onClose}>
        <Entrance visibleKey={visible} distance={26}>
          <Pressable
            style={[styles.chatSheet, { paddingBottom: bottomInset + 14 }]}
            onPress={(event) => event.stopPropagation()}
          >
          <View style={styles.chatHandle} />
          <View style={styles.chatHeader}>
            <View>
              <Text style={styles.chatEyebrow}>Partido</Text>
              <Text style={styles.chatTitle}>Chat</Text>
            </View>
            <View style={styles.chatHeaderActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.chatIconButton,
                  pressed && motionStyles.pressGlow,
                ]}
                onPress={onRefresh}
                disabled={loading}
                android_ripple={greenRipple}
              >
                <RefreshIcon />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.chatCloseButton,
                  pressed && motionStyles.pressGlow,
                ]}
                onPress={onClose}
                android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
              >
                <Text style={styles.chatCloseText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.chatEmptyCard}>
                <Text style={styles.chatEmptyTitle}>
                  {participant ? "Todavia no hay mensajes" : "Chat solo para jugadores"}
                </Text>
                <Text style={styles.chatEmptyText}>
                  {participant
                    ? "Escribe el primero y coordina la llegada."
                    : "Unete a un equipo para poder escribir aqui."}
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View key={message.id} style={styles.messageBubble}>
                  <Pressable onPress={() => onOpenProfile(message.author.id)}>
                    <Text style={styles.messageAuthor}>
                      {publicHandle(message.author)}
                    </Text>
                  </Pressable>
                  <Text style={styles.messageContent}>{message.content}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(message.sentAt)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
          {participant ? (
            <View style={styles.quickMessageRow}>
              <QuickMessageButton
                label="Voy llegando"
                onPress={() => onQuickMessage("Voy llegando")}
                disabled={loading}
              />
              <QuickMessageButton
                label="Confirmo"
                onPress={() => onQuickMessage("Confirmo asistencia")}
                disabled={loading}
              />
              <QuickMessageButton
                label="Necesito peto"
                onPress={() => onQuickMessage("Necesito peto")}
                disabled={loading}
              />
            </View>
          ) : null}
          <View style={styles.messageComposer}>
            <TextInput
              value={messageText}
              onChangeText={onMessageTextChange}
              placeholder="Escribe al equipo"
              placeholderTextColor="#8A8F8B"
              style={styles.messageInput}
              editable={participant && !loading}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                !participant && styles.sendButtonDisabled,
                pressed && participant && motionStyles.pressGlow,
              ]}
              onPress={onSend}
              disabled={!participant || loading}
              android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
            >
              <Text style={styles.sendButtonText}>Enviar</Text>
            </Pressable>
          </View>
          </Pressable>
        </Entrance>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chatModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.56)",
    justifyContent: "flex-end",
  },
  chatSheet: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 640 : undefined,
    maxHeight: "82%",
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#07100A",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 16,
    gap: 12,
    ...platformShadow({ opacity: 0.28, radius: 24, y: -12 }),
  },
  chatHandle: {
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(247,241,232,0.18)",
    alignSelf: "center",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chatEyebrow: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  chatTitle: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  chatHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatIconButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: "rgba(127,239,155,0.14)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatCloseButton: {
    minHeight: 38,
    borderRadius: 18,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chatCloseText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  chatMessages: { maxHeight: Platform.OS === "web" ? 420 : 360 },
  chatMessagesContent: { gap: 10, paddingVertical: 4 },
  chatEmptyCard: {
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 16,
    gap: 6,
  },
  chatEmptyTitle: { color: "#F7F1E8", fontSize: 18, fontWeight: "900" },
  chatEmptyText: {
    color: "rgba(247,241,232,0.66)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  messageBubble: {
    backgroundColor: "rgba(247,241,232,0.10)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    padding: 12,
    gap: 5,
  },
  messageAuthor: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  messageContent: { color: "#F7F1E8", fontSize: 15, lineHeight: 21 },
  messageTime: { color: "rgba(247,241,232,0.46)", fontSize: 11, fontWeight: "700" },
  quickMessageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  messageComposer: { flexDirection: "row", gap: 10, alignItems: "center" },
  messageInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 12,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    color: "#F7F1E8",
    fontSize: 14,
  },
  sendButton: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 25,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: "#0A110E", fontWeight: "900" },
});
