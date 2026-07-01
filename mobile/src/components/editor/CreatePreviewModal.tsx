import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { formatDraftPrice } from "../../utils/matchUtils";

type CreatePreviewModalProps = {
  city: string;
  date: string;
  editing: boolean;
  fieldName: string;
  latitude: number;
  loading: boolean;
  longitude: number;
  players: string;
  pricePerPerson: string;
  time: string;
  title: string;
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
};

export function CreatePreviewModal({
  visible,
  loading,
  title,
  fieldName,
  city,
  date,
  time,
  players,
  pricePerPerson,
  latitude,
  longitude,
  editing,
  onClose,
  onCreate,
}: CreatePreviewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewSheet}>
          <View style={styles.previewBubbleOne} />
          <View style={styles.previewBubbleTwo} />
          <View style={styles.previewHandle} />
          <Text style={styles.previewEyebrow}>Vista previa</Text>
          <Text style={styles.previewTitle}>{title.trim() || "Partido Footy"}</Text>
          <Text style={styles.previewMeta}>
            {fieldName.trim() || "Campo por confirmar"} -{" "}
            {city.trim() || "Ciudad pendiente"}
          </Text>
          <View style={styles.previewInfoGrid}>
            <PreviewInfo label="Fecha" value={`${date} - ${time}`} />
            <PreviewInfo label="Formato" value={`${players} vs ${players}`} />
            <PreviewInfo
              label="Precio"
              value={`${formatDraftPrice(pricePerPerson)} por persona`}
            />
            <PreviewInfo
              label="Ubicacion"
              value={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
            />
          </View>
          <View style={styles.previewActions}>
            <Pressable style={styles.previewSecondaryButton} onPress={onClose}>
              <Text style={styles.previewSecondaryText}>Editar</Text>
            </Pressable>
            <Pressable
              style={styles.previewPrimaryButton}
              onPress={onCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A110E" />
              ) : (
                <Text style={styles.previewPrimaryText}>
                  {editing ? "Guardar cambios" : "Crear partido"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PreviewInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewInfoCard}>
      <Text style={styles.previewInfoLabel}>{label}</Text>
      <Text style={styles.previewInfoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
  },
  previewSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#07120D",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.14)",
    overflow: "hidden",
    padding: 18,
    paddingBottom: 24,
    gap: 12,
  },
  previewBubbleOne: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -60,
    top: -74,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  previewBubbleTwo: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    left: -44,
    bottom: -42,
    backgroundColor: "rgba(143,234,106,0.10)",
  },
  previewHandle: {
    width: 48,
    height: 5,
    borderRadius: 5,
    backgroundColor: "rgba(247,241,232,0.22)",
    alignSelf: "center",
    marginBottom: 4,
  },
  previewEyebrow: {
    color: "#8FEA6A",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewTitle: { color: "#F7F1E8", fontSize: 28, fontWeight: "900" },
  previewMeta: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  previewInfoGrid: { gap: 8 },
  previewInfoCard: {
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 12,
    gap: 3,
  },
  previewInfoLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewInfoValue: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  previewActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  previewSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewSecondaryText: { color: "#F7F1E8", fontWeight: "900" },
  previewPrimaryButton: {
    flex: 1.25,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  previewPrimaryText: { color: "#0A110E", fontWeight: "900" },
});
