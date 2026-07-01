import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppFeedback } from "../../types/feedback";
import { platformShadow } from "../../utils/styleUtils";

type FeedbackToastProps = {
  feedback: AppFeedback | null;
  topInset: number;
  onDismiss: () => void;
};

export function FeedbackToast({
  feedback,
  topInset,
  onDismiss,
}: FeedbackToastProps) {
  if (!feedback) {
    return null;
  }
  const cardStyle = {
    error: styles.error,
    success: styles.success,
    warning: styles.warning,
  }[feedback.kind];
  const dotStyle = {
    error: styles.errorDot,
    success: styles.successDot,
    warning: styles.warningDot,
  }[feedback.kind];

  return (
    <Pressable
      style={[styles.toastWrap, { top: topInset + 12 }]}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.toastCard, cardStyle]}>
        <View style={[styles.toastDot, dotStyle]} />
        <View style={styles.toastTextWrap}>
          <Text style={styles.toastTitle}>{feedback.title}</Text>
          <Text style={styles.toastMessage}>{feedback.message}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 90,
    alignItems: "center",
  },
  toastCard: {
    width: "100%",
    maxWidth: 520,
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...platformShadow({ opacity: 0.28, radius: 18, y: 10 }),
  },
  success: {
    backgroundColor: "rgba(7,18,13,0.96)",
    borderColor: "rgba(143,234,106,0.38)",
  },
  error: {
    backgroundColor: "rgba(27,12,12,0.96)",
    borderColor: "rgba(217,88,88,0.48)",
  },
  warning: {
    backgroundColor: "rgba(30,24,12,0.96)",
    borderColor: "rgba(255,204,102,0.44)",
  },
  toastDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  successDot: { backgroundColor: "#8FEA6A" },
  errorDot: { backgroundColor: "#D95858" },
  warningDot: { backgroundColor: "#FFCC66" },
  toastTextWrap: { flex: 1, gap: 2 },
  toastTitle: {
    color: "#F7F1E8",
    fontSize: 13,
    fontWeight: "900",
  },
  toastMessage: {
    color: "rgba(247,241,232,0.72)",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
});
