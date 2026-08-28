// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from './utils/cookies';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
// Laravel backend for local dev / staging / production.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://back-end-zdip.onrender.com';

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;

// Listeners notified when the local session is cleared (e.g. 401 from the
// backend). AuthContext subscribes so it can drop its in-memory user state
// and bounce the user to the landing/login page.
const sessionExpiredListeners = new Set();

export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors so one bad listener doesn't break the rest
    }
  });
}

// ---------------------------------------------------------------------------
// Session (cookie) helpers
// ---------------------------------------------------------------------------

export function saveSession({ token, user, organizations } = {}) {
  if (token) setCookie(TOKEN_COOKIE, token, SESSION_DAYS);
  if (user) {
    setCookie(USER_COOKIE, JSON.stringify({ ...user, organizations: organizations || [] }), SESSION_DAYS);
  }
}

export function getToken() {
  return getCookie(TOKEN_COOKIE);
}

export function getStoredUser() {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession() {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}

// Revokes the server-side session (if any) and then drops the local
// cookies. Network/5xx failures are swallowed - the local session is
// cleared regardless so the UI never gets stuck in a "logged in but
// backend says no" state.
export async function clearSessionAndRevoke() {
  try {
    await request('/api/v1/auth/logout', {
      method: 'POST',
      withAuth: true,
    });
  } catch {
    // intentionally ignored - local cleanup must always run
  }
  clearSession();
  notifySessionExpired();
}

// ---------------------------------------------------------------------------
// Low level request helper
// ---------------------------------------------------------------------------

async function request(path, { method = 'GET', body, isFormData = false, withAuth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw {
      status: 0,
      message: 'Unable to reach the server. Please check your internet connection and try again.',
      errors: {},
      cause: networkError,
    };
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some responses (e.g. 204) may have no body.
  }

  if (!response.ok) {
    // 401 from an authenticated endpoint means the Laravel session/token
    // is no longer valid. Drop the local session and notify subscribers
    // (AuthContext) so the user is bounced to login. We exclude the
    // unauthenticated auth endpoints themselves - a 401 from /login is a
    // real "wrong password" error, not a session-expired event.
    if (response.status === 401 && withAuth && isAuthEndpointRequiringSession(path)) {
      clearSession();
      notifySessionExpired();
    }

    throw {
      status: response.status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || {},
      data,
    };
  }

  return data;
}

// Paths that prove the user is currently signed in (logout, profile, etc).
// A 401 from any of these means the session was revoked/expired and we
// should drop the local cookies + redirect to login.
function isAuthEndpointRequiringSession(path) {
  if (!path) return false;
  if (path.startsWith('/api/v1/auth/logout')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

export const registerOrganization = (formData) =>
  request('/api/v1/auth/register/organization', { method: 'POST', body: formData, isFormData: true });

export const verifyOtp = (email, otp) =>
  request('/api/v1/auth/verify', { method: 'POST', body: { email, otp } });

export const resendOtp = (email) =>
  request('/api/v1/auth/resend-otp', { method: 'POST', body: { email } });

export const loginUser = (email, password) =>
  request('/api/v1/auth/login', { method: 'POST', body: { email, password } });

// Google Sign-In (individual/student accounts only). `credential` is the
// Google ID token obtained from Google Identity Services on the frontend
// (see src/Login.jsx). terms_accepted/privacy_accepted are only required
// (and should only be sent as true) when completing signup for a brand
// new account - see the two-step flow (Login.jsx -> RegisterWizard
// starting at the academic-status step for new accounts).
//
// `extra` lets us pass additional fields collected after the redirect
// (currently just `academic_status`, from RegisterStep2). ⚠️ NOT PART OF
// THE CONFIRMED CONTRACT - google_login_frontend_guide.pdf only documents
// { credential, terms_accepted, privacy_accepted }. Confirm with backend
// that academic_status is accepted/stored on this endpoint before relying
// on it; if not, we'll need a follow-up PATCH/profile-update call instead.
//
// NOTE ON THE ENDPOINT PATH: the backend guide we received contains a
// garbled/contradictory note about whether this path is
// /api/auth/login/google or /api/auth/google/login - but the guide's own
// code sample unambiguously uses /api/auth/login/google, so that's what
// we use here. Flag this to the backend team to confirm in writing if
// requests start failing with 404.
export const loginWithGoogle = (credential, termsAccepted = false, privacyAccepted = false, extra = {}) =>
  request('/api/v1/auth/login/google', {
    method: 'POST',
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      ...extra,
    },
  });

export const loginOrganization = (email, password) =>
  request('/api/v1/auth/login/organization', { method: 'POST', body: { email, password } });

export const logoutUser = () =>
  request('/api/v1/auth/logout', {
    method: 'POST',
    withAuth: true,
  });

export const forgotPassword = (email) =>
  request('/api/v1/auth/forgot-password', { method: 'POST', body: { email } });

export const resendForgotPassword = (email) =>
  request('/api/v1/auth/forgot-password/resend', { method: 'POST', body: { email } });

export const resetPassword = ({ email, otp, password, password_confirmation }) =>
  request('/api/v1/auth/reset-password', {
    method: 'POST',
    body: { email, otp, password, password_confirmation },
  });

// Alias used by VerifyCode.jsx
export const resendForgotPasswordOtp = (email) =>
  request('/api/v1/auth/forgot-password/resend', {
    method: 'POST',
    body: { email },
  });

export const verifyForgotPasswordOtp = (email, otp) =>
  request('/api/v1/auth/forgot-password/verify', {
    method: 'POST',
    body: { email, otp },
  });
