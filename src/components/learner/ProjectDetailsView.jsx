import { applyToProject, withdrawApplication, getProject, getRecommendations, submitRecommendationFeedback, unwrapApiData } from "../../api";
import { useEffect, useMemo, useState } from "react";

const TYPE_EMOJI = {
  "Practice Task": "🔧", "Simulation Project": "🧪", "Real Project": "🚀",
  Assessment: "📝", Capstone: "🎯",
};

function normalizeProject(raw) {
  const p = unwrapApiData(raw) || raw || {};
  const rawRequirements = p.required_skills ?? p.requiredSkills ?? p.requirements ?? [];
  const requirements = (Array.isArray(rawRequirements) ? rawRequirements : []).map((item) => ({
    skillName: item.skill_name ?? item.skill?.name ?? item.name ?? "Skill",
    minLevel: Number(item.minimum_required_level ?? item.minimum_level ?? item.minLevel ?? 1),
    maxLevel: 5,
    yourLevel: Number(item.current_level ?? item.your_level ?? item.yourLevel ?? 0),
    isCritical: Boolean(item.is_critical_entry ?? item.is_critical ?? item.isCritical),
  }));
  const rawOutcomes = p.learning_outcomes ?? p.learningOutcomes ?? [];
  const outcomes = Array.isArray(rawOutcomes) ? rawOutcomes : [];
  const dates = (value) => value ? new Date(value).toLocaleDateString() : "Not specified";
  const startDate = dates(p.start_date ?? p.startDate);
  const endDate = dates(p.end_date ?? p.endDate);
  return {
    ...p,
    id: p.id ?? p.project_id ?? p.uuid ?? null,
    title: p.title ?? p.name ?? "Untitled project",
    description: p.description ?? "",
    type: p.type ?? p.project_type ?? "Real Project",
    typeEmoji: TYPE_EMOJI[p.type ?? p.project_type] ?? "📌",
    difficulty: p.difficulty ?? "Not specified",
    matchScore: Number(p.match_score ?? p.matchScore ?? 0),
    estimatedHours: p.estimated_hours ?? p.estimatedHours ?? "Not specified",
    estimatedDuration: p.estimated_duration ?? p.duration ?? (p.duration_days ? `${p.duration_days} days` : "Not specified"),
    startDate, endDate,
    workMode: p.work_mode ?? p.workMode ?? "Not specified",
    sponsor: p.organization?.title ?? p.organization?.name ?? "Not specified",
    sponsorRole: p.role ?? p.career_role?.title ?? "Not specified",
    openSpots: p.capacity_state?.remaining ?? p.open_spots ?? null,
    totalSpots: p.capacity ?? null,
    deadline: dates(p.application_deadline ?? p.deadline),
    objectives: Array.isArray(p.objectives) ? p.objectives : (typeof p.objectives === "string" ? p.objectives.split(/\r?\n/).filter(Boolean) : []),
    requirements,
    learningOutcomes: outcomes.map((o) => typeof o === "string" ? { skill: o, gain: "Not specified", impact: "Not specified" } : ({ skill: o.skill ?? o.name ?? o.title ?? "Learning outcome", gain: o.gain ?? o.outcome ?? "Not specified", impact: o.impact ?? "Not specified" })),
    eligibilityNote: p.eligibility?.message ?? p.eligibility_reason ?? "Eligibility details were not provided by the server.",
    phase: p.roadmap_phase ?? p.phase ?? "—",
    phaseName: p.roadmap_phase_name ?? p.phase_name ?? "",
    tags: p.tags ?? [],
    application_id: p.application_id ?? p.application?.id ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Sk({ w = "100%", h = 14, r = 8 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r }} />;
}
function Bar({ pct, color, h = 5 }) {
  return (
    <div className="w-full rounded-full bg-[#f1f3fa] overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  );
}
function LevelDots({ current, required, max = 5 }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < current;
        const req = i < required;
        const color = filled ? (current >= required ? "#059669" : "#f59e0b") : req ? "rgba(239,68,68,0.3)" : "#e2e5ef";
        return <span key={i} className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />;
      })}
    </div>
  );
}
function StatusPill({ status }) {
  const cfg = {
    Submitted: { bg: "rgba(59,139,255,0.08)", border: "rgba(59,139,255,0.2)", dot: "#3b8bff", text: "#3b8bff" },
    "Under Review": { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dot: "#f59e0b", text: "#f59e0b" },
    Accepted: { bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)", dot: "#059669", text: "#059669" },
    Rejected: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", dot: "#ef4444", text: "#ef4444" },
    Withdrawn: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", dot: "#94a3b8", text: "#94a3b8" },
  };
  const c = cfg[status];
  return (
    <span
      className="inline-flex items-center gap-[5px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold px-[10px] py-[4px] rounded-full border"
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      <span className="w-[6px] h-[6px] rounded-full" style={{ background: c.dot }} />
      {status}
    </span>
  );
}
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[10px]">
      {children}
    </p>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT DETAILS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function DetailsScreen({ project, onApply, onBack, recState, onRecAction }) {
  const [expandObjectives, setExpandObjectives] = useState(true);
  const metFull = project.requirements.filter((r) => r.yourLevel >= r.minLevel).length;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#e8eaf0] px-[32px] py-[18px] shrink-0">
        <div className="flex items-center gap-[10px] mb-[14px]">
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] hover:text-[#3b8bff] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Projects
          </button>
          <span className="text-[#e2e5ef]">/</span>
          <span className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] line-clamp-1 max-w-[300px]">
            {project.title}
          </span>
        </div>

        <div className="flex items-start gap-[16px]">
          {/* Icon */}
          <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[22px] shrink-0 bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.15)]">
            {project.typeEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[12px]">
              <div>
                <div className="flex items-center gap-[6px] mb-[4px]">
                  <span className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.1)] px-[7px] py-[1px] rounded-full">
                    Project details
                  </span>
                  <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[#7c3aed] bg-[rgba(124,58,237,0.08)] px-[7px] py-[1px] rounded-full">
                    Phase {project.phase} · {project.phaseName}
                  </span>
                </div>
                <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#0a0b14] leading-tight">
                  {project.title}
                </h1>
              </div>
              {/* Rec actions */}
              {recState === "default" && (
                <div className="flex items-center gap-[6px] shrink-0">
                  <button
                    onClick={() => onRecAction("saved")}
                    className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[8px] bg-[#f1f3fa] hover:bg-[rgba(59,139,255,0.08)] hover:text-[#3b8bff] text-[#64748b] text-[11px] font-['Inter:Medium',sans-serif] font-medium transition-all border border-transparent hover:border-[rgba(59,139,255,0.2)]"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2h8v9L6 8.5 2 11V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                    Save
                  </button>
                  <button
                    onClick={() => onRecAction("hidden")}
                    className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[8px] bg-[#f1f3fa] hover:bg-[#e8eaf0] text-[#64748b] text-[11px] font-['Inter:Medium',sans-serif] font-medium transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2 2l8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Hide
                  </button>
                  <button
                    onClick={() => onRecAction("declined")}
                    className="flex items-center gap-[5px] px-[10px] py-[6px] rounded-[8px] bg-[#f1f3fa] hover:bg-[rgba(239,68,68,0.06)] hover:text-[#ef4444] text-[#64748b] text-[11px] font-['Inter:Medium',sans-serif] font-medium transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Not relevant
                  </button>
                </div>
              )}
              {recState === "saved" && (
                <div className="flex items-center gap-[6px] text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#3b8bff] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.2)] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 2h8v9L6 8.5 2 11V2z"
                      fill="#3b8bff"
                      stroke="#3b8bff"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Saved ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline opacity-60 hover:opacity-100">
                    Undo
                  </button>
                </div>
              )}
              {recState === "hidden" && (
                <div className="flex items-center gap-[6px] text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] bg-[#f1f3fa] border border-[#e8eaf0] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  Hidden ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline hover:text-[#64748b]">
                    Undo
                  </button>
                </div>
              )}
              {recState === "declined" && (
                <div className="flex items-center gap-[6px] text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#ef4444] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  Not relevant ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline opacity-60 hover:opacity-100">
                    Undo
                  </button>
                </div>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex items-center gap-[8px] mt-[8px] flex-wrap">
              {[
                { l: project.type, ic: "🔧" },
                { l: project.difficulty, ic: "⚡" },
                { l: project.estimatedHours, ic: "⏱" },
                { l: project.estimatedDuration, ic: "📅" },
                { l: project.workMode, ic: "💻" },
                { l: `${project.openSpots} spots left`, ic: "👥" },
              ].map((m) => (
                <span
                  key={m.l}
                  className="flex items-center gap-[4px] text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b] bg-[#f8f9fd] border border-[#eef0f8] px-[8px] py-[3px] rounded-full"
                >
                  <span>{m.ic}</span>
                  {m.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: main content */}
        <div className="flex-1 overflow-y-auto px-[32px] py-[24px] flex flex-col gap-[24px]">
          {/* Eligibility banner */}
          <div className="flex items-start gap-[10px] bg-[rgba(5,150,105,0.06)] border border-[rgba(5,150,105,0.18)] rounded-[12px] px-[16px] py-[12px]">
            <span className="text-[16px] mt-[1px]">✓</span>
            <div>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#059669] mb-[2px]">
                You are eligible for this project
              </p>
              <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.5]">
                {project.eligibilityNote}
              </p>
            </div>
          </div>

          {/* About */}
          <div>
            <SectionLabel>About this project</SectionLabel>
            <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.7]">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-[6px] mt-[10px]">
              {project.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-[#f1f3fa] border border-[#e8eaf0] px-[8px] py-[2px] rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div>
            <button
              onClick={() => setExpandObjectives(!expandObjectives)}
              className="flex items-center justify-between w-full mb-[10px]"
            >
              <SectionLabel>Project objectives</SectionLabel>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${expandObjectives ? "rotate-180" : ""}`}
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="#94a3b8"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {expandObjectives && (
              <ul className="flex flex-col gap-[8px]">
                {project.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-[10px]">
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold text-[#3b8bff] bg-[rgba(59,139,255,0.1)] shrink-0 mt-[1px]">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.6]">
                      {o}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Requirements */}
          <div>
            <SectionLabel>
              Skill requirements ({metFull}/{project.requirements.length} met)
            </SectionLabel>
            <div className="flex flex-col gap-[8px]">
              {project.requirements.map((r) => {
                const met = r.yourLevel >= r.minLevel;
                return (
                  <div
                    key={r.skillName}
                    className={`rounded-[10px] border p-[12px] flex items-center gap-[14px] ${met ? "border-[rgba(5,150,105,0.15)] bg-[rgba(5,150,105,0.03)]" : "border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.03)]"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[6px] mb-[5px]">
                        <span
                          className={`w-[6px] h-[6px] rounded-full shrink-0 ${met ? "bg-[#059669]" : "bg-[#ef4444]"}`}
                        />
                        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] text-[#0a0b14]">
                          {r.skillName}
                        </span>
                        {r.isCritical && (
                          <span className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] px-[5px] py-[1px] rounded-full">
                            Critical
                          </span>
                        )}
                      </div>
                      <LevelDots current={r.yourLevel} required={r.minLevel} max={r.maxLevel} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Your level</p>
                      <p
                        className={`text-[15px] font-['Inter:Bold',sans-serif] font-bold leading-tight ${met ? "text-[#059669]" : "text-[#ef4444]"}`}
                      >
                        L{r.yourLevel}
                      </p>
                      <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Min: L{r.minLevel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning outcomes */}
          <div>
            <SectionLabel>Learning outcomes</SectionLabel>
            <div className="grid grid-cols-2 gap-[8px]">
              {project.learningOutcomes.map((lo) => {
                const col = lo.impact === "High" ? "#059669" : lo.impact === "Medium" ? "#f59e0b" : "#94a3b8";
                return (
                  <div key={lo.skill} className="bg-[#fafbff] border border-[#eef0f8] rounded-[10px] p-[12px]">
                    <div className="flex items-center justify-between gap-[6px] mb-[4px]">
                      <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] text-[#0a0b14]">
                        {lo.skill}
                      </span>
                      <span className="text-[9px] font-['Inter:Medium',sans-serif] font-medium" style={{ color: col }}>
                        {lo.impact}
                      </span>
                    </div>
                    <p className="text-[11px] font-['Inter:Bold',sans-serif] font-bold" style={{ color: col }}>
                      {lo.gain}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <SectionLabel>Schedule & logistics</SectionLabel>
            <div className="grid grid-cols-3 gap-[8px]">
              {[
                { l: "Start", v: project.startDate },
                { l: "End", v: project.endDate },
                { l: "Application deadline", v: project.deadline },
                { l: "Work mode", v: project.workMode },
                { l: "Capacity", v: `${project.openSpots} of ${project.totalSpots} spots open` },
                { l: "Sponsor", v: project.sponsor },
              ].map((s) => (
                <div key={s.l} className="bg-[#f8f9fd] border border-[#eef0f8] rounded-[10px] p-[10px]">
                  <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[2px]">{s.l}</p>
                  <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsor */}
          <div className="bg-white border border-[#e8eaf0] rounded-[12px] p-[16px] flex items-center gap-[14px]">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center text-[16px] shrink-0">
              🏢
            </div>
            <div>
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14]">
                {project.sponsor}
              </p>
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                Mentored by a {project.sponsorRole}
              </p>
            </div>
          </div>
        </div>

        {/* Right sidebar: apply CTA */}
        <div className="w-[280px] shrink-0 border-l border-[#e8eaf0] bg-[#fafbff] px-[20px] py-[24px] flex flex-col gap-[16px] overflow-y-auto">
          {/* Match */}
          <div className="bg-white border border-[#e8eaf0] rounded-[14px] p-[16px] text-center">
            <div className="relative w-[80px] h-[80px] mx-auto mb-[10px]">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f3fa" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#matchGrad)"
                  strokeWidth="6"
                  strokeDasharray={`${(project.matchScore / 100) * 213.6} ${213.6}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
                <defs>
                  <linearGradient id="matchGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#3b8bff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[22px] text-[#059669] leading-none">
                  {project.matchScore}
                </span>
                <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">% match</span>
              </div>
            </div>
            <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.5]">
              Your skills align strongly with this project's requirements
            </p>
          </div>

          {/* Deadline urgency */}
          <div className="flex items-center gap-[8px] bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.2)] rounded-[10px] px-[12px] py-[10px]">
            <span className="text-[14px]">⏰</span>
            <div>
              <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#f59e0b]">
                Deadline: {project.deadline}
              </p>
              <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                {project.openSpots} spots remaining
              </p>
            </div>
          </div>

          {/* Apply CTA */}
          <button
            onClick={onApply}
            className="w-full py-[12px] rounded-[12px] text-[14px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white shadow-[0_4px_16px_rgba(59,139,255,0.3)] hover:shadow-[0_6px_20px_rgba(59,139,255,0.4)] transition-all"
            style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
          >
            Apply to Project →
          </button>
          <button className="w-full py-[10px] rounded-[12px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-white border border-[#e8eaf0] hover:bg-[#f8f9fd] transition-all">
            Save for Later
          </button>

          {/* Readiness impact */}
          <div className="bg-white border border-[#e8eaf0] rounded-[12px] p-[14px]">
            <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Readiness impact
            </p>
            {[
              { l: "Practical Experience", gain: "+4 pts", col: "#7c3aed" },
              { l: "Assessment Reliability", gain: "+2 pts", col: "#f59e0b" },
            ].map((ri) => (
              <div
                key={ri.l}
                className="flex items-center justify-between py-[5px] border-b border-[#f1f3fa] last:border-0"
              >
                <div className="flex items-center gap-[5px]">
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: ri.col }} />
                  <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b]">{ri.l}</span>
                </div>
                <span className="text-[11px] font-['Inter:Bold',sans-serif] font-bold" style={{ color: ri.col }}>
                  {ri.gain}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// APPLY FORM
// ═══════════════════════════════════════════════════════════════════════════════
function ApplyFormScreen({ project, onSubmit, onBack }) {
  const [motivation, setMotivation] = useState("");
  const [hours, setHours] = useState("");
  const [agree, setAgree] = useState(false);
  const valid = motivation.length >= 50 && hours !== "" && agree;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-[#e8eaf0] px-[32px] py-[16px] shrink-0">
        <div className="flex items-center gap-[10px] mb-[12px]">
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] hover:text-[#3b8bff] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Project
          </button>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.15)] flex items-center justify-center text-[15px] shrink-0">
            {project.typeEmoji}
          </div>
          <div>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Applying to</p>
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">
              {project.title}
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-[6px] mt-[14px]">
          {["Review details", "Application form", "Confirm & submit"].map((s, i) => (
            <div key={s} className="flex items-center gap-[6px] flex-1">
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold shrink-0 ${i === 1 ? "text-white" : i < 1 ? "bg-[#059669] text-white" : "bg-[#f1f3fa] text-[#94a3b8]"}`}
                style={i === 1 ? { background: "linear-gradient(135deg,#3b8bff,#7c3aed)" } : i < 1 ? {} : {}}
              >
                {i < 1 ? "✓" : i + 1}
              </div>
              <span
                className={`text-[11px] font-['Inter:Medium',sans-serif] font-medium ${i === 1 ? "text-[#0a0b14]" : "text-[#94a3b8]"}`}
              >
                {s}
              </span>
              {i < 2 && <div className={`flex-1 h-px ${i < 1 ? "bg-[#059669]" : "bg-[#e8eaf0]"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[24px]">
        <div className="max-w-[640px] flex flex-col gap-[20px]">
          <div>
            <label className="block text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[6px]">
              Why are you interested in this project? <span className="text-[#ef4444]">*</span>
            </label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={5}
              placeholder="Describe what attracts you to this project, how it aligns with your learning goals, and what you hope to achieve… (min. 50 characters)"
              className="w-full px-[14px] py-[12px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-['Inter:Regular',sans-serif] text-[#0a0b14] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b8bff] transition-colors resize-none leading-[1.6]"
            />
            <div className="flex justify-between mt-[4px]">
              <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Minimum 50 characters</p>
              <p
                className={`text-[10px] font-['Inter:Regular',sans-serif] ${motivation.length >= 50 ? "text-[#059669]" : "text-[#94a3b8]"}`}
              >
                {motivation.length} chars
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[6px]">
              Available hours per week <span className="text-[#ef4444]">*</span>
            </label>
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full h-[42px] px-[14px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-['Inter:Regular',sans-serif] text-[#0a0b14] focus:outline-none focus:border-[#3b8bff] transition-colors cursor-pointer"
            >
              <option value="">Select available hours…</option>
              <option value="4">4 h / week</option>
              <option value="8">8 h / week</option>
              <option value="12">12 h / week</option>
              <option value="16">16+ h / week</option>
            </select>
            <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[4px]">
              This project is estimated at {project.estimatedHours} total over {project.estimatedDuration}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[6px]">
              Relevant experience or prior work <span className="text-[#94a3b8] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Link to GitHub, portfolio, or briefly describe relevant experience…"
              className="w-full px-[14px] py-[12px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-['Inter:Regular',sans-serif] text-[#0a0b14] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b8bff] transition-colors resize-none"
            />
          </div>

          <div className="flex items-start gap-[10px] bg-[#f8f9fd] border border-[#eef0f8] rounded-[10px] px-[14px] py-[12px]">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-[2px] w-[14px] h-[14px] accent-[#3b8bff] cursor-pointer shrink-0"
            />
            <label
              htmlFor="agree"
              className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.55] cursor-pointer"
            >
              I confirm that I meet the skill requirements listed for this project and that the information I am
              providing is accurate. I understand that misrepresentation may result in application rejection.
            </label>
          </div>

          <div className="flex items-center gap-[10px] pt-[4px]">
            <button
              onClick={onBack}
              className="px-[20px] py-[11px] rounded-[11px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-white border border-[#e8eaf0] hover:bg-[#f8f9fd] transition-all"
            >
              Back
            </button>
            <button
              onClick={valid ? () => onSubmit({ motivation, availability: hours }) : undefined}
              className={`flex-1 py-[11px] rounded-[11px] text-[14px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white transition-all ${valid ? "shadow-[0_4px_16px_rgba(59,139,255,0.3)] hover:shadow-[0_6px_20px_rgba(59,139,255,0.4)]" : "opacity-40 cursor-not-allowed"}`}
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              Review Application →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// APPLY CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════════
function ApplyConfirmScreen({ project, applicationData, onConfirm, onBack }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleConfirm() {
    if (!project?.id || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await applyToProject(project.id, { application_data: applicationData || {} });
      onConfirm(unwrapApiData(response));
    } catch (error) {
      setSubmitError(error?.message || "Unable to submit the request to the server.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {submitError && <div role="alert" className="mx-8 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
      <div className="bg-white border-b border-[#e8eaf0] px-[32px] py-[16px] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-[5px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] hover:text-[#3b8bff] transition-colors mb-[12px]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to form
        </button>
        {/* Progress */}
        <div className="flex items-center gap-[6px]">
          {["Review details", "Application form", "Confirm & submit"].map((s, i) => (
            <div key={s} className="flex items-center gap-[6px] flex-1">
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold shrink-0 bg-[#059669] text-white`}
              >
                {i < 2 ? "✓" : "3"}
              </div>
              <span
                className={`text-[11px] font-['Inter:Medium',sans-serif] font-medium ${i === 2 ? "text-[#0a0b14]" : "text-[#94a3b8]"}`}
              >
                {s}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-[#059669]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[32px]">
        <div className="max-w-[600px] flex flex-col gap-[20px]">
          <div>
            <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#0a0b14] mb-[4px]">
              Review your application
            </h2>
            <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b]">
              Check the details below before submitting. Once submitted, you will receive a confirmation and the project
              owner will be notified.
            </p>
          </div>

          {/* Project card */}
          <div className="bg-white border border-[#e8eaf0] rounded-[14px] p-[18px] flex items-start gap-[14px]">
            <div className="w-[40px] h-[40px] rounded-[10px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center text-[16px] shrink-0">
              {project.typeEmoji}
            </div>
            <div className="flex-1">
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">
                {project.title}
              </p>
              <div className="flex items-center gap-[8px] mt-[4px] text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                <span>{project.type}</span>
                <span>·</span>
                <span>{project.estimatedDuration}</span>
                <span>·</span>
                <span>{project.sponsor}</span>
              </div>
            </div>
            <span className="text-[12px] font-['Inter:Bold',sans-serif] font-bold text-[#059669] bg-[rgba(5,150,105,0.08)] px-[8px] py-[3px] rounded-full">
              Eligible ✓
            </span>
          </div>

          {/* Application summary */}
          <div className="bg-white border border-[#e8eaf0] rounded-[14px] p-[18px] flex flex-col gap-[12px]">
            <SectionLabel>Your answers</SectionLabel>
            <div>
              <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[3px]">Motivation</p>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] italic leading-[1.6]">
                "This project directly addresses my Python and REST API skill gaps. I've been working through API design
                theory and want to apply it in a real codebase with proper auth and pagination…"
              </p>
            </div>
            <div className="h-px bg-[#f1f3fa]" />
            <div>
              <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[3px]">Availability</p>
              <p className="text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">8 h / week</p>
            </div>
          </div>

          {/* Validation summary */}
          <div className="bg-[rgba(5,150,105,0.04)] border border-[rgba(5,150,105,0.15)] rounded-[12px] p-[14px]">
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#059669] mb-[8px]">
              Pre-submission checks passed
            </p>
            {[
              "Eligible for this project",
              "Project is currently open",
              "No duplicate active application",
              "Capacity available (4 of 6 spots open)",
              "Application deadline not reached",
            ].map((c) => (
              <div key={c} className="flex items-center gap-[7px] py-[3px]">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="5" fill="#059669" />
                  <path
                    d="M3 5.5l2 2 3-3"
                    stroke="white"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b]">{c}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={onBack}
              className="px-[20px] py-[11px] rounded-[11px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-white border border-[#e8eaf0] hover:bg-[#f8f9fd] transition-all"
            >
              Edit application
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-[8px] py-[11px] rounded-[11px] text-[14px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white shadow-[0_4px_16px_rgba(59,139,255,0.3)] hover:shadow-[0_6px_20px_rgba(59,139,255,0.4)] transition-all disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              {submitting && (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M6.5 1.5C9.8 1.5 12.5 4.2 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION STATUS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function AppStatusScreen({ project, status, onWithdraw, onBack }) {
  const timeline = [
    { label: "Application submitted", date: "22 Sep 2026, 14:32", done: true, active: false },
    {
      label: "Under review",
      date: status !== "Submitted" ? "23 Sep 2026" : "Pending",
      done: status !== "Submitted",
      active: status === "Under Review",
    },
    {
      label: "Decision",
      date: ["Accepted", "Rejected"].includes(status) ? "25 Sep 2026" : "Pending",
      done: ["Accepted", "Rejected"].includes(status),
      active: false,
    },
    { label: "Project start", date: project.startDate, done: false, active: false },
  ];
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-[#e8eaf0] px-[32px] py-[16px] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-[5px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] hover:text-[#3b8bff] transition-colors mb-[6px]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Projects
        </button>
        <div className="flex items-center justify-between">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#0a0b14]">Application Status</h2>
          <StatusPill status={status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[24px]">
        <div className="max-w-[600px] flex flex-col gap-[20px]">
          {/* Status hero */}
          {status === "Submitted" && (
            <div className="bg-[rgba(59,139,255,0.05)] border border-[rgba(59,139,255,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(59,139,255,0.12)] border border-[rgba(59,139,255,0.2)] flex items-center justify-center text-[18px] shrink-0">
                📤
              </div>
              <div>
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#3b8bff] mb-[4px]">
                  Application submitted successfully
                </h3>
                <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.6]">
                  Your application has been received. The project owner at {project.sponsor} will review it and respond
                  before the project start date.
                </p>
              </div>
            </div>
          )}
          {status === "Accepted" && (
            <div
              className="relative overflow-hidden rounded-[16px] p-[22px]"
              style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}
            >
              <div
                className="absolute -top-6 right-0 w-32 h-32 rounded-full opacity-15 pointer-events-none"
                style={{ background: "radial-gradient(circle,#059669,transparent 70%)" }}
              />
              <div className="relative flex items-start gap-[14px]">
                <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(5,150,105,0.2)] border border-[rgba(5,150,105,0.3)] flex items-center justify-center text-[18px] shrink-0">
                  🎉
                </div>
                <div>
                  <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#34d399] mb-[4px]">
                    Congratulations — you've been accepted!
                  </h3>
                  <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)] leading-[1.6]">
                    Your application was approved by {project.sponsor}. The project starts on {project.startDate}. Check
                    your notifications for onboarding details.
                  </p>
                </div>
              </div>
            </div>
          )}
          {status === "Rejected" && (
            <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center text-[18px] shrink-0">
                📋
              </div>
              <div>
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#ef4444] mb-[4px]">
                  Application not accepted this time
                </h3>
                <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.6]">
                  The project team reviewed all applications and selected candidates with stronger relevant experience
                  for the available spots. Your profile and roadmap remain unchanged.
                </p>
              </div>
            </div>
          )}
          {status === "Under Review" && (
            <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center text-[18px] shrink-0">
                🔍
              </div>
              <div>
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#f59e0b] mb-[4px]">
                  Your application is under review
                </h3>
                <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.6]">
                  The {project.sponsor} team is reviewing your application. You will be notified when a decision is
                  made, typically within 2–3 business days.
                </p>
              </div>
            </div>
          )}

          {/* Project */}
          <div className="bg-white border border-[#e8eaf0] rounded-[12px] p-[16px] flex items-center gap-[12px]">
            <div className="w-[36px] h-[36px] rounded-[9px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center text-[14px] shrink-0">
              {project.typeEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14] truncate">
                {project.title}
              </p>
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                {project.type} · {project.estimatedDuration} · {project.sponsor}
              </p>
            </div>
            <div className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] shrink-0">
              Ref #APP-20260922
            </div>
          </div>

          {/* Timeline */}
          <div>
            <SectionLabel>Application timeline</SectionLabel>
            <div className="flex flex-col gap-[0]">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-[14px]">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 ${step.done ? "border-[#059669] bg-[#059669]" : step.active ? "border-[#f59e0b] bg-[rgba(245,158,11,0.1)]" : "border-[#e2e5ef] bg-white"}`}
                    >
                      {step.done ? (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path
                            d="M1.5 4.5l2 2L7.5 2"
                            stroke="white"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : step.active ? (
                        <span className="w-[6px] h-[6px] rounded-full bg-[#f59e0b]" />
                      ) : (
                        <span className="w-[6px] h-[6px] rounded-full bg-[#e2e5ef]" />
                      )}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-[2px] h-[28px] ${step.done ? "bg-[#059669]" : "bg-[#e2e5ef]"}`} />
                    )}
                  </div>
                  <div className="pb-[16px] flex-1">
                    <p
                      className={`text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold ${step.done ? "text-[#0a0b14]" : step.active ? "text-[#f59e0b]" : "text-[#94a3b8]"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {(status === "Submitted" || status === "Under Review") && (
            <div className="bg-[#f8f9fd] border border-[#eef0f8] rounded-[12px] p-[16px] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[2px]">
                  Withdraw application
                </p>
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                  You can withdraw while the application is under review
                </p>
              </div>
              <button
                onClick={onWithdraw}
                className="px-[14px] py-[8px] rounded-[9px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#ef4444] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.05)] hover:bg-[rgba(239,68,68,0.1)] transition-all"
              >
                Withdraw
              </button>
            </div>
          )}
          {status === "Rejected" && (
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-[6px] w-full py-[11px] rounded-[11px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              Browse other projects →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL CONFIRM
// ═══════════════════════════════════════════════════════════════════════════════
function WithdrawConfirmScreen({ project, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  async function handleConfirm() {
    const applicationId = project?.application_id ?? project?.applicationId;
    if (!applicationId || confirming) {
      setWithdrawError("The server did not provide the current application ID. No application was withdrawn.");
      return;
    }
    setConfirming(true);
    setWithdrawError("");
    try {
      await withdrawApplication(applicationId);
      onConfirm();
    } catch (error) {
      setWithdrawError(error?.message || "Unable to withdraw the application from the server.");
    } finally {
      setConfirming(false);
    }
  }
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[480px] w-full bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        {withdrawError && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{withdrawError}</div>}
        <div className="h-[4px] bg-[#ef4444]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] flex items-center justify-center text-[18px] shrink-0">
              ⚠
            </div>
            <div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14] mb-[4px]">
                Withdraw your application?
              </h3>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.6]">
                You are withdrawing your application to{" "}
                <strong className="font-['Inter:Semi_Bold',sans-serif] text-[#0a0b14]">{project.title}</strong>. This
                action will be recorded and you will need to re-apply if you change your mind (subject to availability).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[6px]">
              Reason for withdrawal <span className="text-[#94a3b8] font-normal">(optional)</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-[40px] px-[12px] bg-[#f8f9fd] border border-[#eef0f8] rounded-[9px] text-[13px] font-['Inter:Regular',sans-serif] text-[#0a0b14] focus:outline-none focus:border-[#3b8bff] transition-colors cursor-pointer"
            >
              <option value="">Select a reason…</option>
              <option value="schedule">Schedule conflict</option>
              <option value="scope">Project scope changed</option>
              <option value="found-other">Found a more suitable project</option>
              <option value="not-ready">Not ready for this project yet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={onCancel}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-[#f1f3fa] border border-[#e8eaf0] hover:bg-[#e8eaf0] transition-all"
            >
              Keep application
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] transition-all disabled:opacity-70"
            >
              {confirming && (
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M5.5 1.5C8 1.5 10.5 3.8 10.5 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {confirming ? "Withdrawing…" : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWN STATE
// ═══════════════════════════════════════════════════════════════════════════════
function WithdrawnScreen({ project, onBack }) {
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full flex flex-col items-center text-center gap-[20px]">
        <div className="w-[72px] h-[72px] rounded-[20px] bg-[#f1f3fa] border border-[#e8eaf0] flex items-center justify-center text-[28px]">
          📤
        </div>
        <div>
          <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#0a0b14] mb-[6px]">
            Application withdrawn
          </h3>
          <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.7]">
            Your application to{" "}
            <strong className="font-['Inter:Semi_Bold',sans-serif] text-[#0a0b14]">{project.title}</strong> has been
            withdrawn. This has been recorded on{" "}
            <strong className="font-['Inter:Semi_Bold',sans-serif]">22 Sep 2026 at 15:04</strong>. You may re-apply if
            spots become available before the deadline.
          </p>
        </div>
        <div className="flex items-center gap-[6px]">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-[6px] px-[20px] py-[10px] rounded-[11px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
          >
            Browse more projects
          </button>
          <button
            onClick={onBack}
            className="px-[16px] py-[10px] rounded-[11px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-white border border-[#e8eaf0] hover:bg-[#f8f9fd] transition-all"
          >
            View project
          </button>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// FAILURE STATES
// ═══════════════════════════════════════════════════════════════════════════════
function IneligibleScreen({ project, onBack }) {
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[560px] w-full bg-white border border-[rgba(239,68,68,0.2)] rounded-[20px] overflow-hidden">
        <div className="h-[4px] bg-[#ef4444]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] flex items-center justify-center text-[20px] shrink-0">
              🚫
            </div>
            <div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#ef4444] mb-[4px]">
                Not eligible for this project
              </h3>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.65]">
                Your current skill levels do not meet the minimum requirements for{" "}
                <strong className="font-['Inter:Semi_Bold',sans-serif] text-[#0a0b14]">{project.title}</strong>. No
                application has been submitted.
              </p>
            </div>
          </div>
          <div className="bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.1)] rounded-[10px] p-[14px]">
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Unmet requirements
            </p>
            {project.requirements
              .filter((r) => r.yourLevel < r.minLevel)
              .map((r) => (
                <div
                  key={r.skillName}
                  className="flex items-center justify-between py-[5px] border-b border-[rgba(239,68,68,0.06)] last:border-0"
                >
                  <div className="flex items-center gap-[7px]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#ef4444] shrink-0" />
                    <span className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14]">
                      {r.skillName}
                    </span>
                  </div>
                  <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                    L{r.yourLevel} / required L{r.minLevel}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onBack}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              View Career Roadmap →
            </button>
            <button
              onClick={onBack}
              className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-[#f1f3fa] hover:bg-[#e8eaf0] transition-all"
            >
              Browse projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function DuplicateScreen({ project, onViewStatus, onBack }) {
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full bg-white border border-[rgba(245,158,11,0.25)] rounded-[20px] overflow-hidden">
        <div className="h-[4px] bg-[#f59e0b]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center text-[20px] shrink-0">
              ⚠
            </div>
            <div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#f59e0b] mb-[4px]">
                You already have an active application
              </h3>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.65]">
                A duplicate application cannot be created. Your existing active application to{" "}
                <strong className="font-['Inter:Semi_Bold',sans-serif] text-[#0a0b14]">{project.title}</strong> is still
                open.
              </p>
            </div>
          </div>
          <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-[10px] p-[14px] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] mb-[1px]">
                Application #APP-20260915
              </p>
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                Submitted 15 Sep 2026 · Under Review
              </p>
            </div>
            <StatusPill status="Under Review" />
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onViewStatus}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              View existing application →
            </button>
            <button
              onClick={onBack}
              className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] bg-[#f1f3fa] hover:bg-[#e8eaf0] transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ExpiredFullScreen({ project, variant, onBack }) {
  const isExpired = variant === "expired";
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="h-[4px] bg-[#94a3b8]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-[12px] bg-[rgba(148,163,184,0.1)] border border-[rgba(148,163,184,0.2)] flex items-center justify-center text-[20px] shrink-0">
              {isExpired ? "🔒" : "👥"}
            </div>
            <div>
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#64748b] mb-[4px]">
                {isExpired ? "Application period has closed" : "Project is fully booked"}
              </h3>
              <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.65]">
                {isExpired
                  ? `The application deadline for ${project.title} passed on ${project.deadline}. This project is no longer accepting applications.`
                  : `All ${project.totalSpots} spots for ${project.title} have been filled. No further applications are being accepted.`}
              </p>
            </div>
          </div>
          <div className="bg-[#f8f9fd] border border-[#eef0f8] rounded-[10px] px-[14px] py-[10px] flex items-center justify-between text-[12px]">
            <span className="font-['Inter:Regular',sans-serif] text-[#94a3b8]">
              {isExpired ? "Deadline" : "Capacity"}
            </span>
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#64748b]">
              {isExpired ? project.deadline : `${project.totalSpots}/${project.totalSpots} spots taken`}
            </span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <button
              onClick={onBack}
              className="w-full py-[10px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              Browse other projects →
            </button>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] text-center">
              Similar projects may be available — check the projects list
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProjectDetailsView({ projectId, onBack }) {
  const [rawProject, setRawProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");
  const project = useMemo(() => rawProject ? normalizeProject(rawProject) : null, [rawProject]);
  useEffect(() => {
    let active = true;
    if (!projectId) {
      setLoadError("No project was selected for details.");
      setLoadingProject(false);
      return () => { active = false; };
    }
    setLoadingProject(true);
    setLoadError("");
    getProject(projectId).then((data) => {
      if (active) setRawProject(data);
    }).catch((error) => {
      if (active) setLoadError(error?.message || "Unable to load project details from the server.");
    }).finally(() => { if (active) setLoadingProject(false); });
    return () => { active = false; };
  }, [projectId]);
  const [screen, setScreen] = useState("details");
  const [appStatus, setAppStatus] = useState("Submitted");
  const [applicationData, setApplicationData] = useState({});
  const [activeApplicationId, setActiveApplicationId] = useState(null);
  const [recommendationId, setRecommendationId] = useState(null);
  const [recState, setRecState] = useState("default");
  const [feedbackError, setFeedbackError] = useState("");
  useEffect(() => {
    let active = true;
    getRecommendations({ page: 1, perPage: 50 }).then((payload) => {
      const value = unwrapApiData(payload);
      const rows = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.recommendations) ? value.recommendations : [];
      const match = rows.find((row) => String(row.project_id ?? row.project?.id ?? row.project?.project_id ?? "") === String(projectId));
      if (active && match) setRecommendationId(match.id ?? match.recommendation_id ?? null);
    }).catch(() => { if (active) setRecommendationId(null); });
    return () => { active = false; };
  }, [projectId]);
  const handleRecommendationAction = async (action) => {
    if (action === "default") { setRecState("default"); return; }
    if (!recommendationId) { setFeedbackError("No recommendation record exists for this project on the server. The change was not saved."); return; }
    const eventType = action === "saved" ? "save" : action === "hidden" ? "hide" : "decline";
    setFeedbackError("");
    try {
      await submitRecommendationFeedback(recommendationId, { event_type: eventType });
      setRecState(action);
    } catch (error) { setFeedbackError(error?.message || "Unable to save your recommendation feedback."); }
  };
  const renderContent = () => {
    switch (screen) {
      case "details":
        return (
          <DetailsScreen
            project={project}
            onApply={() => setScreen("apply-form")}
            onBack={onBack}
            recState={recState}
            onRecAction={handleRecommendationAction}
          />
        );
      case "apply-form":
        return (
          <ApplyFormScreen
            project={project}
            onSubmit={(answers) => { setApplicationData(answers); setScreen("apply-confirm"); }}
            onBack={() => setScreen("details")}
          />
        );
      case "apply-confirm":
        return (
          <ApplyConfirmScreen
            project={project}
            applicationData={applicationData}
            onConfirm={(application) => {
              setActiveApplicationId(application?.id ?? application?.application_id ?? application?.application?.id ?? null);
              setScreen("app-status");
              setAppStatus(application?.status ?? "Submitted");
            }}
            onBack={() => setScreen("apply-form")}
          />
        );
      case "app-status":
        return (
          <AppStatusScreen
            project={project}
            status={appStatus}
            onWithdraw={() => setScreen("withdraw-confirm")}
            onBack={() => setScreen("details")}
          />
        );
      case "withdraw-confirm":
        return (
          <WithdrawConfirmScreen
            project={{ ...project, application_id: activeApplicationId ?? project.application_id }}
            onConfirm={() => setScreen("withdrawn")}
            onCancel={() => setScreen("app-status")}
          />
        );
      case "withdrawn":
        return <WithdrawnScreen project={project} onBack={() => setScreen("details")} />;
      default:
        return null;
    }
  };
  if (loadingProject) return <div role="status" className="p-8 text-sm text-slate-600">Loading project details…</div>;
  if (loadError || !project) return <div className="p-8" role="alert"><p className="mb-3 text-sm text-red-700">{loadError || "The service did not return project details."}</p><button className="rounded-lg border px-4 py-2" onClick={onBack}>Back to Projects</button></div>;
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f1f3fa]">
      {feedbackError && <p role="alert" className="px-4 py-2 text-sm text-red-700 bg-red-50">{feedbackError}</p>}
      <div className="flex-1 overflow-hidden bg-[#f1f3fa]">{renderContent()}</div>

   </div>
  );
}
