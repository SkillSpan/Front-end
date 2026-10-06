import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Landing from './components/common/Landing'
import Login from './components/auth/Login'
import CompanyLogin from './components/company/CompanyLogin'
import CompanyForgotPassword from './components/company/CompanyForgotPassword'
import RegisterWizard from './components/auth/RegisterWizard'
import ForgotPasswordWizard from './components/auth/ForgotPasswordWizard'
import CompanyWizard from './components/company/CompanyWizard'
import SessionExpired from './components/auth/SessionExpired'
import Dashboard from './components/dashboard/Dashboard'
import SkillMatrix from './components/skillmatrix/SkillMatrix'
import CareerRoles from './components/careerroles/CareerRoles'
import LearnerWorkspace from './components/learner/LearnerWorkspace'
import { AuthProvider, useAuth } from './components/auth/AuthContext'
import { EvidenceProvider } from './components/evidence/EvidenceContext'
import { EvidenceStatusPage, AddEvidencePage, EvidenceDetailPage, ReviewerPage } from './components/evidence/EvidencePages'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <Login
      onSwitchToRegister={() => navigate('/register')}
      onBack={() => navigate('/')}
      onForgotPassword={() => navigate('/forgot-password')}
      onLoginSuccess={({ user }) => {
        login(user)
        navigate('/dashboard')
      }}
      onNewGoogleUser={(credential) =>
        navigate('/register/status', { state: { googleCredential: credential } })
      }
    />
  )
}

function CompanyLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <CompanyLogin
      onBack={() => navigate('/')}
      onSwitchToRegister={() => navigate('/company/register')}
      onSwitchToStudentLogin={() => navigate('/login')}
      onForgotPassword={() => navigate('/company/forgot-password')}
      onLoginSuccess={({ user }) => {
        login(user)
        navigate('/dashboard')
      }}
    />
  )
}

function CompanyForgotPasswordPage() {
  const navigate = useNavigate()
  return <CompanyForgotPassword onBackToLogin={() => navigate('/company/login')} />
}

// Simple in-app nav map for the dashboard sidebar - most of these targets
// don't have their own screens/APIs yet, so unmapped keys just stay put.
const NAV_ROUTES = {
  dashboard: '/dashboard',
  'career-journey': '/career-journey',
  'skill-matrix': '/skill-matrix',
  'skill-assessment': '/skill-matrix?tab=assessment',
  roles: '/career-roles',
  projects: '/projects',
  assistant: '/assistant',
  mentor: '/mentor',
  talent: '/talent',
  evidence: '/evidence',
  record: '/record',
}

function DashboardPage() {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  return (
    <Dashboard
      user={authUser}
      onLogout={() => {
        logout()
        navigate('/')
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
      initialView={view}
      onNavigate={(key) => {
        if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key])
      }}
      onLogout={() => {
        logout()
        navigate('/')
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
        logout()
        navigate('/')
      }}
      onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]) }}
    />
  )
}

function RequireAuth({ children }) {
  const { authUser } = useAuth()
  if (!authUser) return <Navigate to="/login" replace />
  return children
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
    <div className="route-transition" key={transitionKey(location.pathname)}>
      <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/*" element={<RegisterWizard />} />
      <Route path="/forgot-password/*" element={<ForgotPasswordWizard />} />
      <Route path="/company/login" element={<CompanyLoginPage />} />
      <Route path="/company/register/*" element={<CompanyWizard />} />
      <Route path="/company/forgot-password" element={<CompanyForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/career-journey" element={<RequireAuth><WorkspacePage view="career-journey" /></RequireAuth>} />
      <Route path="/projects" element={<RequireAuth><WorkspacePage view="projects" /></RequireAuth>} />
      <Route path="/assistant" element={<RequireAuth><WorkspacePage view="assistant" /></RequireAuth>} />
      <Route path="/mentor" element={<RequireAuth><WorkspacePage view="mentor" /></RequireAuth>} />
      <Route path="/talent" element={<RequireAuth><WorkspacePage view="talent" /></RequireAuth>} />
      <Route path="/evidence" element={<RequireAuth><EvidenceProvider><EvidenceStatusPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/evidence/add" element={<RequireAuth><EvidenceProvider><AddEvidencePage /></EvidenceProvider></RequireAuth>} />
      <Route path="/evidence/:id" element={<RequireAuth><EvidenceProvider><EvidenceDetailPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/review" element={<RequireAuth><EvidenceProvider><ReviewerPage /></EvidenceProvider></RequireAuth>} />
      <Route path="/record" element={<RequireAuth><WorkspacePage view="record" /></RequireAuth>} />
      <Route
        path="/skill-matrix"
        element={
          <RequireAuth>
            <SkillMatrixPage />
          </RequireAuth>
        }
      />
      <Route path="/career-roles" element={<RequireAuth><WorkspacePage view="career-roles" /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
