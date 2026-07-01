export type FeedbackKind = "error" | "success" | "warning";

export type AppFeedback = {
  kind: FeedbackKind;
  message: string;
  title: string;
};

export type ShowFeedback = (feedback: AppFeedback) => void;
