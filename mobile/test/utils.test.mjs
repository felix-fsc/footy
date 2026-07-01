import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ApiRequestError,
  readApiErrorText,
} from "../src/api/errors.ts";
import {
  authErrorMessage,
  matchMutationErrorMessage,
  validateAuthForm,
} from "../src/utils/authUtils.ts";
import {
  getMatchDraftCity,
  getUserCity,
} from "../src/utils/appStateUtils.ts";
import {
  buildMatchRequestBody,
  draftValuesFromMatch,
  validateMatchDraftValues,
} from "../src/utils/matchDraftUtils.ts";
import {
  dateInputFromInstant,
  formatDurationMinutes,
  formatDraftPrice,
  formatPriceFromCents,
  getMatchViewerState,
  getPlayedRegisteredMatchesCount,
  getUpcomingRegisteredMatches,
  getVisibleMatches,
  isTeamFull,
  timeInputFromInstant,
  userParticipatesInMatch,
} from "../src/utils/matchUtils.ts";
import {
  clampMapZoom,
  getCenterAfterDrag,
  getCityMapCenter,
  getFieldMatchGroups,
  getMapCanvasFrame,
  getMapCenter,
  getMatchLocation,
  getNearestMarkerIndex,
  getLocationFromScreenPoint,
  getPinchZoom,
  getSelectedFieldGroup,
  getTouchDistance,
  getVisibleTiles,
  getWheelZoomDelta,
  latLonToWorld,
  projectLocation,
  worldToLatLon,
} from "../src/utils/mapUtils.ts";

const now = new Date("2026-06-30T12:00:00.000Z");

function apiError(status, body) {
  return {
    status,
    body,
    message: body,
  };
}

function match(overrides = {}) {
  return {
    id: "match-1",
    title: "Partido Footy",
    startsAt: "2026-06-30T19:00:00.000Z",
    maxPlayersPerTeam: 5,
    pricePerPersonCents: 350,
    coverImageUrl: null,
    status: "OPEN",
    createdBy: {
      id: "admin-1",
      displayName: "Admin",
      username: "admin",
    },
    field: {
      id: "field-1",
      name: "Campo Municipal Saladillo",
      address: "Calle Hermanos Alvarez Quintero 13",
      city: "Huelva",
      latitude: 37.25,
      longitude: -6.95,
    },
    occupancy: {
      teamAPlayers: 1,
      teamBPlayers: 0,
      maxPlayersPerTeam: 5,
      totalPlayers: 1,
      totalCapacity: 10,
      remainingTeamA: 4,
      remainingTeamB: 5,
    },
    teams: {
      teamA: [
        {
          participationId: "part-1",
          userId: "user-1",
          displayName: "Felix",
          username: "felix",
          teamSide: "A",
          joinedAt: "2026-06-30T12:30:00.000Z",
        },
      ],
      teamB: [],
    },
    ...overrides,
  };
}

const draft = {
  title: "  Partido de tarde  ",
  fieldName: "  Campo Centro  ",
  address: "  Calle Principal  ",
  city: "  Huelva  ",
  date: "2026-07-01",
  time: "19:30",
  durationMinutes: "90",
  maxPlayers: "5",
  pricePerPerson: "3,50",
  latitude: 37.25,
  longitude: -6.95,
  locationMode: "manual",
  selectedSavedFieldId: null,
  coverImageUrl: "https://example.com/cover.jpg",
};

const profile = {
  id: "profile-1",
  userId: "user-1",
  displayName: "Felix",
  username: "felix",
  email: "felix@example.com",
  fullName: null,
  bio: null,
  preferredPosition: "MIDFIELDER",
  city: "Sevilla",
};

test("valida login y registro con mensajes especificos", () => {
  assert.equal(
    validateAuthForm({
      authMode: "register",
      displayName: "",
      email: "jugador@example.com",
      password: "password123",
    }),
    "Indica un alias de jugador para completar el registro.",
  );
  assert.equal(
    validateAuthForm({
      authMode: "login",
      displayName: "",
      email: "mal",
      password: "password123",
    }),
    "Introduce un email valido.",
  );
  assert.equal(
    validateAuthForm({
      authMode: "register",
      displayName: "Jugador",
      email: "jugador@example.com",
      password: "corta",
    }),
    "La contrasena debe tener al menos 8 caracteres.",
  );
});

