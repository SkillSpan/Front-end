// utils/cookies.js
// Small cookie helper used to persist the auth session on the client.
//
// Notes on "secure cookie handling":
// - The API returns the auth token in the JSON body (not as a Set-Cookie
//   header), so a browser script can't create a true httpOnly cookie for it
//   — only the server can do that. We still store it in a cookie instead of
//   localStorage so it isn't reachable by things like localStorage-scraping
//   snippets or synced across tabs via the `storage` event, and so it always
//   carries the Secure / SameSite=Strict / Path=/ attributes below.
// - `Secure` is only added when the app is actually served over HTTPS,
//   otherwise the cookie would silently be rejected by the browser on
//   http://localhost during development.

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

export function setCookie(name, value, days = 7) {
  const maxAge = Math.round(days * 24 * 60 * 60);
  const secureFlag = isHttps ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Strict${secureFlag}`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict${isHttps ? '; Secure' : ''}`;
}
