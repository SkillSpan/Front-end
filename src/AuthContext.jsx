<<<<<<< HEAD
import { createContext, useContext, useEffect, useState } from 'react';
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
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );
<<<<<<< HEAD
  const navigate = useNavigate();

  useEffect(() => onSessionExpired(() => {
    setAuthUser(null);
    navigate('/session-expired', { replace: true });
  }), [navigate]);

  const login = (user) => setAuthUser(user);

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
      {children}
    </AuthContext.Provider>
  );
}

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
