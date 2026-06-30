import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LocationTargetIcon } from "../icons/AppIcons";
import type { MapLocation } from "../../types/domain";
import {
  MAP_TILE_SIZE,
  clampMapZoom,
  geocodePlace,
  getCenterAfterDrag,
  getCityMapCenter,
  getMapCanvasFrame,
  getTouchDistance,
  getVisibleTiles,
  projectLocation,
  getWheelZoomDelta,
  worldToLatLon,
} from "../../utils/mapUtils";

const LOCATION_PICKER_EDGE_PADDING = 10;

type LocationPickerMapProps = {
  value: MapLocation;
  city: string;
  fieldName: string;
  onChange: (location: MapLocation, address?: string) => void;
};

export function LocationPickerMap({
  value,
  city,
  fieldName,
  onChange,
}: LocationPickerMapProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState<MapLocation>(value);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(15);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);
  const panStart = useRef(dragOffset);
  const movedDuringGesture = useRef(false);
  const latestDragOffset = useRef(dragOffset);
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(15);
  const pinchActive = useRef(false);
  const skipNextCenterSync = useRef(false);
  const lastWheelZoomAt = useRef(0);

  useEffect(() => {
    latestDragOffset.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    if (skipNextCenterSync.current) {
      skipNextCenterSync.current = false;
      return;
    }
    setCenter(value);
  }, [value.latitude, value.longitude]);

  const canvas = getMapCanvasFrame(viewport);
  const mapData = useMemo(
    () => getVisibleTiles(center, zoom, canvas.width, canvas.height),
    [canvas.height, canvas.width, center, zoom],
  );
  const selectedPoint = projectLocation(value, mapData.topLeft, zoom);

  function commitDrag(nextOffset: { x: number; y: number }) {
    if (nextOffset.x === 0 && nextOffset.y === 0) {
      return;
    }
    setCenter(
      getCenterAfterDrag({
        center,
        dragOffset: nextOffset,
        zoom,
      }),
    );
    setDragOffset({ x: 0, y: 0 });
  }

  function pickPoint(locationX: number, locationY: number) {
    const worldPoint = {
      x:
        mapData.topLeft.x + locationX - canvas.left - latestDragOffset.current.x,
      y: mapData.topLeft.y + locationY - canvas.top - latestDragOffset.current.y,
    };
    const nextLocation = worldToLatLon(worldPoint, zoom);
    skipNextCenterSync.current = true;
    onChange(nextLocation);
    setDragOffset({ x: 0, y: 0 });
  }

  function applyZoomDelta(delta: number) {
    setZoom((current) => clampMapZoom(current + delta));
    setDragOffset({ x: 0, y: 0 });
  }

  async function searchLocation() {
    const query = locationSearch.trim();
    if (!query) {
      const fallback = getCityMapCenter(city);
      setCenter(fallback);
      onChange(fallback, city || undefined);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    setLocationSearching(true);
    try {
      const result = await geocodePlace(query, city);
      if (!result) {
        Alert.alert("Sin resultados", "No he encontrado esa direccion.");
        return;
      }
      setCenter(result.location);
      onChange(result.location, result.address);
      setDragOffset({ x: 0, y: 0 });
    } catch (error) {
      Alert.alert(
        "No se pudo buscar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLocationSearching(false);
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (event, gesture) =>
          event.nativeEvent.touches.length >= 2 ||
          Math.abs(gesture.dx) > 5 ||
          Math.abs(gesture.dy) > 5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          movedDuringGesture.current = false;
          panStart.current = latestDragOffset.current;
          const touches = event.nativeEvent.touches;
          pinchActive.current = touches.length >= 2;
          pinchStartDistance.current = getTouchDistance(touches);
          pinchStartZoom.current = zoom;
        },
        onPanResponderMove: (_event, gesture) => {
          const touches = _event.nativeEvent.touches;
          if (touches.length >= 2) {
            const distance = getTouchDistance(touches);
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = distance;
              pinchStartZoom.current = zoom;
            }
            if (distance > 0 && pinchStartDistance.current > 0) {
              movedDuringGesture.current = true;
              pinchActive.current = true;
              const zoomDelta = Math.round(
                Math.log2(distance / pinchStartDistance.current) * 2,
              );
              setZoom(clampMapZoom(pinchStartZoom.current + zoomDelta));
            }
            setDragOffset({
              x: panStart.current.x + gesture.dx,
              y: panStart.current.y + gesture.dy,
            });
            return;
          }

          pinchActive.current = false;
        },
        onPanResponderRelease: (event) => {
          if (pinchActive.current) {
            pinchActive.current = false;
            pinchStartDistance.current = 0;
            commitDrag(latestDragOffset.current);
            return;
          }
          pinchStartDistance.current = 0;
          pickPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
        },
      }),
    [canvas.left, canvas.top, center, mapData.topLeft, onChange, zoom],
  );

  const mapWheelProps =
    Platform.OS === "web"
      ? ({
          onWheel: (event: {
            deltaY?: number;
            nativeEvent?: { deltaY?: number };
            preventDefault?: () => void;
          }) => {
            event.preventDefault?.();
            const deltaY = event.deltaY ?? event.nativeEvent?.deltaY ?? 0;
            if (Math.abs(deltaY) < 4) {
              return;
            }
            const now = Date.now();
            const zoomDelta = getWheelZoomDelta({
              deltaY,
              lastZoomAt: lastWheelZoomAt.current,
              now,
            });
            if (zoomDelta === 0) {
              return;
            }
            lastWheelZoomAt.current = now;
            applyZoomDelta(zoomDelta);
          },
        } as object)
      : {};

  return (
    <View
      style={styles.locationPickerMap}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      {...mapWheelProps}
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
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
          {mapData.tiles.map((tile) => (
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
          <View style={[styles.mapOverlay, styles.noPointerEvents]} />
          <View
            style={[
              styles.locationPickedMarker,
              styles.noPointerEvents,
              {
                left: selectedPoint.left - 11,
                top: selectedPoint.top - 25,
              },
            ]}
          >
            <LocationTargetIcon />
          </View>
        </View>
      </View>
      <View style={styles.locationSearchPanel}>
        <TextInput
          style={styles.locationSearchInput}
          value={locationSearch}
          onChangeText={setLocationSearch}
          placeholder={`Buscar calle cerca de ${fieldName || city || "la pista"}`}
          placeholderTextColor="rgba(227,219,208,0.62)"
          returnKeyType="search"
          onSubmitEditing={searchLocation}
        />
        <Pressable
          style={styles.locationSearchButton}
          onPress={searchLocation}
          disabled={locationSearching}
        >
          {locationSearching ? (
            <ActivityIndicator color="#0A110E" />
          ) : (
            <Text style={styles.locationSearchButtonText}>Buscar</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.locationPickerHint}>
        <Text style={styles.locationPickerHintText}>
          Toca el mapa para fijar la pista
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  locationPickerMap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(52,52,52,0.08)",
  },
  locationSearchPanel: {
    position: "absolute",
    top: 14,
    left: LOCATION_PICKER_EDGE_PADDING,
    right: LOCATION_PICKER_EDGE_PADDING,
    zIndex: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  locationSearchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(10,17,14,0.88)",
    borderWidth: 1,
    borderColor: "rgba(227,219,208,0.18)",
    color: "#F7F1E8",
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "800",
  },
  locationSearchButton: {
    minHeight: 44,
    minWidth: 82,
    borderRadius: 14,
    backgroundColor: "#B7F36B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationSearchButtonText: {
    color: "#0A110E",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  locationPickerHint: {
    position: "absolute",
    left: 18,
    top: 70,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: "rgba(10,17,14,0.78)",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationPickerHintText: { color: "#E3DBD0", fontSize: 12, fontWeight: "900" },
  locationPickedMarker: {
    position: "absolute",
    width: 22,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  noPointerEvents: { pointerEvents: "none" },
});
