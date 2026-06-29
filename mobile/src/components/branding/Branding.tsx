import { Image, StyleSheet, View } from "react-native";

export function AppLogoImage({ size = 42 }: { size?: number }) {
  return (
    <Image
      source={require("../../../assets/icon.png")}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
    />
  );
}

export function LogoMark({ size = 42 }: { size?: number }) {
  return (
    <View
      style={[
        styles.logoMark,
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
      ]}
    >
      <View
        style={[
          styles.logoDot,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            left: size * 0.29,
            top: size * 0.17,
          },
        ]}
      />
      <View
        style={[
          styles.logoSlash,
          {
            width: size * 0.5,
            height: size * 0.2,
            left: size * 0.28,
            top: size * 0.5,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoMark: {
    backgroundColor: "#8FEA6A",
    overflow: "hidden",
    position: "relative",
  },
  logoDot: {
    position: "absolute",
    backgroundColor: "#0B2915",
  },
  logoSlash: {
    position: "absolute",
    backgroundColor: "#0B2915",
    transform: [{ rotate: "-18deg" }],
  },
});
