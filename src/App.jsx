import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Landing from './landing/LandingPage'
import { AuthProvider, useAuth } from './components/auth/AuthContext'
import { signOutToLanding, isDeliberateSignOut, clearDeliberateSignOut } from './components/auth/signOut'
import { EvidenceProvider } from './components/evidence/EvidenceContext'

// Everything behind the login form loads on demand. The app used to ship as a
// single 784 kB bundle, so a visitor reading the landing page downloaded the
// dashboard, the skill matrix and the whole assessment wizard before seeing
// anything. The marketing page and the auth context stay eager — they are the
// first paint.
const Login = lazy(() => import('./components/auth/Login'))
const CompanyForgotPassword = lazy(() => import('./components/company/CompanyForgotPassword'))
const RegisterWizard = lazy(() => import('./components/auth/RegisterWizard'))
const RoleChoice = lazy(() => import('./components/auth/RoleChoice'))
const ForgotPasswordWizard = lazy(() => import('./components/auth/ForgotPasswordWizard'))
const CompanyWizard = lazy(() => import('./components/company/CompanyWizard'))
const SessionExpired = lazy(() => import('./components/auth/SessionExpired'))
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
const SkillMatrix = lazy(() => import('./components/skillmatrix/SkillMatrix'))
const CareerRoles = lazy(() => import('./components/careerroles/CareerRoles'))
const LearnerWorkspace = lazy(() => import('./components/learner/LearnerWorkspace'))
const CompanyLayout = lazy(() => import('./components/company/CompanyLayout'))
const CompanyDashboard = lazy(() => import('./components/company/CompanyDashboard'))
const CompanyTalent = lazy(() => import('./components/company/CompanyTalent'))
const CompanyProfile = lazy(() => import('./components/company/CompanyProfile'))

// One module, four screens: lazy() needs a default export, so each named
// export is adapted rather than splitting the file into four.
const EvidenceStatusPage = lazy(() => import('./components/evidence/EvidencePages').then((m) => ({ default: m.EvidenceStatusPage })))
const AddEvidencePage = lazy(() => import('./components/evidence/EvidencePages').then((m) => ({ default: m.AddEvidencePage })))
const EvidenceDetailPage = lazy(() => import('./components/evidence/EvidencePages').then((m) => ({ default: m.EvidenceDetailPage })))
const ReviewerPage = lazy(() => import('./components/evidence/EvidencePages').then((m) => ({ default: m.ReviewerPage })))

function LoginPage({ initialRole = 'student' }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <Login
      initialRole={initialRole}
      onSwitchToRegister={() => navigate('/get-started')}
      onBack={() => navigate('/')}
      onForgotPassword={(role) =>
        navigate(role === 'company' ? '/company/forgot-password' : '/forgot-password')
      }
      onLoginSuccess={({ user, organizations, role }) => {
        // `organizations` is kept on the in-memory user as well, not just in the
        // cookie: HomeRoute reads it to decide which dashboard a signed-in
        // visitor belongs to (see below).
        login({ ...user, organizations: organizations || [] })
        navigate(role === 'company' ? '/company/dashboard' : '/dashboard')
      }}
      onNewGoogleUser={(credential) =>
        navigate('/register/status', { state: { googleCredential: credential } })
      }
    />
  )
}

function CompanyForgotPasswordPage() {
  const navigate = useNavigate()
  return <CompanyForgotPassword onBackToLogin={() => navigate('/company/login')} />
}

import { NAV_ROUTES } from './navRoutes'

function DashboardPage() {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  return (
    <Dashboard
      user={authUser}
      onLogout={() => {
        signOutToLanding(navigate, logout)
      }}
      onNavigate={(key) => {
        if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key])
      }}
    />
  )
}

function WorkspacePage({ view }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <LearnerWorkspace
      key={view}
      initialView={view}
      onNavigate={(key) => {
        if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key])
      }}
      onLogout={() => {
        signOutToLanding(navigate, logout)
      }}
    />
  )
}

function SkillMatrixPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab = new URLSearchParams(location.search).get('tab')
  return <SkillMatrix initialTab={tab} onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]) }} />
}

function CareerRolesPage() {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  return (
    <CareerRoles
      user={authUser}
      onLogout={() => {
        signOutToLanding(navigate, logout)
      }}
      onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]) }}
    />
  )
}

function RequireAuth({ children }) {
  const { authUser } = useAuth()
  if (!authUser) {
    if (isDeliberateSignOut()) return <Navigate to="/" replace state={{ loggedOut: true }} />
    return <Navigate to="/login" replace />
  }
  return children
}

// Company accounts live under /company/* with their own shell. A learner who
// wanders in has no organization, so they are sent back to the learner
// dashboard instead of seeing a page full of 403s from the company endpoints.
function RequireCompanyAuth({ children }) {
  const { authUser } = useAuth()
  if (!authUser) {
    if (isDeliberateSignOut()) return <Navigate to="/" replace state={{ loggedOut: true }} />
    return <Navigate to="/company/login" replace />
  }
  const hasOrganization = Array.isArray(authUser.organizations) && authUser.organizations.length > 0
  if (!hasOrganization) return <Navigate to="/dashboard" replace />
  return children
}

