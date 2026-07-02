import { ComponentProps, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { PlayerPosition } from "../../types/domain";
import { greenRipple, motionStyles } from "./Motion";

export function Field({
  label,
  error = false,
  ...props
}: { label: string; error?: boolean } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        autoCapitalize="none"
        placeholderTextColor="#8A8F8B"
        style={[styles.input, error && styles.inputError]}
      />
    </View>
  );
}

export function PasswordField({
  label,
  error = false,
  ...props
}: { label: string; error?: boolean } & ComponentProps<typeof TextInput>) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.passwordInputWrap, error && styles.inputError]}>
        <TextInput
          {...props}
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Tu contrasena"
          placeholderTextColor="#8A8F8B"
          secureTextEntry={!visible}
          style={styles.passwordInput}
        />
        <Pressable
          style={({ pressed }) => [
            styles.passwordVisibilityButton,
            pressed && motionStyles.softPress,
          ]}
          onPress={() => setVisible((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
          android_ripple={greenRipple}
        >
          <Text style={styles.passwordVisibilityText}>
            {visible ? "Ocultar" : "Ver"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && motionStyles.pressGlow,
      ]}
      onPress={onPress}
      android_ripple={greenRipple}
    >
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PositionButton({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: PlayerPosition;
  active: boolean;
  onPress: (value: PlayerPosition) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.positionButton,
        active && styles.positionButtonActive,
        pressed && motionStyles.pressGlow,
      ]}
      onPress={() => onPress(value)}
      android_ripple={greenRipple}
    >
      <Text
        style={[
          styles.positionButtonText,
          active && styles.positionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function QuickChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickChip,
        active && styles.quickChipActive,
        pressed && motionStyles.pressGlow,
      ]}
      onPress={onPress}
      android_ripple={greenRipple}
    >
      <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const open = status === "OPEN";
  const full = status === "FULL";

  return (
    <View
      style={[
        styles.statusPill,
        full && styles.statusPillFull,
        !open && !full && styles.statusPillClosed,
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          full && styles.statusPillTextFull,
          !open && !full && styles.statusPillTextClosed,
        ]}
      >
        {matchStatusLabel(status)}
      </Text>
    </View>
  );
}

function matchStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Abierto";
    case "CANCELLED":
      return "Cancelado";
    case "FINISHED":
      return "Finalizado";
    case "FULL":
      return "Completo";
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  fieldBlock: { gap: 5 },
  fieldLabel: { color: "#8FEA6A", fontSize: 12, fontWeight: "900" },
  input: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 12,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    color: "#F7F1E8",
    fontSize: 14,
  },
  inputError: {
    borderColor: "rgba(255,128,128,0.88)",
    backgroundColor: "rgba(146,39,39,0.15)",
  },
  passwordInputWrap: {
    minHeight: 42,
    borderRadius: 13,
    paddingLeft: 12,
    paddingRight: 6,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, color: "#F7F1E8", fontSize: 14, minHeight: 42 },
  passwordVisibilityButton: {
    minWidth: 48,
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: "rgba(143,234,106,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  passwordVisibilityText: { color: "#A7F47D", fontSize: 11, fontWeight: "900" },
  filterButton: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "rgba(127,239,155,0.20)",
    borderWidth: 1,
    borderColor: "rgba(127,239,155,0.36)",
  },
  filterButtonText: { color: "#E3DBD0", fontSize: 13, fontWeight: "900" },
  filterButtonTextActive: { color: "#F7F1E8" },
  quickChip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipActive: {
    backgroundColor: "#8FEA6A",
    borderColor: "#8FEA6A",
  },
  quickChipText: {
    color: "rgba(247,241,232,0.78)",
    fontSize: 11,
    fontWeight: "900",
  },
  quickChipTextActive: { color: "#0A110E" },
  positionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 19,
    backgroundColor: "rgba(247,241,232,0.10)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  positionButtonActive: {
    backgroundColor: "#8FEA6A",
    borderColor: "#8FEA6A",
  },
  positionButtonText: { color: "#F7F1E8", fontSize: 12, fontWeight: "900" },
  positionButtonTextActive: { color: "#0A110E" },
  statusPill: {
    paddingHorizontal: 10,
    minHeight: 26,
    borderRadius: 13,
    backgroundColor: "#8FEA6A",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillFull: { backgroundColor: "#8FEA6A" },
  statusPillClosed: { backgroundColor: "rgba(217,88,88,0.18)" },
  statusPillText: { color: "#0A110E", fontSize: 11, fontWeight: "900" },
  statusPillTextFull: { color: "#051116" },
  statusPillTextClosed: { color: "#8F2727" },
});
