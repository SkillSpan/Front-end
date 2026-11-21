// Turns an API enum such as "fourth_year" or "core_skills" into readable
// text ("Fourth year", "Core skills"). Anything that is not snake_case is
// returned unchanged, so values typed by people are never altered.
export function formatEnum(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!/^[a-z0-9]+(_[a-z0-9]+)+$/.test(text)) return value;
  const words = text.split('_').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
