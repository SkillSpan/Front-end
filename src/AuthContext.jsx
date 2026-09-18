<<<<<<< HEAD
<<<<<<< HEAD
import { createContext, useContext, useEffect, useState } from 'react';
=======
import { createContext, useEffect, useState } from 'react';
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
import { useNavigate } from 'react-router-dom';
import {
  clearSession,
  clearSessionAndRevoke,
  getStoredUser,
  isAuthenticated,
  onSessionExpired,
} from './api';
=======
import { createContext, useContext, useState } from 'react';
import { clearSession, getStoredUser, isAuthenticated } from './api';
>>>>>>> feature/hide-scrollbars

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
<<<<<<< HEAD
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );
<<<<<<< HEAD
=======
  const [authUser, setAuthUser] = useState(() => {
    if (!isAuthenticated()) {
      return null;
    }

    return getStoredUser();
  });
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
  const navigate = useNavigate();

  // If any 401 from an authenticated endpoint clears the local session
  // (see api.js request helper), mirror that in component state so the UI
  // stops showing the user as logged in, and redirect to the dedicated
  // Session Expired screen instead of leaving the user on a broken page.
  useEffect(() => {
    return onSessionExpired(() => {
      setAuthUser(null);
      navigate('/session-expired', { replace: true });
    });
  }, [navigate]);

  const login = (user) => {
    if (!user) {
      setAuthUser(null);
      return;
    }

    setAuthUser(user);
  };

  const logout = async () => {
    setAuthUser(null);
    await clearSessionAndRevoke();
  };

  const forceLogout = () => {
=======

  const login = (user) => setAuthUser(user);

  const logout = () => {
>>>>>>> feature/hide-scrollbars
    clearSession();
    setAuthUser(null);
  };

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <AuthContext.Provider value={{
      authUser,
      isAuthenticated: !!authUser,
      login,
      logout,
      forceLogout,
    }}>
=======
    <AuthContext.Provider value={{ authUser, login, logout }}>
>>>>>>> feature/hide-scrollbars
=======
    <AuthContext.Provider
      value={{
        authUser,
        isAuthenticated: !!authUser,
        login,
        logout,
        forceLogout,
      }}
    >
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
      {children}
    </AuthContext.Provider>
  );
}

<<<<<<< HEAD
<<<<<<< HEAD
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
=======
// eslint-disable-next-line react-refresh/only-export-components -- this
// hook is tightly coupled to AuthProvider/AuthContext above and is used
// throughout the auth flows; splitting it into its own file would add
// indirection for no real benefit here.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
>>>>>>> feature/hide-scrollbars
}
=======
export { AuthContext };
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
