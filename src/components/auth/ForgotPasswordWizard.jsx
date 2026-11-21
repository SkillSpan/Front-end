import { useEffect, useState } from 'react';
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

// The email + code the reset screen needs used to live only in this
// component's state, so a refresh (or coming back to /forgot-password/reset
// from history) wiped them: the user typed a new password twice, pressed
// "Reset Password", and got "Reset session is missing" instead. sessionStorage
// keeps them for the lifetime of the tab - no cookie, nothing shared with other
// tabs, and gone as soon as the tab closes.
const RESET_SESSION_KEY = 'skillspan:password-reset';

function readResetSession() {
  const empty = { email: '', otp: '' };
  try {
    const raw = sessionStorage.getItem(RESET_SESSION_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      email: typeof parsed?.email === 'string' ? parsed.email : '',
      otp: typeof parsed?.otp === 'string' ? parsed.otp : '',
    };
  } catch {
    // storage disabled (private mode) or corrupt value - start clean
    return empty;
  }
}

function ForgotPasswordWizard() {
  const [reset, setReset] = useState(readResetSession);
  const navigate = useNavigate();
  const { email: resetEmail, otp: resetOtp } = reset;

  useEffect(() => {
    try {
      if (!reset.email && !reset.otp) sessionStorage.removeItem(RESET_SESSION_KEY);
      else sessionStorage.setItem(RESET_SESSION_KEY, JSON.stringify(reset));
    } catch {
      // storage disabled: the wizard still works for this page view
    }
  }, [reset]);

  const clearResetSession = () => setReset({ email: '', otp: '' });

  return (
    <Routes>
      <Route
        index
        element={
          <ForgotPassword
            onBackToLogin={() => navigate('/login')}
            onContinueToVerify={(email) => {
              // A new request always invalidates the previous code.
              setReset({ email, otp: '' });
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
              setReset((prev) => ({ ...prev, otp: code }));
              navigate('/forgot-password/reset');
            }}
          />
        }
      />
      <Route
        path="reset"
        element={
          // Without an email + code there is nothing to reset: send the visitor
          // back to the first step instead of letting them fill in the form and
          // fail on submit.
          resetEmail && resetOtp ? (
            <ResetPassword
              email={resetEmail}
              otp={resetOtp}
              onBackToVerify={() => navigate('/forgot-password/verify')}
              onSuccess={() => {
                clearResetSession();
                navigate('/forgot-password/success');
              }}
            />
          ) : (
            <Navigate to="/forgot-password" replace />
          )
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
