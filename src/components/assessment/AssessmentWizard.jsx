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
  calculateIntelligence,
  getCareerRoles,
  getSpecializations,
  getProfile,
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

// Safety net: the backend is expected to filter by ?specialization_id= itself.
// If it ever returns the full list instead, and the roles carry their linked
// specialization ids, keep only the ones that match. Roles without any
// specialization info are left alone (we trust the server in that case).
function onlyRolesOfSpecialization(roles, specializationId) {
  const wanted = String(specializationId);
  const idsOf = (role) => {
    const found = [];
    const add = (v) => {
      if (v == null || v === '') return;
      if (typeof v === 'object') add(v.id ?? v.specialization_id);
      else found.push(String(v));
    };
    add(role.specialization_id);
    add(role.specialization);
    [role.specialization_ids, role.specializations].forEach((list) => {
      if (Array.isArray(list)) list.forEach(add);
    });
    return found;
  };
  const withInfo = roles.filter((role) => idsOf(role).length > 0);
  if (withInfo.length === 0) return roles;
  return roles.filter((role) => {
    const ids = idsOf(role);
    return ids.length === 0 || ids.includes(wanted);
  });
}

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
  const [specializations, setSpecializations] = useState([]);
  const [specializationId, setSpecializationId] = useState('');
  // false until GET /reference/specializations has answered (either way).
  const [specializationsLoaded, setSpecializationsLoaded] = useState(false);
  // Why the specialization picker is missing (shown to the learner) - '' when fine.
  const [specializationsProblem, setSpecializationsProblem] = useState('');
  const [careerRoles, setCareerRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [careerRoleId, setCareerRoleId] = useState('');
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  // 'idle' | 'pending' | 'done' | 'error' - drives the Submitting screen so the
  // learner only reaches Results once the server has really scored the answers.
  const [submission, setSubmission] = useState({ status: 'idle', error: '' });

  const toRows = (payload) => {
    const value = unwrapApiData(payload);
    return Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
  };

  // Step 1 of the flow: Select Specialization
  //   GET /api/v1/reference/specializations (public)
  // The specialization picked in Profile Setup (saved as a name) is
  // pre-selected when it matches one of the returned specializations.
  useEffect(() => {
    let active = true;
    (async () => {
      let problem = '';
      const rows = await getSpecializations()
        .then((res) => {
          const raw = toRows(res);
          const usable = raw
            .map((row) => (row && typeof row === 'object'
              ? { id: row.id ?? row.specialization_id, name: row.name ?? row.title ?? row.specialization_name }
              : null))
            .filter((row) => row && row.id != null && row.name);
          if (!usable.length) {
            problem = raw.length
              ? 'The specializations list came back without ids.'
              : 'The specializations list is empty.';
            console.warn('[assessment] specializations unusable:', raw);
          }
          return usable;
        })
        .catch((error) => {
          problem = 'Specializations could not be loaded.';
          console.warn('[assessment] GET /reference/specializations failed:', error);
          return [];
        });
      if (!active) return;
      setSpecializations(rows);
      setSpecializationsProblem(problem);
      setSpecializationsLoaded(true);
      if (!rows.length) return;
      try {
        const res = await getProfile();
        const profile = res?.data || res || {};
        const saved = String(profile.specialization ?? '').trim().toLowerCase();
        const match = rows.find((row) => String(row.id) === String(profile.specialization_id ?? '')) ||
          (saved && rows.find((row) => String(row.name ?? row.title).trim().toLowerCase() === saved));
        if (active && match) setSpecializationId((current) => current || String(match.id));
      } catch {
        // No profile / unreachable - the learner just picks one.
      }
    })();
    return () => { active = false; };
  }, []);

  // Step 2: Select Career Role
  //   GET /api/v1/career-roles?specialization_id={id}   (needs the token)
  // If the specializations list could not be loaded at all we fall back to
  // the unfiltered role list so the learner is never blocked.
  const useSpecializationFlow = specializations.length > 0;
  useEffect(() => {
    if (!specializationsLoaded) return undefined;
    if (useSpecializationFlow && !specializationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCareerRoles([]);
      return undefined;
    }
    let active = true;
    setRolesLoading(true);
    getCareerRoles({ page: 1, perPage: 100, specializationId: useSpecializationFlow ? Number(specializationId) : undefined })
      .then((payload) => {
        if (!active) return;
        const rows = toRows(payload).filter((role) => role?.id != null && (!role.status || String(role.status).toLowerCase() === 'approved'));
        setCareerRoles(useSpecializationFlow ? onlyRolesOfSpecialization(rows, specializationId) : rows);
      })
      .catch(() => { if (active) setCareerRoles([]); })
      .finally(() => { if (active) setRolesLoading(false); });
    return () => { active = false; };
  }, [specializationsLoaded, useSpecializationFlow, specializationId]);

  const handleSpecializationChange = (value) => {
    setSpecializationId(value);
    // A different specialization means a different role list.
    setCareerRoleId('');
    setCareerRoles([]);
    setStartError('');
  };

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
    if (useSpecializationFlow && !specializationId) { setStartError('Select your specialization before starting the assessment.'); return; }
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
          // Step 3: POST /api/v1/baseline-assessments
          //   { specialization_id, career_role_id } -> questions picked by the backend
          const res = await startBaselineAssessment({
            ...(useSpecializationFlow ? { specialization_id: Number(specializationId) } : {}),
            career_role_id: Number(careerRoleId),
          });
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
  // The dashboard reads `/readiness/latest` and `/intelligence/latest`, and
  // BOTH of those are only written by a calculation — nothing in the app ever
  // asked for one. A learner finished the assessment with a real score and
  // still saw 0 on the dashboard, with no roadmap, because the submit response
  // persists neither. Trigger the decision here, while the "Submitting" screen
  // (which already lists "Generating your roadmap") is on screen waiting.
  const persistResultAndSync = async (payload) => {
    saveSubmissionResult(payload);
    const careerRoleId = payload?.career_role_id ?? payload?.career_role?.id ?? null;
    try {
      await calculateIntelligence(
        careerRoleId ? { career_role_id: careerRoleId } : {},
        { timeoutMs: 45000 },
      );
    } catch {
      // The assessment result is already stored. A failed readiness/roadmap
      // calculation must not throw it away — the dashboard simply stays empty
      // until the next successful calculation.
    }
  };

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
      await persistResultAndSync(res?.data || res || null);
      setSubmission({ status: 'done', error: '' });
    } catch (error) {
      // 409 ASSESSMENT_ALREADY_COMPLETED: the server already has a result.
      if (error?.code === 'ASSESSMENT_ALREADY_COMPLETED') {
        try {
          const res = await getBaselineAssessment(id);
          await persistResultAndSync(res?.data || res || null);
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
            <SkillAssessmentIntro onStart={startAssessment} specializationsProblem={specializationsProblem} specializations={specializations} specializationId={specializationId} onSpecializationChange={handleSpecializationChange} rolesLoading={rolesLoading} careerRoles={careerRoles} careerRoleId={careerRoleId} onCareerRoleChange={(v) => { setCareerRoleId(v); setStartError(''); }} startError={startError} starting={starting} />
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