test("calcula la ciudad principal de usuario y borrador", () => {
  assert.equal(
    getUserCity({
      profile,
      profileCity: "Huelva",
    }),
    "Sevilla",
  );
  assert.equal(
    getUserCity({
      profile: null,
      profileCity: "Huelva",
    }),
    "Huelva",
  );
  assert.equal(
    getMatchDraftCity({
      draftCity: "Cadiz",
      profile: null,
      profileCity: "",
    }),
    "Cadiz",
  );
});

test("traduce errores habituales de auth a mensajes claros", () => {
  assert.equal(
    authErrorMessage(apiError(401, "invalid credentials"), "login"),
    "Email o contrasena incorrectos.",
  );
  assert.equal(
    authErrorMessage(apiError(409, "email already exists"), "register"),
    "El email ya esta en uso.",
  );
  assert.equal(
    authErrorMessage(apiError(409, "username already taken"), "register"),
    "Este alias de jugador ya esta en uso. Elige otro.",
  );
  assert.equal(
    authErrorMessage(apiError(500, "server error"), "register"),
    "El servicio no esta disponible ahora mismo. Intentalo en unos minutos.",
  );
});

test("lee errores de API desde texto y JSON", () => {
  assert.equal(readApiErrorText("  error plano  "), "error plano");
  assert.equal(
    readApiErrorText(JSON.stringify({ detail: "Email ya registrado" })),
    "Email ya registrado",
  );
  assert.equal(
    readApiErrorText(
      JSON.stringify({
        message: "Datos invalidos",
        errors: {
          email: ["Email invalido"],
          password: ["Contrasena corta"],
        },
      }),
    ),
    "Datos invalidos Email invalido Contrasena corta",
  );

  const error = new ApiRequestError(409, JSON.stringify({ message: "Duplicado" }));
  assert.equal(error.status, 409);
  assert.equal(error.message, "Duplicado");
});

test("formatea precios y entradas de fecha para formularios", () => {
  assert.equal(formatPriceFromCents(null), "Gratis");
  assert.equal(formatPriceFromCents(350), "3.50 EUR");
  assert.equal(formatDraftPrice("0"), "Gratis");
  assert.equal(formatDraftPrice("3,5"), "3.50 EUR");
  assert.equal(formatDurationMinutes(45), "45 min");
  assert.equal(formatDurationMinutes(90), "1 h 30 min");
  assert.equal(formatDurationMinutes(null), "1 h 30 min");
  assert.equal(dateInputFromInstant("2026-07-01T19:30:00.000Z"), "2026-07-01");
  assert.match(timeInputFromInstant("2026-07-01T19:30:00.000Z"), /^\d{2}:\d{2}$/);
  assert.equal(timeInputFromInstant("fecha mala"), "19:00");
});

test("traduce errores de administracion de partidos", () => {
  assert.equal(
    matchMutationErrorMessage(apiError(403, "forbidden")),
    "No tienes permisos para modificar este partido.",
  );
  assert.equal(
    matchMutationErrorMessage(apiError(404, "not found")),
    "El backend no tiene disponible esta accion. Despliega la ultima version del backend o usa la API local actualizada.",
  );
  assert.equal(
    matchMutationErrorMessage(apiError(500, "server error")),
    "El servidor no pudo guardar los cambios. Intentalo de nuevo en unos minutos.",
  );
});

test("valida y normaliza el borrador de un partido", () => {
  const validation = validateMatchDraftValues(draft);

  assert.deepEqual(validation, {
    ok: true,
    durationMinutes: 90,
    maxPlayers: 5,
    pricePerPersonCents: 350,
  });

  const body = buildMatchRequestBody(draft, validation);
  assert.equal(body.title, "Partido de tarde");
  assert.equal(body.durationMinutes, 90);
  assert.equal(body.maxPlayersPerTeam, 5);
  assert.equal(body.pricePerPersonCents, 350);
  assert.equal(body.fieldId, null);
  assert.deepEqual(body.field, {
    name: "Campo Centro",
    address: "Calle Principal",
    city: "Huelva",
    latitude: 37.25,
    longitude: -6.95,
  });
});

