import { createContext, useEffect, useState } from 'react';
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
  const [authUser, setAuthUser] = useState(() => {
    if (!isAuthenticated()) {
      return null;
    }

    return getStoredUser();
  });
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
    clearSession();
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        isAuthenticated: !!authUser,
        login,
        logout,
        forceLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
