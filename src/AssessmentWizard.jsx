import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SkillAssessmentIntro from './SkillAssessmentIntro';
import SkillAssessmentStarting from './SkillAssessmentStarting';
import SkillAssessment from './SkillAssessment';
import SkillAssessmentSubmitting from './SkillAssessmentSubmitting';
import SkillAssessmentCompletion from './SkillAssessmentCompletion';
import SkillAssessmentResults from './SkillAssessmentResults';
import SkillAssessmentResume from './SkillAssessmentResume';
import {
  loadSavedAnswers,
  clearSavedAnswers,
  countAnswered,
  loadAssessmentId,
  saveAssessmentId,
  clearAssessmentId,
  saveSubmissionResult,
  clearSubmissionResult,
} from './assessmentStorage';
import { TOTAL_QUESTIONS } from './assessmentQuestions';
import { startBaselineAssessment, autosaveBaselineAssessment, submitBaselineAssessment } from './api';

// NOTE: every navigate() call below uses an ABSOLUTE path
// (/register/assessment/...) rather than a relative one, for the same
// reason documented in RegisterWizard.jsx and ForgotPasswordWizard.jsx -
// this wizard is mounted under a wildcard route (path="assessment/*" in
// RegisterWizard), and relative navigation from a route matched via a
// wildcard resolves against the full current pathname rather than this
// wizard's own base path.
//
// `onFinish` is called once the learner has actually completed (or
// explicitly exited) the assessment. There's no results/dashboard page in
// this codebase yet, so the caller currently just sends them home - same
// pattern LearnerProfileSetup used before this feature existed.
//
// Full flow: Intro (or Resume, if there's saved in-progress work) ->
// Starting -> Questions -> Submitting -> Completion -> Results -> onFinish.
function AssessmentWizard({ onFinish }) {
  const navigate = useNavigate();

  // The backend attempt id from POST /api/v1/baseline-assessments (see
  // api.js). Kept in sessionStorage (assessmentStorage.js) so it survives
  // an accidental reload the same way the in-progress answers already do -
  // null means either "not started yet" or "the create call failed", both
  // of which are handled gracefully below (autosave/submit simply no-op
  // without an id, and the quiz keeps working purely off sessionStorage as
  // it did before this endpoint existed).
  const [assessmentId, setAssessmentId] = useState(loadAssessmentId);

  const finish = () => {
    if (typeof onFinish === 'function') onFinish();
    else navigate('/');
  };

  // The index route decides between the first-time Intro screen and the
  // "8. Resume state" screen: if there's saved in-progress answers from an
  // earlier "Save & Exit" (see SkillAssessment.jsx / assessmentStorage.js),
  // a returning learner should land on "Pick up where you left off"
  // instead of the pitch screen they've already seen. A fully-answered set
  // that never made it to the Results screen (e.g. the tab closed mid
  // submit) is treated the same way - "Continue" just drops them back on
  // the last question so they can hit Finish again.
  const savedAnswers = loadSavedAnswers();
  const hasInProgressAnswers = countAnswered(savedAnswers) > 0 && countAnswered(savedAnswers) <= TOTAL_QUESTIONS;

  const startOver = () => {
    clearSavedAnswers();
    clearAssessmentId();
    clearSubmissionResult();
    setAssessmentId(null);
    navigate('/register/assessment', { replace: true });
  };

  // Kicks off a real attempt on the backend (POST
  // /api/v1/baseline-assessments) before moving on to the "Starting..."
  // interstitial. Best-effort: if the backend is unreachable or the call
  // fails, we still proceed - the assessment keeps working entirely off
  // sessionStorage as it always has, just without server-side autosave.
  const startAssessment = async () => {
    try {
      const res = await startBaselineAssessment();
      const data = res?.data || res || {};
      const id = data.id ?? data.assessment_id ?? data.assessment?.id ?? null;
      if (id !== null && id !== undefined) {
        saveAssessmentId(id);
        setAssessmentId(id);
      }
    } catch {
      // Offline / backend unavailable - fall through and keep going.
    } finally {
      navigate('/register/assessment/starting');
    }
  };

  // Fires once the last question is answered (SkillAssessment.jsx). Moves
  // on to the "Submitting" interstitial immediately (so the UI doesn't
  // stall on network latency) while the real autosave + final submit
  // (PATCH then POST .../submit) happen in the background. Whatever the
  // server returns is stashed for SkillAssessmentResults.jsx to prefer
  // over its own locally-computed skill profile; if either call fails, the
  // Results screen's local fallback covers it.
  const completeQuestions = (finalAnswers) => {
    navigate('/register/assessment/submitting');
    if (!assessmentId) return;
    (async () => {
      try {
        await autosaveBaselineAssessment(assessmentId, { answers: finalAnswers });
        const res = await submitBaselineAssessment(assessmentId);
        saveSubmissionResult(res?.data || res || null);
      } catch {
        // Keep whatever was already autosaved / fall back to the local
        // calculation on the Results screen.
      }
    })();
  };

  return (
    <Routes>
      <Route
        index
        element={
          hasInProgressAnswers ? (
            <SkillAssessmentResume
              onContinue={() => navigate('/register/assessment/questions')}
              onStartOver={startOver}
            />
          ) : (
            <SkillAssessmentIntro onStart={startAssessment} />
          )
        }
      />
      <Route
        path="starting"
        element={
          <SkillAssessmentStarting
            onDone={() => navigate('/register/assessment/questions')}
            onExit={finish}
          />
        }
      />
      <Route
        path="questions"
        element={
          <SkillAssessment
            assessmentId={assessmentId}
            onExit={finish}
            onComplete={completeQuestions}
          />
        }
      />
      <Route
        path="submitting"
        element={<SkillAssessmentSubmitting onDone={() => navigate('/register/assessment/completion')} />}
      />
      <Route
        path="completion"
        element={<SkillAssessmentCompletion onViewProfile={() => navigate('/register/assessment/results')} />}
      />
      <Route
        path="results"
        element={
          <SkillAssessmentResults
            onFinish={() => {
              // The Skill Matrix is now "initialized" - clear the
              // in-progress snapshot so a future visit to this route starts
              // a fresh assessment instead of re-showing the Resume screen.
              clearSavedAnswers();
              clearAssessmentId();
              clearSubmissionResult();
              finish();
            }}
          />
        }
      />
      <Route path="*" element={<Navigate to="/register/assessment" replace />} />
    </Routes>
  );
}

export default AssessmentWizard;
