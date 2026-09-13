import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import VerifyCode from './VerifyCode';
import ResetSuccess from './ResetSuccess';

// NOTE: absolute navigate() targets throughout - see the comment in
// CompanyWizard.jsx for why relative sibling names (navigate('verify'))
// break inside a splat-mounted route (/forgot-password/*).
function ForgotPasswordWizard() {
  const [resetEmail, setResetEmail] = useState('');
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
