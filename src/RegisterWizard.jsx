import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import RegisterStep1 from './RegisterStep1';
import RegisterStep2 from './RegisterStep2';
import RegisterStep3 from './RegisterStep3';
import OtpVerification from './OtpVerification';
import { decodeJwtPayloadUnsafe } from './utils/jwt';
import { saveSession } from './api';
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
      // save it and go straight to the landing page, same as a normal
      // login.
      const { user, organizations, token } = step3Data.response?.data || step3Data.response || {};
      saveSession({ token, user, organizations });
      login(user);
      navigate('/');
      return;
    }

    // Manual signup still needs to verify their email via OTP.
    navigate('/register/verify');
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
            onVerifySuccess={() => navigate('/login')}
            onContinueToLogin={() => navigate('/login')}
            onBack={() => navigate('/register/terms')}
          />
        }
      />
      <Route path="*" element={<Navigate to={googleCredential ? '/register/status' : '/register/account'} replace />} />
    </Routes>
  );
}

export default RegisterWizard;
