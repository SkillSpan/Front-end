import { lazy, Suspense, useEffect, useState, useCallback } from 'react'
import { safeRedirect } from './utils/safeRedirect'
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
const CompanyLogin = lazy(() => import('./components/company/CompanyLogin'))
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
const CompanyProfile = lazy(() => import('./components/company/CompanyProfile'))
const CompanyComingSoon = lazy(() => import('./components/company/CompanyComingSoon'))
const PendingApproval = lazy(() => import('./components/company/PendingApproval'))
const CompanyNotifications = lazy(() => import('./components/company/notifications/CompanyNotifications'))
// Sprint 4: US-PRJ-01 (create/edit), US-PRJ-02 (list + owner details),
// US-MATCH-03 (applications), US-MATCH-04 (team formation + learner invitation).
const ProjectsList = lazy(() => import('./components/company/projects/ProjectsList'))
const ProjectDetail = lazy(() => import('./components/company/projects/ProjectDetail'))
const ProjectForm = lazy(() => import('./components/company/projects/ProjectForm'))
const ApplicationsPage = lazy(() => import('./components/company/applications/ApplicationsPage'))
const ApplicationDetail = lazy(() => import('./components/company/applications/ApplicationDetail'))
const TeamFormation = lazy(() => import('./components/company/team/TeamFormation'))
const TeamInvitationPage = lazy(() => import('./components/company/team/TeamInvitationPage'))
// Talent (US-COMP-05 search, US-COMP-06 summary + compare, US-COMP-07 lists + notes + contact).
const TalentSearch = lazy(() => import('./components/company/talent/TalentSearch'))
const CandidateSummary = lazy(() => import('./components/company/talent/CandidateSummary'))
const TalentCompare = lazy(() => import('./components/company/talent/TalentCompare'))
const TalentLists = lazy(() => import('./components/company/talent/TalentLists'))

// Design preview (html.to.design / Figma import): when the build is made with
// VITE_COMPANY_PREVIEW=true, /company/dashboard and /company/pending render
// the Nova Tech sample data without logging in. Off in normal builds.
const COMPANY_PREVIEW = import.meta.env.VITE_COMPANY_PREVIEW === 'true'
const PREVIEW_USER = { id: 0, name: 'Lina Haddad', email: 'lina@novatech.example' }
const PREVIEW_ORG = { id: 0, name: 'Nova Tech', verification_status: 'verified' }
const PREVIEW_COUNTS = { projects: 12, applicationsPending: 12, unreadNotifications: 3 }

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

function CompanyLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  return (
    <CompanyLogin
      onBack={() => navigate('/')}
      onSwitchToRegister={() => navigate('/company/register')}
      onSwitchToStudentLogin={() => navigate('/login')}
      onForgotPassword={() => navigate('/company/forgot-password')}
      onLoginSuccess={({ user, redirectUrl }) => {
        login(user)
        // US-COMP-03: the login answer carries redirect_url. Only in-app paths
        // are followed ("/..." but not "//host"); anything else → the dashboard.
        navigate(safeRedirect(redirectUrl, '/company/dashboard'))
      }}
      onPendingApproval={(organization) => navigate('/company/pending', { state: { organization } })}
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

const COMPANY_SOON_VIEWS = ['settings']

// Sprint 4 views → the sidebar item they belong to (CompanyLayout `active`).
const VIEW_NAV = {
  projects: 'projects', 'project-new': 'projects', project: 'projects', 'project-edit': 'projects', team: 'projects',
  applicants: 'applicants', application: 'applicants',
  talent: 'talent', candidate: 'talent', 'talent-compare': 'talent', 'talent-lists': 'talent',
}
const VIEW_TITLE = {
  'project-new': 'prj.form.createTitle', project: 'prj.detail.title', 'project-edit': 'prj.form.editTitle',
  team: 'team.title', application: 'app.detail.title',
  candidate: 'tal.summary', 'talent-compare': 'tal.cmp.title', 'talent-lists': 'tal.lists.title',
}

function CompanyPage({ view, demo, previewState, mode }) {
  const navigate = useNavigate()
  const { authUser, logout } = useAuth()
  const [counts, setCounts] = useState(demo ? PREVIEW_COUNTS : null)
  // The Organization Profile reports the name/status it loaded so the top bar
  // shows the same verification status as the page (US-COMP-04).
  const [orgOverride, setOrgOverride] = useState(null)
  const user = demo ? PREVIEW_USER : authUser
  const baseOrganization = demo ? PREVIEW_ORG : authUser?.organizations?.[0] || null
  const organization = orgOverride ? { ...(baseOrganization || {}), ...orgOverride } : baseOrganization
  // permissions.can_publish_projects (dashboard payload) also gates the sidebar's "Publish project".
  const [canPublish, setCanPublish] = useState(true)
  const handleData = useCallback((data) => {
    setCounts(data.counts)
    setCanPublish(data.canPublish !== false && data.permissions?.can_publish_projects !== false)
  }, [])
  const handleOrganization = useCallback((org) => setOrgOverride(org), [])

  const renderView = () => {
    const sprint4 = { user, onNavigate: navigate, demo, previewState }
    if (view === 'talent') return <TalentSearch {...sprint4} />
    if (view === 'candidate') return <CandidateSummary {...sprint4} />
    if (view === 'talent-compare') return <TalentCompare {...sprint4} />
    if (view === 'talent-lists') return <TalentLists {...sprint4} />
    if (view === 'profile') {
      return (
        <CompanyProfile
          user={user}
          onNavigate={navigate}
          demo={demo}
          previewState={previewState}
          mode={mode}
          onOrganization={handleOrganization}
        />
      )
    }
    if (view === 'projects') return <ProjectsList {...sprint4} />
    if (view === 'project-new' || view === 'project-edit') return <ProjectForm {...sprint4} />
    if (view === 'project') return <ProjectDetail {...sprint4} />
    if (view === 'team') return <TeamFormation {...sprint4} />
    if (view === 'applicants') return <ApplicationsPage {...sprint4} />
    if (view === 'application') return <ApplicationDetail {...sprint4} />
    if (COMPANY_SOON_VIEWS.includes(view)) return <CompanyComingSoon onNavigate={navigate} />
    if (view === 'notifications') {
      return <CompanyNotifications user={user} onNavigate={navigate} demo={demo} previewState={previewState} />
    }
    return <CompanyDashboard user={user} onNavigate={navigate} demo={demo} previewState={previewState} onData={handleData} />
  }

  return (
    <CompanyLayout
      active={VIEW_NAV[view] || view}
      titleKey={VIEW_TITLE[view]}
      onNavigate={navigate}
      user={user}
      organization={organization}
      counts={counts}
      live={!demo}
      canPublish={canPublish}
      onLogout={() => {
        logout()
        navigate('/company/login')
      }}
    >
      {renderView()}
    </CompanyLayout>
  )
}

// Company screens in a preview build. `?state=` picks the state to show so each
// one can be imported into Figma on its own:
//   empty   → a new company with no projects (dashboard) / no notifications
//   loading → every section shows its skeleton
//   error   → every section shows its error card with Retry
//             (add &section=funnel to fail only one section)
//   denied  → the "access denied" state (403)
const PREVIEW_STATES = ['empty', 'loading', 'error', 'denied']
// Organization Profile (US-COMP-04) preview states:
//   /company/profile?state=  pending | incomplete | rejected | reverification |
//                            saved | upload-error | uploading | loading | error | denied
//   /company/profile/edit?state=  errors | reverify | upload-error | loading | error | denied
const PROFILE_PREVIEW_STATES = [
  'loading', 'error', 'denied', 'pending', 'incomplete', 'rejected', 'reverification',
  'saved', 'upload-error', 'uploading', 'errors', 'reverify',
]

// Sprint 4 screens read their preview state from ?preview= (their own ?state=
// is the project-state filter of My Projects): loading | error | empty | denied |
// notfound | readonly, plus per-screen states listed in each component.
function Sprint4PreviewPage({ view }) {
  const location = useLocation()
  const state = new URLSearchParams(location.search).get('preview')
  return <CompanyPage key={`demo-${view}-${location.pathname}-${state || 'full'}`} view={view} demo="full" previewState={state} />
}

function CompanyPreviewPage({ view, empty, mode }) {
  const location = useLocation()
  const param = new URLSearchParams(location.search).get('state')
  const allowed = view === 'profile' ? PROFILE_PREVIEW_STATES : PREVIEW_STATES
  const state = empty ? 'empty' : (allowed.includes(param) ? param : null)
  const demo = view === 'dashboard' && state === 'empty' ? 'empty' : 'full'
  return <CompanyPage key={`demo-${view}-${mode || ''}-${state || 'full'}`} view={view} demo={demo} previewState={state} mode={mode} />
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
          // US-COMP-03 Scenario 5: a company representative goes back to Company Login.
          if (location.pathname.startsWith('/company')) {
            navigate('/company/login', { state: { sessionExpired: true } })
          } else {
            navigate('/login')
          }
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
      <Route path="/company/login" element={<CompanyLoginPage />} />
      <Route path="/company/register/*" element={<CompanyWizard />} />
      <Route path="/company/forgot-password" element={<CompanyForgotPasswordPage />} />
      <Route
        path="/company/dashboard"
        element={COMPANY_PREVIEW
          ? <CompanyPreviewPage view="dashboard" />
          : <RequireCompanyAuth><CompanyPage key="dashboard" view="dashboard" /></RequireCompanyAuth>}
      />
      {COMPANY_PREVIEW && <Route path="/company/dashboard-empty" element={<CompanyPreviewPage view="dashboard" empty />} />}
      {/* US-COMP-03: Notification History (paginated, read/unread, mark as read). */}
      <Route
        path="/company/notifications"
        element={COMPANY_PREVIEW
          ? <CompanyPreviewPage view="notifications" />
          : <RequireCompanyAuth><CompanyPage key="notifications" view="notifications" /></RequireCompanyAuth>}
      />
      {/* Sprint 1 BR-01: a pending organization cannot sign in — signed-out page. */}
      <Route path="/company/pending" element={<PendingApproval demo={COMPANY_PREVIEW} />} />
      {COMPANY_SOON_VIEWS.map((v) => (
        <Route
          key={v}
          path={`/company/${v}/*`}
          element={COMPANY_PREVIEW
            ? <CompanyPage key={v} view={v} demo="full" />
            : <RequireCompanyAuth><CompanyPage key={v} view={v} /></RequireCompanyAuth>}
        />
      ))}
      {/* Sprint 4 — US-PRJ-02 My Projects + owner details, US-PRJ-01 create/edit, US-MATCH-04 team. */}
      {[
        ['/company/projects', 'projects'],
        ['/company/projects/new', 'project-new'],
        ['/company/projects/:id', 'project'],
        ['/company/projects/:id/edit', 'project-edit'],
        ['/company/projects/:id/team', 'team'],
        ['/company/applicants', 'applicants'],
        ['/company/applicants/:id', 'application'],
        ['/company/talent', 'talent'],
        ['/company/talent/compare', 'talent-compare'],
        ['/company/talent/lists', 'talent-lists'],
        ['/company/talent/lists/:listId', 'talent-lists'],
        ['/company/talent/:id', 'candidate'],
      ].map(([path, v]) => (
        <Route
          key={path}
          path={path}
          element={COMPANY_PREVIEW
            ? <Sprint4PreviewPage view={v} />
            : <RequireCompanyAuth><CompanyPage key={v} view={v} /></RequireCompanyAuth>}
        />
      ))}
      {/* US-MATCH-04 AC-07: the invited learner accepts or declines. */}
      <Route
        path="/team-invitations/:id"
        element={COMPANY_PREVIEW ? <TeamInvitationPage demo /> : <RequireAuth><TeamInvitationPage /></RequireAuth>}
      />
      {/* US-COMP-04: Organization Profile — view + edit. */}
      <Route
        path="/company/profile"
        element={COMPANY_PREVIEW
          ? <CompanyPreviewPage view="profile" mode="view" />
          : <RequireCompanyAuth><CompanyPage key="profile" view="profile" mode="view" /></RequireCompanyAuth>}
      />
      <Route
        path="/company/profile/edit"
        element={COMPANY_PREVIEW
          ? <CompanyPreviewPage view="profile" mode="edit" />
          : <RequireCompanyAuth><CompanyPage key="profile-edit" view="profile" mode="edit" /></RequireCompanyAuth>}
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
