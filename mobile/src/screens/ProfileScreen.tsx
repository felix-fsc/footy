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
import { BottomNav } from "../components/navigation/BottomNav";
import {
  AdminFieldsPanel,
  MyMatchesSection,
  NextMatchCard,
  ProfileEditor,
  ProfileHero,
  ProfileStatsRow,
} from "../components/profile/ProfileSections";
import type {
  MatchResponse,
  PlayerPosition,
  PlayerProfileResponse,
  SavedFieldResponse,
} from "../types/domain";

type ProfileScreenProps = {
  admin: {
    address: string;
    city: string;
    editingId: string | null;
    isAdmin: boolean;
    latitude: string;
    longitude: string;
    name: string;
    savedFields: SavedFieldResponse[];
  };
  adminActions: {
    onAddressChange: (value: string) => void;
    onCityChange: (value: string) => void;
    onDeleteField: (field: SavedFieldResponse) => void;
    onLatitudeChange: (value: string) => void;
    onLongitudeChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onSaveField: () => void;
    onStartFieldCreate: () => void;
    onStartFieldEdit: (field: SavedFieldResponse) => void;
  };
  layout: {
    bottomInset: number;
    topInset: number;
  };
  navigation: {
    onCreate: () => void;
    onHome: () => void;
    onOpenMatch: (matchId: string) => void;
    onProfile: () => void;
  };
  profileData: {
    bio: string;
    city: string;
    editing: boolean;
    fullName: string;
    loading: boolean;
    myMatches: MatchResponse[];
    nextMyMatch: MatchResponse | null;
    position: PlayerPosition;
    profile: PlayerProfileResponse | null;
    userName: string | null;
    username: string;
    victoryStreak: number;
  };
  profileActions: {
    onBioChange: (value: string) => void;
    onCityChange: (value: string) => void;
    onFullNameChange: (value: string) => void;
    onLogout: () => void;
    onPositionChange: (value: PlayerPosition) => void;
    onSaveProfile: () => void;
    onToggleEditing: () => void;
    onUsernameChange: (value: string) => void;
  };
};

export function ProfileScreen({
  admin,
  adminActions,
  layout,
  navigation,
  profileActions,
  profileData,
}: ProfileScreenProps) {
  const {
    bio: profileBio,
    city: profileCity,
    editing: profileEditing,
    fullName: profileFullName,
    loading,
    myMatches,
    nextMyMatch,
    position: profilePosition,
    profile,
    userName,
    username: profileUsername,
    victoryStreak,
  } = profileData;

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <ScrollView
        contentContainerStyle={[
          styles.profileContent,
          {
            paddingTop: layout.topInset + 18,
            paddingBottom: layout.bottomInset + 104,
          },
        ]}
      >
        <View style={styles.profileHeader}>
          <Pressable style={styles.backButton} onPress={navigation.onHome}>
            <Text style={styles.backButtonText}>{"<"}</Text>
          </Pressable>
          <Text style={styles.profileTitle}>Perfil</Text>
          <Pressable style={styles.logoutPill} onPress={profileActions.onLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </Pressable>
        </View>

        <ProfileHero
          isAdmin={admin.isAdmin}
          profile={profile}
          profileCity={profileCity}
          profileEditing={profileEditing}
          profilePosition={profilePosition}
          userName={userName}
          victoryStreak={victoryStreak}
          onToggleEditing={profileActions.onToggleEditing}
        />

        {admin.isAdmin ? (
          <AdminFieldsPanel
            admin={admin}
            loading={loading}
            onAddressChange={adminActions.onAddressChange}
            onCityChange={adminActions.onCityChange}
            onDeleteField={adminActions.onDeleteField}
            onLatitudeChange={adminActions.onLatitudeChange}
            onLongitudeChange={adminActions.onLongitudeChange}
            onNameChange={adminActions.onNameChange}
            onSaveField={adminActions.onSaveField}
            onStartFieldCreate={adminActions.onStartFieldCreate}
            onStartFieldEdit={adminActions.onStartFieldEdit}
          />
        ) : null}

        {profileEditing ? (
          <ProfileEditor
            bio={profileBio}
            city={profileCity}
            fullName={profileFullName}
            loading={loading}
            position={profilePosition}
            username={profileUsername}
            onBioChange={profileActions.onBioChange}
            onCityChange={profileActions.onCityChange}
            onFullNameChange={profileActions.onFullNameChange}
            onPositionChange={profileActions.onPositionChange}
            onSaveProfile={profileActions.onSaveProfile}
            onUsernameChange={profileActions.onUsernameChange}
          />
        ) : null}

        <ProfileStatsRow matchesCount={myMatches.length} victoryStreak={victoryStreak} />
        <NextMatchCard nextMyMatch={nextMyMatch} onOpenMatch={navigation.onOpenMatch} />
        <MyMatchesSection matches={myMatches} onOpenMatch={navigation.onOpenMatch} />
      </ScrollView>
      <BottomNav
        active="profile"
        onHome={navigation.onHome}
        onCreate={navigation.onCreate}
        onProfile={navigation.onProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  profileContent: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 760 : undefined,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 10,
    gap: 14,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 19,
    backgroundColor: "rgba(227,219,208,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#E3DBD0", fontSize: 30, fontWeight: "700" },
  profileTitle: { color: "#E3DBD0", fontSize: 20, fontWeight: "900" },
  logoutPill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 19,
    backgroundColor: "rgba(247,241,232,0.12)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#F7F1E8", fontWeight: "900" },
});
