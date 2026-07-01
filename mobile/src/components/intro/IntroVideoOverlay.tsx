import { useEventListener } from "expo";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const INTRO_VIDEO = require("../../../assets/intro.mp4");

export function IntroVideoOverlay({ onDone }: { onDone: () => void }) {
  const finished = useRef(false);
  const mounted = useRef(true);
  const player = useVideoPlayer(INTRO_VIDEO, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = true;
  });

  const finish = useCallback(() => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onDone();
  }, [onDone]);

  const playSafely = useCallback(() => {
    if (finished.current || !mounted.current) {
      return;
    }
    if (
      Platform.OS === "web" &&
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    try {
      void Promise.resolve(player.play()).catch(() => undefined);
    } catch {
      // The browser can reject play() while the intro is being removed.
    }
  }, [player]);

  useEventListener(player, "playToEnd", finish);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") {
      finish();
    }
    if (Platform.OS === "web" && status === "readyToPlay") {
      playSafely();
    }
  });

  useEffect(() => {
    const playTimer = setTimeout(playSafely, 0);
    return () => {
      clearTimeout(playTimer);
      mounted.current = false;
    };
  }, [playSafely]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    function ignoreExpectedMediaAbort(event: PromiseRejectionEvent) {
      const reason = event.reason as { name?: string; message?: string };
      const message = reason?.message ?? "";
      if (
        reason?.name === "AbortError" &&
        message.toLowerCase().includes("play() request")
      ) {
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", ignoreExpectedMediaAbort);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        ignoreExpectedMediaAbort,
      );
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    function playWhenVisible() {
      if (document.visibilityState === "visible") {
        playSafely();
      }
    }

    document.addEventListener("visibilitychange", playWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", playWhenVisible);
    };
  }, [playSafely]);

  useEffect(() => {
    const fallback = setTimeout(finish, 6500);
    return () => clearTimeout(fallback);
  }, [finish]);

  return (
    <View style={styles.introScreen}>
      <StatusBar style="light" />
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        playsInline
        style={styles.introVideo}
      />
      <Pressable style={styles.introSkipButton} onPress={finish}>
        <Text style={styles.introSkipText}>Saltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  introScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  introVideo: {
    flex: 1,
    backgroundColor: "#000000",
  },
  introSkipButton: {
    position: "absolute",
    right: 18,
    top: Platform.OS === "android" ? 34 : 54,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  introSkipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
