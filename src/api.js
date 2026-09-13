// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).
//
// Endpoint source of truth: api_endpoints_render.md (taken directly from
// routes/api.php, not hand-documented) - all paths are now under /api/v1.

import { setCookie, getCookie, removeCookie } from './utils/cookies';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
// Laravel backend for local dev / staging / production.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://back-end-zdip.onrender.com';
const API_PREFIX = '/api/v1';

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;

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

// The logged-in user object comes straight from the login/register response
// (see saveSession above) and its exact shape isn't guaranteed, so try the
// common id field names before giving up. Used anywhere a learner_id needs
// to be sent to the backend (skills matrix, career-roles current levels,
// etc.) - if this returns null, don't send the request: the backend will
// just reject it with an unhelpful 422 "field is required" since
// JSON.stringify silently drops an undefined learner_id.
export function resolveLearnerId(user) {
  return user?.id ?? user?.user_id ?? user?.learner_id ?? user?.uuid ?? null;
}

export function clearSession() {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}

// ---------------------------------------------------------------------------
// Session-expiry notification
// ---------------------------------------------------------------------------
// api.js is a plain module, not a React component, so it can't navigate on
// its own. Instead it clears the (now-invalid) session and notifies
// whoever registered interest - AuthContext does this on mount, and shows
// the "Your session has expired" screen (see SessionExpired.jsx) in
// response. Only fires for requests that were actually sending a token
// (withAuth: true); a 401 on a public endpoint like /auth/login is just a
// normal "wrong password" and is handled locally by that screen instead.
let sessionExpiredHandler = null;

export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
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
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
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
    if (withAuth && response.status === 401) {
      clearSession();
      if (sessionExpiredHandler) sessionExpiredHandler();
    }
    throw {
      status: response.status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || {},
    };
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/auth/register', { method: 'POST', body: payload });

export const registerOrganization = (formData) =>
  request('/auth/register/organization', { method: 'POST', body: formData, isFormData: true });

export const verifyOtp = (email, otp) =>
  request('/auth/verify', { method: 'POST', body: { email, otp } });

export const resendOtp = (email) =>
  request('/auth/resend-otp', { method: 'POST', body: { email } });

export const loginUser = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } });

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
export const loginWithGoogle = (credential, termsAccepted = false, privacyAccepted = false, extra = {}) =>
  request('/auth/login/google', {
    method: 'POST',
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      ...extra,
    },
  });

export const loginOrganization = (email, password) =>
  request('/auth/login/organization', { method: 'POST', body: { email, password } });

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: { email } });

export const resendForgotPassword = (email) =>
  request('/auth/forgot-password/resend', { method: 'POST', body: { email } });

// ⚠️ NEW ENDPOINT, PAYLOAD/RESPONSE SHAPE NOT DOCUMENTED - only its path
// (/auth/forgot-password/verify) is listed in api_endpoints_render.md, with
// no request/response sample. Assumed to check the OTP on its own, ahead
// of collecting a new password, mirroring /auth/verify's shape ({ email,
// otp }). Used to give the user pass/fail feedback on the code itself
// before asking them to also type a new password - see VerifyCode.jsx /
// CompanyForgotPassword.jsx. reset-password below still sends the otp
// again, since we have no confirmation the backend now issues a
// short-lived reset token from this call instead. Flag to backend if this
// double-checks the code in a way that breaks single-use OTPs.
export const verifyForgotPasswordOtp = (email, otp) =>
  request('/auth/forgot-password/verify', { method: 'POST', body: { email, otp } });

export const resetPassword = ({ email, otp, password, password_confirmation }) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: { email, otp, password, password_confirmation },
  });

// ---------------------------------------------------------------------------
// Session termination (protected)
// ---------------------------------------------------------------------------

export const logout = () => request('/auth/logout', { method: 'POST', withAuth: true });

export const logoutAllDevices = () => request('/auth/logout-all', { method: 'POST', withAuth: true });

