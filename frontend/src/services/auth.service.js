// Auth API calls + token persistence.
//
// Real backend contract (verified in src/services/auth.service.js):
//   POST /auth/login    { email, password }          -> 200 { success, data: { user, accessToken, refreshToken } }
//   POST /auth/register { email, password, name }    -> 201 same shape
//   POST /auth/refresh  { refreshToken }             -> 200 { success, data: { accessToken, refreshToken } }
//   POST /auth/logout                                -> 200 (requires Bearer access token)
//   GET  /users/me                                   -> 200 { success, data: user } (session check)
// Error shape: { success: false, message, code, errors?: [{ field, message }] }
//
// Storage note (read before changing):
// The backend returns bearer tokens in JSON and sets NO cookies, so the
// browser must persist them itself. localStorage is used so the 7-day
// refresh token survives page reloads. Trade-off: any XSS vulnerability
// could read these values, so we (1) never log tokens, (2) only send them
// to our own backend via the Authorization header, and (3) clear them on
// logout. Never store them anywhere else.

import { apiGet, apiPost } from "./api";

const STORAGE_KEYS = {
  accessToken: "forgebase.accessToken",
  refreshToken: "forgebase.refreshToken",
  user: "forgebase.user",
};

export function getStoredAuth() {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    const rawUser = localStorage.getItem(STORAGE_KEYS.user);
    return {
      accessToken,
      refreshToken,
      user: rawUser ? JSON.parse(rawUser) : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

function persistAuth({ accessToken, refreshToken, user }) {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export async function loginRequest({ email, password }) {
  const payload = await apiPost("/auth/login", { email, password });
  const { user, accessToken, refreshToken } = payload.data;
  persistAuth({ accessToken, refreshToken, user });
  return { user, accessToken, refreshToken };
}

// Backend contract (backend/src/validators/auth.validator.js +
// backend/src/services/auth.service.js):
//   POST /auth/register { name, email, password } -> 201 { user, accessToken, refreshToken }
// Password must be 8-128 chars, name 1-100 chars. Registration also
// creates a session, so the tokens are persisted exactly like login.
export async function registerRequest({ name, email, password }) {
  const payload = await apiPost("/auth/register", { name, email, password });
  const { user, accessToken, refreshToken } = payload.data;
  persistAuth({ accessToken, refreshToken, user });
  return { user, accessToken, refreshToken };
}

export async function refreshRequest() {
  const { refreshToken } = getStoredAuth();
  if (!refreshToken) {
    throw new Error("No refresh token stored");
  }
  const payload = await apiPost("/auth/refresh", { refreshToken });
  // Refresh rotates both tokens; the response has no user, so reuse stored one.
  const { user } = getStoredAuth();
  persistAuth({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
    user,
  });
  return payload.data;
}

export async function logoutRequest() {
  const { accessToken } = getStoredAuth();
  try {
    if (accessToken) {
      await apiPost("/auth/logout", {}, { token: accessToken });
    }
  } finally {
    // Always clear local session, even if the backend call fails.
    clearStoredAuth();
  }
}

export async function fetchCurrentUser(accessToken) {
  const payload = await apiGet("/users/me", { token: accessToken });
  return payload.data;
}
