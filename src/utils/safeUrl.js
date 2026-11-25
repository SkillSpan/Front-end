export function safeExternalUrl(value, { httpsOnly = false } = {}) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    const allowedProtocols = httpsOnly ? ['https:'] : ['https:', 'http:'];
    if (!allowedProtocols.includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
