import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import VerifyCode from './VerifyCode';
import ResetPassword from './ResetPassword';
import ResetSuccess from './ResetSuccess';

// NOTE: every navigate() call below uses an ABSOLUTE path
// (/forgot-password/...) rather than a relative one. This wizard is
// mounted under a wildcard route (path="/forgot-password/*" in App.jsx),
// and relative navigation from a route matched via a wildcard resolves
// against the *full current pathname* rather than this wizard's base
// path - a relative navigate('reset') called while on
// /forgot-password/verify would produce /forgot-password/verify/reset
// instead of /forgot-password/reset. Always use absolute paths here.
function ForgotPasswordWizard() {
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        index
        element={
          <ForgotPassword
            onBackToLogin={() => navigate('/login')}
            onContinueToVerify={(email) => {
              setResetEmail(email);
              navigate('/forgot-password/verify');
            }}
          />
        }
      />
      <Route
        path="verify"
        element={
          <VerifyCode
            email={resetEmail}
            onBack={() => navigate('/forgot-password')}
            onSuccess={(code) => {
              setResetOtp(code);
              navigate('/forgot-password/reset');
            }}
          />
        }
      />
      <Route
        path="reset"
        element={
          <ResetPassword
            email={resetEmail}
            otp={resetOtp}
            onBackToVerify={() => navigate('/forgot-password/verify')}
            onSuccess={() => navigate('/forgot-password/success')}
          />
        }
      />
      <Route
        path="success"
        element={<ResetSuccess onGoToLogin={() => navigate('/login')} />}
      />
      <Route path="*" element={<Navigate to="/forgot-password" replace />} />
    </Routes>
  );
}

export default ForgotPasswordWizard;
