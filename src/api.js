// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from "./utils/cookies";

export const API_BASE_URL = "https://back-end-zdip.onrender.com";

const TOKEN_COOKIE = "skillspan_token";
const USER_COOKIE = "skillspan_user";
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

// ---------------------------------------------------------------------------
// Low level request helper
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
      credentials: "omit", // ← تم التعديل هنا
      body: isFormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (networkError) {
    throw {
      status: 0,
      message:
        "Unable to reach the server. Please check your internet connection and try again.",
      errors: {},
    };
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some responses (e.g. 204) may have no body.
  }

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

export const registerOrganization = (formData) =>
  request("/api/auth/register/organization", {
    method: "POST",
    body: formData,
    isFormData: true,
  });

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

// Dedicated password-recovery OTP validation. This must remain separate from
// account/email verification because the two flows may have different
// expiration and consumption rules.
// التحقق من كود استعادة كلمة المرور فقط
// لا يغير كلمة المرور ولا يستهلك الـOTP
export const verifyForgotPasswordOtp = (email, otp) =>
  request('/api/auth/forgot-password/verify', {
    method: 'POST',
    body: {
      email,
      otp,
    },
  })

// The final reset step only needs the OTP (already confirmed in the
// previous /forgot-password/verify step) and the new password — no email,
// since Backend now matches the OTP directly against the stored tokens.
// إعادة تعيين كلمة المرور بعد إدخال كود الاستعادة
export const resetPassword = ({
  email,
  otp,
  password,
  password_confirmation,
}) =>
  request('/api/auth/reset-password', {
    method: 'POST',
    body: {
      email,
      otp,
      password,
      password_confirmation,
    },
  })


  export const loginWithGoogle = (
  credential,
  termsAccepted = false,
  privacyAccepted = false
) =>
  request("/api/auth/login/google", {
    method: "POST",
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
    },
  });
