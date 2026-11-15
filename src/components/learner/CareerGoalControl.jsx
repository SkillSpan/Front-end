import { useRef, useState } from 'react';

export default function CareerGoalControl({ role, currentGoalId, onSelect, onCalculate, busy = false }) {
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const isCurrent = currentGoalId != null && String(currentGoalId) === String(role.id);

  async function act(calculate) {
    if (pending.current || busy) return;
    pending.current = true;
    setWorking(true);
    setNotice('');
    setError('');
    try {
      const result = await (calculate ? onCalculate(role) : onSelect(role));
      setNotice(calculate
        ? result?.analysisReady ? 'Career analysis updated.' : 'The calculation completed, but its results could not be refreshed. Reload the page to try again.'
        : result?.analysisReady
          ? 'Career goal saved. Your analysis is available in Career Journey.'
          : 'Career goal saved. No analysis is available yet. Calculate it when your required skill assessments are ready.');
    } catch (failure) {
      setError(failure?.code === 'ASSESSMENT_INCOMPLETE'
        ? 'Complete assessments for all skills required by this role before calculating your career analysis.'
        : failure?.message || (calculate ? 'Career analysis could not be calculated. Your saved goal is unchanged.' : 'The career goal update could not be confirmed. Refresh and try again.'));
    } finally {
      pending.current = false;
      setWorking(false);
    }
  }

  return (
    <section aria-label="Career goal" className="my-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
      <p className="mb-3 text-slate-700">Your career goal is used for Career Journey and project matching.</p>
      <div className="flex flex-wrap gap-3">
        {onSelect && <button type="button" disabled={busy || working || isCurrent} onClick={() => act(false)} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {isCurrent ? 'Current Career Goal' : working ? 'Saving career goal…' : 'Set as Career Goal'}
        </button>}
        {isCurrent && onCalculate && <button type="button" disabled={busy || working} onClick={() => act(true)} className="rounded-lg border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-700 disabled:opacity-50">Calculate Career Analysis</button>}
      </div>
      {notice && <p role="status" className="mt-3 text-green-800">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </section>
  );
}
