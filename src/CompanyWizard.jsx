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
// shows a "submitted" state before POST /api/v1/auth/register/organization
// actually returns 201.
//
// NOTE: all navigate() calls here use absolute paths (leading "/"), not
// relative sibling names like navigate('terms'). This route is mounted at
// /company/register/* (a splat route) - relative navigation from inside a
// splat route resolves against the full matched URL, not just this
// route's own segment, so navigate('terms') from .../company-info would
// produce .../company-info/terms instead of .../terms, which then matches
// no route, falls through to the "*" catch-all below, and (if that catch-all
// also uses a relative target) recurses into an ever-growing URL. Absolute
// paths sidestep that ambiguity entirely - see the same fix in
// RegisterWizard.jsx.
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
            organizationEmail={companyData.email}
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
