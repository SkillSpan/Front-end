// The name to show for a signed-in person. The auth user carries `name`;
// other payloads use `full_name` or first/last name; the email's local part
// is the last resort, so a real account never shows a generic label.
export function displayName(user, fallback = '') {
  if (!user || typeof user !== 'object') return fallback;
  const direct = [user.name, user.full_name, user.display_name]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean);
  if (direct) return direct;
  const parts = [user.first_name, user.last_name].filter((value) => typeof value === 'string' && value.trim());
  if (parts.length) return parts.join(' ').trim();
  if (user.user && typeof user.user === 'object') {
    const nested = displayName(user.user);
    if (nested) return nested;
  }
  if (typeof user.email === 'string' && user.email.includes('@')) return user.email.split('@')[0];
  return fallback;
}
