import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { PlayerProfileResponse } from "../../types/domain";
import { positionLabel, publicHandle } from "../../utils/matchUtils";
import { platformShadow } from "../../utils/styleUtils";
import { Entrance, greenRipple, motionStyles } from "../ui/Motion";

type PublicProfileModalProps = {
  visible: boolean;
  profile: PlayerProfileResponse | null;
  onClose: () => void;
};

export function PublicProfileModal({
  visible,
  profile,
  onClose,
}: PublicProfileModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.publicProfileBackdrop} onPress={onClose}>
        <Entrance visibleKey={profile?.id ?? visible} distance={18}>
          <Pressable
            style={styles.publicProfileCard}
            onPress={(event) => event.stopPropagation()}
          >
          <View style={styles.publicProfileTop}>
            <View style={styles.publicProfileAvatar}>
              <Text style={styles.publicProfileAvatarText}>
                {(profile?.username ||
                  profile?.fullName ||
                  profile?.displayName ||
                  "J")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.publicProfileClose,
                pressed && motionStyles.pressGlow,
              ]}
              onPress={onClose}
              android_ripple={greenRipple}
            >
              <Text style={styles.publicProfileCloseText}>Cerrar</Text>
            </Pressable>
          </View>
          <Text style={styles.publicProfileName}>
            {profile?.fullName || profile?.displayName || "Jugador Footy"}
          </Text>
          <Text style={styles.publicProfileHandle}>
            {publicHandle(profile ?? undefined)}
          </Text>
          <View style={styles.publicProfileInfoGrid}>
            <View style={styles.publicProfileInfoCard}>
              <Text style={styles.publicProfileInfoLabel}>Posicion</Text>
              <Text style={styles.publicProfileInfoValue}>
                {positionLabel(profile?.preferredPosition ?? null)}
              </Text>
            </View>
            <View style={styles.publicProfileInfoCard}>
              <Text style={styles.publicProfileInfoLabel}>Ciudad</Text>
              <Text style={styles.publicProfileInfoValue}>
                {profile?.city || "Sin ciudad"}
              </Text>
            </View>
          </View>
          {profile?.bio ? (
            <Text style={styles.publicProfileBio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.publicProfileBioMuted}>
              Este jugador todavia no ha escrito una bio.
            </Text>
          )}
          </Pressable>
        </Entrance>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  publicProfileBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  publicProfileCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    backgroundColor: "#07100A",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 18,
    gap: 12,
    ...platformShadow({ opacity: 0.3, radius: 28, y: 16 }),
  },
  publicProfileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  publicProfileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  publicProfileAvatarText: { color: "#0A110E", fontSize: 28, fontWeight: "900" },
  publicProfileClose: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  publicProfileCloseText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  publicProfileName: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  publicProfileHandle: { color: "#8FEA6A", fontSize: 14, fontWeight: "900" },
  publicProfileInfoGrid: { flexDirection: "row", gap: 10 },
  publicProfileInfoCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.10)",
    padding: 12,
    gap: 4,
  },
  publicProfileInfoLabel: {
    color: "rgba(247,241,232,0.52)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  publicProfileInfoValue: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  publicProfileBio: {
    color: "rgba(247,241,232,0.76)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  publicProfileBioMuted: {
    color: "rgba(247,241,232,0.46)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
});
