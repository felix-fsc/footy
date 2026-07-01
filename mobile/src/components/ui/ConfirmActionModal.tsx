import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type ConfirmActionModalProps = {
  confirmLabel: string;
  loading?: boolean;
  message: string;
  title: string;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionModal({
  confirmLabel,
  loading = false,
  message,
  title,
  visible,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmSheet}>
          <View style={styles.confirmAccent} />
          <Text style={styles.confirmEyebrow}>Confirmar accion</Text>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmActions}>
            <Pressable
              style={styles.confirmSecondaryButton}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.confirmSecondaryText}>Volver</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmDangerButton, loading && styles.confirmButtonDisabled]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmDangerText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  confirmSheet: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 26,
    backgroundColor: "#07120D",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    padding: 18,
    gap: 11,
    overflow: "hidden",
  },
  confirmAccent: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -58,
    top: -70,
    backgroundColor: "rgba(217,88,88,0.18)",
  },
  confirmEyebrow: {
    color: "#FFD1D1",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  confirmTitle: {
    color: "#F7F1E8",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  confirmMessage: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmSecondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 21,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSecondaryText: { color: "#F7F1E8", fontSize: 13, fontWeight: "900" },
  confirmDangerButton: {
    flex: 1.15,
    minHeight: 50,
    borderRadius: 21,
    backgroundColor: "#D95858",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDangerText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  confirmButtonDisabled: { opacity: 0.62 },
});
