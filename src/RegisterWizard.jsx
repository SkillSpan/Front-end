import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import RegisterStep1 from './RegisterStep1';
import RegisterStep2 from './RegisterStep2';
import RegisterStep3 from './RegisterStep3';
import OtpVerification from './OtpVerification';
import LearnerProfileSetup from './LearnerProfileSetup';
import AssessmentWizard from './AssessmentWizard';
import { decodeJwtPayloadUnsafe } from './utils/jwt';
import { saveSession, loginUser } from './api';
import { useAuth } from './AuthContext';

// Each step has its own real URL (/register/account, /register/status,
// /register/terms, /register/verify) so browser back/forward and refresh
// land you on the right screen instead of always bouncing to the landing
// page. The accumulated wizard data itself stays in memory (it includes a
// password field, so we deliberately do NOT persist it to
// sessionStorage/localStorage just to survive a hard refresh) - refreshing
// mid-wizard resets that step's inputs, same as any ordinary form.
//
// Google sign-up entry point: Login.jsx sends a brand-new Google identity
// here directly at /register/status (skipping account/step 1, since name +
// email + password aren't needed - Google already provided identity). The
// Google ID token travels via router state (`location.state.googleCredential`)
// - never persisted, just carried across this in-app navigation. From here
// the user only needs to fill in academic status (step 2) and accept
// Terms/Privacy (step 3, which already has that UI) - step 3 is what
// actually finalizes the account for a Google sign-up (see RegisterStep3).
function RegisterWizard() {
  const location = useLocation();
  const [registerData, setRegisterData] = useState({});
  const [googleCredential] = useState(() => location.state?.googleCredential || null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Purely cosmetic (e.g. "Continuing setup for name@email.com") - the
  // backend independently verifies the real credential, this is never
  // trusted for anything else.
  const googleProfile = googleCredential ? decodeJwtPayloadUnsafe(googleCredential) : null;

  // NOTE: every navigate() call in this wizard uses an ABSOLUTE path
  // (leading /register/...) rather than a relative one. This wizard is
  // mounted under a wildcard route (path="/register/*" in App.jsx), and
  // relative navigation from inside a route matched via a wildcard
  // resolves against the *full current pathname* rather than the
  // wizard's base path - so a relative navigate('status') called while
  // sitting on /register/account produces /register/account/status
  // instead of /register/status. Once the URL stops matching anything,
  // the catch-all route below fires and (if it were also relative) keeps
  // appending to that already-broken path forever. Always use absolute
  // paths here to sidestep this entirely.
  const handleStep1Success = (step1Data) => {
    setRegisterData((prev) => ({ ...prev, ...step1Data }));
    navigate('/register/status');
  };

  const handleStep2Success = (step2Data) => {
    setRegisterData((prev) => ({ ...prev, ...step2Data }));
    navigate('/register/terms');
  };

  const handleStep3Success = (step3Data) => {
    setRegisterData((prev) => ({ ...prev, ...step3Data }));

    if (googleCredential) {
      // Account was just created + the response already includes a valid
      // session (Google verified the email, so there's no OTP step) -
      // save it and go straight into Profile Setup, same as the manual
      // signup path below does once it has a session of its own.
      const { user, organizations, token } = step3Data.response?.data || step3Data.response || {};
      saveSession({ token, user, organizations });
      login(user);
      navigate('/register/profile');
      return;
    }

    // Manual signup still needs to verify their email via OTP.
    navigate('/register/verify');
  };

  // /auth/verify doesn't hand back a session token (per the confirmed
  // contract it's verification-only), so a manual signup isn't actually
  // signed in yet at this point. We use the credentials still held in
  // memory from step 1 (see the module-level comment on registerData - it
  // deliberately never touches storage) to log the learner in ourselves,
  // so they land straight in Profile Setup instead of being bounced to a
  // manual login screen immediately after finishing registration. If
  // that auto sign-in fails for any reason, we fall back to sending them
  // to the login page rather than blocking them here.
  const handleContinueAfterVerify = async () => {
    if (registerData.email && registerData.password) {
      try {
        const res = await loginUser(registerData.email, registerData.password);
        const { user, organizations, token } = res.data || res;
        saveSession({ token, user, organizations });
        login(user);
        navigate('/register/profile');
        return;
      } catch {
        // Fall through to manual login below.
      }
    }
    navigate('/login');
  };

  return (
    <Routes>
      <Route
        path="account"
        element={
          <RegisterStep1
            initialData={registerData}
            onNextSuccess={handleStep1Success}
            onNavigateToLogin={() => navigate('/login')}
          />
        }
      />
      <Route
        path="status"
        element={
          <RegisterStep2
            onNextSuccess={handleStep2Success}
            onBack={() => navigate(googleCredential ? '/login' : '/register/account')}
            introText={
              googleProfile?.email
                ? `Continuing setup for ${googleProfile.email}`
                : undefined
            }
          />
        }
      />
      <Route
        path="terms"
        element={
          <RegisterStep3
            registerData={registerData}
            googleCredential={googleCredential}
            onNextSuccess={handleStep3Success}
            onBack={() => navigate('/register/status')}
          />
        }
      />
      <Route
        path="verify"
        element={
          <OtpVerification
            userEmail={registerData.email}
            onVerifySuccess={handleContinueAfterVerify}
            onContinueToLogin={handleContinueAfterVerify}
            onBack={() => navigate('/register/terms')}
          />
        }
      />
      <Route
        path="profile"
        element={
          <LearnerProfileSetup
            // The Baseline Skill Assessment comes right after Profile
            // Setup (see LearnerProfileSetup's own sidebar stepper, which
            // already lists Assessment as the next step).
            onComplete={() => navigate('/register/assessment')}
            onSkip={() => navigate('/register/assessment')}
          />
        }
      />
      <Route
        path="assessment/*"
        element={
          <AssessmentWizard
            // No results/dashboard page exists yet in this app - land the
            // learner on the homepage once the assessment is done or
            // skipped. Update this once one exists (see
            // api_endpoints_render.md for the readiness endpoints this
            // would presumably lead into).
            onFinish={() => navigate('/')}
          />
        }
      />
      <Route
        path="*"
        element={<Navigate to={googleCredential ? '/register/status' : '/register/account'} replace />}
      />
    </Routes>
  );
}

export default RegisterWizard;
