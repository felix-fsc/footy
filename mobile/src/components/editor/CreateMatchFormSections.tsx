import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { SavedFieldResponse } from "../../types/domain";
import { MapPickerIcon } from "../icons/AppIcons";
import { QuickChip } from "../ui/FormControls";
import { CalendarPicker, TimeWheel } from "./MatchEditorControls";

type LocationSummaryProps = {
  latitude: number;
  longitude: number;
  selectedSavedFieldId: string | null;
  onOpenLocationPicker: () => void;
};

export function LocationSummary({
  latitude,
  longitude,
  selectedSavedFieldId,
  onOpenLocationPicker,
}: LocationSummaryProps) {
  return (
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
  );
}

type SavedFieldsPickerProps = {
  savedFields: SavedFieldResponse[];
  selectedSavedFieldId: string | null;
  onSelectSavedField: (field: SavedFieldResponse | null) => void;
};

export function SavedFieldsPicker({
  savedFields,
  selectedSavedFieldId,
  onSelectSavedField,
}: SavedFieldsPickerProps) {
  if (savedFields.length === 0) {
    return null;
  }

  return (
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
              style={[styles.savedFieldChip, active && styles.savedFieldChipActive]}
              onPress={() => onSelectSavedField(field)}
            >
              <Text
                style={[styles.savedFieldChipTitle, active && styles.savedFieldChipTitleActive]}
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
  );
}

type DateSectionProps = {
  date: string;
  showCalendar: boolean;
  onDateChange: (value: string) => void;
  onToggleCalendar: () => void;
};

export function DateSection({
  date,
  showCalendar,
  onDateChange,
  onToggleCalendar,
}: DateSectionProps) {
  return (
    <View style={styles.calendarBlock}>
      <Text style={styles.fieldLabel}>Fecha</Text>
      <Pressable style={styles.dateSelectorCard} onPress={onToggleCalendar}>
        <View>
          <Text style={styles.dateSelectorLabel}>Fecha elegida</Text>
          <Text style={styles.dateSelectorValue}>{date}</Text>
        </View>
        <Text style={styles.dateSelectorAction}>{showCalendar ? "Ocultar" : "Cambiar"}</Text>
      </Pressable>
      {showCalendar ? <CalendarPicker value={date} onChange={onDateChange} /> : null}
    </View>
  );
}

type PlayersSectionProps = {
  maxPlayers: string;
  onMaxPlayersChange: (value: string) => void;
};

export function PlayersSection({
  maxPlayers,
  onMaxPlayersChange,
}: PlayersSectionProps) {
  return (
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
  );
}

export { TimeWheel };

const styles = StyleSheet.create({
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
});
