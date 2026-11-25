// Stores non-sensitive UI session metadata only. The backend owns the actual
// authentication credential in an HttpOnly cookie that JavaScript cannot read.

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
