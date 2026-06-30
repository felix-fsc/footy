import * as Location from "expo-location";
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
  View,
} from "react-native";
import type { FieldMatchGroup, MapLocation, MatchResponse } from "../../types/domain";
import {
  MAP_DEFAULT_ZOOM,
  MAP_TILE_SIZE,
  clampMapZoom,
  getCityMapCenter,
  getCenterAfterDrag,
  getMapCanvasFrame,
  getMapCenter,
  getMatchLocation,
  getTouchDistance,
  getVisibleTiles,
  projectLocation,
  getWheelZoomDelta,
} from "../../utils/mapUtils";
import { platformShadow } from "../../utils/styleUtils";
import { LocationTargetIcon } from "../icons/AppIcons";
import { SelectedPopup } from "./SelectedPopup";

const MARKER_SIZE = 44;

type MapHomeProps = {
  matches: MatchResponse[];
  selectedMatch: MatchResponse | null;
  selectedMatchId: string | null;
  searchQuery: string;
  userCity: string;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onOpenDetail: (id: string) => void;
  loading: boolean;
};

export function MapHome({
  matches,
  selectedMatch,
  selectedMatchId,
  searchQuery,
  userCity,
  onSelect,
  onClearSelection,
  onOpenDetail,
  loading,
}: MapHomeProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MAP_DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const suggestedCenter = useMemo(
    () => getMapCenter(matches, userLocation),
    [matches, userLocation],
  );
  const [mapCenter, setMapCenter] = useState<MapLocation>(suggestedCenter);
  const initializedCenter = useRef(false);
  const previousSearchQuery = useRef(searchQuery);
  const panStart = useRef(dragOffset);
  const movedDuringGesture = useRef(false);
  const latestDragOffset = useRef(dragOffset);
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(MAP_DEFAULT_ZOOM);
  const pinchActive = useRef(false);
  const lastWheelZoomAt = useRef(0);

  useEffect(() => {
    if (!initializedCenter.current || userLocation) {
      setMapCenter(userLocation ?? getCityMapCenter(userCity));
      initializedCenter.current = true;
    }
  }, [userCity, userLocation]);

  useEffect(() => {
    const selectedLocation = selectedMatch
      ? getMatchLocation(selectedMatch)
      : null;
    if (selectedLocation) {
      setMapCenter(selectedLocation);
      setDragOffset({ x: 0, y: 0 });
      previousSearchQuery.current = searchQuery;
      return;
    }

    const currentQuery = searchQuery.trim();
    const previousQuery = previousSearchQuery.current.trim();
    if (currentQuery && matches.length > 0) {
      setMapCenter(getMapCenter(matches, null));
      setDragOffset({ x: 0, y: 0 });
    } else if (!currentQuery && previousQuery) {
      setMapCenter(getCityMapCenter(userCity));
      setDragOffset({ x: 0, y: 0 });
    }
    previousSearchQuery.current = searchQuery;
  }, [matches, searchQuery, selectedMatch, userCity]);

  useEffect(() => {
    latestDragOffset.current = dragOffset;
  }, [dragOffset]);

  const canvas = getMapCanvasFrame(viewport);
  const mapData = useMemo(
    () => getVisibleTiles(mapCenter, zoom, canvas.width, canvas.height),
    [canvas.height, canvas.width, mapCenter, zoom],
  );

  const fieldGroups = useMemo(() => {
    const groups = new Map<string, FieldMatchGroup>();

    matches.forEach((match) => {
      const location = getMatchLocation(match);
      if (!location) {
        return;
      }

      const field = match.field;
      const key =
        field?.id ??
        `${location.latitude.toFixed(5)},${location.longitude.toFixed(5)}`;
      const current = groups.get(key);

      if (current) {
        current.matches.push(match);
        return;
      }

      groups.set(key, {
        key,
        fieldName: field?.name ?? "Pista sin nombre",
        latitude: location.latitude,
        longitude: location.longitude,
        matches: [match],
      });
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      matches: group.matches.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    }));
  }, [matches]);

  const markerCoordinates = useMemo(
    () =>
      fieldGroups.map((group) =>
        projectLocation(
          {
            latitude: group.latitude,
            longitude: group.longitude,
          },
          mapData.topLeft,
          zoom,
        ),
      ),
    [fieldGroups, mapData.topLeft, zoom],
  );

  const selectedFieldGroup = useMemo(() => {
    if (!selectedMatchId) {
      return null;
    }

    return (
      fieldGroups.find((group) =>
        group.matches.some((match) => match.id === selectedMatchId),
      ) ?? null
    );
  }, [fieldGroups, selectedMatchId]);

  function commitDrag(nextOffset: { x: number; y: number }) {
    if (nextOffset.x === 0 && nextOffset.y === 0) {
      return;
    }
    setMapCenter(
      getCenterAfterDrag({
        center: mapCenter,
        dragOffset: nextOffset,
        zoom,
      }),
    );
    setDragOffset({ x: 0, y: 0 });
  }

  function selectNearestMarker(locationX: number, locationY: number) {
    const point = {
      x: locationX - canvas.left - latestDragOffset.current.x,
      y: locationY - canvas.top - latestDragOffset.current.y,
    };
    const hitIndex = markerCoordinates.findIndex((coordinate) => {
      const dx = coordinate.left - point.x;
      const dy = coordinate.top - point.y;
      return Math.sqrt(dx * dx + dy * dy) <= 42;
    });

    if (hitIndex >= 0) {
      const group = fieldGroups[hitIndex];
      onSelect(group.matches[0].id);
      return;
    }

    onClearSelection();
  }

  function applyZoomDelta(delta: number) {
    setZoom((current) => clampMapZoom(current + delta));
    setDragOffset({ x: 0, y: 0 });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
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
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
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
              setDragOffset({ x: 0, y: 0 });
            }
            return;
          }

          pinchActive.current = false;
          if (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2) {
            movedDuringGesture.current = true;
          }
          setDragOffset({
            x: panStart.current.x + gesture.dx,
            y: panStart.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (event) => {
          if (pinchActive.current) {
            pinchActive.current = false;
            pinchStartDistance.current = 0;
            return;
          }
          pinchStartDistance.current = 0;
          if (movedDuringGesture.current) {
            commitDrag(latestDragOffset.current);
            return;
          }
          selectNearestMarker(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
          );
        },
      }),
    [canvas.left, canvas.top, mapCenter, markerCoordinates, fieldGroups, zoom],
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

  async function useMyLocation() {
    try {
      if (Platform.OS === "web") {
        if (!("geolocation" in navigator)) {
          Alert.alert(
            "Ubicacion no disponible",
            "Este navegador no expone geolocalizacion.",
          );
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setDragOffset({ x: 0, y: 0 });
          },
          () => {
            Alert.alert(
              "No se pudo usar tu ubicacion",
              "Revisa permisos de ubicacion del navegador.",
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso de ubicacion necesario",
          "Activa la ubicacion para centrar el mapa en tu posicion.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setDragOffset({ x: 0, y: 0 });
    } catch {
      Alert.alert(
        "No se pudo usar tu ubicacion",
        "Revisa que la ubicacion del dispositivo este activada.",
      );
    }
  }

  return (
    <View
      style={styles.mapStage}
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
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClearSelection}
          >
            <View style={[styles.mapOverlay, styles.noPointerEvents]} />
          </Pressable>
          {fieldGroups.map((group, index) => {
            const coordinate = markerCoordinates[index];
            const firstMatch = group.matches[0];
            const active = group.matches.some(
              (match) => match.id === selectedMatchId,
            );

            return (
              <Pressable
                key={group.key}
                onPress={() => {
                  onSelect(firstMatch.id);
                }}
                style={[
                  styles.mapMarkerWrap,
                  {
                    left: coordinate.left - MARKER_SIZE / 2,
                    top: coordinate.top - MARKER_SIZE / 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.mapMarkerHalo,
                    active && styles.mapMarkerHaloActive,
                  ]}
                />
                <View
                  style={[
                    styles.mapMarkerPin,
                    active && styles.mapMarkerPinActive,
                    group.matches.length > 1 && styles.mapMarkerClusterPin,
                  ]}
                >
                  {group.matches.length > 1 ? (
                    <Text style={styles.mapMarkerCount}>
                      {group.matches.length}
                    </Text>
                  ) : (
                    <Text style={styles.mapMarkerBall}>⚽</Text>
                  )}
                </View>
                <View
                  style={[
                    styles.mapMarkerTail,
                    active && styles.mapMarkerTailActive,
                  ]}
                />
              </Pressable>
            );
          })}
          {userLocation ? (
            <View
              style={[
                styles.userLocationMarker,
                styles.noPointerEvents,
                {
                  left:
                    projectLocation(userLocation, mapData.topLeft, zoom).left -
                    11,
                  top:
                    projectLocation(userLocation, mapData.topLeft, zoom).top -
                    11,
                },
              ]}
            />
          ) : null}
        </View>
      </View>
      <Pressable style={styles.mapLocationButton} onPress={useMyLocation}>
        <LocationTargetIcon />
      </Pressable>

      {loading ? (
        <View style={styles.mapLoadingPill}>
          <ActivityIndicator color="#0A110E" />
          <Text style={styles.mapLoadingText}>Actualizando</Text>
        </View>
      ) : null}
      {selectedMatch ? (
        <SelectedPopup
          match={selectedMatch}
          matches={selectedFieldGroup?.matches ?? [selectedMatch]}
          onOpenDetail={onOpenDetail}
          loading={loading}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapStage: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderTopLeftRadius: Platform.OS === "web" ? 28 : 30,
    borderTopRightRadius: Platform.OS === "web" ? 28 : 30,
    borderBottomLeftRadius: Platform.OS === "web" ? 28 : 0,
    borderBottomRightRadius: Platform.OS === "web" ? 28 : 0,
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
  mapLocationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: "rgba(7,16,10,0.92)",
    borderWidth: 1,
    borderColor: "rgba(247,241,232,0.16)",
    alignItems: "center",
    justifyContent: "center",
    ...platformShadow({ opacity: 0.3, radius: 18, y: 10 }),
    zIndex: 18,
  },
  userLocationMarker: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2979FF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  mapLoadingPill: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#8FEA6A",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  mapLoadingText: { color: "#0A110E", fontSize: 12, fontWeight: "900" },
  mapMarkerWrap: {
    position: "absolute",
    width: 44,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 12,
  },
  mapMarkerHalo: {
    position: "absolute",
    top: 3,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(143,234,106,0.18)",
    borderWidth: 1,
    borderColor: "rgba(143,234,106,0.35)",
  },
  mapMarkerHaloActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -1,
    backgroundColor: "rgba(143,234,106,0.28)",
    borderColor: "#8FEA6A",
  },
  mapMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#8FEA6A",
    borderWidth: 3,
    borderColor: "#0A110E",
    alignItems: "center",
    justifyContent: "center",
    ...platformShadow({ elevation: 8, opacity: 0.35, radius: 8, y: 5 }),
  },
  noPointerEvents: { pointerEvents: "none" },
  mapMarkerPinActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#B8FFD0",
    borderColor: "#F7F1E8",
  },
  mapMarkerClusterPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F7F1E8",
    borderColor: "#8FEA6A",
  },
  mapMarkerTail: {
    marginTop: -3,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#0A110E",
  },
  mapMarkerTailActive: {
    borderTopColor: "#F7F1E8",
  },
  mapMarkerBall: {
    fontSize: 16,
    lineHeight: 18,
  },
  mapMarkerCount: {
    color: "#0A110E",
    fontSize: 15,
    fontWeight: "900",
  },
});
