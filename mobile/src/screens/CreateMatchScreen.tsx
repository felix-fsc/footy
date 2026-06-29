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
import {
  CalendarPicker,
  CreatePreviewModal,
  TimeWheel,
} from "../components/editor/MatchEditorControls";
import { MapPickerIcon, PencilIcon } from "../components/icons/AppIcons";
import { BottomNav } from "../components/navigation/BottomNav";
import { Field, QuickChip } from "../components/ui/FormControls";
import type { MatchResponse, SavedFieldResponse } from "../types/domain";

type CreateMatchScreenProps = {
  editingMatchId: string | null;
  selectedMatch: MatchResponse | null;
  loading: boolean;
  title: string;
  fieldName: string;
  city: string;
  date: string;
  time: string;
  maxPlayers: string;
  pricePerPerson: string;
  latitude: number;
  longitude: number;
  selectedSavedFieldId: string | null;
  savedFields: SavedFieldResponse[];
  showCalendar: boolean;
  showPreview: boolean;
  topInset: number;
  bottomInset: number;
  onClose: () => void;
  onHome: () => void;
  onCreateTab: () => void;
  onProfile: () => void;
  onTitleChange: (value: string) => void;
  onFieldNameChange: (value: string) => void;
  onOpenLocationPicker: () => void;
  onSelectSavedField: (field: SavedFieldResponse | null) => void;
  onToggleCalendar: () => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onMaxPlayersChange: (value: string) => void;
  onPricePerPersonChange: (value: string) => void;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onSubmit: () => void;
};

