import assert from "node:assert/strict";
import { test } from "node:test";

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
  getMatchViewerState,
  getVisibleMatches,
  isTeamFull,
  userParticipatesInMatch,
} from "../src/utils/matchUtils.ts";

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
  maxPlayers: "5",
  pricePerPerson: "3,50",
  latitude: 37.25,
  longitude: -6.95,
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
    maxPlayers: 5,
    pricePerPersonCents: 350,
  });

  const body = buildMatchRequestBody(draft, validation);
  assert.equal(body.title, "Partido de tarde");
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