test("usa fieldId cuando el admin elige un campo guardado", () => {
  const validation = validateMatchDraftValues(draft);
  assert.equal(validation.ok, true);

  const body = buildMatchRequestBody(
    {
      ...draft,
      selectedSavedFieldId: "field-99",
    },
    validation,
  );

  assert.equal(body.fieldId, "field-99");
  assert.equal(body.field, null);
});

test("rechaza borradores de partido incompletos o fuera de rango", () => {
  assert.deepEqual(
    validateMatchDraftValues({
      ...draft,
      title: "",
    }),
    {
      ok: false,
      title: "Faltan datos",
      message: "Completa titulo, campo, fecha y hora.",
    },
  );
  assert.deepEqual(
    validateMatchDraftValues({
      ...draft,
      locationMode: "saved",
      selectedSavedFieldId: null,
    }),
    {
      ok: false,
      title: "Elige una pista",
      message: "Selecciona una pista guardada o cambia a ubicacion manual.",
    },
  );
  assert.deepEqual(
    validateMatchDraftValues({
      ...draft,
      durationMinutes: "15",
    }),
    {
      ok: false,
      title: "Revisa la duracion",
      message: "La duracion debe estar entre 30 y 240 minutos.",
    },
  );
  assert.deepEqual(
    validateMatchDraftValues({
      ...draft,
      maxPlayers: "12",
    }),
    {
      ok: false,
      title: "Revisa plazas",
      message: "El maximo por equipo debe estar entre 1 y 11.",
    },
  );
  assert.deepEqual(
    validateMatchDraftValues({
      ...draft,
      pricePerPerson: "101",
    }),
    {
      ok: false,
      title: "Revisa el precio",
      message: "El precio por persona debe estar entre 0 y 100 euros.",
    },
  );
});

test("convierte una respuesta de partido a valores editables", () => {
  assert.deepEqual(draftValuesFromMatch(match()), {
    title: "Partido Footy",
    fieldName: "Campo Municipal Saladillo",
    address: "Calle Hermanos Alvarez Quintero 13",
    city: "Huelva",
    durationMinutes: "90",
    maxPlayers: "5",
    pricePerPerson: "3.50",
  });
});

test("filtra partidos visibles por fecha, busqueda, disponibilidad y mis partidos", () => {
  const available = match();
  const past = match({
    id: "past",
    startsAt: "2026-06-29T19:00:00.000Z",
  });
  const full = match({
    id: "full",
    occupancy: {
      teamAPlayers: 5,
      teamBPlayers: 5,
      maxPlayersPerTeam: 5,
      totalPlayers: 10,
      totalCapacity: 10,
      remainingTeamA: 0,
      remainingTeamB: 0,
    },
  });
  const otherCity = match({
    id: "sevilla",
    title: "Partido Norte",
    field: {
      ...available.field,
      city: "Sevilla",
    },
  });

  assert.deepEqual(
    getVisibleMatches({
      matches: [available, past, full, otherCity],
      myMatches: [available],
      searchQuery: "huelva",
      matchFilter: "all",
      dateFilter: "today",
      onlyAvailable: true,
      now,
    }).map((item) => item.id),
    ["match-1"],
  );

  assert.deepEqual(
    getVisibleMatches({
      matches: [available, otherCity],
      myMatches: [available],
      searchQuery: "",
      matchFilter: "mine",
      dateFilter: "all",
      onlyAvailable: false,
      now,
    }).map((item) => item.id),
    ["match-1"],
  );
});

