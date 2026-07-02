import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppLogoImage } from "../branding/Branding";
import { MapHome } from "../map/MapHome";
import { ListHome } from "../matches/ListHome";
import { ModeButton } from "../ui/ModeButton";
import { greenRipple, motionStyles } from "../ui/Motion";
import type { HomeMode, MatchResponse } from "../../types/domain";

export function HomeHero({ playedMatchesCount }: { playedMatchesCount: number }) {
  return (
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
          <Text style={styles.homeStreakNumber}>{playedMatchesCount}</Text>
          <Text style={styles.homeStreakText}>jugados</Text>
        </View>
      </View>
    </View>
  );
}

export function HomeSearch({
  searchQuery,
  onSearchQueryChange,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}) {
  return (
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
  );
}

export function HomeToolbar({
  homeMode,
  loading,
  onHomeModeChange,
  onRefresh,
}: {
  homeMode: HomeMode;
  loading: boolean;
  onHomeModeChange: (mode: HomeMode) => void;
  onRefresh: () => void;
}) {
  return (
    <>
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
        style={({ pressed }) => [
          styles.refreshMiniButton,
          pressed && !loading && motionStyles.pressGlow,
        ]}
        onPress={onRefresh}
        disabled={loading}
        android_ripple={greenRipple}
      >
        {loading ? (
          <ActivityIndicator color="#E3DBD0" />
        ) : (
          <Text style={styles.refreshMiniText}>R</Text>
        )}
      </Pressable>
    </>
  );
}

type HomeBodyProps = {
  currentUserId: string | null;
  homeMode: HomeMode;
  loading: boolean;
  matches: MatchResponse[];
  myMatches: MatchResponse[];
  searchQuery: string;
  selectedMatch: MatchResponse | null;
  selectedMatchId: string | null;
  userCity: string;
  onOpenDetail: (matchId: string) => void;
  onSelectMatch: (matchId: string | null) => void;
};

export function HomeBody({
  currentUserId,
  homeMode,
  loading,
  matches,
  myMatches,
  searchQuery,
  selectedMatch,
  selectedMatchId,
  userCity,
  onOpenDetail,
  onSelectMatch,
}: HomeBodyProps) {
  return homeMode === "map" ? (
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
  );
}

const styles = StyleSheet.create({
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
    fontSize: 8,
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
});
