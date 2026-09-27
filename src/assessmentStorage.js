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

export const loadSavedAnswers = () => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

export const saveAnswers = (answers) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
        // Best effort only - losing autosave shouldn't block the quiz.
    }
};

export const clearSavedAnswers = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
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
        return sessionStorage.getItem(ASSESSMENT_ID_KEY) || null;
    } catch {
        return null;
    }
};

export const saveAssessmentId = (id) => {
    try {
        if (id === null || id === undefined) sessionStorage.removeItem(ASSESSMENT_ID_KEY);
        else sessionStorage.setItem(ASSESSMENT_ID_KEY, String(id));
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
        const raw = sessionStorage.getItem(SUBMISSION_RESULT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const saveSubmissionResult = (result) => {
    try {
        if (result) sessionStorage.setItem(SUBMISSION_RESULT_KEY, JSON.stringify(result));
        else sessionStorage.removeItem(SUBMISSION_RESULT_KEY);
    } catch {
        // Best effort only.
    }
};

export const clearSubmissionResult = () => saveSubmissionResult(null);