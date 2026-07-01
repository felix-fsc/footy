import { useMemo, useRef } from "react";
import { Platform } from "react-native";
import { getWheelZoomDelta } from "../../utils/mapUtils";

type WheelEventLike = {
  deltaY?: number;
  nativeEvent?: { deltaY?: number };
  preventDefault?: () => void;
};

export function useMapWheelZoom(onZoomDelta: (delta: number) => void) {
  const lastWheelZoomAt = useRef(0);

  return useMemo(
    () =>
      Platform.OS === "web"
        ? ({
            onWheel: (event: WheelEventLike) => {
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
              onZoomDelta(zoomDelta);
            },
          } as object)
        : {},
    [onZoomDelta],
  );
}
