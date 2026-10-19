import { useEffect, useState } from 'react';
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
  loadAssessmentId,
  saveAssessmentId,
  clearAssessmentId,
  saveSubmissionResult,
  loadSubmissionResult,
  clearSubmissionResult,
  saveQuestionBankRaw,
  clearQuestionBank,
} from './assessmentStorage';
import { getQuestionBank, computeProgress, toResponses } from './assessmentQuestions';
import {
  startBaselineAssessment,
  getBaselineAssessment,
  autosaveBaselineAssessment,
  submitBaselineAssessment,
  getCareerRoles,
  unwrapApiData,
} from '../../api';

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
// The intelligence (FastAPI) service explains a rejected request in
// details.detail - either a string or a list of { loc, msg } entries. Surface
// that so the real cause is visible instead of a generic message.
const describeSubmitError = (error) => {
  const base = error?.message || 'We could not score your assessment. Please try again.';
  const detail = error?.details?.detail;
  let extra = '';
  if (typeof detail === 'string') extra = detail;
  else if (Array.isArray(detail)) {
    extra = detail
      .slice(0, 3)
      .map((d) => `${Array.isArray(d?.loc) ? d.loc.filter((x) => x !== 'body').join('.') : ''} ${d?.msg || ''}`.trim())
      .filter(Boolean)
      .join(' | ');
  }
  return extra ? `${base} (${extra})` : base;
};

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
  const [careerRoles, setCareerRoles] = useState([]);
  const [careerRoleId, setCareerRoleId] = useState('');
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  // 'idle' | 'pending' | 'done' | 'error' - drives the Submitting screen so the
  // learner only reaches Results once the server has really scored the answers.
  const [submission, setSubmission] = useState({ status: 'idle', error: '' });
  useEffect(() => {
    let active = true;
    getCareerRoles({ page: 1, perPage: 100 }).then((payload) => {
      const value = unwrapApiData(payload);
      const rows = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.career_roles) ? value.career_roles : [];
      if (active) setCareerRoles(rows.filter((role) => role?.id != null && (!role.status || String(role.status).toLowerCase() === 'approved')));
    }).catch(() => { if (active) setCareerRoles([]); });
    return () => { active = false; };
  }, []);

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
  const bank = getQuestionBank();
  const savedAnswers = loadSavedAnswers();
  const progress = computeProgress(savedAnswers, bank.questions);
  const hasInProgressAnswers = bank.total > 0 && progress.answered > 0 && !!assessmentId;

  const startOver = () => {
    clearSavedAnswers();
    clearAssessmentId();
    clearSubmissionResult();
    clearQuestionBank();
    setAssessmentId(null);
    setSubmission({ status: 'idle', error: '' });
    navigate('/register/assessment', { replace: true });
  };

  // Kicks off a real attempt on the backend (POST
  // /api/v1/baseline-assessments) before moving on to the "Starting..."
  // interstitial. Best-effort: if the backend is unreachable or the call
  // fails, we still proceed - the assessment keeps working entirely off
  // sessionStorage as it always has, just without server-side autosave.
  const startAssessment = async () => {
    setStartError('');
    if (!careerRoleId) { setStartError('Select a career role before starting the assessment.'); return; }
    if (starting) return;
    setStarting(true);
    try {
      const sameRoleInProgress = !!assessmentId && String(bank.careerRoleId) === String(careerRoleId) && bank.total > 0;
      let assessment = null;

      if (sameRoleInProgress) {
        // Same role as the attempt already in progress - just keep going.
        assessment = null;
      } else {
        // A different role means a different question set: drop whatever
        // was cached for the previous one first.
        clearSavedAnswers();
        clearSubmissionResult();
        clearQuestionBank();
        clearAssessmentId();
        setAssessmentId(null);
        try {
          const res = await startBaselineAssessment({ career_role_id: Number(careerRoleId) });
          assessment = res?.data || res || null;
        } catch (error) {
          // 409 = this learner already has an attempt for this role.
          // If it is still in progress, resume it with its original questions.
          const existingId = error?.details?.assessment_id;
          if (error?.code === 'ASSESSMENT_ALREADY_EXISTS' && existingId && error?.details?.status === 'in_progress') {
            const res = await getBaselineAssessment(existingId);
            assessment = res?.data || res || null;
          } else if (error?.code === 'ASSESSMENT_ALREADY_EXISTS') {
            throw { ...error, message: 'You have already completed the assessment for this role. Please choose a different career role.' };
          } else {
            throw error;
          }
        }

        const id = assessment?.id ?? null;
        if (id === null || !Array.isArray(assessment?.questions) || assessment.questions.length === 0) {
          throw { message: 'No questions are available for this career role yet. Please choose another role.' };
        }
        saveQuestionBankRaw(assessment);
        saveAssessmentId(id);
        setAssessmentId(String(id));
      }
    } catch (error) {
      setStartError(error?.message || 'Unable to start the assessment on the server.');
      setStarting(false);
      return;
    }
    setStarting(false);
    navigate('/register/assessment/starting');
  };

  // Fires once the last question is answered (SkillAssessment.jsx). Moves
  // on to the "Submitting" interstitial immediately (so the UI doesn't
  // stall on network latency) while the real autosave + final submit
  // (PATCH then POST .../submit) happen in the background. Whatever the
  // server returns is stashed for SkillAssessmentResults.jsx to prefer
  // over its own locally-computed skill profile; if either call fails, the
  // Results screen's local fallback covers it.
  const runSubmit = async (finalAnswers) => {
    const id = assessmentId || loadAssessmentId();
    if (!id) {
      setSubmission({ status: 'error', error: 'No active assessment found. Please start the assessment again.' });
      return;
    }
    setSubmission({ status: 'pending', error: '' });
    try {
      const questions = getQuestionBank().questions;
      const responses = toResponses(finalAnswers, questions);
      const { answered, total, percent } = computeProgress(finalAnswers, questions);
      await autosaveBaselineAssessment(id, { progress: { answered, total, percent }, responses }).catch(() => {});
      const res = await submitBaselineAssessment(id, responses);
      saveSubmissionResult(res?.data || res || null);
      setSubmission({ status: 'done', error: '' });
    } catch (error) {
      // 409 ASSESSMENT_ALREADY_COMPLETED: the server already has a result.
      if (error?.code === 'ASSESSMENT_ALREADY_COMPLETED') {
        try {
          const res = await getBaselineAssessment(id);
          saveSubmissionResult(res?.data || res || null);
          setSubmission({ status: 'done', error: '' });
          return;
        } catch { /* fall through to the generic error */ }
      }
      setSubmission({ status: 'error', error: describeSubmitError(error) });
    }
  };

  const completeQuestions = (finalAnswers) => {
    navigate('/register/assessment/submitting');
    runSubmit(finalAnswers);
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
            <SkillAssessmentIntro onStart={startAssessment} careerRoles={careerRoles} careerRoleId={careerRoleId} onCareerRoleChange={(v) => { setCareerRoleId(v); setStartError(''); }} startError={startError} starting={starting} />
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
          bank.total === 0 ? <Navigate to="/register/assessment" replace /> :
          <SkillAssessment
            assessmentId={assessmentId}
            onExit={finish}
            onComplete={completeQuestions}
          />
        }
      />
      <Route
        path="submitting"
        element={
          <SkillAssessmentSubmitting
            status={submission.status === 'idle' && loadSubmissionResult() ? 'done' : submission.status}
            error={submission.error}
            onRetry={() => runSubmit(loadSavedAnswers())}
            onBack={() => navigate('/register/assessment/questions')}
            onDone={() => navigate('/register/assessment/completion')}
          />
        }
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
              clearQuestionBank();
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
