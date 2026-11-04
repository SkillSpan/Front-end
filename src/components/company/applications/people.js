/** Two-letter avatar initials (no photos in the approved application view). */
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';
