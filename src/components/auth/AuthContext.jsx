import { createContext, useContext, useState } from 'react';
import { clearSession, getStoredUser, isAuthenticated } from '../../api';

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

  return (
    <AuthContext.Provider value={{ authUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook lives beside AuthProvider/AuthContext and is imported from here
// throughout the auth flows; moving it would touch every import.
// eslint-disable-next-line react-refresh/only-export-components -- useAuth is a hook co-located with its provider; only affects dev fast-refresh
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Same as useAuth, but returns null outside an AuthProvider (screens that are
// also rendered on their own, e.g. in tests, only need the user if present).
// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export function useOptionalAuth() {
  return useContext(AuthContext);
}