// The site root is also the app's front door. A visitor who still has a session
// belongs in their own dashboard: sending them to the marketing page made
// returning users think they had to sign up again ("it keeps asking me to
// register"). AuthContext restores the session synchronously on first render,
// so there is no flash of the landing page before the redirect.
//
// `?site=1` is the deliberate way back for anyone who wants to read the landing
// page while signed in (demos, screenshots, the "view site" link).
function HomeRoute() {
  const { authUser } = useAuth()
  const { search, state } = useLocation()
  const wantsSite = new URLSearchParams(search).has('site') || state?.loggedOut === true
  // The deliberate-logout hand-over is done once the landing page is showing.
  useEffect(() => {
    clearDeliberateSignOut()
  }, [])
  if (authUser && !wantsSite) {
    const isCompany = Array.isArray(authUser.organizations) && authUser.organizations.length > 0
    return <Navigate to={isCompany ? '/company/dashboard' : '/dashboard'} replace />
  }
  return <Landing />
}

function CompanyPage({ view }) {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  const organization = authUser?.organizations?.[0] || null

  const renderView = () => {
    if (view === 'talent') return <CompanyTalent />
    if (view === 'profile') return <CompanyProfile user={authUser} />
    return <CompanyDashboard user={authUser} onNavigate={navigate} />
  }

  return (
    <CompanyLayout
      active={view}
      onNavigate={navigate}
      user={authUser}
      organization={organization}
      onLogout={() => {
        signOutToLanding(navigate, logout)
      }}
    >
      {renderView()}
    </CompanyLayout>
  )
}

// Key for the page-transition wrapper. It must stay the same while moving
// between the steps of one wizard (/company/register/account -> company-info
// -> ...), otherwise React remounts the whole wizard on every step, its
// in-memory form data is wiped, and the step guards bounce the user back to
// the first page. So we only key on the section ("/company/register",
// "/register", "/dashboard", ...), not the full path.
function transitionKey(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'company') return `company/${parts[1] || ''}`
  return parts[0] || 'home'
}

// Shown while a lazily-loaded screen is fetched. Inline styles on purpose: it
// must render before any of the split CSS has arrived.
function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        font: "500 13px 'Inter', system-ui, sans-serif",
      }}
    >
      Loading…
    </div>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionExpired, dismissSessionExpired } = useAuth()

  // Full-page takeover, not a modal on top of whatever was open - a
  // 401-expired token means nothing else on screen can be trusted/acted on
  // anyway (see api.js `onSessionExpired`).
  if (sessionExpired) {
    return (
      <SessionExpired
        onLoginAgain={() => {
          dismissSessionExpired()
          navigate('/login')
        }}
        onGoToLanding={() => {
          dismissSessionExpired()
          navigate('/')
        }}
      />
    )
  }

  return (
    <div
      className={`route-transition${location.pathname === '/' ? ' route-transition--landing' : ''}`}
      key={transitionKey(location.pathname)}
    >
      <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/get-started" element={<RoleChoice />} />
      <Route path="/register/*" element={<RegisterWizard />} />
      <Route path="/forgot-password/*" element={<ForgotPasswordWizard />} />
      <Route path="/company/login" element={<LoginPage initialRole="company" />} />
      <Route path="/company/register/*" element={<CompanyWizard />} />
      <Route path="/company/forgot-password" element={<CompanyForgotPasswordPage />} />
      <Route
        path="/company/dashboard"
        element={<RequireCompanyAuth><CompanyPage key="dashboard" view="dashboard" /></RequireCompanyAuth>}
      />
      <Route
        path="/company/talent"
        element={<RequireCompanyAuth><CompanyPage key="talent" view="talent" /></RequireCompanyAuth>}
      />
      <Route
        path="/company/profile"
        element={<RequireCompanyAuth><CompanyPage key="profile" view="profile" /></RequireCompanyAuth>}
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/career-journey" element={<RequireAuth><WorkspacePage key="career-journey" view="career-journey" /></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><WorkspacePage key="projects" view="projects" /></RequireAuth>} />
      <Route path="/assistant" element={<RequireAuth><WorkspacePage key="assistant" view="assistant" /></RequireAuth>} />
      <Route path="/support" element={<RequireAuth><WorkspacePage key="support" view="support" /></RequireAuth>} />
      <Route path="/mentor" element={<RequireAuth><WorkspacePage key="mentor" view="mentor" /></RequireAuth>} />
      <Route path="/talent" element={<RequireAuth><WorkspacePage key="talent" view="talent" /></RequireAuth>} />
      <Route path="/evidence" element={<RequireAuth><EvidenceProvider><EvidenceStatusPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/evidence/add" element={<RequireAuth><EvidenceProvider><AddEvidencePage /></EvidenceProvider></RequireAuth>} />
      <Route path="/evidence/:id" element={<RequireAuth><EvidenceProvider><EvidenceDetailPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/review" element={<RequireAuth><EvidenceProvider><ReviewerPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/record" element={<RequireAuth><EvidenceProvider><EvidenceStatusPage /></EvidenceProvider></RequireAuth>} />
      <Route
        path="/skill-matrix"
        element={
          <RequireAuth>
            <SkillMatrixPage />
          </RequireAuth>
        }
      />
      <Route path="/career-roles" element={<RequireAuth><WorkspacePage key="career-roles" view="career-roles" /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><WorkspacePage key="profile" view="profile" /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><WorkspacePage key="settings" view="settings" /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App