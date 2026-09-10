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
//
// NOTE: every navigate() call below uses an ABSOLUTE path
// (/company/register/...) rather than a relative one. This wizard is
// mounted under a wildcard route (path="/company/register/*" in
// App.jsx), and relative navigation from a route matched via a wildcard
// resolves against the *full current pathname* rather than this
// wizard's base path - a relative navigate('documents') called while on
// /company/register/company-info would produce
// /company/register/company-info/documents instead of
// /company/register/documents, and the catch-all route below would then
// keep appending to that already-broken path. Always use absolute paths
// here.
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
              navigate('/company/register/company-info');
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
              navigate('/company/register/documents');
            }}
            onBack={() => navigate('/company/register/account')}
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
              navigate('/company/register/terms');
            }}
            onBack={() => navigate('/company/register/company-info')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route
        path="terms"
        element={
          <CompanyStep4
            companyData={companyData}
            onNextSuccess={() => navigate('/company/register/verify')}
            onBack={() => navigate('/company/register/documents')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route
        path="verify"
        element={
          <OtpVerification
            userEmail={companyData.email}
            onVerifySuccess={() => navigate('/company/register/submitted')}
            onContinueToLogin={() => navigate('/company/register/submitted')}
            onBack={() => navigate('/company/register/terms')}
          />
        }
      />
      <Route
        path="submitted"
        element={
          <CompanyStep5
            email={companyData.email}
            onNavigateToLanding={() => navigate('/')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
      <Route path="*" element={<Navigate to="/company/register/account" replace />} />
    </Routes>
  );
}

export default CompanyWizard;
