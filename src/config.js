// config.js
// Small central place for frontend feature flags / enums that are shared
// across multiple screens, so we don't hardcode the same value twice.

// Google Sign-In (individual/student login) - backend contract confirmed:
// POST /api/v1/auth/login/google, see api.js `loginWithGoogle`. Requires
// VITE_GOOGLE_CLIENT_ID to be set (Google Identity Services client ID) -
// see .env.example.
export const GOOGLE_LOGIN_ENABLED = true;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Organization/company Google sign-in was tried and removed - the backend
// has no confirmed contract for it, and the "new vs. existing account"
// hand-off it needs added real complexity without a real endpoint behind
// it. The company login/register flows are plain email+password only.

// Backend-defined organization types (see /api/v1/auth/register/organization).
// This is intentionally NOT the same list as "industry" - do not mix them.
export const ORGANIZATION_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'university', label: 'University' },
  { value: 'training_partner', label: 'Training Partner' },
];

// Fallback OTP validity window, used only until the backend response gives
// us a real expiry (see OtpVerification.jsx). This is a UI fallback, not a
// source of truth - the real expiry/validation always happens server side.
export const OTP_FALLBACK_EXPIRY_SECONDS = 600; // 10 minutes
export const OTP_FALLBACK_RESEND_COOLDOWN_SECONDS = 60;
