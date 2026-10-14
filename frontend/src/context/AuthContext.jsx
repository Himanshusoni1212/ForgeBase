// Global authentication state for the app.
//
// - On load, restores the session from localStorage and validates it
//   against GET /users/me (so a refresh keeps you signed in, but a
//   revoked/expired token signs you out instead of faking a session).
// - Exposes login() / logout() used by the Login page and (later) topbar.
// - Never logs credentials or tokens.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearStoredAuth,
  fetchCurrentUser,
  getStoredAuth,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    async function restore() {
      const stored = getStoredAuth();
      if (!stored.accessToken) {
        setRestoring(false);
        return;
      }
      try {
        const freshUser = await fetchCurrentUser(stored.accessToken);
        setUser(freshUser);
        setAccessToken(stored.accessToken);
      } catch {
        // Stored token is expired/revoked/unusable: drop the session.
        clearStoredAuth();
        setUser(null);
        setAccessToken(null);
      } finally {
        setRestoring(false);
      }
    }
    restore();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await loginRequest({ email, password });
    setUser(result.user);
    setAccessToken(result.accessToken);
    return result;
  }, []);

  // Same session mechanism as login: the backend returns tokens on
  // registration, so the new account starts out signed in.
  const register = useCallback(async ({ name, email, password }) => {
    const result = await registerRequest({ name, email, password });
    setUser(result.user);
    setAccessToken(result.accessToken);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Always drop the local session, even if the backend call fails
      // (logoutRequest already clears storage in the same way).
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      restoring,
      login,
      register,
      logout,
    }),
    [user, accessToken, restoring, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