test("mis partidos solo incluye inscritos futuros del usuario actual", () => {
  const futureRegistered = match({
    id: "future-registered",
    startsAt: "2026-06-30T20:00:00.000Z",
  });
  const olderRegistered = match({
    id: "older-registered",
    startsAt: "2026-06-29T20:00:00.000Z",
  });
  const futureNotRegistered = match({
    id: "future-not-registered",
    startsAt: "2026-06-30T21:00:00.000Z",
    teams: {
      teamA: [
        {
          participationId: "part-2",
          userId: "user-2",
          displayName: "Otro",
          username: "otro",
          teamSide: "A",
          joinedAt: "2026-06-30T12:30:00.000Z",
        },
      ],
      teamB: [],
    },
  });

  assert.deepEqual(
    getUpcomingRegisteredMatches({
      matches: [futureNotRegistered, olderRegistered, futureRegistered],
      currentUserId: "user-1",
      now,
    }).map((item) => item.id),
    ["future-registered"],
  );

  assert.deepEqual(
    getUpcomingRegisteredMatches({
      matches: [futureRegistered],
      currentUserId: null,
      now,
    }),
    [],
  );

  assert.equal(
    getPlayedRegisteredMatchesCount({
      matches: [futureNotRegistered, olderRegistered, futureRegistered],
      currentUserId: "user-1",
      now,
    }),
    1,
  );
});

test("calcula ubicaciones y limites basicos del mapa", () => {
  const huelvaCenter = getCityMapCenter("Huelva");
  assert.deepEqual(huelvaCenter, { latitude: 37.26142, longitude: -6.94472 });
  assert.deepEqual(getCityMapCenter("Madrid centro"), {
    latitude: 40.416775,
    longitude: -3.70379,
  });

  const locatedMatch = match();
  assert.deepEqual(getMatchLocation(locatedMatch), {
    latitude: 37.25,
    longitude: -6.95,
  });
  assert.equal(
    getMatchLocation(
      match({
        field: {
          ...locatedMatch.field,
          latitude: null,
        },
      }),
    ),
    null,
  );

  assert.deepEqual(getMapCenter([locatedMatch], null), {
    latitude: 37.25,
    longitude: -6.95,
  });
  assert.equal(clampMapZoom(1), 11);
  assert.equal(clampMapZoom(99), 17);
  assert.equal(getTouchDistance([{ pageX: 0, pageY: 0 }]), 0);
  assert.equal(
    getTouchDistance([
      { pageX: 0, pageY: 0 },
      { pageX: 3, pageY: 4 },
    ]),
    5,
  );
});

test("agrupa partidos por campo y localiza seleccion de marcador", () => {
  const early = match({
    id: "early",
    startsAt: "2026-06-30T18:00:00.000Z",
  });
  const late = match({
    id: "late",
    startsAt: "2026-06-30T20:00:00.000Z",
  });
  const other = match({
    id: "other",
    field: {
      ...early.field,
      id: "field-2",
      name: "Otro campo",
      latitude: 37.3,
      longitude: -6.9,
    },
  });

  const groups = getFieldMatchGroups([late, other, early]);

  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.find((group) => group.key === "field-1")?.matches.map((item) => item.id),
    ["early", "late"],
  );
  assert.equal(getSelectedFieldGroup(groups, "late")?.key, "field-1");
  assert.equal(getSelectedFieldGroup(groups, "missing"), null);
  assert.equal(
    getNearestMarkerIndex({
      markerCoordinates: [
        { x: 10, y: 10 },
        { x: 100, y: 100 },
      ],
      point: { x: 104, y: 104 },
    }),
    1,
  );
  assert.equal(
    getNearestMarkerIndex({
      markerCoordinates: [{ x: 10, y: 10 }],
      point: { x: 100, y: 100 },
    }),
    -1,
  );
});

test("convierte entre lat/lon y coordenadas de mundo de forma reversible", () => {
  const location = { latitude: 37.26142, longitude: -6.94472 };
  const world = latLonToWorld(location, 14);
  const roundTrip = worldToLatLon(world, 14);

  assert.ok(Math.abs(roundTrip.latitude - location.latitude) < 0.000001);
  assert.ok(Math.abs(roundTrip.longitude - location.longitude) < 0.000001);
});

