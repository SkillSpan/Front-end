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

  return (
    <Routes>
      <Route
        index
        element={
          <ForgotPassword
            onBackToLogin={() => navigate('/login')}
            onContinueToVerify={(email) => {
              setResetEmail(email);
              navigate('verify');
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
              navigate('reset');
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
            onBackToVerify={() => navigate('verify')}
            onSuccess={() => navigate('success')}
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
