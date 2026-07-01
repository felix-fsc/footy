import { useCallback, useEffect, useRef, useState } from "react";
import type { AppFeedback } from "../types/feedback";

const FEEDBACK_VISIBLE_MS = 3600;

export function useFeedback() {
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFeedback(null);
  }, []);

  const showFeedback = useCallback(
    (nextFeedback: AppFeedback) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setFeedback(nextFeedback);
      timeoutRef.current = setTimeout(clearFeedback, FEEDBACK_VISIBLE_MS);
    },
    [clearFeedback],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    clearFeedback,
    feedback,
    showFeedback,
  };
}
