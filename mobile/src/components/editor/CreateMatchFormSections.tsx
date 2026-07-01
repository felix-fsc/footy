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
      <View style={styles.savedFieldHeader}>
        <Text style={styles.fieldLabel}>Pistas guardadas</Text>
        <Text style={styles.savedFieldHint}>Elige una pista o marca punto manual</Text>
      </View>
      <ScrollView
        style={styles.savedFieldList}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.savedFieldListContent}
      >
        <SavedFieldRow
          active={!selectedSavedFieldId}
          title="Punto manual"
          meta="Elegir ubicacion en el mapa"
          onPress={() => onSelectSavedField(null)}
        />
        {savedFields.map((field) => {
          const active = selectedSavedFieldId === field.id;
          return (
            <SavedFieldRow
              key={field.id}
              active={active}
              title={field.name}
              meta={field.city || field.address || "Pista guardada"}
              onPress={() => onSelectSavedField(field)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

type SavedFieldRowProps = {
  active: boolean;
  title: string;
  meta: string;
  onPress: () => void;
};

function SavedFieldRow({ active, title, meta, onPress }: SavedFieldRowProps) {
  return (
    <Pressable
      style={[styles.savedFieldRow, active && styles.savedFieldRowActive]}
      onPress={onPress}
    >
      <View style={styles.savedFieldTextBlock}>
        <Text
          style={[styles.savedFieldTitle, active && styles.savedFieldTitleActive]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.savedFieldMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={[styles.savedFieldState, active && styles.savedFieldStateActive]}>
        <Text
          style={[
            styles.savedFieldStateText,
            active && styles.savedFieldStateTextActive,
          ]}
        >
          {active ? "Seleccionada" : "Elegir"}
        </Text>
      </View>
    </Pressable>
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
  savedFieldBlock: { gap: 9 },
  savedFieldHeader: { gap: 3 },
  savedFieldHint: {
    color: "rgba(247,241,232,0.58)",
    fontSize: 11,
    fontWeight: "800",
  },
  savedFieldList: {
    maxHeight: 230,
  },
  savedFieldListContent: {
    gap: 8,
    paddingBottom: 2,
  },
  savedFieldRow: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: "rgba(247,241,232,0.08)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  savedFieldRowActive: {
    backgroundColor: "rgba(127,239,155,0.18)",
    borderColor: "rgba(127,239,155,0.42)",
  },
  savedFieldTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  savedFieldTitle: {
    color: "#E3DBD0",
    fontSize: 14,
    fontWeight: "900",
  },
  savedFieldTitleActive: { color: "#F7F1E8" },
  savedFieldMeta: {
    color: "rgba(227,219,208,0.62)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },
  savedFieldState: {
    minWidth: 66,
    borderRadius: 999,
    backgroundColor: "rgba(247,241,232,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center",
  },
  savedFieldStateActive: {
    backgroundColor: "#8FEA6A",
  },
  savedFieldStateText: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 10,
    fontWeight: "900",
  },
  savedFieldStateTextActive: {
    color: "#0A110E",
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
