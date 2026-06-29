import { ApiRequestError } from "../api/errors";
import type { AuthMode } from "../types/domain";

export function validateAuthForm({
  authMode,
  displayName,
  email,
  password,
}: {
  authMode: AuthMode;
  displayName: string;
  email: string;
  password: string;
}) {
  if (authMode === "register" && !displayName.trim()) {
    return "Indica un alias de jugador para completar el registro.";
  }
  if (authMode === "register" && displayName.trim().length > 80) {
    return "El alias de jugador no puede superar 80 caracteres.";
  }
  if (!email) {
    return "Introduce tu email.";
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return "Introduce un email valido.";
  }
  if (!password) {
    return "Introduce tu contrasena.";
  }
  if (authMode === "register" && password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres.";
  }
  if (password.length > 72) {
    return "La contrasena no puede superar 72 caracteres.";
  }
  return null;
}

export function authErrorMessage(error: unknown, authMode: AuthMode) {
  const status = error instanceof ApiRequestError ? error.status : null;
  const rawMessage =
    error instanceof ApiRequestError
      ? `${error.message} ${error.body}`
      : error instanceof Error
        ? error.message
        : String(error);
  const normalized = rawMessage.toLowerCase();

  if (authMode === "register" && status === 409) {
    if (normalized.includes("username") || normalized.includes("displayname")) {
      return "Este alias de jugador ya esta en uso. Elige otro.";
    }
    return "El email ya esta en uso.";
  }

  if (authMode === "login" && status === 401) {
    return "Email o contrasena incorrectos.";
  }

  if (authMode === "register" && (status === 401 || status === 403)) {
    return "El email ya esta en uso.";
  }

  if (
    normalized.includes("email already registered") ||
    normalized.includes("email already exists") ||
    normalized.includes("email already in use") ||
    (normalized.includes("email") &&
      (normalized.includes("already") ||
        normalized.includes("existe") ||
        normalized.includes("uso") ||
        normalized.includes("use") ||
        normalized.includes("registered") ||
        normalized.includes("duplicate") ||
        normalized.includes("conflict")))
  ) {
    return "El email ya esta en uso.";
  }
  if (
    (normalized.includes("username") ||
      normalized.includes("displayname") ||
      normalized.includes("alias")) &&
    (normalized.includes("already") ||
      normalized.includes("existe") ||
      normalized.includes("uso") ||
      normalized.includes("taken") ||
      normalized.includes("registered") ||
      normalized.includes("duplicate") ||
      normalized.includes("conflict"))
  ) {
    return "Este alias de jugador ya esta en uso. Elige otro.";
  }
  const isCredentialError =
    normalized.includes("invalid credentials") ||
    normalized.includes("bad credentials") ||
    normalized.includes("unauthorized") ||
    normalized.includes("401");

  if (authMode === "login" && isCredentialError) {
    return "Email o contrasena incorrectos.";
  }
  if (normalized.includes("must be") && normalized.includes("password")) {
    return "La contrasena debe tener al menos 8 caracteres.";
  }
  if (
    normalized.includes("email") &&
    (normalized.includes("invalid") ||
      normalized.includes("not well-formed") ||
      normalized.includes("must be a well-formed"))
  ) {
    return "Introduce un email valido.";
  }
  if (status === 400 || normalized.includes("validation")) {
    return authMode === "login"
      ? "Revisa el email y la contrasena antes de continuar."
      : "Revisa los datos del registro antes de continuar.";
  }
  if (status && status >= 500) {
    return "El servicio no esta disponible ahora mismo. Intentalo en unos minutos.";
  }
  return authMode === "login"
    ? "No se pudo iniciar sesion. Comprueba los datos e intentalo de nuevo."
    : "No se pudo crear la cuenta. Comprueba los datos e intentalo de nuevo.";
}

export function matchMutationErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) {
      return "No tienes permisos para modificar este partido.";
    }
    if (error.status === 404 || error.status === 405) {
      return "El backend no tiene disponible esta accion. Despliega la ultima version del backend o usa la API local actualizada.";
    }
    if (error.status >= 500) {
      return "El servidor no pudo guardar los cambios. Intentalo de nuevo en unos minutos.";
    }
  }
  return error instanceof Error ? error.message : "Error inesperado";
}
