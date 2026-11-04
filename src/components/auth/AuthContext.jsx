import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getProfile, getStoredUser, isAuthenticated, onSessionExpired, setSessionExpiredRedirect } from '../../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  // Restore the session from the cookie synchronously on first render
  // (lazy initializer), so a signed-in visitor never sees the landing page
  // flash before the redirect to the dashboard.
  const [authUser, setAuthUser] = useState(() =>
    isAuthenticated() ? getStoredUser() : null
  );
  // A stored token may belong to another backend or have expired. It is
  // checked once with GET /profile before any signed-in screen renders.
  const [checkingSession, setCheckingSession] = useState(() => isAuthenticated());

  // Any 401 on an authenticated request clears the cookies in api.js. Here
  // the in-memory user is dropped and the router does the redirect, so the
  // app is not reloaded.
  useEffect(() => {
    setSessionExpiredRedirect((url) => navigate(url, { replace: true }));
    const unsubscribe = onSessionExpired(() => setAuthUser(null));
    return () => {
      unsubscribe();
      setSessionExpiredRedirect(null);
    };
  }, [navigate]);

  useEffect(() => {
    if (!checkingSession) return undefined;
    let active = true;
    // Only a 401 matters here, and api.js handles it (clear + redirect). Any
    // other answer, including 404 for a learner with no profile yet or a
    // network error, keeps the session.
    getProfile()
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [checkingSession]);

  const login = (user) => {
    setCheckingSession(false);
    setAuthUser(user);
  };

  const logout = () => {
    clearSession();
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, checkingSession, login, logout }}>
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
