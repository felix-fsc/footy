import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { AppLogoImage } from "../components/branding/Branding";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import { Field, PasswordField } from "../components/ui/FormControls";
import { ModeButton } from "../components/ui/ModeButton";
import type { AuthMode } from "../types/domain";

type AuthScreenProps = {
  authMode: AuthMode;
  displayName: string;
  email: string;
  password: string;
  authError: string | null;
  loading: boolean;
  googleLoginConfigured: boolean;
  onAuthModeChange: (mode: AuthMode) => void;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onGoogleToken: (idToken: string) => Promise<void>;
};

export function AuthScreen({
  authMode,
  displayName,
  email,
  password,
  authError,
  loading,
  googleLoginConfigured,
  onAuthModeChange,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleToken,
}: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.authScreen}>
      <StatusBar style="light" />
      <ScreenBubbles />
      <ScrollView
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authHeroBlock}>
          <View style={styles.authLogoHalo}>
            <View style={styles.authLogoBubbleOne} />
            <View style={styles.authLogoBubbleTwo} />
            <AppLogoImage size={Platform.OS === "android" ? 58 : 64} />
          </View>
          <Text style={styles.authBrand}>Footy</Text>
        </View>

        <View style={styles.authCard}>
          <View pointerEvents="none" style={styles.authCardBubbleOne} />
          <View pointerEvents="none" style={styles.authCardBubbleTwo} />
          <View style={styles.modeSwitchLight}>
            <ModeButton
              label="Entrar"
              icon="login"
              active={authMode === "login"}
              onPress={() => onAuthModeChange("login")}
            />
            <ModeButton
              label="Registro"
              icon="register"
              active={authMode === "register"}
              onPress={() => onAuthModeChange("register")}
            />
          </View>
          <View style={styles.authFormHeading}>
            <Text style={styles.authFormTitle}>
              {authMode === "login" ? "Inicia sesion" : "Crea tu cuenta"}
            </Text>
          </View>
          {authMode === "register" ? (
            <Field
              label="Alias de jugador"
              value={displayName}
              onChangeText={onDisplayNameChange}
              placeholder="Ej. Felix10"
              autoCapitalize="none"
              error={
                authError?.startsWith("Indica un alias") ||
                authError?.startsWith("Este alias") ||
                authError?.startsWith("El alias")
              }
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={onEmailChange}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoComplete="email"
            error={
              authError?.startsWith("Introduce tu email") ||
              authError?.startsWith("Introduce un email") ||
              authError?.startsWith("El email") ||
              authError?.startsWith("Email o contrasena")
            }
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={onPasswordChange}
            error={
              authError?.startsWith("Introduce tu contrasena") ||
              authError?.startsWith("La contrasena") ||
              authError?.startsWith("Email o contrasena")
            }
          />
          {authError ? (
            <View style={styles.authErrorBox} accessibilityLiveRegion="polite">
              <View style={styles.authErrorDot} />
              <Text style={styles.authErrorText}>{authError}</Text>
            </View>
          ) : null}
          <Pressable
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A110E" />
            ) : (
              <Text style={styles.authButtonText}>
                {authMode === "login" ? "Iniciar sesion" : "Crear cuenta"}
              </Text>
            )}
          </Pressable>
          <View style={styles.authDividerRow}>
            <View style={styles.authDividerLine} />
            <Text style={styles.authDividerText}>o continua con</Text>
            <View style={styles.authDividerLine} />
          </View>
          <GoogleAuthButton
            configured={googleLoginConfigured}
            loading={loading}
            onGoogleToken={onGoogleToken}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authScreen: { flex: 1, backgroundColor: "#000000" },
  authContent: {
    flexGrow: 1,
    justifyContent: Platform.OS === "android" ? "flex-start" : "center",
    paddingHorizontal: Platform.OS === "web" ? 18 : 10,
    paddingTop: Platform.OS === "android" ? 18 : 16,
    paddingBottom: 18,
    gap: 10,
  },
  authHeroBlock: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
  },
  authLogoHalo: {
    width: Platform.OS === "android" ? 78 : 88,
    height: Platform.OS === "android" ? 78 : 88,
    borderRadius: Platform.OS === "android" ? 24 : 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,243,81,0.10)",
    borderWidth: 1,
    borderColor: "rgba(179,243,81,0.18)",
    overflow: "hidden",
  },
  authLogoBubbleOne: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    right: -18,
    top: -16,
    backgroundColor: "rgba(179,243,81,0.28)",
  },
  authLogoBubbleTwo: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    left: -12,
    bottom: -10,
    backgroundColor: "rgba(227,219,208,0.12)",
  },
  authBrand: {
    color: "#E3DBD0",
    fontSize: Platform.OS === "android" ? 34 : 38,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(18,31,24,0.94)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.18)",
    padding: Platform.OS === "android" ? 12 : 14,
    gap: Platform.OS === "android" ? 9 : 10,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
  },
  authCardBubbleOne: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -58,
    top: -62,
    backgroundColor: "rgba(179,243,81,0.13)",
  },
  authCardBubbleTwo: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    left: -44,
    bottom: -38,
    backgroundColor: "rgba(227,219,208,0.05)",
  },
  modeSwitchLight: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(247,241,232,0.07)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.08)",
    flexDirection: "row",
    padding: 5,
  },
  authFormHeading: { paddingTop: 0 },
  authFormTitle: { color: "#F7F1E8", fontSize: 19, fontWeight: "900" },
  authErrorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    padding: 9,
    borderRadius: 13,
    backgroundColor: "rgba(146,39,39,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,128,128,0.34)",
  },
  authErrorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF8C8C",
    marginTop: 4,
  },
  authErrorText: {
    flex: 1,
    color: "#FFD1D1",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  authButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonDisabled: { opacity: 0.72 },
  authButtonText: { color: "#0A110E", fontSize: 15, fontWeight: "900" },
  authDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(247,241,232,0.12)",
  },
  authDividerText: {
    color: "rgba(227,219,208,0.54)",
    fontSize: 12,
    fontWeight: "900",
  },
});