// ---------------------------------------------------------------------------
// Learner profile & readiness (protected, role:learner)
// ---------------------------------------------------------------------------

export const createProfile = (payload) =>
  request('/profile', { method: 'POST', body: payload, withAuth: true });

export const getProfile = () => request('/profile', { method: 'GET', withAuth: true });

export const updateProfile = (payload) =>
  request('/profile', { method: 'PUT', body: payload, withAuth: true });

export const calculateReadiness = (payload) =>
  request('/readiness/calculate', { method: 'POST', body: payload, withAuth: true });

export const getLatestReadiness = () => request('/readiness/latest', { method: 'GET', withAuth: true });

// ---------------------------------------------------------------------------
// Organization profile (protected, requires organization.approved)
// ---------------------------------------------------------------------------

export const getOrganizationProfile = () => request('/organization/profile', { method: 'GET', withAuth: true });

// ---------------------------------------------------------------------------
// Admin (protected, admin middleware)
// ---------------------------------------------------------------------------

export const listPendingOrganizations = (status) =>
  request(`/admin/organizations${status ? `?status=${encodeURIComponent(status)}` : ''}`, {
    method: 'GET',
    withAuth: true,
  });

export const getAdminOrganization = (organizationId) =>
  request(`/admin/organizations/${organizationId}`, { method: 'GET', withAuth: true });

export const getOrganizationProofFile = (organizationId) =>
  request(`/admin/organizations/${organizationId}/proof-file`, { method: 'GET', withAuth: true });

export const approveOrganization = (organizationId) =>
  request(`/admin/organizations/${organizationId}/approve`, { method: 'POST', withAuth: true });

export const rejectOrganization = (organizationId, reason) =>
  request(`/admin/organizations/${organizationId}/reject`, {
    method: 'POST',
    body: reason ? { reason } : undefined,
    withAuth: true,
  });

// ---------------------------------------------------------------------------
// Reference data / dropdowns (public, no token)
// ---------------------------------------------------------------------------
// Source: SkillSpan_Full_API_Reference.pdf. Feed these into the university /
// specialization / country selects on the profile & register forms instead
// of hardcoding option lists.

export const getUniversities = () => request('/reference/universities', { method: 'GET' });

export const getSpecializations = () => request('/reference/specializations', { method: 'GET' });

export const getCountries = () => request('/reference/countries', { method: 'GET' });

// Call after the learner picks a country - id comes from getCountries().
export const getUniversitiesByCountry = (countryId) =>
  request(`/reference/countries/${countryId}/universities`, { method: 'GET' });

// ---------------------------------------------------------------------------
// Skills - taxonomy & matrix (protected, any authenticated role)
// ---------------------------------------------------------------------------
// This is the real backend for what SkillMatrix.jsx currently fakes with
// local state (see the NOTE at the top of that file) - wire it up to these
// once the UI is ready to persist instead of just simulating the save.

export const getSkillsTaxonomy = () => request('/skills/taxonomy', { method: 'GET', withAuth: true });

// ⚠️ Per API reference this can return unfiltered rows, but the endpoint
// DOES validate `learner_id` as a REQUIRED query parameter - calling it
// with no params fails with a 422 "The learner id field is required."
// Always pass the signed-in learner's id (see resolveLearnerId below); we
// still also filter the response client-side (SkillMatrix.jsx /
// careerRolesApi.js) in case rows for other learners come back too.
export const getSkillsMatrix = (learnerId) => {
  const qs = learnerId ? `?learner_id=${encodeURIComponent(learnerId)}` : '';
  return request(`/skills/matrix${qs}`, { method: 'GET', withAuth: true });
};

// Upsert (by learner_id + skill_id pair). No ownership check server-side
// yet - learner_id is open, so always pass the current user's id.
export const upsertSkillMatrix = (payload) =>
  request('/skills/matrix', { method: 'POST', body: payload, withAuth: true });

