// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from "./utils/cookies";

export const API_BASE_URL = "https://back-end-zdip.onrender.com";

const TOKEN_COOKIE = "skillspan_token";
const USER_COOKIE  = "skillspan_user";
const SESSION_DAYS = 7;

// ---------------------------------------------------------------------------
// Session (cookie) helpers
// ---------------------------------------------------------------------------

export function saveSession({ token, user, organizations } = {}) {
  if (token) setCookie(TOKEN_COOKIE, token, SESSION_DAYS);
  if (user) {
    setCookie(
      USER_COOKIE,
      JSON.stringify({ ...user, organizations: organizations || [] }),
      SESSION_DAYS,
    );
  }
}

export function getToken() {
  return getCookie(TOKEN_COOKIE);
}

export function getStoredUser() {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession() {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

async function request(
  path,
  { method = "GET", body, isFormData = false, withAuth = false } = {},
) {
  const headers = { Accept: "application/json" };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: "omit",
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw {
      status: 0,
      message: "Unable to reach the server. Please check your internet connection and try again.",
      errors: {},
    };
  }

  let data = {};
  try { data = await response.json(); } catch { /* 204 No Content */ }

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || "Something went wrong. Please try again.",
      errors: data.errors || {},
    };
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request("/api/auth/register", { method: "POST", body: payload });

// Builds FormData internally — proofFile must be a File object.
export const registerOrganization = (params) => {
  const fd = new FormData();
  fd.append("name",                     params.name);
  fd.append("email",                    params.email);
  if (params.phone) fd.append("phone",  params.phone);
  fd.append("password",                 params.password);
  fd.append("password_confirmation",    params.password_confirmation);
  fd.append("terms_accepted",           "1");
  fd.append("privacy_accepted",         "1");

  fd.append("organization_name",        params.organization_name);
  fd.append("organization_type",        params.organization_type);
  fd.append("organization_contact_email", params.organization_contact_email);
  if (params.organization_contact_phone)
    fd.append("organization_contact_phone", params.organization_contact_phone);
  if (params.organization_website)
    fd.append("organization_website",   params.organization_website);
  if (params.organization_description)
    fd.append("organization_description", params.organization_description);
  if (params.organization_industry)
    fd.append("organization_industry",  params.organization_industry);
  if (params.organization_company_size)
    fd.append("organization_company_size", params.organization_company_size);
  if (params.organization_country)
    fd.append("organization_country",   params.organization_country);
  if (params.organization_city)
    fd.append("organization_city",      params.organization_city);
  if (params.organization_address)
    fd.append("organization_address",   params.organization_address);
  if (params.organization_postal_code)
    fd.append("organization_postal_code", params.organization_postal_code);

  fd.append("proof_file", params.proofFile);

  return request("/api/auth/register/organization", {
    method: "POST",
    body: fd,
    isFormData: true,
  });
};

export const verifyOtp = (email, otp) =>
  request("/api/auth/verify", { method: "POST", body: { email, otp } });

export const resendOtp = (email) =>
  request("/api/auth/resend-otp", { method: "POST", body: { email } });

export const loginUser = (email, password) =>
  request("/api/auth/login", { method: "POST", body: { email, password } });

export const loginOrganization = (email, password) =>
  request("/api/auth/login/organization", {
    method: "POST",
    body: { email, password },
  });

export const forgotPassword = (email) =>
  request("/api/auth/forgot-password", { method: "POST", body: { email } });

export const resendForgotPassword = (email) =>
  request("/api/auth/forgot-password/resend", {
    method: "POST",
    body: { email },
  });

// Alias used by VerifyCode.jsx
export const resendForgotPasswordOtp = resendForgotPassword;

export const verifyForgotPasswordOtp = (email, otp) =>
  request("/api/auth/forgot-password/verify", {
    method: "POST",
    body: { email, otp },
  });

export const resetPassword = ({ email, otp, password, password_confirmation }) =>
  request("/api/auth/reset-password", {
    method: "POST",
    body: { email, otp, password, password_confirmation },
  });

export const loginWithGoogle = (credential, termsAccepted = false, privacyAccepted = false) =>
  request("/api/auth/login/google", {
    method: "POST",
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
    },
  });
