<<<<<<< HEAD
import { createContext, useContext, useState } from 'react';
import { clearSession, getStoredUser, isAuthenticated } from './api';
=======
import { createContext, useContext, useEffect, useState } from 'react';
import { clearSession, getStoredUser, isAuthenticated, onSessionExpired } from './api';
>>>>>>> feature-my-work

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );

  const login = (user) => setAuthUser(user);

  const logout = () => {
    clearSession();
    setAuthUser(null);
  };

<<<<<<< HEAD
=======
  // If api.js detects the backend has revoked/expired the session (a 401 on
  // an authenticated endpoint), drop the in-memory user too so the UI
  // reflects the logged-out state instead of showing a stale authenticated
  // screen that will just fail on the next request.
  useEffect(() => onSessionExpired(() => setAuthUser(null)), []);

>>>>>>> feature-my-work
  return (
    <AuthContext.Provider value={{ authUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

<<<<<<< HEAD
// eslint-disable-next-line react-refresh/only-export-components -- this
// hook is tightly coupled to AuthProvider/AuthContext above and is used
// throughout the auth flows; splitting it into its own file would add
// indirection for no real benefit here.
=======
// This hook is tightly coupled to AuthProvider/AuthContext above and is
// used throughout the auth flows; splitting it into its own file would add
// indirection for no real benefit here.
/* eslint-disable react-refresh/only-export-components */
>>>>>>> feature-my-work
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
<<<<<<< HEAD
=======
/* eslint-enable react-refresh/only-export-components */
>>>>>>> feature-my-work
