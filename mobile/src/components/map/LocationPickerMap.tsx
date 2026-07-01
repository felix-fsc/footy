import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { LocationTargetIcon } from "../icons/AppIcons";
import { LocationPickerOverlay } from "./LocationPickerOverlay";
import { MapOverlay, MapTileCanvas } from "./MapTileCanvas";
import type { MapLocation } from "../../types/domain";
import { useLocationSearch } from "../../hooks/useLocationSearch";
import {
  clampMapZoom,
  getCenterAfterDrag,
  getLocationFromScreenPoint,
  getMapCanvasFrame,
  getPinchZoom,
  getTouchDistance,
  getVisibleTiles,
  projectLocation,
} from "../../utils/mapUtils";
import { useMapWheelZoom } from "./useMapWheelZoom";

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
  const panStart = useRef(dragOffset);
  const movedDuringGesture = useRef(false);
  const latestDragOffset = useRef(dragOffset);
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(15);
  const pinchActive = useRef(false);
  const skipNextCenterSync = useRef(false);
  const resetMapPosition = useCallback((location: MapLocation) => {
    setCenter(location);
    setDragOffset({ x: 0, y: 0 });
  }, []);
  const {
    locationSearch,
    locationSearching,
    searchLocation,
    setLocationSearch,
  } = useLocationSearch({
    city,
    onChange,
    onLocationFound: resetMapPosition,
  });

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
    const nextLocation = getLocationFromScreenPoint({
      canvas,
      dragOffset: latestDragOffset.current,
      locationX,
      locationY,
      topLeft: mapData.topLeft,
      zoom,
    });
    skipNextCenterSync.current = true;
    onChange(nextLocation);
    setDragOffset({ x: 0, y: 0 });
  }

  const applyZoomDelta = useCallback((delta: number) => {
    setZoom((current) => clampMapZoom(current + delta));
    setDragOffset({ x: 0, y: 0 });
  }, []);

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
              setZoom(
                getPinchZoom({
                  currentDistance: distance,
                  startDistance: pinchStartDistance.current,
                  startZoom: pinchStartZoom.current,
                }),
              );
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

  const mapWheelProps = useMapWheelZoom(applyZoomDelta);

  return (
    <View
      style={styles.locationPickerMap}
      onLayout={(event) => setViewport(event.nativeEvent.layout)}
      {...mapWheelProps}
    >
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <MapTileCanvas
          canvas={canvas}
          dragOffset={dragOffset}
          tiles={mapData.tiles}
        >
          <MapOverlay />
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
        </MapTileCanvas>
      </View>
      <LocationPickerOverlay
        city={city}
        fieldName={fieldName}
        locationSearch={locationSearch}
        locationSearching={locationSearching}
        onLocationSearchChange={setLocationSearch}
        onSearchLocation={searchLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  locationPickerMap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  locationPickedMarker: {
    position: "absolute",
    width: 22,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  noPointerEvents: { pointerEvents: "none" },
});
