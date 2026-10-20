import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useEvidence } from './EvidenceContext';
import EvidenceShell from './EvidenceShell';
import EvidenceStatus from './EvidenceStatus';
import AddEvidence from './AddEvidence';
import EvidenceDetail from './EvidenceDetail';
import ReviewerDashboard from './ReviewerDashboard';
import ErrorState from './ErrorState';
import './evidence.css';

export function EvidenceStatusPage() {
  const navigate = useNavigate();
  const { evidence, source, reload } = useEvidence();
  if (source === 'error') {
    return <EvidenceShell><ErrorState onRetry={reload} onContactSupport={() => window.alert('Please contact SkillSpan support.')} /></EvidenceShell>;
  }
  return (
    <EvidenceShell>
      <EvidenceStatus
        evidence={evidence}
        onAdd={(id) => navigate(id ? `/evidence/add?resubmit=${encodeURIComponent(id)}` : '/evidence/add')}
        onOpen={(id) => navigate(`/evidence/${encodeURIComponent(id)}`)}
      />
    </EvidenceShell>
  );
}

export function AddEvidencePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { evidence, saveEvidence } = useEvidence();
  const resubmitId = params.get('resubmit');
  const resubmitRecord = resubmitId ? evidence.find((item) => String(item.id) === resubmitId) || null : null;
  return (
    <EvidenceShell>
      <AddEvidence
        skill={evidence[0]}
        resubmitRecord={resubmitRecord}
        onCancel={() => navigate('/evidence')}
        onSubmit={async (payload) => { await saveEvidence(payload); navigate('/evidence'); }}
      />
    </EvidenceShell>
  );
}

export function EvidenceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { authUser } = useAuth();
  const { evidence, source } = useEvidence();
  const record = evidence.find((item) => String(item.id) === id);
  if (!record && source !== 'loading') return <Navigate to="/evidence" replace />;
  return (
    <EvidenceShell>
      {record && (
        <EvidenceDetail
          record={record}
          learnerName={authUser?.name || 'Learner'}
          onBack={() => navigate('/evidence')}
          onResubmit={(recordId) => navigate(`/evidence/add?resubmit=${encodeURIComponent(recordId)}`)}
        />
      )}
    </EvidenceShell>
  );
}

// Reviewer workspace keeps its own full-screen layout (queue sidebar +
// decision panel) exactly as designed, so it is not wrapped in AppLayout.
export function ReviewerPage() {
  const { evidence, source, decideEvidence } = useEvidence();
  if (source === 'loading') return null;
  if (!evidence.length) {
    return <div className="evidence-scope flex min-h-screen items-center justify-center text-sm text-[#667085]">No evidence to review.</div>;
  }
  return (
    <div className="evidence-scope">
      <ReviewerDashboard evidence={evidence} onDecide={decideEvidence} />
    </div>
  );
}
