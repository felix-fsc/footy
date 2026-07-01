import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MatchResponse, SavedFieldResponse } from "../../types/domain";
import { platformShadow } from "../../utils/styleUtils";
import { MapPickerIcon, PencilIcon } from "../icons/AppIcons";
import { Field, QuickChip } from "../ui/FormControls";
import { CalendarPicker, TimeWheel } from "./MatchEditorControls";

type EditMatchBannerProps = {
  selectedMatch: MatchResponse | null;
  title: string;
};

export function EditMatchBanner({ selectedMatch, title }: EditMatchBannerProps) {
  return (
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
  );
}

type CreateMatchFormProps = {
  city: string;
  date: string;
  editingMatchId: string | null;
  fieldName: string;
  latitude: number;
  loading: boolean;
  longitude: number;
  maxPlayers: string;
  pricePerPerson: string;
  savedFields: SavedFieldResponse[];
  selectedSavedFieldId: string | null;
  showCalendar: boolean;
  time: string;
  title: string;
  onDateChange: (value: string) => void;
  onFieldNameChange: (value: string) => void;
  onMaxPlayersChange: (value: string) => void;
  onOpenLocationPicker: () => void;
  onOpenPreview: () => void;
  onPricePerPersonChange: (value: string) => void;
  onSelectSavedField: (field: SavedFieldResponse | null) => void;
  onTimeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onToggleCalendar: () => void;
};

export function CreateMatchForm({
  date,
  editingMatchId,
  fieldName,
  latitude,
  loading,
  longitude,
  maxPlayers,
  pricePerPerson,
  savedFields,
  selectedSavedFieldId,
  showCalendar,
  time,
  title,
  onDateChange,
  onFieldNameChange,
  onMaxPlayersChange,
  onOpenLocationPicker,
  onOpenPreview,
  onPricePerPersonChange,
  onSelectSavedField,
  onTimeChange,
  onTitleChange,
  onToggleCalendar,
}: CreateMatchFormProps) {
  return (
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
      <LocationSummary
        latitude={latitude}
        longitude={longitude}
        selectedSavedFieldId={selectedSavedFieldId}
        onOpenLocationPicker={onOpenLocationPicker}
      />
      <SavedFieldsPicker
        savedFields={savedFields}
        selectedSavedFieldId={selectedSavedFieldId}
        onSelectSavedField={onSelectSavedField}
      />
      <DateSection
        date={date}
        showCalendar={showCalendar}
        onDateChange={onDateChange}
        onToggleCalendar={onToggleCalendar}
      />
      <TimeWheel value={time} onChange={onTimeChange} />
      <PlayersSection maxPlayers={maxPlayers} onMaxPlayersChange={onMaxPlayersChange} />
      <Field
        label="Precio por persona"
        value={pricePerPerson}
        onChangeText={onPricePerPersonChange}
        keyboardType="decimal-pad"
        placeholder="3.50"
      />
      <Pressable style={styles.createPreviewButton} onPress={onOpenPreview} disabled={loading}>
        <Text style={styles.createPreviewButtonText}>
          {editingMatchId ? "Previsualizar cambios" : "Ver vista previa"}
        </Text>
      </Pressable>
    </View>
  );
}

function LocationSummary({
  latitude,
  longitude,
  selectedSavedFieldId,
  onOpenLocationPicker,
}: {
  latitude: number;
  longitude: number;
  selectedSavedFieldId: string | null;
  onOpenLocationPicker: () => void;
}) {
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

function SavedFieldsPicker({
  savedFields,
  selectedSavedFieldId,
  onSelectSavedField,
}: {
  savedFields: SavedFieldResponse[];
  selectedSavedFieldId: string | null;
  onSelectSavedField: (field: SavedFieldResponse | null) => void;
}) {
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

function DateSection({
  date,
  showCalendar,
  onDateChange,
  onToggleCalendar,
}: {
  date: string;
  showCalendar: boolean;
  onDateChange: (value: string) => void;
  onToggleCalendar: () => void;
}) {
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

function PlayersSection({
  maxPlayers,
  onMaxPlayersChange,
}: {
  maxPlayers: string;
  onMaxPlayersChange: (value: string) => void;
}) {
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

const styles = StyleSheet.create({
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
    ...platformShadow({ opacity: 0.22, radius: 20, y: 12 }),
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
    ...platformShadow({ opacity: 0.24, radius: 18, y: 10 }),
  },
  createPreviewButtonText: {
    color: "#0A110E",
    fontSize: 16,
    fontWeight: "900",
  },
});
