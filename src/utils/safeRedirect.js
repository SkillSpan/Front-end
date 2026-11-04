// US-COMP-03: POST /api/v1/auth/login/organization answers redirect_url.
// In-app path from a server redirect_url, or the fallback. Accepts "/company/…"
// or a full URL on this same origin; never an external host.
export function safeRedirect(url, fallback) {
  if (typeof url !== 'string' || !url.trim()) return fallback
  let path = url.trim()
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path)
      if (typeof window === 'undefined' || u.origin !== window.location.origin) return fallback
      path = `${u.pathname}${u.search}${u.hash}`
    } catch {
      return fallback
    }
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

