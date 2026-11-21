// assessmentStorage.js
// Small shared helper around the sessionStorage-backed autosave for the
// Baseline Skill Assessment. Several screens need to read/write the same
// "in-progress answers" blob:
//   - SkillAssessment.jsx        writes on every answer, reads on mount
//   - SkillAssessmentResume.jsx  reads to show "4 of 12 answered" etc.
//   - SkillAssessmentResults.jsx reads to render the finished skill profile
//   - AssessmentWizard.jsx       reads to decide Intro vs. Resume, and
//                                 clears once the learner reaches Results
// Centralizing the key + JSON parsing here keeps those screens from
// silently drifting out of sync with each other.

export const STORAGE_KEY = 'skillspan_assessment_answers';

// localStorage (not sessionStorage): an assessment left half-way must still be
// there after the learner closes the site and comes back, so they land on the
// "Pick up where you left off" screen instead of the dashboard.
const store = {
  getItem: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  removeItem: (k) => { try { window.localStorage.removeItem(k); } catch { /* storage unavailable */ } },
};

export const loadSavedAnswers = () => {
  try {
    const raw = store.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveAnswers = (answers) => {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // Best effort only - losing autosave shouldn't block the quiz.
  }
};

export const clearSavedAnswers = () => {
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
};

export const countAnswered = (answers) =>
  Object.keys(answers || {}).filter((id) => answers[id] !== undefined && answers[id] !== '').length;

// ---------------------------------------------------------------------------
// Backend assessment id + submission result
// ---------------------------------------------------------------------------
// Now that /api/v1/baseline-assessments exists (see api.js), the wizard
// creates a real attempt on the backend and needs to remember its id across
// screens (Intro -> Starting -> Questions -> Submitting), the same way it
// already remembers in-progress answers above. Kept in sessionStorage for
// the same reason: nothing sensitive, just needs to survive an accidental
// reload mid-assessment.

const ASSESSMENT_ID_KEY = 'skillspan_assessment_id';
const SUBMISSION_RESULT_KEY = 'skillspan_assessment_result';

export const loadAssessmentId = () => {
  try {
    return store.getItem(ASSESSMENT_ID_KEY) || null;
  } catch {
    return null;
  }
};

export const saveAssessmentId = (id) => {
  try {
    if (id === null || id === undefined) store.removeItem(ASSESSMENT_ID_KEY);
    else store.setItem(ASSESSMENT_ID_KEY, String(id));
  } catch {
    // Best effort only - the assessment still works locally without it.
  }
};

export const clearAssessmentId = () => saveAssessmentId(null);

// Raw server response from submitBaselineAssessment(), if the call
// succeeded - SkillAssessmentResults.jsx prefers this over its own local
// calculation whenever it's present and looks usable.
export const loadSubmissionResult = () => {
  try {
    const raw = store.getItem(SUBMISSION_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSubmissionResult = (result) => {
  try {
    if (result) store.setItem(SUBMISSION_RESULT_KEY, JSON.stringify(result));
    else store.removeItem(SUBMISSION_RESULT_KEY);
  } catch {
    // Best effort only.
  }
};

export const clearSubmissionResult = () => saveSubmissionResult(null);

// ---------------------------------------------------------------------------
// Server-provided question set (role-specific)
// ---------------------------------------------------------------------------
// POST /api/v1/baseline-assessments returns the questions selected for the
// learner's chosen career role (frozen server-side in a snapshot). They are
// cached here so every screen (quiz, resume, completion, results) renders the
// SAME role-specific questions - see assessmentQuestions.js, which turns this
// raw payload into the shape the screens use.

const QUESTION_BANK_KEY = 'skillspan_assessment_questions';

export const loadQuestionBankRaw = () => {
  try {
    const raw = store.getItem(QUESTION_BANK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveQuestionBankRaw = (assessment) => {
  try {
    if (assessment) store.setItem(QUESTION_BANK_KEY, JSON.stringify(assessment));
    else store.removeItem(QUESTION_BANK_KEY);
  } catch {
    // Best effort only.
  }
};

export const clearQuestionBank = () => saveQuestionBankRaw(null);

// ---------------------------------------------------------------------------
// Resume after leaving the site
// ---------------------------------------------------------------------------
// Whose attempt is saved on this device, so a different account signing in
// on the same browser is never sent to someone else's half-done assessment.
const OWNER_KEY = 'skillspan_assessment_owner';
// Set for this tab only when the learner chose "Save & Exit": inside the same
// visit they go where they asked (the dashboard); the next visit resumes.
const EXITED_KEY = 'skillspan_assessment_exited';

export const saveAssessmentOwner = (userId) => {
  if (userId === null || userId === undefined || userId === '') store.removeItem(OWNER_KEY);
  else store.setItem(OWNER_KEY, String(userId));
};

export const markAssessmentExited = () => {
  try { sessionStorage.setItem(EXITED_KEY, '1'); } catch { /* ignore */ }
};

export const clearAssessmentExited = () => {
  try { sessionStorage.removeItem(EXITED_KEY); } catch { /* ignore */ }
};

// True when this user has an assessment started and not yet submitted on
// this device (and did not just leave it on purpose in this visit).
export const hasAssessmentInProgress = (userId) => {
  const id = loadAssessmentId();
  if (!id) return false;
  if (loadSubmissionResult()) return false;
  const bank = loadQuestionBankRaw();
  if (!bank || !Array.isArray(bank.questions) || bank.questions.length === 0) return false;
  const owner = store.getItem(OWNER_KEY);
  if (owner && userId != null && String(owner) !== String(userId)) return false;
  try { if (sessionStorage.getItem(EXITED_KEY)) return false; } catch { /* ignore */ }
  return true;
};
