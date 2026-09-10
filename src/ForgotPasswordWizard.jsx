import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import ForgotPassword from './ForgotPassword';
import VerifyCode from './VerifyCode';
import ResetPassword from './ResetPassword';
import ResetSuccess from './ResetSuccess';

function ForgotPasswordWizard() {
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');

  const navigate = useNavigate();

  const handleStartVerification = (email) => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return;
    }

    setResetEmail(normalizedEmail);
    setResetOtp('');
    navigate('/forgot-password/verify');
  };

  return (
    <Routes>
      <Route
        index
        element={
          <ForgotPassword
            onBackToLogin={() => navigate('/login')}
            onContinueToVerify={handleStartVerification}
          />
        }
      />

        <Route
          path="verify"
          element={
            resetEmail ? (
              <VerifyCode
                email={resetEmail}
                onBack={() => navigate('/forgot-password')}
                onSuccess={(code) => {
                  setResetOtp(code);
                  navigate('/forgot-password/reset');
                }}
              />
            ) : (
              <Navigate to="/forgot-password" replace />
            )
          }
        />

      <Route
          path="reset"
          element={
            resetEmail && resetOtp ? (
              <ResetPassword
                email={resetEmail}
                otp={resetOtp}
                onBackToVerify={() => navigate('/forgot-password/verify')}
                onSuccess={() => navigate('/forgot-password/success')}
              />
            ) : (
              <Navigate to="/forgot-password" replace />
            )
          }
        />

      <Route
        path="success"
        element={
          <ResetSuccess
            onGoToLogin={() => navigate('/login', { replace: true })}
          />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/forgot-password" replace />}
      />
    </Routes>
  );
}

export default ForgotPasswordWizard;