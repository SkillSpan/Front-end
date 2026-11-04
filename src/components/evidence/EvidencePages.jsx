import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getSkillsMatrix } from '../../api';
import { fetchSkillOptions } from './lib/evidenceApi';
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

function useSkillOptions() {
  const [state, setState] = useState({ skills: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchSkillOptions()
      .then((skills) => { if (alive) setState({ skills, loading: false, error: '' }); })
      .catch(() => {
        if (alive) setState({ skills: [], loading: false, error: "Couldn't load the skills list." });
      });
    return () => { alive = false; };
  }, [attempt]);
  const retry = () => {
    setState({ skills: [], loading: true, error: '' });
    setAttempt((n) => n + 1);
  };
  return { ...state, retry };
}

// skill_id of every skill the learner added to My Skill Matrix, so the
// picker can list "My skills" first. Errors just mean no shortcut list.
function useMatrixSkillIds() {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => getSkillsMatrix())
      .then((raw) => {
        const rows = Array.isArray(raw) ? raw : (raw && (raw.data || raw.skills)) || [];
        const list = rows
          .map((row) => (row && (row.skill_id || (row.skill && row.skill.id))) || null)
          .filter((id) => id !== null)
          .map(String);
        if (alive) setIds(list);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return ids;
}

// POST /api/v1/evidence needs skill_id, and AddEvidence only knows a skill
// when one is passed in, so a new submission picks it here first.
function SkillPicker({ skills, loading, error, onRetry, myIds, value, onChange }) {
  const mine = skills.filter((s) => myIds.includes(String(s.id)));
  const others = skills.filter((s) => !myIds.includes(String(s.id)));
  return (
    <div className="mx-auto mb-5 max-w-[820px]">
      <div className="figma-card p-5 sm:p-7">
        <label htmlFor="evidence-skill" className="mb-2 block text-sm font-semibold text-[#101828]">
          Skill <span className="text-[#d92d20]">*</span>
        </label>
        <p className="m-0 mb-3 text-xs text-[#667085]">Which skill does this evidence prove?</p>
        {error ? (
          <div className="flex items-center gap-3 text-sm text-[#b42318]">
            {error}
            <button type="button" onClick={onRetry} className="font-semibold text-[var(--blue)] underline">Retry</button>
          </div>
        ) : (
          <select
            id="evidence-skill"
            value={value ? String(value.skillId) : ''}
            disabled={loading}
            onChange={(e) => {
              const picked = skills.find((s) => String(s.id) === e.target.value);
              onChange(picked ? { skill: picked.name, skillId: picked.id, category: picked.category || '', level: '' } : null);
            }}
            className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 text-sm text-[#101828] focus:border-[var(--blue)] focus:outline-none"
          >
            <option value="">{loading ? 'Loading skills...' : 'Choose a skill'}</option>
            {mine.length > 0 && (
              <optgroup label="My skills">
                {mine.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </optgroup>
            )}
            <optgroup label={mine.length ? 'All skills' : 'Skills'}>
              {others.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </optgroup>
          </select>
        )}
      </div>
    </div>
  );
}

export function AddEvidencePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { evidence, saveEvidence } = useEvidence();
  const { skills, loading, error, retry } = useSkillOptions();
  const myIds = useMatrixSkillIds();
  const [pickedSkill, setPickedSkill] = useState(null);
  const resubmitId = params.get('resubmit');
  const resubmitRecord = resubmitId ? evidence.find((item) => String(item.id) === resubmitId) || null : null;
  return (
    <EvidenceShell>
      {!resubmitRecord && (
        <SkillPicker
          skills={skills}
          loading={loading}
          error={error}
          onRetry={retry}
          myIds={myIds}
          value={pickedSkill}
          onChange={setPickedSkill}
        />
      )}
      <AddEvidence
        skill={pickedSkill}
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
