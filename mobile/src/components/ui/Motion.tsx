import { useEffect, useRef, type ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";

type EntranceProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  visibleKey?: string | number | boolean | null;
  style?: object | object[];
};

export function Entrance({
  children,
  delay = 0,
  distance = 14,
  visibleKey = true,
  style,
}: EntranceProps) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    motion.setValue(0);
    Animated.spring(motion, {
      toValue: 1,
      delay,
      useNativeDriver: true,
      damping: 18,
      stiffness: 150,
      mass: 0.82,
    }).start();
  }, [delay, motion, visibleKey]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: motion,
          transform: [
            {
              translateY: motion.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
            {
              scale: motion.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export const motionStyles = StyleSheet.create({
  pressGlow: {
    backgroundColor: "rgba(143,234,106,0.24)",
    borderColor: "rgba(143,234,106,0.86)",
    shadowColor: "#8FEA6A",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    transform: [{ scale: 0.98 }],
  },
  dangerPressGlow: {
    backgroundColor: "rgba(217,88,88,0.28)",
    borderColor: "rgba(217,88,88,0.78)",
    shadowColor: "#D95858",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    transform: [{ scale: 0.98 }],
  },
  softPress: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});

export const greenRipple = {
  color: "rgba(143,234,106,0.20)",
  borderless: false,
};

export const dangerRipple = {
  color: "rgba(217,88,88,0.22)",
  borderless: false,
};
