import { useNavigate } from 'react-router-dom';
import { Loader2, Info } from 'lucide-react';
import AppLayout from '../dashboard/AppLayout';
import { useAuth } from '../auth/AuthContext';
import { NAV_ROUTES } from '../../navRoutes';
import { useEvidence } from './EvidenceContext';
import './evidence.css';

// Wraps Rawan's evidence screens in the same authenticated shell (dark
// sidebar + top bar) used by the Dashboard / Skill Matrix / Career Roles.
export default function EvidenceShell({ children }) {
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();
  const { source, loadError, reload } = useEvidence();

  return (
    <AppLayout
      active="evidence"
      user={authUser}
      onLogout={() => { logout(); navigate('/'); }}
      onNavigate={(key) => { if (NAV_ROUTES[key]) navigate(NAV_ROUTES[key]); }}
      readinessScore={67}
      roleLabel="Software Engineer"
    >
      <div className="evidence-scope">
        {source === 'preview' && (
          <div className="mx-auto mb-4 flex max-w-[1180px] items-center gap-2 rounded-lg border border-[#d9e5ff] bg-[#f5f8ff] px-3.5 py-2.5 text-[11px] text-[#344054]">
            <Info size={14} className="shrink-0 text-[#2f5bea]" />
            <span className="flex-1">
              {loadError ? `Couldn't load your evidence (${loadError}). ` : 'No evidence returned by the API yet. '}
              Showing preview data — changes here stay on this page.
            </span>
            <button type="button" onClick={reload} className="font-semibold text-[#2f5bea] hover:underline">Retry</button>
          </div>
        )}
        {source === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-24 text-xs text-[#667085]">
            <Loader2 size={16} className="animate-spin" />Loading evidence…
          </div>
        ) : children}
      </div>
    </AppLayout>
  );
}
