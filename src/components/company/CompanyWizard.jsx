import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import CompanyStep1 from './CompanyStep1';
import CompanyStep2 from './CompanyStep2';
import CompanyStep3 from './CompanyStep3';
import CompanyStep4 from './CompanyStep4';
import CompanyStep5 from './CompanyStep5';

// Company Registration flow:
// /company/register/account
// /company/register/company-info
// /company/register/documents
// /company/register/terms
// /company/register/submitted
//
// The form data lives in memory only (it contains a password and files), so a
// page refresh or a direct link to a later step would land on an empty form.
// Every step therefore checks that the previous steps are complete and sends
// the user back to the first incomplete one instead of showing a broken page.

const BASE = '/company/register';
const SUBMITTED_KEY = 'skillspan_company_registered_email';

const readSubmittedEmail = () => {
  try {
    return sessionStorage.getItem(SUBMITTED_KEY);
  } catch {
    return null;
  }
};

const writeSubmittedEmail = (email) => {
  try {
    if (email) sessionStorage.setItem(SUBMITTED_KEY, email);
    else sessionStorage.removeItem(SUBMITTED_KEY);
  } catch {
    // storage unavailable (private mode etc.) - the confirmation page just won't survive a refresh
  }
};

const isStep1Done = (d) => !!(d.email && d.password && d.name);
const isStep2Done = (d) => !!(d.companyName && d.country && d.city && d.address);
const isStep3Done = (d) => !!d.proofFile;

function firstIncompleteStep(d) {
  if (!isStep1Done(d)) return `${BASE}/account`;
  if (!isStep2Done(d)) return `${BASE}/company-info`;
  if (!isStep3Done(d)) return `${BASE}/documents`;
  return null;
}

function CompanyWizard() {
  const [companyData, setCompanyData] = useState({});
  const [submittedEmail, setSubmittedEmail] = useState(readSubmittedEmail);
  const navigate = useNavigate();

  const merge = (patch) => setCompanyData((prev) => ({ ...prev, ...patch }));

  // Renders `element` only when every step before `step` has its data.
  // Otherwise redirects: to the confirmation page if this browser session
  // already finished a registration, or to the first incomplete step.
  const guard = (step, element) => {
    const order = ['account', 'company-info', 'documents', 'terms'];
    const missing = firstIncompleteStep(companyData);
    if (missing && order.indexOf(missing.split('/').pop()) < order.indexOf(step)) {
      return <Navigate to={submittedEmail !== null ? `${BASE}/submitted` : missing} replace />;
    }
    return element;
  };

  const startNewRegistration = () => {
    setSubmittedEmail(null);
    writeSubmittedEmail(null);
  };

  return (
    <Routes>
      <Route
        path="account"
        element={
          <CompanyStep1
            initialData={companyData}
            onNextSuccess={(step1Data) => {
              startNewRegistration();
              merge(step1Data);
              navigate(`${BASE}/company-info`);
            }}
            onNavigateToLogin={() => navigate('/company/login')}
            onBack={() => navigate('/')}
          />
        }
      />

      <Route
        path="company-info"
        element={guard(
          'company-info',
          <CompanyStep2
            initialData={companyData}
            onNextSuccess={(step2Data) => {
              merge(step2Data);
              navigate(`${BASE}/documents`);
            }}
            onBack={() => navigate(`${BASE}/account`)}
            onNavigateToLogin={() => navigate('/company/login')}
          />,
        )}
      />

      <Route
        path="documents"
        element={guard(
          'documents',
          <CompanyStep3
            initialData={companyData}
            onNextSuccess={(step3Data) => {
              merge(step3Data);
              navigate(`${BASE}/terms`);
            }}
            onBack={() => navigate(`${BASE}/company-info`)}
            onNavigateToLogin={() => navigate('/company/login')}
          />,
        )}
      />

      <Route
        path="terms"
        element={guard(
          'terms',
          <CompanyStep4
            companyData={companyData}
            onNextSuccess={() => {
              // Registration is done: keep only the email for the confirmation
              // page and drop the password / uploaded files from memory.
              setSubmittedEmail(companyData.email || '');
              writeSubmittedEmail(companyData.email || '');
              setCompanyData({});
              navigate(`${BASE}/submitted`);
            }}
            onBack={() => navigate(`${BASE}/documents`)}
            onNavigateToLogin={() => navigate('/company/login')}
          />,
        )}
      />

      <Route
        path="submitted"
        element={
          submittedEmail === null ? (
            <Navigate to={`${BASE}/account`} replace />
          ) : (
            <CompanyStep5
              email={submittedEmail}
              onNavigateToLanding={() => {
                writeSubmittedEmail(null);
                navigate('/');
              }}
              onNavigateToLogin={() => {
                writeSubmittedEmail(null);
                navigate('/company/login');
              }}
            />
          )
        }
      />

      <Route path="*" element={<Navigate to={`${BASE}/account`} replace />} />
    </Routes>
  );
}

export default CompanyWizard;
