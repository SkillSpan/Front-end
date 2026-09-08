import React, { useRef, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, Link2, Loader2, Paperclip, Zap } from "lucide-react";
import { SEED_EVIDENCE, TYPE_META, getAfterApproval, validateFile, validateUrl } from "../lib/evidenceMeta";
import { CategoryIcon, SkillIcon, TypeIcon } from "./Shared";

const EVIDENCE_TYPES = [
  ["github", "GitHub Repository", "Public repository with actual code"],
  ["live", "Live Deployment", "Working deployment URL"],
  ["design", "Design File", "Figma / Adobe XD link"],
  ["document", "Document", "PDF, DOC, or DOCX (max 20 MB)"],
];

export default function AddEvidence({ skill = SEED_EVIDENCE[0], resubmitRecord = null, onCancel = () => {}, onSubmit = () => {} }) {
  const isResubmit = Boolean(resubmitRecord);
  const activeSkill = resubmitRecord || skill || SEED_EVIDENCE[0];
  const [mode, setMode] = useState(isResubmit && resubmitRecord.type === "document" ? "file" : "url");
  const [evidenceType, setEvidenceType] = useState(isResubmit ? resubmitRecord.type : "live");
  const [url, setUrl] = useState(isResubmit && resubmitRecord.type !== "document" ? resubmitRecord.url : "");
  const [file, setFile] = useState(isResubmit && resubmitRecord.type === "document" ? { name: resubmitRecord.url, size: 0 } : null);
  const [description, setDescription] = useState(isResubmit ? resubmitRecord.description : "");
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);
  const afterApproval = getAfterApproval(activeSkill.confidence);

  function chooseFile(nextFile) { setFile(nextFile || null); setErrors((current) => ({ ...current, file: "" })); }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return; // guard against double submit
    const nextErrors = {};
    if (mode === "url") { const error = validateUrl(evidenceType, url); if (error) nextErrors.url = error; }
    else { const error = validateFile(file); if (error) nextErrors.file = error; }
    if (description.trim().length < 50) nextErrors.description = "Describe what this evidence demonstrates (at least 50 characters).";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        id: isResubmit ? resubmitRecord.id : null,
        skill: activeSkill.skill,
        skillId: activeSkill.skillId,
        category: activeSkill.category,
        type: mode === "file" ? "document" : evidenceType,
        url: mode === "file" ? file.name : url.trim(),
        evidence_file: mode === "file" ? file : undefined,
        description: description.trim(),
        confidence: activeSkill.confidence,
        level: activeSkill.level,
        status: "pending",
      });
      // On success the parent navigates away — nothing else to do here.
    } catch (error) {
      // Keep whatever the learner typed; just surface the problem near the button.
      setSubmitError(error?.message || "Something went wrong while submitting. Please try again.");
      if (error?.fieldErrors) setErrors((current) => ({ ...current, ...error.fieldErrors }));
    } finally {
      setIsSubmitting(false);
    }
  }
  const canSubmit = (mode === "url" ? url.trim().length > 5 : Boolean(file)) && description.trim().length >= 50;

  return <div className="flex min-h-screen flex-col bg-[#f7f8fb] lg:flex-row">
    <aside className="w-full shrink-0 bg-[#101b3d] px-6 py-7 text-white lg:min-h-screen lg:w-[280px]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#aab7d6]">Evidencing skill</p>
      <div className="mb-6 flex items-center gap-3"><SkillIcon skill={activeSkill.skill} /><div><p className="m-0 text-sm font-semibold">{activeSkill.skill}</p><p className="m-0 mt-1 flex items-center gap-1.5 text-xs text-[#98a2b3]"><CategoryIcon dark />{activeSkill.category}</p></div></div>
      <div className="mb-6 grid grid-cols-2 gap-2"><div className="rounded-lg border border-[#2b3c69] bg-[#17254d] p-3"><p className="m-0 text-[9px] uppercase tracking-[.1em] text-[#98a2b3]">Current level</p><p className="m-0 mt-1 text-sm font-semibold">Intermediate</p><div className="mt-2 flex gap-1" aria-label="Intermediate level"><span className="h-1.5 w-1.5 rounded-full bg-[#4f8cff]"/><span className="h-1.5 w-1.5 rounded-full bg-[#4f8cff]"/><span className="h-1.5 w-1.5 rounded-full bg-[#4f8cff]"/><span className="h-1.5 w-1.5 rounded-full bg-[#4f8cff]"/><span className="h-1.5 w-1.5 rounded-full bg-[#303957]"/></div></div><div className="rounded-lg border border-[#2b3c69] bg-[#17254d] p-3"><p className="m-0 text-[9px] uppercase tracking-[.1em] text-[#98a2b3]">Confidence</p><p className="m-0 mt-1 text-sm font-semibold">{activeSkill.confidence}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#303957]"><div className="h-full rounded-full bg-[#4f8cff]" style={{ width: `${activeSkill.confidence}%` }}/></div></div></div>
      <div className="mb-7 rounded-lg border border-[#1d6b55]/50 bg-[#123d39] p-3.5"><p className="m-0 flex items-center gap-1.5 text-xs font-semibold text-[#8df0c4]"><Zap size={13} fill="currentColor" />If Approved — Confidence Impact</p><p className="m-0 mt-2 text-base font-semibold text-white">{activeSkill.confidence}% <span className="text-[#98a2b3]">→</span> ~93-100%</p><p className="m-0 mt-1 text-[10px] leading-4 text-[#9de4c6]/70">Approved evidence contributes to skill confidence per BR-07.</p></div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#aab7d6]">Supported evidence (BR-03)</p>
      <div className="space-y-2">{EVIDENCE_TYPES.map(([type, label, sublabel]) => <div key={type} className="flex items-center gap-3 rounded-[7px] border border-[#2b3c69] bg-[#17254d] px-3 py-2.5 text-[#d0d5dd] shadow-[0_1px_2px_rgba(0,0,0,.12)]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[#222b50] text-[#cbd5ff]"><TypeIcon type={type} size={16} /></span><div className="min-w-0"><p className="m-0 text-[11px] font-semibold text-[#f2f4ff]">{label}</p><p className="m-0 mt-0.5 truncate text-[9px] leading-4 text-[#8f98bf]">{sublabel}</p></div></div>)}</div>
      <button type="button" onClick={onCancel} className="figma-link-btn mt-10 inline-flex items-center gap-1.5 px-1 py-0.5 text-xs font-medium text-[#aab7d6] transition hover:text-white"><ChevronLeft size={14} />Back to Skill Matrix</button>
    </aside>

    <section className="min-w-0 flex-1 px-5 py-7 sm:px-10 lg:px-14 lg:py-10"><div className="mx-auto max-w-[820px]">
      <div className="mb-8 flex items-start justify-between gap-4"><div><h1 className="figma-title text-[18px]">{isResubmit ? "Resubmit Evidence" : "Add Evidence"}</h1><p className="figma-subtitle">{isResubmit ? "Update your evidence based on the reviewer’s notes, then resubmit for review." : `Submit proof of your ${activeSkill.skill} proficiency — a reviewer will verify and update your confidence score.`}</p></div></div>
      <form onSubmit={handleSubmit} className="figma-card p-5 sm:p-7">
        <div className="mb-7 flex items-center justify-between border-b border-[#f0f2f5] pb-5"><div><h2 className="m-0 text-sm font-semibold text-[#101828]">Evidence details</h2><p className="m-0 mt-1 text-xs text-[#667085]">Choose one way to share your work.</p></div><span className="text-[11px] text-[#98a2b3]">Required fields *</span></div>
        <div className="mb-7 inline-flex rounded-lg border border-[#e4e7ec] bg-white p-0" role="tablist" aria-label="Evidence submission method">{[["url", "Reference URL", Link2], ["file", "File Upload", Paperclip]].map(([key, label, Icon]) => <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)} className={`inline-flex min-h-9 items-center gap-2 rounded-md px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${mode === key ? "bg-[#101010] text-white" : "text-[#667085] hover:text-[#344054]"}`}><Icon size={14} />{label}</button>)}</div>
        {mode === "url" && <><div className="mb-7"><p className="mb-3 text-xs font-semibold text-[#344054]">Evidence type</p><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{Object.entries(TYPE_META).map(([type, meta]) => { const active = evidenceType === type; return <button key={type} type="button" aria-pressed={active} onClick={() => { setEvidenceType(type); setErrors((current) => ({ ...current, url: "" })); }} className={`group flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg border px-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${active ? "border-[#101010] bg-[#eef3ff]" : "border-[#e4e7ec] bg-white hover:border-[#b8c7f7] hover:bg-[#f9fbff]"}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-white text-[#2f5bea]" : "bg-[#f2f4f7] text-[#667085]"}`}><TypeIcon type={type} size={18} /></span><span className={`text-[11px] font-medium ${active ? "text-[#2348c5]" : "text-[#344054]"}`}>{meta.label}</span></button>; })}</div></div><div className="mb-7"><label htmlFor="evidence-url" className="mb-2 block text-xs font-semibold text-[#344054]">GitHub Repository URL <span className="text-[#d92d20]">*</span></label><input id="evidence-url" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setErrors((current) => ({ ...current, url: "" })); }} placeholder={TYPE_META[evidenceType]?.placeholder} className={`figma-input h-11 px-3 text-sm ${errors.url ? "border-[#f04438]" : ""}`} />{errors.url && <p className="mt-2 text-xs text-[#b42318]">{errors.url}</p>}</div></>}
        {mode === "file" && <div className="mb-7"><label htmlFor="evidence-file" className="mb-2 block text-xs font-semibold text-[#344054]">Upload document <span className="text-[#d92d20]">*</span></label><div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && fileInputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files?.[0]); }} className={`flex min-h-[184px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]/40 ${errors.file ? "border-[#f04438] bg-[#fffbfa]" : isDragging ? "border-[#2f5bea] bg-[#eef3ff]" : "border-[#d0d5dd] bg-[#fcfcfd] hover:border-[#2f5bea] hover:bg-[#f9fbff]"}`}><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff] text-[#2f5bea]"><Paperclip size={18} /></span><p className="m-0 text-sm font-medium text-[#344054]">{file ? file.name : "Drag & drop or click to upload"}</p><p className="m-0 mt-1 text-xs text-[#98a2b3]">PDF, DOC, DOCX — max 20 MB</p></div><input ref={fileInputRef} id="evidence-file" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />{errors.file && <p className="mt-2 text-xs text-[#b42318]">{errors.file}</p>}</div>}
        <div className="mb-6"><div className="flex items-center justify-between gap-3"><label htmlFor="evidence-description" className="mb-2 block text-xs font-semibold text-[#344054]">Evidence description <span className="text-[#d92d20]">*</span></label><span className="text-[11px] text-[#98a2b3]">{description.length} / min 50 chars</span></div><textarea id="evidence-description" value={description} onChange={(event) => { setDescription(event.target.value); setErrors((current) => ({ ...current, description: "" })); }} rows={5} placeholder="Describe what this evidence demonstrates — what you built, the technologies used, your specific contribution, and the scale or complexity of the project..." className={`figma-input resize-y px-3 py-3 text-sm leading-6 ${errors.description ? "border-[#f04438]" : ""}`} />{errors.description ? <p className="mt-2 text-xs text-[#b42318]">{errors.description}</p> : <p className="mt-2 text-[11px] text-[#98a2b3]">Tip: Include technologies, scale, your specific role, and any measurable outcomes.</p>}</div>
        <div className="mb-7 flex gap-2.5 rounded-lg border border-[#d9e5ff] bg-[#f5f8ff] px-3.5 py-3 text-xs leading-5 text-[#344054]"><Check size={15} className="mt-0.5 shrink-0 text-[#2f5bea]" /><p className="m-0"><span className="font-semibold">AC-01 / BR-01:</span> This evidence will be linked to your {activeSkill.skill} skill record and associated with your learner profile. New submissions enter <code>pending_review</code> status (BR-04).</p></div>
        {submitError && <div className="mb-5 flex items-start gap-2 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3.5 py-3 text-xs leading-5 text-[#b42318]"><AlertTriangle size={15} className="mt-0.5 shrink-0" /><p className="m-0">{submitError}</p></div>}
        <div className="flex flex-col-reverse gap-2.5 border-t border-[#f0f2f5] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={isSubmitting} className="figma-btn-secondary">Cancel</button><button type="submit" disabled={!canSubmit || isSubmitting} className={`figma-btn-primary ${!canSubmit || isSubmitting ? "opacity-40" : ""}`}>{isSubmitting ? <><Loader2 size={14} className="animate-spin" />Submitting…</> : <>{isResubmit ? "Resubmit for review" : "Submit for review"}<ChevronLeft className="rotate-180" size={14} /></>}</button></div>
      </form>
    </div></section>
  </div>;
}
