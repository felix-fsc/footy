import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { AuthMode } from "../../types/domain";
import { platformShadow } from "../../utils/styleUtils";
import { AppLogoImage } from "../branding/Branding";
import { Field, PasswordField } from "../ui/FormControls";
import { ModeButton } from "../ui/ModeButton";
import { motionStyles } from "../ui/Motion";
import { GoogleAuthButton } from "./GoogleAuthButton";

export function AuthHero() {
  return (
    <View style={styles.authHeroBlock}>
      <View style={styles.authLogoHalo}>
        <View style={styles.authLogoBubbleOne} />
        <View style={styles.authLogoBubbleTwo} />
        <AppLogoImage size={Platform.OS === "android" ? 58 : 64} />
      </View>
      <Text style={styles.authBrand}>Footy</Text>
    </View>
  );
}

type AuthCardProps = {
  authError: string | null;
  authMode: AuthMode;
  displayName: string;
  email: string;
  googleLoginConfigured: boolean;
  loading: boolean;
  password: string;
  onAuthModeChange: (mode: AuthMode) => void;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onGoogleToken: (idToken: string) => Promise<void>;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function AuthCard({
  authError,
  authMode,
  displayName,
  email,
  googleLoginConfigured,
  loading,
  password,
  onAuthModeChange,
  onDisplayNameChange,
  onEmailChange,
  onGoogleToken,
  onPasswordChange,
  onSubmit,
}: AuthCardProps) {
  return (
    <View style={styles.authCard}>
      <View style={[styles.authCardBubbleOne, styles.noPointerEvents]} />
      <View style={[styles.authCardBubbleTwo, styles.noPointerEvents]} />
      <AuthModeSwitch authMode={authMode} onAuthModeChange={onAuthModeChange} />
      <View style={styles.authFormHeading}>
        <Text style={styles.authFormTitle}>
          {authMode === "login" ? "Inicia sesion" : "Crea tu cuenta"}
        </Text>
      </View>
      <AuthForm
        authError={authError}
        authMode={authMode}
        displayName={displayName}
        email={email}
        password={password}
        onDisplayNameChange={onDisplayNameChange}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
      />
      <AuthErrorBanner authError={authError} />
      <Pressable
        style={({ pressed }) => [
          styles.authButton,
          loading && styles.authButtonDisabled,
          pressed && !loading && motionStyles.pressGlow,
        ]}
        onPress={onSubmit}
        disabled={loading}
        android_ripple={{ color: "rgba(10,17,14,0.18)", borderless: false }}
      >
        {loading ? (
          <ActivityIndicator color="#0A110E" />
        ) : (
          <Text style={styles.authButtonText}>
            {authMode === "login" ? "Iniciar sesion" : "Crear cuenta"}
          </Text>
        )}
      </Pressable>
      <AuthDivider />
      <GoogleAuthButton
        configured={googleLoginConfigured}
        loading={loading}
        onGoogleToken={onGoogleToken}
      />
    </View>
  );
}

function AuthModeSwitch({
  authMode,
  onAuthModeChange,
}: {
  authMode: AuthMode;
  onAuthModeChange: (mode: AuthMode) => void;
}) {
  return (
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
  );
}

function AuthForm({
  authError,
  authMode,
  displayName,
  email,
  password,
  onDisplayNameChange,
  onEmailChange,
  onPasswordChange,
}: {
  authError: string | null;
  authMode: AuthMode;
  displayName: string;
  email: string;
  password: string;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  return (
    <>
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
    </>
  );
}

function AuthErrorBanner({ authError }: { authError: string | null }) {
  if (!authError) {
    return null;
  }

  return (
    <View style={styles.authErrorBox} accessibilityLiveRegion="polite">
      <View style={styles.authErrorDot} />
      <Text style={styles.authErrorText}>{authError}</Text>
    </View>
  );
}

function AuthDivider() {
  return (
    <View style={styles.authDividerRow}>
      <View style={styles.authDividerLine} />
      <Text style={styles.authDividerText}>o continua con</Text>
      <View style={styles.authDividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...platformShadow({ opacity: 0.28, radius: 26, y: 16 }),
  },
  noPointerEvents: { pointerEvents: "none" },
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