// Partial update of a single matrix row by its own id (not the
// learner/skill pair) - level, confidence_score, source_type, etc.
export const updateSkillMatrixEntry = (id, payload) =>
  request(`/skills/matrix/${id}`, { method: 'PUT', body: payload, withAuth: true });

// ---------------------------------------------------------------------------
// Evidence (protected)
// ---------------------------------------------------------------------------
// Backs the "Add Evidence" nav item already stubbed in AppLayout.jsx.

// payload should be FormData when sending evidence_file, or a plain object
// when sending evidence_url instead - pass isFormData accordingly.
export const submitEvidence = (payload, isFormData = false) =>
  request('/evidence', { method: 'POST', body: payload, isFormData, withAuth: true });

// role:learner - returns only the current user's *verified* evidence.
export const getMyEvidence = () => request('/evidence', { method: 'GET', withAuth: true });

// ⚠️ Per API reference: no ownership/role check on this one - any signed-in
// user can fetch any evidence record by id.
export const getEvidenceById = (id) => request(`/evidence/${id}`, { method: 'GET', withAuth: true });

// role:admin - accept/reject; does NOT recalculate the skill's level.
export const reviewEvidence = (id, verificationStatus, reviewerNotes) =>
  request(`/evidence/${id}/review`, {
    method: 'PUT',
    body: { verification_status: verificationStatus, reviewer_notes: reviewerNotes },
    withAuth: true,
  });

// ---------------------------------------------------------------------------
// Baseline assessments (protected, role:learner)
// ---------------------------------------------------------------------------

// No body - the new attempt is linked to the current learner automatically.
export const startBaselineAssessment = () => request('/baseline-assessments', { method: 'POST', withAuth: true });

// Ownership is enforced server-side - only the learner who owns the
// assessment can fetch it.
export const getBaselineAssessment = (assessmentId) =>
  request(`/baseline-assessments/${assessmentId}`, { method: 'GET', withAuth: true });

// Autosave - call periodically while the learner answers, before the final
// submit. payload: { progress: { current_step, total_steps }, responses }.
// ⚠️ Shape is inferred from the reference doc (no confirmed sample) -
// verify against a live response before relying on it.
export const saveBaselineAssessmentProgress = (assessmentId, payload) =>
  request(`/baseline-assessments/${assessmentId}`, { method: 'PATCH', body: payload, withAuth: true });

// Final submit - locks the assessment and computes the result. One-shot;
// calling it twice for the same assessment should be treated as an error.
export const submitBaselineAssessment = (assessmentId, responses) =>
  request(`/baseline-assessments/${assessmentId}/submit`, {
    method: 'POST',
    body: { responses },
    withAuth: true,
  });

// ---------------------------------------------------------------------------
// Career roles (protected, role:learner)
// ---------------------------------------------------------------------------
// Backs the Career Roles screens (src/careerroles/CareerRoles.jsx), which
// currently render from the local mock catalog in rolesData.js - see the
// NOTE at the top of that file. Swap the mock ROLES/SUGGESTED arrays for
// these once the UI is ready to fetch instead of simulating.

// page/perPage are optional - only sent when provided, so callers can still
// do getCareerRoles() for page 1 with the backend's default page size.
export const getCareerRoles = ({ page, perPage } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (perPage) params.set('per_page', perPage);
  const qs = params.toString();
  return request(`/career-roles${qs ? `?${qs}` : ''}`, { method: 'GET', withAuth: true });
};

// title, version, effective date, status (draft/approved/retired, etc.) for
// one career role.
export const getCareerRoleById = (id) =>
  request(`/career-roles/${id}`, { method: 'GET', withAuth: true });

// Required skills for the role - level, importance weight, critical flag,
// and prerequisites - bundled into a single decision snapshot (see SRS
// §8.4 "Decision Request Sequence" / §10.9 "Required Decision Data") so the
// UI doesn't need to stitch together separate skill-gap and role-profile
// calls just to render the Skill Requirements table.
export const getCareerRoleSkills = (id) =>
  request(`/career-roles/${id}/skills`, { method: 'GET', withAuth: true });
