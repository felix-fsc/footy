import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppTab } from "../../types/domain";
import { platformShadow } from "../../utils/styleUtils";

const MOBILE_EDGE_PADDING = 10;

type BottomNavProps = {
  active: AppTab;
  onHome: () => void;
  onCreate: () => void;
  onProfile: () => void;
};

export function BottomNav({
  active,
  onHome,
  onCreate,
  onProfile,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 4);

  return (
    <View style={[styles.bottomNav, { bottom: bottomInset + 2 }]}>
      <Pressable
        style={[styles.navItem, active === "home" && styles.navItemActive]}
        onPress={onHome}
      >
        <Text style={[styles.navIcon, active === "home" && styles.navIconActive]}>
          H
        </Text>
        <Text style={[styles.navLabel, active === "home" && styles.navLabelActive]}>
          Home
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.navItem,
          styles.navCreateItem,
          active === "create" && styles.navItemActive,
        ]}
        onPress={onCreate}
      >
        <Text
          style={[
            styles.navCreateIcon,
            active === "create" && styles.navIconActive,
          ]}
        >
          +
        </Text>
        <Text
          style={[
            styles.navLabel,
            active === "create" && styles.navLabelActive,
          ]}
        >
          Crear partido
        </Text>
      </Pressable>
      <Pressable
        style={[styles.navItem, active === "profile" && styles.navItemActive]}
        onPress={onProfile}
      >
        <Text
          style={[styles.navIcon, active === "profile" && styles.navIconActive]}
        >
          P
        </Text>
        <Text
          style={[
            styles.navLabel,
            active === "profile" && styles.navLabelActive,
          ]}
        >
          Perfil
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: Platform.OS === "web" ? "50%" : MOBILE_EDGE_PADDING,
    right: Platform.OS === "web" ? undefined : MOBILE_EDGE_PADDING,
    width: Platform.OS === "web" ? 420 : undefined,
    transform: Platform.OS === "web" ? [{ translateX: -210 }] : undefined,
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.20)",
    flexDirection: "row",
    padding: 5,
    gap: 5,
    ...platformShadow({ opacity: 0.28, radius: 18, y: 8 }),
  },
  navItem: {
    flex: 1,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navItemActive: { backgroundColor: "#8FEA6A" },
  navCreateItem: {},
  navCreateIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 17,
    marginTop: -1,
  },
  navIcon: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 14,
    fontWeight: "900",
  },
  navIconActive: { color: "#0A110E" },
  navLabel: {
    color: "rgba(227,219,208,0.78)",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  navLabelActive: { color: "#0A110E" },
});
