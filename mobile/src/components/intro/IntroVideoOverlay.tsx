import { useEventListener } from "expo";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

const INTRO_VIDEO = require("../../../assets/intro.mp4");

export function IntroVideoOverlay({ onDone }: { onDone: () => void }) {
  const finished = useRef(false);
  const player = useVideoPlayer(INTRO_VIDEO, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.muted = true;
    nextPlayer.play();
  });

  const finish = useCallback(() => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onDone();
  }, [onDone]);

  useEventListener(player, "playToEnd", finish);
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "error") {
      finish();
    }
    if (Platform.OS === "web" && status === "readyToPlay") {
      player.play();
    }
  });

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const playTimer = setTimeout(() => player.play(), 0);
    return () => clearTimeout(playTimer);
  }, [player]);

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
