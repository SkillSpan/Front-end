// utils/jwt.js
//
// Decodes the payload of a JWT WITHOUT verifying its signature. This is
// only ever used to pre-fill display text in the UI (e.g. "Continuing
// setup for name@email.com") while a Google sign-up is in progress - the
// actual credential is still sent to the backend as-is, and the backend
// is the only thing that verifies it. Never use this decoded data for any
// security decision on the frontend.
export function decodeJwtPayloadUnsafe(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
