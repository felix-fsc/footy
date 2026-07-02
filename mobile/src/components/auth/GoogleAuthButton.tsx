import * as Google from "expo-auth-session/providers/google";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../../api/config";
import { motionStyles } from "../ui/Motion";

export function GoogleAuthButton({
  configured,
  loading,
  onGoogleToken,
}: {
  configured: boolean;
  loading: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
}) {
  if (!configured) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.googleButton,
          styles.googleButtonDisabled,
          pressed && motionStyles.softPress,
        ]}
        onPress={() =>
          Alert.alert(
            "Google no esta configurado",
            "Falta configurar EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en mobile y APP_SECURITY_GOOGLE_CLIENT_IDS en backend.",
          )
        }
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continuar con Google, aun no configurado"
        android_ripple={{ color: "rgba(10,17,14,0.12)", borderless: true }}
      >
        <View style={styles.googleMark}>
          <Text style={styles.googleMarkText}>G</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <ConfiguredGoogleAuthButton
      loading={loading}
      onGoogleToken={onGoogleToken}
    />
  );
}

function ConfiguredGoogleAuthButton({
  loading,
  onGoogleToken,
}: {
  loading: boolean;
  onGoogleToken: (idToken: string) => Promise<void>;
}) {
  const [googleRequest, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    selectAccount: true,
  });

  async function submitGoogleAuth() {
    if (!googleRequest) {
      Alert.alert("Google no esta listo", "Espera un momento e intentalo de nuevo.");
      return;
    }

    const result = await promptGoogleSignIn();
    if (result.type !== "success") {
      return;
    }

    const idToken = result.params.id_token;
    if (!idToken) {
      Alert.alert("Google no esta listo", "Google no devolvio id_token.");
      return;
    }

    await onGoogleToken(idToken);
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.googleButton,
        (!googleRequest || loading) && styles.googleButtonDisabled,
        pressed && motionStyles.softPress,
      ]}
      onPress={submitGoogleAuth}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Continuar con Google"
      android_ripple={{ color: "rgba(10,17,14,0.12)", borderless: true }}
    >
      <View style={styles.googleMark}>
        <Text style={styles.googleMarkText}>G</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: 44,
    height: 44,
    alignSelf: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(10,17,14,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonDisabled: { opacity: 0.62 },
  googleMark: {
    alignItems: "center",
    justifyContent: "center",
  },
  googleMarkText: { color: "#4285F4", fontSize: 17, fontWeight: "900" },
});
