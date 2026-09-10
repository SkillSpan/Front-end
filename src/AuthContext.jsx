import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearSession,
  clearSessionAndRevoke,
  getStoredUser,
  isAuthenticated,
  onSessionExpired,
} from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore the session from the secure cookie synchronously on first
  // render (lazy initializer) instead of in a useEffect - this is a plain
  // synchronous read, not a subscription to an external system, so there's
  // no need to render once without the user and then again with it.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );
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
    clearSession();
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{
      authUser,
      isAuthenticated: !!authUser,
      login,
      logout,
      forceLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
