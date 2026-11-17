const KEY = 'skillspan_assessment_auth_return';
const MAX_AGE_MS = 60 * 60 * 1000;
const PATH = '/register/assessment';

export function rememberAssessmentReturn(specializationId = '') {
  try {
    sessionStorage.removeItem(KEY + '_selection');
    sessionStorage.setItem(KEY, JSON.stringify({ path: PATH, specializationId: String(specializationId), savedAt: Date.now() }));
  } catch { /* Navigation still works when browser storage is unavailable. */ }
}

export function getAssessmentReturn() {
  try {
    const entry = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (entry?.path !== PATH || !Number.isFinite(entry.savedAt) || Date.now() - entry.savedAt > MAX_AGE_MS || entry.savedAt > Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return entry;
  } catch { return null; }
}

export function consumeAssessmentReturn() {
  const entry = getAssessmentReturn();
  try {
    if (entry) sessionStorage.setItem(KEY + '_selection', JSON.stringify(entry));
    sessionStorage.removeItem(KEY);
  } catch { /* Best effort. */ }
  return entry?.path || null;
}

export function readAssessmentSpecialization() {
  try {
    const entry = JSON.parse(sessionStorage.getItem(KEY + '_selection') || 'null');

    return entry?.path === PATH && Date.now() - entry.savedAt <= MAX_AGE_MS ? entry.specializationId || '' : '';
  } catch { return ''; }
}
