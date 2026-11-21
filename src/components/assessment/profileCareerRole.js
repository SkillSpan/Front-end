// The career role the learner picks in Profile Setup, next to their
// specialization. Kept on the device (no API contract change) so the
// assessment screen can start straight away without asking again.
const KEY = 'skillspan.profile.careerRole';

export function saveProfileCareerRole(role) {
  try {
    if (role && role.id) localStorage.setItem(KEY, JSON.stringify(role));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable - the assessment screen will simply ask.
  }
}

export function loadProfileCareerRole() {
  try {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : null;
    return value && value.id ? value : null;
  } catch {
    return null;
  }
}
