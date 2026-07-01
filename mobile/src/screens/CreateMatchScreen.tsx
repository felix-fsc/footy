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
  CreateMatchForm,
  EditMatchBanner,
} from "../components/editor/CreateMatchSections";
import { CreatePreviewModal } from "../components/editor/CreatePreviewModal";
import { BottomNav } from "../components/navigation/BottomNav";
import type {
  MatchLocationMode,
  MatchResponse,
  SavedFieldResponse,
} from "../types/domain";

type CreateMatchScreenProps = {
  actions: {
    onClose: () => void;
    onClosePreview: () => void;
    onDateChange: (value: string) => void;
    onDurationMinutesChange: (value: string) => void;
    onFieldNameChange: (value: string) => void;
    onLocationModeChange: (mode: MatchLocationMode) => void;
    onMaxPlayersChange: (value: string) => void;
    onOpenLocationPicker: () => void;
    onOpenPreview: () => void;
    onPricePerPersonChange: (value: string) => void;
    onSelectSavedField: (field: SavedFieldResponse | null) => void;
    onSubmit: () => void;
    onTimeChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    onToggleCalendar: () => void;
  };
  draft: {
    city: string;
    date: string;
    durationMinutes: string;
    fieldName: string;
    latitude: number;
    longitude: number;
    locationMode: MatchLocationMode;
    maxPlayers: string;
    pricePerPerson: string;
    selectedSavedFieldId: string | null;
    time: string;
    title: string;
  };
  editor: {
    editingMatchId: string | null;
    loading: boolean;
    savedFields: SavedFieldResponse[];
    selectedMatch: MatchResponse | null;
    showCalendar: boolean;
    showPreview: boolean;
  };
  layout: {
    bottomInset: number;
    topInset: number;
  };
  navigation: {
    onCreateTab: () => void;
    onHome: () => void;
    onProfile: () => void;
  };
};

export function CreateMatchScreen({
  actions,
  draft,
  editor,
  layout,
  navigation,
}: CreateMatchScreenProps) {
  const {
    city,
    date,
    durationMinutes,
    fieldName,
    latitude,
    longitude,
    locationMode,
    maxPlayers,
    pricePerPerson,
    selectedSavedFieldId,
    time,
    title,
  } = draft;
  const {
    editingMatchId,
    loading,
    savedFields,
    selectedMatch,
    showCalendar,
    showPreview,
  } = editor;

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <ScrollView
        contentContainerStyle={[
          styles.createContent,
          {
            paddingTop: layout.topInset + 18,
            paddingBottom: layout.bottomInset + 116,
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
            onPress={actions.onClose}
          >
            <Text style={styles.closePillText}>
              {editingMatchId ? "Volver" : "Cerrar"}
            </Text>
          </Pressable>
        </View>

        {editingMatchId ? (
          <EditMatchBanner selectedMatch={selectedMatch} title={title} />
        ) : null}

        <CreateMatchForm
          city={city}
          date={date}
          durationMinutes={durationMinutes}
          editingMatchId={editingMatchId}
          fieldName={fieldName}
          latitude={latitude}
          loading={loading}
          longitude={longitude}
          locationMode={locationMode}
          maxPlayers={maxPlayers}
          pricePerPerson={pricePerPerson}
          savedFields={savedFields}
          selectedSavedFieldId={selectedSavedFieldId}
          showCalendar={showCalendar}
          time={time}
          title={title}
          onDateChange={actions.onDateChange}
          onDurationMinutesChange={actions.onDurationMinutesChange}
          onFieldNameChange={actions.onFieldNameChange}
          onLocationModeChange={actions.onLocationModeChange}
          onMaxPlayersChange={actions.onMaxPlayersChange}
          onOpenLocationPicker={actions.onOpenLocationPicker}
          onOpenPreview={actions.onOpenPreview}
          onPricePerPersonChange={actions.onPricePerPersonChange}
          onSelectSavedField={actions.onSelectSavedField}
          onTimeChange={actions.onTimeChange}
          onTitleChange={actions.onTitleChange}
          onToggleCalendar={actions.onToggleCalendar}
        />
      </ScrollView>
      <CreatePreviewModal
        visible={showPreview}
        loading={loading}
        title={title}
        fieldName={fieldName}
        city={city}
        date={date}
        time={time}
        durationMinutes={durationMinutes}
        players={maxPlayers}
        pricePerPerson={pricePerPerson}
        latitude={latitude}
        longitude={longitude}
        editing={Boolean(editingMatchId)}
        onClose={actions.onClosePreview}
        onCreate={actions.onSubmit}
      />
      <BottomNav
        active="create"
        onHome={navigation.onHome}
        onCreate={navigation.onCreateTab}
        onProfile={navigation.onProfile}
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
});
