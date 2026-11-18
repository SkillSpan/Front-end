import { useEffect, useRef, useState } from "react";
import { getRoadmapResources, startRoadmapResource, updateRoadmapProgress } from "../../api";

export default function RoadmapLearningPanel({ action, onClose }) {
  const panelRef = useRef(null);
  const [resources, setResources] = useState([]);
  const [activity, setActivity] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState(0);
  const [evidence, setEvidence] = useState("");
  useEffect(() => {
    let live = true;
    panelRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    getRoadmapResources(action.id).then((response) => {
      if (!live) return;
      const data = response.data ?? response;
      setResources(data.resources ?? []);
      setActivity(data.activity);
      setProgress(data.activity?.progress_value ?? 0);
      setEvidence(data.activity?.completion_evidence ?? "");
    }).catch((e) => { if (live) setError(e.message || "Unable to load resources."); })
      .finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
  }, [action.id]);
  async function start(resource) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await startRoadmapResource(action.id, resource.id);
      const data = response.data ?? response;
      setActivity(data.activity);
      setNotice("Learning started. Use Open resource below; opening it does not mark this action complete.");
    } catch (e) { setError(e.message || "Unable to start learning."); }
    finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await updateRoadmapProgress(action.id, { progress_value: Number(progress), completion_evidence: evidence });
      setActivity(response.data ?? response);
      setNotice(Number(progress) === 100 ? "Evidence submitted as pending review. Your skill level has not changed." : "Progress saved. Your skill level has not changed.");
    } catch (e) { setError(e.message || "Unable to save progress."); }
    finally { setBusy(false); }
  }
  return <section ref={panelRef} aria-label="Learning resources" className="m-6 rounded-xl border border-slate-200 bg-white text-slate-900 p-6 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-4"><h3 className="font-semibold">{action.objective}</h3><button type="button" className="text-blue-700 underline" onClick={onClose}>Close resources</button></div>
    {busy && <p role="status">Loading…</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!busy && !error && resources.length === 0 && <p>No approved resource is currently available for this skill.</p>}
    {resources.map((resource) => <article key={resource.id} className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold">{resource.title}</h4>
      <p>{resource.provider} · {resource.language || "Language not specified"} · Free</p>
      <p>Suggested resource level: {resource.level ?? "Not specified"}/5. Choose a resource that matches your background.</p>
      {resource.prerequisites && <p>Prerequisites: {resource.prerequisites}</p>}
      <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={busy || Boolean(activity && activity.learning_resource_id !== resource.id)} onClick={() => start(resource)}>{activity?.learning_resource_id === resource.id ? "Resume learning" : "Start learning"}</button>
      {activity?.learning_resource_id === resource.id && /^https:\/\//i.test(resource.url) && <a className="inline-block ml-4 py-2 text-blue-700 underline" href={resource.url} target="_blank" rel="noopener noreferrer">Open resource ↗</a>}
    </article>)}
    {activity && <form onSubmit={save} className="space-y-3">
      <label className="block">Self-reported progress (%)<input className="ml-3 border rounded bg-white text-slate-900 p-2" type="number" min="0" max="100" step="1" required value={progress} onChange={(e) => setProgress(e.target.value)} /></label>
      <label className="block">Completion evidence<textarea className="block w-full border rounded bg-white text-slate-900 p-2" maxLength={5000} required={Number(progress) === 100} value={evidence} onChange={(e) => setEvidence(e.target.value)} /></label>
      <p>Progress is self-reported. Completion evidence requires review and does not automatically raise your skill level.</p>
      <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">Save progress</button>
      <p>Review status: {activity.verification_state}</p>
    </form>}
  </section>;
}
