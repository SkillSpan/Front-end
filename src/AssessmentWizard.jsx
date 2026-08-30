import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SkillAssessmentIntro from './SkillAssessmentIntro';
import SkillAssessment from './SkillAssessment';

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
function AssessmentWizard({ onFinish }) {
  const navigate = useNavigate();

  const finish = () => {
    if (typeof onFinish === 'function') onFinish();
    else navigate('/');
  };

  return (
    <Routes>
      <Route index element={<SkillAssessmentIntro onStart={() => navigate('/register/assessment/questions')} />} />
      <Route
        path="questions"
        element={<SkillAssessment onExit={finish} onComplete={finish} />}
      />
      <Route path="*" element={<Navigate to="/register/assessment" replace />} />
    </Routes>
  );
}

export default AssessmentWizard;
