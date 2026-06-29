import type {
  GeocodeResult,
  MapLocation,
  MapPoint,
  MapTile,
  MatchResponse,
} from "../types/domain";

export const MAP_TILE_SIZE = 256;
export const MAP_DEFAULT_ZOOM = 14;
export const MAP_MIN_ZOOM = 11;
export const MAP_MAX_ZOOM = 17;
export const DEFAULT_MAP_CENTER = { latitude: 37.26142, longitude: -6.94472 };

export function getCityMapCenter(city: string | null | undefined): MapLocation {
  const normalized = (city ?? "").trim().toLowerCase();
  if (normalized.includes("huelva")) {
    return { latitude: 37.26142, longitude: -6.94472 };
  }
  if (normalized.includes("madrid")) {
    return { latitude: 40.416775, longitude: -3.70379 };
  }
  return DEFAULT_MAP_CENTER;
}

export async function geocodePlace(query: string, city?: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return null;
  }

  const scopedQuery = city?.trim()
    ? `${normalizedQuery}, ${city.trim()}, Espana`
    : `${normalizedQuery}, Espana`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=es&q=${encodeURIComponent(scopedQuery)}`,
  );
  if (!response.ok) {
    throw new Error("No se pudo buscar la direccion");
  }

  const results = (await response.json()) as GeocodeResult[];
  const first = results[0];
  if (!first) {
    return null;
  }

  return {
    location: {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
    },
    address: first.display_name,
  };
}

export function getMatchLocation(match: MatchResponse) {
  const latitude = match.field?.latitude;
  const longitude = match.field?.longitude;
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude };
  }
  return null;
}

export function getMapCenter(
  matches: MatchResponse[],
  userLocation: MapLocation | null,
): MapLocation {
  if (userLocation) {
    return userLocation;
  }

  const locations = matches
    .map(getMatchLocation)
    .filter(Boolean) as MapLocation[];
  if (locations.length === 0) {
    return DEFAULT_MAP_CENTER;
  }

  return {
    latitude:
      locations.reduce((sum, location) => sum + location.latitude, 0) /
      locations.length,
    longitude:
      locations.reduce((sum, location) => sum + location.longitude, 0) /
      locations.length,
  };
}

export function latLonToWorld(location: MapLocation, zoom: number) {
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((location.latitude * Math.PI) / 180);
  return {
    x: ((location.longitude + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

export function worldToLatLon(point: MapPoint, zoom: number): MapLocation {
  const scale = MAP_TILE_SIZE * 2 ** zoom;
  const longitude = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const latitude =
    (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

export function getVisibleTiles(
  center: MapLocation,
  zoom: number,
  width: number,
  height: number,
) {
  const centerWorld = latLonToWorld(center, zoom);
  const topLeft = {
    x: centerWorld.x - width / 2,
    y: centerWorld.y - height / 2,
  };
  const startX = Math.floor(topLeft.x / MAP_TILE_SIZE);
  const endX = Math.ceil((topLeft.x + width) / MAP_TILE_SIZE);
  const startY = Math.floor(topLeft.y / MAP_TILE_SIZE);
  const endY = Math.ceil((topLeft.y + height) / MAP_TILE_SIZE);
  const maxTile = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) {
        continue;
      }
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        key: `${zoom}-${wrappedX}-${y}`,
        x: x * MAP_TILE_SIZE - topLeft.x,
        y: y * MAP_TILE_SIZE - topLeft.y,
        uri: `https://api.maptiler.com/maps/streets-v2/${zoom}/${wrappedX}/${y}.png?key=2MmV019neQt8MfLPITjf`,
      });
    }
  }

  return { tiles, topLeft, width, height };
}

export function projectLocation(
  location: MapLocation,
  topLeft: MapPoint,
  zoom: number,
) {
  const world = latLonToWorld(location, zoom);
  return {
    left: world.x - topLeft.x,
    top: world.y - topLeft.y,
  };
}

export function clampMapZoom(value: number) {
  return Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, value));
}

export function getTouchDistance(touches: { pageX: number; pageY: number }[]) {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}
