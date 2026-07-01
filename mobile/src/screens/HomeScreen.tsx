import { StatusBar } from "expo-status-bar";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import {
  HomeBody,
  HomeHero,
  HomeSearch,
  HomeToolbar,
} from "../components/home/HomeSections";
import { BottomNav } from "../components/navigation/BottomNav";
import type { HomeMode, MatchResponse } from "../types/domain";

const MOBILE_EDGE_PADDING = 10;

type HomeScreenProps = {
  actions: {
    onHomeModeChange: (mode: HomeMode) => void;
    onOpenDetail: (matchId: string) => void;
    onRefresh: () => void;
    onSearchQueryChange: (value: string) => void;
    onSelectMatch: (matchId: string | null) => void;
  };
  data: {
    currentUserId: string | null;
    loading: boolean;
    matches: MatchResponse[];
    myMatches: MatchResponse[];
    searchQuery: string;
    selectedMatch: MatchResponse | null;
    selectedMatchId: string | null;
    userCity: string;
    victoryStreak: number;
  };
  layout: {
    topInset: number;
  };
  navigation: {
    onCreate: () => void;
    onHome: () => void;
    onProfile: () => void;
  };
  view: {
    homeMode: HomeMode;
  };
};

export function HomeScreen({
  actions,
  data,
  layout,
  navigation,
  view,
}: HomeScreenProps) {
  const {
    currentUserId,
    loading,
    matches,
    myMatches,
    searchQuery,
    selectedMatch,
    selectedMatchId,
    userCity,
    victoryStreak,
  } = data;
  const { homeMode } = view;

  return (
    <SafeAreaView style={styles.darkScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <View style={[styles.homeShell, { paddingTop: layout.topInset }]}>
        <View style={styles.homeContent}>
          <View style={styles.homeHeader}>
            <HomeHero victoryStreak={victoryStreak} />
          </View>

          <View style={styles.homeSearchWrap}>
            <HomeSearch
              searchQuery={searchQuery}
              onSearchQueryChange={actions.onSearchQueryChange}
            />
          </View>

          <View style={styles.homeToolbar}>
            <HomeToolbar
              homeMode={homeMode}
              loading={loading}
              onHomeModeChange={actions.onHomeModeChange}
              onRefresh={actions.onRefresh}
            />
          </View>

          <View style={styles.homeBody}>
            <HomeBody
              currentUserId={currentUserId}
              homeMode={homeMode}
              loading={loading}
              matches={matches}
              myMatches={myMatches}
              searchQuery={searchQuery}
              selectedMatch={selectedMatch}
              selectedMatchId={selectedMatchId}
              userCity={userCity}
              onOpenDetail={actions.onOpenDetail}
              onSelectMatch={actions.onSelectMatch}
            />
          </View>
        </View>
      </View>
      <BottomNav
        active="home"
        onHome={navigation.onHome}
        onCreate={navigation.onCreate}
        onProfile={navigation.onProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: "#000000" },
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
  homeSearchWrap: {
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 8,
  },
  homeToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Platform.OS === "web" ? 0 : MOBILE_EDGE_PADDING,
    paddingBottom: 10,
  },
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
