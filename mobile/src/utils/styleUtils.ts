import { Platform } from "react-native";

export function platformShadow({
  color = "#000000",
  elevation,
  opacity,
  radius,
  x = 0,
  y,
}: {
  color?: string;
  elevation?: number;
  opacity: number;
  radius: number;
  x?: number;
  y: number;
}) {
  return Platform.select({
    web: {
      boxShadow: `${x}px ${y}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    },
    default: {
      elevation,
      shadowColor: color,
      shadowOffset: { width: x, height: y },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  });
}

function hexToRgb(color: string) {
  const normalized = color.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character + character)
          .join("")
      : normalized;
  const parsed = Number.parseInt(value, 16);
  if (!Number.isFinite(parsed)) {
    return "0, 0, 0";
  }
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;
  return `${red}, ${green}, ${blue}`;
}
