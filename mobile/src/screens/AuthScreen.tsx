import { StatusBar } from "expo-status-bar";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { AuthCard, AuthHero } from "../components/auth/AuthSections";
import { ScreenBubbles } from "../components/chrome/ScreenBubbles";
import { Entrance } from "../components/ui/Motion";
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
        <Entrance visibleKey={authMode} distance={10}>
          <AuthHero />
        </Entrance>
        <Entrance visibleKey={authMode} delay={70} distance={16}>
          <AuthCard
            authError={authError}
            authMode={authMode}
            displayName={displayName}
            email={email}
            googleLoginConfigured={googleLoginConfigured}
            loading={loading}
            password={password}
            onAuthModeChange={onAuthModeChange}
            onDisplayNameChange={onDisplayNameChange}
            onEmailChange={onEmailChange}
            onGoogleToken={onGoogleToken}
            onPasswordChange={onPasswordChange}
            onSubmit={onSubmit}
          />
        </Entrance>
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
});
