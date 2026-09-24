import { createContext, useContext, useEffect, useState } from 'react';
import {
  clearSession,
  clearSessionAndRevoke,
  getStoredUser,
  isAuthenticated,
  onSessionExpired,
} from '../../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );

  // Merged in from the skill-matrix/career-roles branch: a full-page
  // "Your session has expired" takeover (see SessionExpired.jsx) instead
  // of silently dropping back to a logged-out state. A 401-expired token
  // means nothing else currently on screen can be trusted/acted on anyway.
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = (user) => setAuthUser(user);

  const logout = () => {
    // Best-effort: tell the backend to revoke this token too. clearSessionAndRevoke
    // already swallows network/5xx errors and clears the local cookies
    // regardless, so the UI never gets stuck "logged in but backend says no".
    clearSessionAndRevoke();
    setAuthUser(null);
  };

  // If api.js detects the backend has revoked/expired the session (a 401 on
  // an authenticated endpoint), drop the in-memory user and show the
  // full-page session-expired screen instead of leaving a stale
  // authenticated screen on-screen that will just keep failing.
  useEffect(
    () =>
      onSessionExpired(() => {
        clearSession();
        setAuthUser(null);
        setSessionExpired(true);
      }),
    []
  );

  const dismissSessionExpired = () => setSessionExpired(false);

  return (
    <AuthContext.Provider
      value={{ authUser, login, logout, sessionExpired, dismissSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// This hook is tightly coupled to AuthProvider/AuthContext above and is
// used throughout the auth flows; splitting it into its own file would add
// indirection for no real benefit here.
/* eslint-disable react-refresh/only-export-components */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
/* eslint-enable react-refresh/only-export-components */