test("calcula frame, rueda y drag del mapa", () => {
  assert.deepEqual(getMapCanvasFrame({ width: 300, height: 500 }), {
    width: 1200,
    height: 1268,
    left: -450,
    top: -384,
  });
  assert.equal(
    getWheelZoomDelta({ deltaY: 2, lastZoomAt: 0, now: 1000 }),
    0,
  );
  assert.equal(
    getWheelZoomDelta({ deltaY: 80, lastZoomAt: 950, now: 1000 }),
    0,
  );
  assert.equal(
    getWheelZoomDelta({ deltaY: 80, lastZoomAt: 800, now: 1000 }),
    -1,
  );
  assert.equal(
    getWheelZoomDelta({ deltaY: -80, lastZoomAt: 800, now: 1000 }),
    1,
  );

  const center = { latitude: 37.26142, longitude: -6.94472 };
  assert.deepEqual(
    getCenterAfterDrag({
      center,
      dragOffset: { x: 0, y: 0 },
      zoom: 14,
    }),
    center,
  );

  const dragged = getCenterAfterDrag({
    center,
    dragOffset: { x: 120, y: -80 },
    zoom: 14,
  });
  assert.notEqual(dragged.latitude, center.latitude);
  assert.notEqual(dragged.longitude, center.longitude);
});

test("calcula zoom por pellizco y ubicacion desde toque de pantalla", () => {
  assert.equal(
    getPinchZoom({
      currentDistance: 200,
      startDistance: 100,
      startZoom: 14,
    }),
    16,
  );
  assert.equal(
    getPinchZoom({
      currentDistance: 0,
      startDistance: 100,
      startZoom: 14,
    }),
    14,
  );

  const center = { latitude: 37.26142, longitude: -6.94472 };
  const mapData = getVisibleTiles(center, 14, 512, 512);
  const picked = getLocationFromScreenPoint({
    canvas: { left: 0, top: 0 },
    dragOffset: { x: 0, y: 0 },
    locationX: 256,
    locationY: 256,
    topLeft: mapData.topLeft,
    zoom: 14,
  });

  assert.ok(Math.abs(picked.latitude - center.latitude) < 0.000001);
  assert.ok(Math.abs(picked.longitude - center.longitude) < 0.000001);
});

test("genera tiles visibles y proyecta ubicaciones en pantalla", () => {
  const center = { latitude: 37.26142, longitude: -6.94472 };
  const mapData = getVisibleTiles(center, 14, 512, 512);

  assert.equal(mapData.width, 512);
  assert.equal(mapData.height, 512);
  assert.ok(mapData.tiles.length > 0);
  assert.ok(mapData.tiles.every((tile) => tile.key.startsWith("14-")));

  const projected = projectLocation(center, mapData.topLeft, 14);
  assert.ok(Math.abs(projected.left - 256) < 1);
  assert.ok(Math.abs(projected.top - 256) < 1);
});

test("detecta participacion y equipos completos", () => {
  const currentMatch = match();

  assert.equal(userParticipatesInMatch(currentMatch, "user-1"), true);
  assert.equal(userParticipatesInMatch(currentMatch, "user-2"), false);
  assert.equal(isTeamFull(currentMatch, "A"), false);
  assert.equal(
    isTeamFull(
      match({
        occupancy: {
          teamAPlayers: 5,
          teamBPlayers: 1,
          maxPlayersPerTeam: 5,
          totalPlayers: 6,
          totalCapacity: 10,
          remainingTeamA: 0,
          remainingTeamB: 4,
        },
      }),
      "A",
    ),
    true,
  );
});

test("calcula el estado del usuario frente al partido seleccionado", () => {
  const ownedMatch = match({
    createdBy: {
      id: "user-1",
      displayName: "Felix",
      username: "felix",
    },
  });

  assert.deepEqual(getMatchViewerState(ownedMatch, "user-1"), {
    isParticipant: true,
    isOwner: true,
    isOpen: true,
  });

  assert.deepEqual(getMatchViewerState(match({ status: "CANCELLED" }), "user-2"), {
    isParticipant: false,
    isOwner: false,
    isOpen: false,
  });

  assert.deepEqual(getMatchViewerState(null, "user-1"), {
    isParticipant: false,
    isOwner: false,
    isOpen: false,
  });
});
