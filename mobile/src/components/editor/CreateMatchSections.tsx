import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SavedFieldResponse } from "../../types/domain";
import { platformShadow } from "../../utils/styleUtils";
import { Field } from "../ui/FormControls";
import {
  DateSection,
  LocationSummary,
  PlayersSection,
  SavedFieldsPicker,
  TimeWheel,
} from "./CreateMatchFormSections";
export { EditMatchBanner } from "./EditMatchBanner";

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

const styles = StyleSheet.create({
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
