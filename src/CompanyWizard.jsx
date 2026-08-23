import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CompanyStep1 from './CompanyStep1';
import CompanyStep2 from './CompanyStep2';
import CompanyStep3 from './CompanyStep3';
import CompanyStep4 from './CompanyStep4';
import CompanyStep5 from './CompanyStep5';
import OtpVerification from './OtpVerification';

// Flow per backend contract review: Registration (multipart POST, done at
// the end of step 4) -> OTP -> Pending Admin Review (step 5). Nothing here
// shows a "submitted" state before POST /api/auth/register/organization
// actually returns 201.
function CompanyWizard() {
  const [companyData, setCompanyData] = useState({});
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="account"
        element={
          <CompanyStep1
            initialData={companyData}
            onNextSuccess={(step1Data) => {
              setCompanyData((prev) => ({ ...prev, ...step1Data }));
              navigate('company-info');
            }}
            onNavigateToLogin={() => navigate('/company/login')}
            onBack={() => navigate('/')}
          />
        }
      />
      <Route
        path="company-info"
        element={
          <CompanyStep2
            initialData={companyData}
            onNextSuccess={(step2Data) => {
              setCompanyData((prev) => ({ ...prev, ...step2Data }));
              navigate('documents');
            }}
            onBack={() => navigate('account')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route
        path="documents"
        element={
          <CompanyStep3
            initialData={companyData}
            onNextSuccess={(step3Data) => {
              setCompanyData((prev) => ({ ...prev, ...step3Data }));
              navigate('terms');
            }}
            onBack={() => navigate('company-info')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route
        path="terms"
        element={
          <CompanyStep4
            companyData={companyData}
            onNextSuccess={() => navigate('verify')}
            onBack={() => navigate('documents')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route
        path="verify"
        element={
          <OtpVerification
            userEmail={companyData.email}
            onVerifySuccess={() => navigate('submitted')}
            onContinueToLogin={() => navigate('submitted')}
            onBack={() => navigate('terms')}
          />
        }
      />
      <Route
        path="submitted"
        element={
          <CompanyStep5
            organizationEmail={companyData.email}
            onNavigateToLanding={() => navigate('/')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route path="*" element={<Navigate to="account" replace />} />
    </Routes>
  );
}

export default CompanyWizard;
