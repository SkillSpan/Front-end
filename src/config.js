// config.js
// Small central place for frontend feature flags / enums that are shared
// across multiple screens, so we don't hardcode the same value twice.

// Google Sign-In (individual/student login) - backend contract confirmed:
// POST /api/auth/login/google, see api.js `loginWithGoogle`. Requires
// VITE_GOOGLE_CLIENT_ID to be set (Google Identity Services client ID) -
// see .env.example.
export const GOOGLE_LOGIN_ENABLED = true;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Organization/company Google sign-in was tried and removed - the backend
// has no confirmed contract for it, and the "new vs. existing account"
// hand-off it needs added real complexity without a real endpoint behind
// it. The company login/register flows are plain email+password only.

// Backend-defined organization types (see /api/auth/register/organization).
// This is intentionally NOT the same list as "industry" - do not mix them.
export const ORGANIZATION_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'university', label: 'University' },
  { value: 'training_partner', label: 'Training Partner' },
];

// Industry and company-size options of the company profile. Used by Company
// Registration (US-COMP-01, step 2) and the Organization Profile edit form
// (US-COMP-04), so both always offer the same values.
// TODO(api, to be confirmed): the backend's allowed values for
// organization_industry / organization_size.
export const COMPANY_INDUSTRIES = [
  { value: 'Software & IT Services', label: 'Software & IT Services' },
  { value: 'Digital Marketing', label: 'Digital Marketing' },
  { value: 'E-commerce', label: 'E-commerce' },
];

export const COMPANY_SIZES = [
  { value: '1 - 10 employees', label: '1 - 10 employees' },
  { value: '11 - 50 employees', label: '11 - 50 employees' },
  { value: '51 - 200 employees', label: '51 - 200 employees' },
  { value: '200+ employees', label: '200+ employees' },
];

// Organization documents (trade license / additional document) — one place
// for the accepted types and the size limit, used by registration (US-COMP-01)
// and the Organization Profile documents card (US-COMP-04).
// TODO(api, to be confirmed): the backend limit and accepted types. The
// server validates again (BR-06); these only give the user an early message.
export const COMPANY_DOCUMENT_MAX_MB = 5;
export const COMPANY_DOCUMENT_MAX_BYTES = COMPANY_DOCUMENT_MAX_MB * 1024 * 1024;
export const COMPANY_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const COMPANY_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

// Fallback OTP validity window, used only until the backend response gives
// us a real expiry (see OtpVerification.jsx). This is a UI fallback, not a
// source of truth - the real expiry/validation always happens server side.
export const OTP_FALLBACK_EXPIRY_SECONDS = 600; // 10 minutes
export const OTP_FALLBACK_RESEND_COOLDOWN_SECONDS = 60;
