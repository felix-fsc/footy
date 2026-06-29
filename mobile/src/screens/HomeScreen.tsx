import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppLogoImage } from "../components/branding/Branding";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import { MapHome } from "../components/map/MapHome";
import { ListHome } from "../components/matches/ListHome";
import { BottomNav } from "../components/navigation/BottomNav";
import { ModeButton } from "../components/ui/ModeButton";
import type { HomeMode, MatchResponse } from "../types/domain";

const MOBILE_EDGE_PADDING = 10;

type HomeScreenProps = {
  homeMode: HomeMode;
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  selectedMatch: MatchResponse | null;
  selectedMatchId: string | null;
  currentUserId: string | null;
  searchQuery: string;
  userCity: string;
  victoryStreak: number;
  loading: boolean;
  topInset: number;
  onHomeModeChange: (mode: HomeMode) => void;
  onSearchQueryChange: (value: string) => void;
  onRefresh: () => void;
  onSelectMatch: (matchId: string | null) => void;
  onOpenDetail: (matchId: string) => void;
  onHome: () => void;
  onCreate: () => void;
  onProfile: () => void;
};

export function HomeScreen({
  homeMode,
  matches,
  myMatches,
  selectedMatch,
  selectedMatchId,
  currentUserId,
  searchQuery,
  userCity,
  victoryStreak,
  loading,
  topInset,
  onHomeModeChange,
  onSearchQueryChange,
  onRefresh,
  onSelectMatch,
  onOpenDetail,
  onHome,
  onCreate,
  onProfile,
}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <View style={[styles.homeShell, { paddingTop: topInset }]}>
        <View style={styles.homeContent}>
          <View style={styles.homeHeader}>
            <View style={styles.homeHeroBanner}>
              <View style={styles.homeBannerCircleOne} />
              <View style={styles.homeBannerCircleTwo} />
              <View style={styles.homeBannerTopline}>
                <View style={styles.homeTitleBlock}>
                  <View style={styles.homeTitleRow}>
                    <AppLogoImage size={36} />
                    <Text style={styles.homeTitle}>Footy</Text>
                  </View>
                  <Text style={styles.homeSubtitle}>
                    Encuentra partidos cerca y unete al equipo.
                  </Text>
                </View>
                <View style={styles.homeStreakPill}>
                  <Text style={styles.homeStreakNumber}>{victoryStreak}</Text>
                  <Text style={styles.homeStreakText}>racha</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.homeSearchWrap}>
            <View style={styles.homeSearchPill}>
              <View style={styles.homeSearchIcon}>
                <View style={styles.homeSearchCircle} />
                <View style={styles.homeSearchHandle} />
              </View>
              <TextInput
                style={styles.homeSearchInput}
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                placeholder="Buscar partido o ciudad"
                placeholderTextColor="rgba(227,219,208,0.62)"
              />
            </View>
          </View>

          <View style={styles.homeToolbar}>
            <View style={styles.modeSwitchDark}>
              <ModeButton
                label="Mapa"
                active={homeMode === "map"}
                onPress={() => onHomeModeChange("map")}
              />
              <ModeButton
                label="Lista"
                active={homeMode === "list"}
                onPress={() => onHomeModeChange("list")}
              />
            </View>
            <Pressable
              style={styles.refreshMiniButton}
              onPress={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#E3DBD0" />
              ) : (
                <Text style={styles.refreshMiniText}>R</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.homeBody}>
            {homeMode === "map" ? (
              <MapHome
                matches={matches}
                selectedMatch={selectedMatch}
                selectedMatchId={selectedMatchId}
                searchQuery={searchQuery}
                userCity={userCity}
                onSelect={onSelectMatch}
                onClearSelection={() => onSelectMatch(null)}
                onOpenDetail={onOpenDetail}
                loading={loading}
              />
            ) : (
              <ListHome
                matches={matches}
                myMatches={myMatches}
                currentUserId={currentUserId}
                selectedMatchId={selectedMatchId}
                onSelect={onSelectMatch}
                onOpenDetail={onOpenDetail}
                loading={loading}
              />
            )}
          </View>
        </View>
      </View>
      <BottomNav
        active="home"
        onHome={onHome}
        onCreate={onCreate}
        onProfile={onProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
  modeSwitchDark: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    flexDirection: "row",
    padding: 6,
  },
  homeShell: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 0,
    paddingBottom: 0,
  },
  homeContent: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1180 : undefined,
    alignSelf: "center",
    paddingTop: Platform.OS === "android" ? 8 : 14,
  },
  homeHeader: {
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingTop: Platform.OS === "android" ? 6 : 0,
    paddingBottom: 8,
  },
  homeHeroBanner: {
    minHeight: Platform.OS === "web" ? 88 : 78,
    borderRadius: Platform.OS === "web" ? 24 : 19,
    backgroundColor: "rgba(7,12,9,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.10)",
    overflow: "hidden",
    paddingHorizontal: Platform.OS === "web" ? 18 : 12,
    paddingVertical: Platform.OS === "web" ? 14 : 10,
    justifyContent: "center",
  },
  homeBannerCircleOne: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 69,
    right: -72,
    top: -82,
    backgroundColor: "rgba(179,243,81,0.16)",
  },
  homeBannerCircleTwo: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    left: -38,
    bottom: -48,
    backgroundColor: "rgba(227,219,208,0.07)",
  },
  homeBannerTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  homeTitleBlock: { flex: 1, minWidth: 0 },
  homeTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  homeStreakPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  homeStreakNumber: { color: "#0A110E", fontSize: 16, fontWeight: "900" },
  homeStreakText: {
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    marginTop: -3,
  },
  homeTitle: {
    color: "#F7F1E8",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 31,
  },
  homeSubtitle: {
    color: "rgba(227,219,208,0.68)",
    fontSize: Platform.OS === "web" ? 13 : 11,
    fontWeight: "800",
    marginTop: 3,
  },
  homeSearchWrap: {
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 8,
  },
  homeSearchPill: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    backgroundColor: "rgba(10,17,14,0.42)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  homeSearchIcon: {
    width: 24,
    height: 24,
    position: "relative",
  },
  homeSearchCircle: {
    position: "absolute",
    left: 2,
    top: 2,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#8FEA6A",
  },
  homeSearchHandle: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#8FEA6A",
    transform: [{ rotate: "45deg" }],
  },
  homeSearchInput: {
    flex: 1,
    color: "#E3DBD0",
    fontSize: 14,
    fontWeight: "800",
    paddingVertical: 0,
  },
  homeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 10,
  },
  refreshMiniButton: {
    width: 40,
    height: 40,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.22)",
    backgroundColor: "rgba(227,219,208,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshMiniText: { color: "#E3DBD0", fontSize: 18, fontWeight: "900" },
  homeBody: {
    flex: 1,
    minHeight: 0,
    marginBottom: 0,
    borderRadius: Platform.OS === "web" ? 28 : 0,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: Platform.OS === "web" ? 1 : 0,
    borderColor: "rgba(227,219,208,0.10)",
  },
});
