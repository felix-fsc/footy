import { Image, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { MAP_TILE_SIZE } from "../../utils/mapUtils";

type MapTile = {
  key: string;
  uri: string;
  x: number;
  y: number;
};

type MapTileCanvasProps = {
  canvas: {
    height: number;
    left: number;
    top: number;
    width: number;
  };
  children?: ReactNode;
  dragOffset: {
    x: number;
    y: number;
  };
  tiles: MapTile[];
};

export function MapTileCanvas({
  canvas,
  children,
  dragOffset,
  tiles,
}: MapTileCanvasProps) {
  return (
    <View
      style={[
        styles.mapCanvas,
        {
          left: canvas.left,
          top: canvas.top,
          width: canvas.width,
          height: canvas.height,
          transform: [
            { translateX: dragOffset.x },
            { translateY: dragOffset.y },
          ],
        },
      ]}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={[
            styles.mapTile,
            {
              left: tile.x,
              top: tile.y,
              width: MAP_TILE_SIZE,
              height: MAP_TILE_SIZE,
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
}

export function MapOverlay() {
  return <View style={styles.mapOverlay} />;
}

const styles = StyleSheet.create({
  mapCanvas: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
    backgroundColor: "#C8D2C4",
  },
  mapTile: { position: "absolute" },
  mapOverlay: {
    position: "absolute",
    pointerEvents: "none",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(52,52,52,0.08)",
  },
});