export function CreateMatchScreen({
  editingMatchId,
  selectedMatch,
  loading,
  title,
  fieldName,
  city,
  date,
  time,
  maxPlayers,
  pricePerPerson,
  latitude,
  longitude,
  selectedSavedFieldId,
  savedFields,
  showCalendar,
  showPreview,
  topInset,
  bottomInset,
  onClose,
  onHome,
  onCreateTab,
  onProfile,
  onTitleChange,
  onFieldNameChange,
  onOpenLocationPicker,
  onSelectSavedField,
  onToggleCalendar,
  onDateChange,
  onTimeChange,
  onMaxPlayersChange,
  onPricePerPersonChange,
  onOpenPreview,
  onClosePreview,
  onSubmit,
}: CreateMatchScreenProps) {
  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <ScrollView
        contentContainerStyle={[
          styles.createContent,
          {
            paddingTop: topInset + 18,
            paddingBottom: bottomInset + 116,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.screenHeader}>
          <View>
            {editingMatchId ? (
              <Text style={styles.smallLabel}>Editando partido</Text>
            ) : null}
            <Text style={styles.screenTitle}>
              {editingMatchId ? "Editar partido" : "Nuevo partido"}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.closePill,
              editingMatchId && styles.editClosePill,
              pressed && styles.closePillPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.closePillText}>
              {editingMatchId ? "Volver" : "Cerrar"}
            </Text>
          </Pressable>
        </View>

        {editingMatchId ? (
          <View style={styles.editModeBanner}>
            <View style={styles.editModeIcon}>
              <PencilIcon />
            </View>
            <View style={styles.editModeTextWrap}>
              <Text style={styles.editModeTitle} numberOfLines={1}>
                {selectedMatch?.title ?? title}
              </Text>
              <Text style={styles.editModeMeta} numberOfLines={1}>
                Los cambios se guardaran en el partido publicado
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.createCard}>
          <View style={styles.createCardBubbleOne} />
          <View style={styles.createCardBubbleTwo} />
          <Field
            label="Titulo"
            value={title}
            onChangeText={onTitleChange}
            placeholder="Partido Footy"
          />
          <Field
            label="Campo"
            value={fieldName}
            onChangeText={onFieldNameChange}
            placeholder="Nombre del campo"
          />
          <View style={styles.locationCreateCard}>
            <View>
              <Text style={styles.locationCreateTitle}>Ubicacion</Text>
              <Text style={styles.locationCreateMeta}>
                {selectedSavedFieldId ? "Pista guardada" : "Punto manual"} -{" "}
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
            <Pressable style={styles.locationPickButton} onPress={onOpenLocationPicker}>
              <MapPickerIcon />
            </Pressable>
          </View>
          {savedFields.length > 0 ? (
            <View style={styles.savedFieldBlock}>
              <Text style={styles.fieldLabel}>Pistas guardadas</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.savedFieldScroller}
              >
                <Pressable
                  style={[
                    styles.savedFieldChip,
                    !selectedSavedFieldId && styles.savedFieldChipActive,
                  ]}
                  onPress={() => onSelectSavedField(null)}
                >
                  <Text
                    style={[
                      styles.savedFieldChipTitle,
                      !selectedSavedFieldId && styles.savedFieldChipTitleActive,
                    ]}
                  >
                    Punto manual
                  </Text>
                  <Text style={styles.savedFieldChipMeta}>Elegir en mapa</Text>
                </Pressable>
                {savedFields.map((field) => {
                  const active = selectedSavedFieldId === field.id;
                  return (
                    <Pressable
                      key={field.id}
                      style={[
                        styles.savedFieldChip,
                        active && styles.savedFieldChipActive,
                      ]}
                      onPress={() => onSelectSavedField(field)}
                    >
                      <Text
                        style={[
                          styles.savedFieldChipTitle,
                          active && styles.savedFieldChipTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {field.name}
                      </Text>
                      <Text style={styles.savedFieldChipMeta} numberOfLines={1}>
                        {field.city || field.address || "Pista guardada"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.calendarBlock}>
            <Text style={styles.fieldLabel}>Fecha</Text>
            <Pressable style={styles.dateSelectorCard} onPress={onToggleCalendar}>
              <View>
                <Text style={styles.dateSelectorLabel}>Fecha elegida</Text>
                <Text style={styles.dateSelectorValue}>{date}</Text>
              </View>
              <Text style={styles.dateSelectorAction}>
                {showCalendar ? "Ocultar" : "Cambiar"}
              </Text>
            </Pressable>
            {showCalendar ? (
              <CalendarPicker value={date} onChange={onDateChange} />
            ) : null}
          </View>
          <TimeWheel value={time} onChange={onTimeChange} />
          <View style={styles.choiceBlock}>
            <Text style={styles.fieldLabel}>Jugadores por equipo</Text>
            <View style={styles.quickChipRow}>
              {["5", "7", "11"].map((players) => (
                <QuickChip
                  key={players}
                  label={`${players} vs ${players}`}
                  active={maxPlayers === players}
                  onPress={() => onMaxPlayersChange(players)}
                />
              ))}
            </View>
          </View>
          <Field
            label="Precio por persona"
            value={pricePerPerson}
            onChangeText={onPricePerPersonChange}
            keyboardType="decimal-pad"
            placeholder="3.50"
          />
          <Pressable
            style={styles.createPreviewButton}
            onPress={onOpenPreview}
            disabled={loading}
          >
            <Text style={styles.createPreviewButtonText}>
              {editingMatchId ? "Previsualizar cambios" : "Ver vista previa"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <CreatePreviewModal
        visible={showPreview}
        loading={loading}
        title={title}
        fieldName={fieldName}
        city={city}
        date={date}
        time={time}
        players={maxPlayers}
        pricePerPerson={pricePerPerson}
        latitude={latitude}
        longitude={longitude}
        editing={Boolean(editingMatchId)}
        onClose={onClosePreview}
        onCreate={onSubmit}
      />
      <BottomNav
        active="create"
        onHome={onHome}
        onCreate={onCreateTab}
        onProfile={onProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  createContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
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
  screenTitle: { color: "#E3DBD0", fontSize: 30, fontWeight: "900" },
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
  editClosePill: {
    backgroundColor: "rgba(143,234,106,0.13)",
    borderColor: "rgba(143,234,106,0.30)",
  },
  closePillPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  closePillText: { color: "#E3DBD0", fontWeight: "900" },
  editModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(143,234,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.24)",
    padding: 12,
  },
  editModeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(7,16,10,0.72)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  editModeTextWrap: { flex: 1, minWidth: 0, gap: 3 },
  editModeTitle: { color: "#F7F1E8", fontSize: 15, fontWeight: "900" },
  editModeMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 12,
    fontWeight: "800",
  },
  createCard: {
    backgroundColor: "rgba(7,12,9,0.92)",
    borderRadius: 24,
    padding: 12,
    gap: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.14)",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  createCardBubbleOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -62,
    top: -70,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  createCardBubbleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -44,
    bottom: -40,
    backgroundColor: "rgba(227,219,208,0.08)",
  },
  fieldLabel: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  locationCreateCard: {
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationCreateTitle: { color: "#F7F1E8", fontSize: 14, fontWeight: "900" },
  locationCreateMeta: {
    color: "rgba(247,241,232,0.70)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  locationPickButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7F1E8",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  savedFieldBlock: { gap: 8 },
  savedFieldScroller: { gap: 8, paddingRight: 4 },
  savedFieldChip: {
    width: 150,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    padding: 10,
    justifyContent: "center",
  },
  savedFieldChipActive: {
    backgroundColor: "rgba(127,239,155,0.18)",
    borderColor: "rgba(127,239,155,0.42)",
  },
  savedFieldChipTitle: {
    color: "#E3DBD0",
    fontSize: 13,
    fontWeight: "900",
  },
  savedFieldChipTitleActive: { color: "#F7F1E8" },
  savedFieldChipMeta: {
    color: "rgba(227,219,208,0.62)",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },
  calendarBlock: { gap: 7 },
  dateSelectorCard: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateSelectorLabel: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dateSelectorValue: {
    color: "#F7F1E8",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  dateSelectorAction: {
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#8FEA6A",
    color: "#0A110E",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  choiceBlock: { gap: 7 },
  quickChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  createPreviewButton: {
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  createPreviewButtonText: {
    color: "#0A110E",
    fontSize: 16,
    fontWeight: "900",
  },
});
