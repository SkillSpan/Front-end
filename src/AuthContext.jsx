import { createContext, useContext, useEffect, useState } from 'react';
import { clearSession, getStoredUser, isAuthenticated, logout as logoutRequest, onSessionExpired } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );
  const [sessionExpired, setSessionExpired] = useState(false);

  // api.js can't navigate on its own (it's a plain module, not a
  // component) - it clears the cookie itself on a 401 from an
  // authenticated request, and calls this to tell the app to show the
  // "Your session has expired" screen (see SessionExpired.jsx).
  useEffect(() => {
    onSessionExpired(() => {
      setAuthUser(null);
      setSessionExpired(true);
    });
    return () => onSessionExpired(null);
  }, []);

  const login = (user) => setAuthUser(user);

  const logout = () => {
    // Best-effort: tell the backend to revoke this token too. If it fails
    // (already expired, offline, etc.) we still clear the local session -
    // being logged out locally is the safe default either way.
    if (isAuthenticated()) {
      logoutRequest().catch(() => {});
    }
    clearSession();
    setAuthUser(null);
  };

  const dismissSessionExpired = () => setSessionExpired(false);

  return (
    <AuthContext.Provider value={{ authUser, login, logout, sessionExpired, dismissSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- this
// hook is tightly coupled to AuthProvider/AuthContext above and is used
// throughout the auth flows; splitting it into its own file would add
// indirection for no real benefit here.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
