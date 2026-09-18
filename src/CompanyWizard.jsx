import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import CompanyStep1 from './CompanyStep1';
import CompanyStep2 from './CompanyStep2';
import CompanyStep3 from './CompanyStep3';
import CompanyStep4 from './CompanyStep4';
import CompanyStep5 from './CompanyStep5';
<<<<<<< HEAD
<<<<<<< HEAD
import OtpVerification from './OtpVerification';
=======
>>>>>>> feature/hide-scrollbars
=======
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f

// Company Registration flow:
// /company/register/account
// /company/register/company-info
// /company/register/documents
// /company/register/terms
// /company/register/submitted
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
<<<<<<< HEAD
<<<<<<< HEAD
            onNextSuccess={() => navigate('/company/register/verify')}
=======
            onNextSuccess={() => navigate('/company/register/submitted')}
>>>>>>> feature/hide-scrollbars
            onBack={() => navigate('/company/register/documents')}
=======
            onNextSuccess={() =>
              navigate('/company/register/submitted')
            }
            onBack={() =>
              navigate('/company/register/documents')
            }
>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />
<<<<<<< HEAD
      <Route
<<<<<<< HEAD
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
=======

>>>>>>> 4fe3036680fd3a5fc5b9a3217cfe022635b4142f
      <Route
=======
>>>>>>> feature/hide-scrollbars
        path="submitted"
        element={
          <CompanyStep5
            email={companyData.email}
            onNavigateToLanding={() => navigate('/')}
            onNavigateToLogin={() => navigate('/company/login')}
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/company/register/account"
            replace
          />
        }
      />
    </Routes>
  );
}

export default CompanyWizard;