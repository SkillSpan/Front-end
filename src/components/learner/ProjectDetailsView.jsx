import StateBlock from "../common/StateBlock";
import { useProjectsText } from "../../i18n/useProjectsText";
import { applyToProject, withdrawApplication, getApplications, getProject, getRecommendations, submitRecommendationFeedback, unwrapApiData } from "../../api";
import { useEffect, useMemo, useState } from "react";

// Same type labels as the projects list (ProjectsView): the API sends enums.
function projectTypeLabel(type) {
  if (type === "simulation") return "Simulation Project";
  if (type === "company_sponsored" || !type) return "Real Project";
  return type;
}
// Same difficulty labels as the projects list (the API sends a number).
function difficultyLabel(value) {
  if (value === null || value === undefined || value === "") return "Not specified";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (n <= 1) return "Beginner";
  if (n <= 3) return "Intermediate";
  if (n === 4) return "Advanced";
  return "Expert";
}
// A value the server actually sent (not null/undefined/empty/"Not specified").
const hasValue = (v) => v !== null && v !== undefined && v !== "" && v !== "-" && v !== "Not specified" && !(typeof v === "number" && Number.isNaN(v));

function normalizeProject(raw) {
  const p = unwrapApiData(raw) || raw || {};
  const rawRequirements = p.required_skills ?? p.requiredSkills ?? p.requirements ?? [];
  // The API sends eligibility as { eligible, reasons[], skill_failures[{skill_id, learner_level}] }.
  const elig = p.eligibility && typeof p.eligibility === "object" ? p.eligibility : null;
  const failures = Array.isArray(elig?.skill_failures) ? elig.skill_failures : [];
  const requirements = (Array.isArray(rawRequirements) ? rawRequirements : []).map((item) => {
    const failure = failures.find((f) => String(f.skill_id) === String(item.skill_id ?? item.skill?.id ?? ""));
    const rawLevel = item.current_level ?? item.your_level ?? item.yourLevel ?? failure?.learner_level ?? null;
    const minLevel = Number(item.minimum_required_level ?? item.minimum_level ?? item.minLevel ?? 1);
    const yourLevel = rawLevel === null || rawLevel === undefined || rawLevel === "" ? null : Number(rawLevel);
    return {
      skillName: item.skill_name ?? item.skill?.name ?? item.name ?? "Skill",
      minLevel,
      maxLevel: 5,
      yourLevel,
      // true / false when known; null when the server has no level for this skill
      met: yourLevel !== null ? yourLevel >= minLevel : failure ? false : null,
      isCritical: Boolean(item.is_critical_entry ?? item.is_critical ?? item.isCritical),
    };
  });
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
    type: projectTypeLabel(p.type ?? p.project_type),
    difficulty: difficultyLabel(p.difficulty),
    matchScore: Number(p.match_score ?? p.matchScore ?? 0),
    estimatedHours: p.estimated_hours ?? p.estimatedHours ?? "Not specified",
    estimatedDuration: p.estimated_duration ?? p.duration ?? (p.duration_days ? `${p.duration_days} days` : "Not specified"),
    startDate, endDate,
    workMode: p.work_mode ?? p.workMode ?? "Not specified",
    sponsor: p.organization?.title ?? p.organization?.name ?? "Not specified",
    sponsorRole: p.role ?? p.career_role?.title ?? "Not specified",
    // API: capacity_state = { capacity, seats_taken, seats_remaining, full }
    openSpots: p.capacity_state?.seats_remaining ?? p.capacity_state?.remaining ?? p.open_spots ?? null,
    totalSpots: p.capacity_state?.capacity ?? p.capacity ?? null,
    isFull: Boolean(p.capacity_state?.full),
    isPastDeadline: (() => { const dl = p.application_deadline ?? p.deadline; if (!dl) return false; const t = new Date(`${String(dl).slice(0, 10)}T23:59:59`); return !Number.isNaN(t.getTime()) && t < new Date(); })(),
    eligible: elig ? (elig.eligible === true ? true : elig.eligible === false ? false : null) : (typeof p.eligibility === "string" ? /^eligible$/i.test(p.eligibility) : null),
    eligibilityReasons: Array.isArray(elig?.reasons) ? elig.reasons.filter(Boolean) : [],
    deadline: dates(p.application_deadline ?? p.deadline),
    objectives: Array.isArray(p.objectives) ? p.objectives : (typeof p.objectives === "string" ? p.objectives.split(/\r?\n/).filter(Boolean) : []),
    requirements,
    learningOutcomes: outcomes.map((o) => typeof o === "string" ? { skill: o, gain: "Not specified", impact: "Not specified" } : ({ skill: o.skill ?? o.name ?? o.title ?? "Learning outcome", gain: o.gain ?? o.outcome ?? "Not specified", impact: o.impact ?? "Not specified" })),
    eligibilityNote: elig?.message ?? (Array.isArray(elig?.reasons) && elig.reasons.length ? elig.reasons.join(" ") : null) ?? p.eligibility_reason ?? "",
    phase: p.roadmap_phase ?? p.phase ?? "-",
    phaseName: p.roadmap_phase_name ?? p.phase_name ?? "",
    tags: p.tags ?? [],
    application_id: p.application_id ?? p.application?.id ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
// eslint-disable-next-line no-unused-vars -- retained Vercel page variant
function Sk({ w = "100%", h = 14, r = 8 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r }} />;
}
// eslint-disable-next-line no-unused-vars -- retained Vercel page variant
function Bar({ pct, color, h = 5 }) {
  return (
    <div className="w-full rounded-full bg-[#f0f6fc] overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  );
}
// API statuses: submitted, shortlisted, accepted, rejected, waitlisted, withdrawn.
const APP_STATUS_LABEL = {
  submitted: "Submitted",
  shortlisted: "Under Review",
  under_review: "Under Review",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};
function appStatusLabel(status) {
  if (!status) return "Submitted";
  return APP_STATUS_LABEL[String(status).toLowerCase()] ?? String(status);
}
function formatDateTime(value, withTime = false) {
  if (!value) return null;
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  return withTime
    ? t.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : t.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }) {
  const { L } = useProjectsText();
  const cfg = {
    Submitted: { bg: "rgba(22,103,224,0.08)", border: "rgba(22,103,224,0.2)", dot: "#1667e0", text: "#1667e0" },
    "Under Review": { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dot: "#f9a01f", text: "#f9a01f" },
    Accepted: { bg: "rgba(21,146,90,0.08)", border: "rgba(21,146,90,0.2)", dot: "#15925a", text: "#15925a" },
    Rejected: { bg: "rgba(209,59,59,0.08)", border: "rgba(209,59,59,0.2)", dot: "#d13b3b", text: "#d13b3b" },
    Withdrawn: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", dot: "#98a1ba", text: "#98a1ba" },
    Waitlisted: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", dot: "#f9a01f", text: "#9a5b00" },
  };
  // Unknown or lower-case API values used to crash here (cfg[status] undefined).
  const c = cfg[status] ?? cfg[appStatusLabel(status)] ?? cfg.Submitted;
  return (
    <span
      className="inline-flex items-center gap-[5px] text-[12px] font-semibold px-[10px] py-[4px] rounded-full border"
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      {L(appStatusLabel(status))}
    </span>
  );
}
function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[10px]">
      {children}
    </p>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT DETAILS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function DetailsScreen({ project, onApply, onBack, recState, onRecAction }) {
  const { L } = useProjectsText();
  const [expandObjectives, setExpandObjectives] = useState(true);
  const metFull = project.requirements.filter((r) => r.met === true).length;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#e4ebf5] px-[32px] max-sm:px-[16px] py-[20px] shrink-0">
        <div className="flex items-center gap-[10px] mb-[14px]">
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] text-[12px] font-medium text-[#98a1ba] hover:text-[#1667e0] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {L("Projects")}
          </button>
          <span className="text-[#e2e5ef]">/</span>
          <span className="text-[12px] font-normal text-[#6b7593] line-clamp-1 max-w-[300px] rtl:text-right" dir="auto">
            {project.title}
          </span>
        </div>

        <div className="flex items-start gap-[16px]">
          {/* Icon */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[12px] max-sm:flex-col">
              <div>
                <div className="flex items-center gap-[6px] mb-[6px] flex-wrap">
                  <span className="text-[11px] font-semibold text-[#1667e0] bg-[rgba(22,103,224,0.1)] px-[7px] py-[1px] rounded-full">
                    {L("Project details")}
                  </span>
                  <span className="text-[11px] font-medium text-[#5b5bd6] bg-[rgba(91,91,214,0.08)] px-[7px] py-[1px] rounded-full">
                    {hasValue(project.phase) ? L("Phase {n}", { n: project.phase }) : L("Roadmap phase not specified")}{project.phaseName ? ` · ${project.phaseName}` : ""}
                  </span>
                </div>
                <h1 className="font-semibold text-[24px] max-sm:text-[20px] tracking-[-0.02em] text-[#05103d] leading-[1.25] rtl:text-right" dir="auto">
                  {project.title}
                </h1>
              </div>
              {/* Rec actions */}
              {recState === "default" && (
                <div className="flex items-center gap-[6px] shrink-0">
                  <button
                    onClick={() => onRecAction("saved")}
                    className="h-[32px] px-[12px] rounded-[8px] bg-white border border-[#d7deea] text-[#3b4565] text-[12.5px] font-medium hover:bg-[#f7fafe] hover:border-[#c3cee0] transition-colors"
                  >
                    {L("Save")}
                  </button>
                  <button
                    onClick={() => onRecAction("hidden")}
                    className="h-[32px] px-[12px] rounded-[8px] bg-white border border-[#d7deea] text-[#3b4565] text-[12.5px] font-medium hover:bg-[#f7fafe] hover:border-[#c3cee0] transition-colors"
                  >
                    {L("Hide")}
                  </button>
                  <button
                    onClick={() => onRecAction("declined")}
                    className="h-[32px] px-[12px] rounded-[8px] bg-white border border-[#d7deea] text-[#3b4565] text-[12.5px] font-medium hover:bg-[#f7fafe] hover:border-[#c3cee0] transition-colors"
                  >
                    {L("Not relevant")}
                  </button>
                </div>
              )}
              {recState === "saved" && (
                <div className="flex items-center gap-[6px] text-[11px] font-medium text-[#1667e0] bg-[rgba(22,103,224,0.08)] border border-[rgba(22,103,224,0.2)] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  Saved ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline opacity-60 hover:opacity-100">
                    {L("Undo")}
                  </button>
                </div>
              )}
              {recState === "hidden" && (
                <div className="flex items-center gap-[6px] text-[11px] font-medium text-[#98a1ba] bg-[#f0f6fc] border border-[#e4ebf5] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  Hidden ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline hover:text-[#6b7593]">
                    {L("Undo")}
                  </button>
                </div>
              )}
              {recState === "declined" && (
                <div className="flex items-center gap-[6px] text-[11px] font-medium text-[#d13b3b] bg-[rgba(209,59,59,0.06)] border border-[rgba(209,59,59,0.15)] px-[10px] py-[6px] rounded-[8px] shrink-0">
                  Not relevant ·{" "}
                  <button onClick={() => onRecAction("default")} className="underline opacity-60 hover:opacity-100">
                    {L("Undo")}
                  </button>
                </div>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex items-center gap-[8px] mt-[8px] flex-wrap">
              {[
                { l: L(project.type), ic: "🔧" },
                { l: L(project.difficulty), ic: "⚡" },
                { l: /^\d+(\.\d+)?$/.test(String(project.estimatedHours)) ? L("{n} h", { n: project.estimatedHours }) : null, ic: "⏱" },
                { l: (() => { const m = String(project.estimatedDuration ?? "").match(/^\s*(\d+)\s*weeks?\s*$/i); return m ? L("{n} weeks", { n: m[1] }) : project.duration_days ? L("{n} weeks", { n: Math.max(1, Math.round(project.duration_days / 7)) }) : project.estimatedDuration; })(), ic: "📅" },
                { l: L(project.workMode), ic: "💻" },
                { l: hasValue(project.openSpots) ? L("{n} spots left", { n: project.openSpots }) : null, ic: "👥" },
              ].filter((m) => hasValue(m.l) && !/\b(null|undefined|NaN)\b/.test(String(m.l))).map((m) => (
                <span
                  key={m.l}
                  className="flex items-center text-[12px] font-medium text-[#3b4565] bg-white border border-[#e4ebf5] px-[10px] py-[4px] rounded-full"
                >
                  {m.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden max-lg:flex-col max-lg:overflow-y-auto">
        {/* Left: main content */}
        <div className="flex-1 overflow-y-auto max-lg:overflow-visible max-lg:flex-none px-[32px] max-sm:px-[16px] py-[24px] flex flex-col gap-[24px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Eligibility banner: from the server's eligibility result */}
          {(() => {
            const tone = project.eligible === true
              ? { box: "bg-[rgba(21,146,90,0.06)] border-[rgba(21,146,90,0.18)]", title: "text-[#15925a]", text: L("You are eligible for this project") }
              : project.eligible === false
                ? { box: "bg-[rgba(209,59,59,0.05)] border-[rgba(209,59,59,0.18)]", title: "text-[#b42828]", text: L("You are not eligible for this project yet") }
                : { box: "bg-white border-[#e4ebf5]", title: "text-[#3b4565]", text: L("Eligibility has not been evaluated yet") };
            return (
              <div className={`flex items-start gap-[10px] border rounded-[12px] px-[16px] py-[12px] ${tone.box}`}>
                <div>
                  <p className={`font-semibold text-[13px] mb-[2px] ${tone.title}`}>{tone.text}</p>
                  {project.eligibilityNote && (
                    <p className="text-[12px] font-normal text-[#6b7593] leading-[1.5]" dir="auto">{project.eligibilityNote}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* About */}
          <div>
            <SectionLabel>{L("About this project")}</SectionLabel>
            <p className="text-[13px] font-normal text-[#6b7593] leading-[1.7] rtl:text-right" dir="auto">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-[6px] mt-[10px]">
              {project.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-medium text-[#6b7593] bg-[#f0f6fc] border border-[#e4ebf5] px-[8px] py-[2px] rounded-full"
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
              <SectionLabel>{L("Project objectives")}</SectionLabel>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${expandObjectives ? "rotate-180" : ""}`}
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="#98a1ba"
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
                    <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold text-[#1667e0] bg-[rgba(22,103,224,0.1)] shrink-0 mt-[1px]">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-normal text-[#6b7593] leading-[1.6] rtl:text-right" dir="auto">
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
              {L("Skill requirements ({a}/{b} met)", { a: metFull, b: project.requirements.length })}
            </SectionLabel>
            <div className="flex flex-col gap-[8px]">
              {project.requirements.map((r) => {
                const met = r.met;
                return (
                  <div
                    key={r.skillName}
                    className={`rounded-[10px] border p-[12px] flex items-center gap-[14px] ${met === true ? "border-[rgba(21,146,90,0.15)] bg-[rgba(21,146,90,0.03)]" : met === false ? "border-[rgba(209,59,59,0.18)] bg-[rgba(209,59,59,0.03)]" : "border-[#e4ebf5] bg-white"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[6px] mb-[5px]">
                        <span className="font-semibold text-[12px] text-[#05103d] rtl:text-right" dir="auto">
                          {r.skillName}
                        </span>
                        {r.isCritical && (
                          <span className="text-[11px] font-semibold text-[#9a5b00] bg-[#fff3df] border border-[#f7d9a8] px-[5px] py-[1px] rounded-full">
                            {L("Critical")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-normal text-[#98a1ba]">{L("Your level")}</p>
                      <p
                        className={`text-[15px] font-bold leading-tight ${met === true ? "text-[#15925a]" : met === false ? "text-[#d13b3b]" : "text-[#6b7593]"}`}
                      >
                        {r.yourLevel === null ? L("Not assessed") : `L${r.yourLevel}`}
                      </p>
                      <p className="text-[11px] font-normal text-[#98a1ba]">{L("Min: L{n}", { n: r.minLevel })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning outcomes */}
          {project.learningOutcomes.length > 0 && (
          <div>
            <SectionLabel>{L("Learning outcomes")}</SectionLabel>
            <div className="grid grid-cols-2 gap-[8px]">
              {project.learningOutcomes.map((lo) => {
                const col = lo.impact === "High" ? "#15925a" : lo.impact === "Medium" ? "#f9a01f" : "#98a1ba";
                return (
                  <div key={lo.skill} className="bg-[#f7fafe] border border-[#eef0f8] rounded-[10px] p-[12px]">
                    <div className="flex items-center justify-between gap-[6px] mb-[4px]">
                      <span className="font-semibold text-[12px] text-[#05103d] rtl:text-right" dir="auto">
                        {lo.skill}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: col }}>
                        {L(lo.impact)}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: col }}>
                      {L(lo.gain)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Schedule */}
          <div>
            <SectionLabel>{L("Schedule & logistics")}</SectionLabel>
            <div className="grid grid-cols-3 gap-[8px]">
              {[
                { l: L("Start"), v: project.startDate },
                { l: L("End"), v: project.endDate },
                { l: L("Application deadline"), v: project.deadline },
                { l: L("Work mode"), v: L(project.workMode) },
                { l: L("Capacity"), v: hasValue(project.openSpots) && hasValue(project.totalSpots) ? L("{n} of {m} spots open", { n: project.openSpots, m: project.totalSpots }) : hasValue(project.openSpots) ? L("{n} spots open", { n: project.openSpots }) : L("Not specified") },
                { l: L("Sponsor"), v: project.sponsor },
              ].map((s) => (
                <div key={s.l} className="bg-[#f7fafe] border border-[#eef0f8] rounded-[10px] p-[10px]">
                  <p className="text-[11px] font-normal text-[#98a1ba] mb-[2px]">{L(s.l)}</p>
                  <p className="text-[12px] font-semibold text-[#05103d]">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsor */}
          {hasValue(project.sponsor) && (
          <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[16px] flex items-center gap-[14px]">
            <div>
              <p className="font-semibold text-[13px] text-[#05103d] rtl:text-right" dir="auto">
                {project.sponsor}
              </p>
              {hasValue(project.sponsorRole) && (
                <p className="text-[11px] font-normal text-[#98a1ba]">
                  {L("Mentored by a {role}", { role: project.sponsorRole })}
                </p>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Right sidebar: apply CTA */}
        <div className="w-[300px] max-lg:w-full shrink-0 border-l max-lg:border-l-0 max-lg:border-t border-[#e4ebf5] bg-[#f7fafe] px-[20px] max-sm:px-[16px] py-[24px] flex flex-col gap-[16px] overflow-y-auto max-lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Match */}
          <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[16px] text-center">
            <div className="relative w-[80px] h-[80px] mx-auto mb-[10px]">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f0f6fc" strokeWidth="6" />
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
                    <stop offset="0%" stopColor="#15925a" />
                    <stop offset="100%" stopColor="#1667e0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-[22px] text-[#15925a] leading-none">
                  {project.matchScore}
                </span>
                <span className="text-[11px] font-normal text-[#98a1ba]">{L("% match")}</span>
              </div>
            </div>
            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.5]">
              {project.matchScore >= 75
                ? L("Your skills align strongly with this project's requirements")
                : project.matchScore >= 50
                  ? L("Your skills partly match this project's requirements")
                  : L("Some required skills still need work for this project")}
            </p>
          </div>

          {/* Deadline urgency */}
          <div className="flex items-center gap-[8px] bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.2)] rounded-[10px] px-[12px] py-[10px]">
            <div>
              <p className="text-[11px] font-semibold text-[#9a5b00]">
                {L("Deadline: {d}", { d: project.deadline })}
              </p>
              {hasValue(project.openSpots) && (
                <p className="text-[11px] font-normal text-[#98a1ba]">
                  {L("{n} spots remaining", { n: project.openSpots })}
                </p>
              )}
            </div>
          </div>

          {/* Apply CTA */}
          <button
            onClick={onApply}
            className="w-full h-[44px] rounded-[10px] text-[14px] font-semibold text-white bg-[#1667e0] hover:bg-[#0f52ba] transition-colors"
          >
            {project.isPastDeadline ? L("Applications closed") : project.isFull ? L("Project is full") : project.eligible === false ? L("Check eligibility") : L("Apply to Project")}
          </button>
          <button
            type="button"
            onClick={() => onRecAction?.("saved")}
            className="w-full h-[42px] rounded-[10px] text-[13px] font-medium text-[#3b4565] bg-white border border-[#d7deea] hover:bg-[#f7fafe] transition-colors"
          >
            {recState === "saved" ? L("Saved") : L("Save for Later")}
          </button>

          {/* Readiness impact: only when the server sends it (no invented numbers). */}
          {Array.isArray(project.readiness_impact) && project.readiness_impact.length > 0 && (
            <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[14px]">
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[8px]">
                {L("Readiness impact")}
              </p>
              {project.readiness_impact.map((ri, i) => (
                <div
                  key={ri.component ?? ri.label ?? i}
                  className="flex items-center justify-between py-[5px] border-b border-[#f0f6fc] last:border-0"
                >
                  <span className="text-[11px] font-normal text-[#6b7593]">{ri.label ?? ri.component ?? L("Readiness")}</span>
                  {hasValue(ri.gain ?? ri.points) && (
                    <span className="text-[11px] font-bold text-[#1667e0]">{ri.gain ?? `+${ri.points} pts`}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// APPLY FORM
// ═══════════════════════════════════════════════════════════════════════════════
function ApplyFormScreen({ project, onSubmit, onBack }) {
  const { L } = useProjectsText();
  const [motivation, setMotivation] = useState("");
  const [hours, setHours] = useState("");
  const [agree, setAgree] = useState(false);
  const valid = motivation.length >= 50 && hours !== "" && agree;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-[#e4ebf5] px-[32px] py-[16px] shrink-0">
        <div className="flex items-center gap-[10px] mb-[12px]">
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] text-[12px] font-medium text-[#98a1ba] hover:text-[#1667e0] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100">
              <path
                d="M8 2L4 6l4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {L("Back to Project")}
          </button>
        </div>
        <div className="flex items-center gap-[8px]">
          <div>
            <p className="text-[11px] font-normal text-[#98a1ba]">{L("Applying to")}</p>
            <p className="font-semibold text-[14px] text-[#05103d] rtl:text-right" dir="auto">
              {project.title}
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-[6px] mt-[14px]">
          {["Review details", "Application form", "Confirm & submit"].map((s, i) => (
            <div key={s} className="flex items-center gap-[6px] flex-1">
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${i === 1 ? "text-white" : i < 1 ? "bg-[#15925a] text-white" : "bg-[#f0f6fc] text-[#98a1ba]"}`}
                style={i === 1 ? { background: "#1667e0" } : i < 1 ? {} : {}}
              >
                {i + 1}
              </div>
              <span
                className={`text-[11px] font-medium ${i === 1 ? "text-[#05103d]" : "text-[#98a1ba]"}`}
              >
                {s}
              </span>
              {i < 2 && <div className={`flex-1 h-px ${i < 1 ? "bg-[#15925a]" : "bg-[#e4ebf5]"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[24px]">
        <div className="max-w-[640px] flex flex-col gap-[20px]">
          <div>
            <label className="block text-[12px] font-semibold text-[#05103d] mb-[6px]">
              {L("Why are you interested in this project?")} <span className="text-[#d13b3b]">*</span>
            </label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={5}
              placeholder="Describe what attracts you to this project, how it aligns with your learning goals, and what you hope to achieve… (min. 50 characters)"
              className="w-full px-[14px] py-[12px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-normal text-[#05103d] placeholder:text-[#98a1ba] focus:outline-none focus:border-[#1667e0] transition-colors resize-none leading-[1.6]"
            />
            <div className="flex justify-between mt-[4px]">
              <p className="text-[11px] font-normal text-[#98a1ba]">{L("Minimum 50 characters")}</p>
              <p
                className={`text-[11px] font-normal ${motivation.length >= 50 ? "text-[#15925a]" : "text-[#98a1ba]"}`}
              >
                {L("{n} chars", { n: motivation.length })}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#05103d] mb-[6px]">
              {L("Available hours per week")} <span className="text-[#d13b3b]">*</span>
            </label>
            <select
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full h-[42px] px-[14px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-normal text-[#05103d] focus:outline-none focus:border-[#1667e0] transition-colors cursor-pointer"
            >
              <option value="">{L("Select available hours…")}</option>
              <option value="4">4 h / week</option>
              <option value="8">8 h / week</option>
              <option value="12">12 h / week</option>
              <option value="16">16+ h / week</option>
            </select>
            <p className="text-[11px] font-normal text-[#98a1ba] mt-[4px]">
              This project is estimated at {project.estimatedHours} total over {project.estimatedDuration}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#05103d] mb-[6px]">
              {L("Relevant experience or prior work")} <span className="text-[#98a1ba] font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={L("Link to GitHub, portfolio, or briefly describe relevant experience\u2026")}
              className="w-full px-[14px] py-[12px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-normal text-[#05103d] placeholder:text-[#98a1ba] focus:outline-none focus:border-[#1667e0] transition-colors resize-none"
            />
          </div>

          <div className="flex items-start gap-[10px] bg-[#f7fafe] border border-[#eef0f8] rounded-[10px] px-[14px] py-[12px]">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-[2px] w-[14px] h-[14px] accent-[#1667e0] cursor-pointer shrink-0"
            />
            <label
              htmlFor="agree"
              className="text-[12px] font-normal text-[#6b7593] leading-[1.55] cursor-pointer"
            >
              {L("I confirm that I meet the skill requirements listed for this project and that the information I am providing is accurate. I understand that misrepresentation may result in application rejection.")}
            </label>
          </div>

          <div className="flex items-center gap-[10px] pt-[4px]">
            <button
              onClick={onBack}
              className="px-[20px] py-[11px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-white border border-[#e4ebf5] hover:bg-[#f7fafe] transition-all"
            >
              {L("Back")}
            </button>
            <button
              onClick={valid ? () => onSubmit({ motivation, availability: hours }) : undefined}
              className={`flex-1 py-[11px] rounded-[10px] text-[14px] font-semibold text-white transition-all ${valid ? "" : "opacity-40 cursor-not-allowed"}`}
              style={{ background: "#1667e0" }}
            >
              {L("Review Application")}
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
function ApplyConfirmScreen({ project, applicationData, recommendationId, onConfirm, onBack }) {
  const { L } = useProjectsText();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  async function handleConfirm() {
    if (!project?.id || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await applyToProject(project.id, {
        application_data: applicationData || {},
        ...(recommendationId ? { recommendation_id: Number(recommendationId) } : {}),
      });
      onConfirm(unwrapApiData(response));
    } catch (error) {
      setSubmitError(error?.message || "Unable to submit the request to the server.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {submitError && <div role="alert" className="mx-[32px] max-sm:mx-[16px] mt-[16px] rounded-[10px] border border-[#f3c9c9] bg-[#fdf3f3] px-[14px] py-[10px] text-[13px] text-[#b42828]">{L(submitError)}</div>}
      <div className="bg-white border-b border-[#e4ebf5] px-[32px] py-[16px] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-[5px] text-[12px] font-medium text-[#98a1ba] hover:text-[#1667e0] transition-colors mb-[12px]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100">
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {L("Back to form")}
        </button>
        {/* Progress */}
        <div className="flex items-center gap-[6px]">
          {["Review details", "Application form", "Confirm & submit"].map((s, i) => (
            <div key={s} className="flex items-center gap-[6px] flex-1">
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 bg-[#15925a] text-white`}
              >
                {i < 2 ? i + 1 : "3"}
              </div>
              <span
                className={`text-[11px] font-medium ${i === 2 ? "text-[#05103d]" : "text-[#98a1ba]"}`}
              >
                {s}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-[#15925a]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[32px]">
        <div className="max-w-[600px] flex flex-col gap-[20px]">
          <div>
            <h2 className="font-bold text-[20px] text-[#05103d] mb-[4px]">
              {L("Review your application")}
            </h2>
            <p className="text-[13px] font-normal text-[#6b7593]">
              {L("Check the details below before submitting. Once submitted, you will receive a confirmation and the project owner will be notified.")}
            </p>
          </div>

          {/* Project card */}
          <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[18px] flex items-start gap-[14px]">
            <div className="flex-1">
              <p className="font-semibold text-[14px] text-[#05103d] rtl:text-right" dir="auto">
                {project.title}
              </p>
              <div className="flex items-center gap-[8px] mt-[4px] text-[11px] font-normal text-[#98a1ba]">
                <span>{project.type}</span>
                <span>·</span>
                <span>{project.estimatedDuration}</span>
                <span>·</span>
                <span>{project.sponsor}</span>
              </div>
            </div>
            <span className="text-[12px] font-bold text-[#15925a] bg-[rgba(21,146,90,0.08)] px-[8px] py-[3px] rounded-full">
              {L("Eligible")}
            </span>
          </div>

          {/* Application summary */}
          <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[18px] flex flex-col gap-[12px]">
            <SectionLabel>{L("Your answers")}</SectionLabel>
            <div>
              <p className="text-[11px] font-normal text-[#98a1ba] mb-[3px]">{L("Motivation")}</p>
              <p className="text-[13px] font-normal text-[#6b7593] italic leading-[1.6]">
                "This project directly addresses my Python and REST API skill gaps. I've been working through API design
                theory and want to apply it in a real codebase with proper auth and pagination…"
              </p>
            </div>
            <div className="h-px bg-[#f0f6fc]" />
            <div>
              <p className="text-[11px] font-normal text-[#98a1ba] mb-[3px]">{L("Availability")}</p>
              <p className="text-[13px] font-semibold text-[#05103d]">
                {hasValue(applicationData?.availability)
                  ? L("{n} h / week", { n: `${applicationData.availability}${String(applicationData.availability) === "16" ? "+" : ""}` })
                  : L("Not specified")}
              </p>
            </div>
          </div>

          {/* Validation summary */}
          <div className="bg-[rgba(21,146,90,0.04)] border border-[rgba(21,146,90,0.15)] rounded-[12px] p-[14px]">
            <p className="text-[11px] font-semibold text-[#15925a] mb-[8px]">
              {L("Pre-submission checks passed")}
            </p>
            {[
              "Eligible for this project",
              "Project is currently open",
              "No duplicate active application",
              hasValue(project.openSpots) && hasValue(project.totalSpots)
                ? L("Capacity available ({n} of {m} spots open)", { n: project.openSpots, m: project.totalSpots })
                : L("Capacity available"),
              "Application deadline not reached",
            ].map((c) => (
              <div key={c} className="flex items-center gap-[7px] py-[3px]">
                <span className="text-[12px] font-normal text-[#6b7593]">{c}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={onBack}
              className="px-[20px] py-[11px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-white border border-[#e4ebf5] hover:bg-[#f7fafe] transition-all"
            >
              {L("Edit application")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-[8px] py-[11px] rounded-[10px] text-[14px] font-semibold text-white transition-all disabled:opacity-70"
              style={{ background: "#1667e0" }}
            >
              {submitting && (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M6.5 1.5C9.8 1.5 12.5 4.2 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? L("Submitting…") : L("Submit Application")}
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
function AppStatusScreen({ project, status: rawStatus, application, onWithdraw, onBack }) {
  const { L } = useProjectsText();
  // Dates come from the application the server returned; nothing is invented.
  const status = appStatusLabel(rawStatus);
  const decided = ["Accepted", "Rejected"].includes(status);
  const submittedAt = formatDateTime(application?.submitted_at ?? application?.created_at, true);
  const reviewedAt = formatDateTime(application?.reviewed_at);
  const decidedAt = formatDateTime(application?.decided_at ?? application?.decision_at);
  const timeline = [
    { label: L("Application submitted"), date: submittedAt ?? L("Submitted"), done: true, active: false },
    {
      label: L("Under review"),
      date: status === "Submitted" ? L("Pending") : reviewedAt ?? (status === "Under Review" ? L("In progress") : L("Done")),
      done: status !== "Submitted" && status !== "Under Review",
      active: status === "Under Review" || status === "Waitlisted",
    },
    {
      label: L("Decision"),
      date: decided ? decidedAt ?? status : L("Pending"),
      done: decided,
      active: false,
    },
    { label: L("Project start"), date: project.startDate, done: false, active: false },
  ];
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-white border-b border-[#e4ebf5] px-[32px] py-[16px] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-[5px] text-[12px] font-medium text-[#98a1ba] hover:text-[#1667e0] transition-colors mb-[6px]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rtl:-scale-x-100">
            <path
              d="M8 2L4 6l4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {L("Projects")}
        </button>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[18px] text-[#05103d]">{L("Application Status")}</h2>
          <StatusPill status={status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[32px] py-[24px]">
        <div className="max-w-[600px] flex flex-col gap-[20px]">
          {/* Status hero */}
          {status === "Submitted" && (
            <div className="bg-[rgba(22,103,224,0.05)] border border-[rgba(22,103,224,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div>
                <h3 className="font-bold text-[15px] text-[#1667e0] mb-[4px]">
                  {L("Application submitted successfully")}
                </h3>
                <p className="text-[13px] font-normal text-[#6b7593] leading-[1.6]">
                  Your application has been received. The project owner at {project.sponsor} will review it and respond
                  before the project start date.
                </p>
              </div>
            </div>
          )}
          {status === "Accepted" && (
            <div
              className="relative overflow-hidden rounded-[16px] p-[22px]"
              style={{ background: "#060d2e" }}
            >
              <div
                className="absolute -top-6 right-0 w-32 h-32 rounded-full opacity-15 pointer-events-none"
                style={{ background: "transparent" }}
              />
              <div className="relative flex items-start gap-[14px]">
                <div>
                  <h3 className="font-bold text-[15px] text-[#34d399] mb-[4px]">
                    {L("Congratulations, you've been accepted!")}
                  </h3>
                  <p className="text-[13px] font-normal text-[rgba(255,255,255,0.6)] leading-[1.6]">
                    Your application was approved by {project.sponsor}. The project starts on {project.startDate}. Check
                    your notifications for onboarding details.
                  </p>
                </div>
              </div>
            </div>
          )}
          {status === "Rejected" && (
            <div className="bg-[rgba(209,59,59,0.05)] border border-[rgba(209,59,59,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div>
                <h3 className="font-bold text-[15px] text-[#d13b3b] mb-[4px]">
                  {L("Application not accepted this time")}
                </h3>
                <p className="text-[13px] font-normal text-[#6b7593] leading-[1.6]">
                  {L("The project team reviewed all applications and selected candidates with stronger relevant experience for the available spots. Your profile and roadmap remain unchanged.")}
                </p>
              </div>
            </div>
          )}
          {status === "Under Review" && (
            <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-[16px] p-[22px] flex items-start gap-[14px]">
              <div>
                <h3 className="font-bold text-[15px] text-[#9a5b00] mb-[4px]">
                  {L("Your application is under review")}
                </h3>
                <p className="text-[13px] font-normal text-[#6b7593] leading-[1.6]">
                  The {project.sponsor} team is reviewing your application. You will be notified when a decision is
                  made, typically within 2–3 business days.
                </p>
              </div>
            </div>
          )}

          {/* Project */}
          <div className="bg-white border border-[#e4ebf5] rounded-[12px] p-[16px] flex items-center gap-[12px]">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] text-[#05103d] truncate rtl:text-right" dir="auto">
                {project.title}
              </p>
              <p className="text-[11px] font-normal text-[#98a1ba]">
                {project.type} · {project.estimatedDuration} · {project.sponsor}
              </p>
            </div>
            {application?.id != null && (
              <div className="text-[11px] font-normal text-[#98a1ba] shrink-0">
                {L("Application #{n}", { n: application.id })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <SectionLabel>{L("Application timeline")}</SectionLabel>
            <div className="flex flex-col gap-[0]">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-[14px]">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 ${step.done ? "border-[#15925a] bg-[#15925a]" : step.active ? "border-[#f9a01f] bg-[rgba(245,158,11,0.1)]" : "border-[#e2e5ef] bg-white"}`}
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
                        <span className="w-[6px] h-[6px] rounded-full bg-[#f9a01f]" />
                      ) : (
                        <span className="w-[6px] h-[6px] rounded-full bg-[#e2e5ef]" />
                      )}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={`w-[2px] h-[28px] ${step.done ? "bg-[#15925a]" : "bg-[#e2e5ef]"}`} />
                    )}
                  </div>
                  <div className="pb-[16px] flex-1">
                    <p
                      className={`text-[12px] font-semibold ${step.done ? "text-[#05103d]" : step.active ? "text-[#9a5b00]" : "text-[#98a1ba]"}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] font-normal text-[#98a1ba]">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {(status === "Submitted" || status === "Under Review") && (
            <div className="bg-[#f7fafe] border border-[#eef0f8] rounded-[12px] p-[16px] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#05103d] mb-[2px]">
                  {L("Withdraw application")}
                </p>
                <p className="text-[11px] font-normal text-[#98a1ba]">
                  {L("You can withdraw while the application is under review")}
                </p>
              </div>
              <button
                onClick={onWithdraw}
                className="px-[14px] py-[8px] rounded-[8px] text-[12px] font-medium text-[#d13b3b] border border-[rgba(209,59,59,0.25)] bg-[rgba(209,59,59,0.05)] hover:bg-[rgba(209,59,59,0.1)] transition-all"
              >
                {L("Withdraw")}
              </button>
            </div>
          )}
          {status === "Rejected" && (
            <button
              onClick={onBack}
              className="flex items-center justify-center gap-[6px] w-full py-[11px] rounded-[10px] text-[13px] font-semibold text-white"
              style={{ background: "#1667e0" }}
            >
              {L("Browse other projects")}
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
  const { L } = useProjectsText();
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
      const response = await withdrawApplication(applicationId);
      onConfirm(unwrapApiData(response));
    } catch (error) {
      setWithdrawError(error?.message || "Unable to withdraw the application from the server.");
    } finally {
      setConfirming(false);
    }
  }
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[480px] w-full bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        {withdrawError && <div role="alert" className="mx-[32px] max-sm:mx-[16px] mt-[16px] rounded-[10px] border border-[#f3c9c9] bg-[#fdf3f3] px-[14px] py-[10px] text-[13px] text-[#b42828]">{L(withdrawError)}</div>}
        <div className="h-[4px] bg-[#d13b3b]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div>
              <h3 className="font-bold text-[17px] text-[#05103d] mb-[4px]">
                {L("Withdraw your application?")}
              </h3>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.6]">
                You are withdrawing your application to{" "}
                <strong className="font-semibold text-[#05103d] rtl:text-right" dir="auto">{project.title}</strong>. This
                action will be recorded and you will need to re-apply if you change your mind (subject to availability).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#05103d] mb-[6px]">
              {L("Reason for withdrawal")} <span className="text-[#98a1ba] font-normal">(optional)</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-[40px] px-[12px] bg-[#f7fafe] border border-[#eef0f8] rounded-[8px] text-[13px] font-normal text-[#05103d] focus:outline-none focus:border-[#1667e0] transition-colors cursor-pointer"
            >
              <option value="">{L("Select a reason…")}</option>
              <option value="schedule">{L("Schedule conflict")}</option>
              <option value="scope">{L("Project scope changed")}</option>
              <option value="found-other">{L("Found a more suitable project")}</option>
              <option value="not-ready">{L("Not ready for this project yet")}</option>
              <option value="other">{L("Other")}</option>
            </select>
          </div>

          <div className="flex items-center gap-[8px]">
            <button
              onClick={onCancel}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-[#f0f6fc] border border-[#e4ebf5] hover:bg-[#e4ebf5] transition-all"
            >
              {L("Keep application")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 flex items-center justify-center gap-[6px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white bg-[#d13b3b] hover:bg-[#dc2626] transition-all disabled:opacity-70"
            >
              {confirming && (
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M5.5 1.5C8 1.5 10.5 3.8 10.5 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {confirming ? L("Withdrawing…") : L("Confirm Withdrawal")}
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
function WithdrawnScreen({ project, withdrawnAt, onBack }) {
  const { L } = useProjectsText();
  const when = formatDateTime(withdrawnAt, true);
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full flex flex-col items-center text-center gap-[20px]">
        <div>
          <h3 className="font-bold text-[20px] text-[#05103d] mb-[6px]">
            {L("Application withdrawn")}
          </h3>
          <p className="text-[13px] font-normal text-[#6b7593] leading-[1.7]">
            {L("Your application to {title} has been withdrawn.", { title: project.title })}
            {when ? <> {L("It was recorded on")} <strong className="font-semibold">{when}</strong>.</> : null}{" "}
            {L("You may re-apply if spots become available before the deadline.")}
          </p>
        </div>
        <div className="flex items-center gap-[6px]">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-[6px] px-[20px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: "#1667e0" }}
          >
            {L("Browse more projects")}
          </button>
          <button
            onClick={onBack}
            className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-white border border-[#e4ebf5] hover:bg-[#f7fafe] transition-all"
          >
            {L("View project")}
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
  const { L } = useProjectsText();
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[560px] w-full bg-white border border-[rgba(209,59,59,0.2)] rounded-[16px] overflow-hidden">
        <div className="h-[4px] bg-[#d13b3b]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div>
              <h3 className="font-bold text-[17px] text-[#d13b3b] mb-[4px]">
                {L("Not eligible for this project")}
              </h3>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.65]">
                Your current skill levels do not meet the minimum requirements for{" "}
                <strong className="font-semibold text-[#05103d] rtl:text-right" dir="auto">{project.title}</strong>. No
                application has been submitted.
              </p>
            </div>
          </div>
          <div className="bg-[rgba(209,59,59,0.03)] border border-[rgba(209,59,59,0.1)] rounded-[10px] p-[14px]">
            <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[8px]">
              {L("Unmet requirements")}
            </p>
            {project.requirements
              .filter((r) => r.met === false)
              .map((r) => (
                <div
                  key={r.skillName}
                  className="flex items-center justify-between py-[5px] border-b border-[rgba(209,59,59,0.06)] last:border-0"
                >
                  <div className="flex items-center gap-[7px]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#d13b3b] shrink-0" />
                    <span className="text-[12px] font-medium text-[#05103d] rtl:text-right" dir="auto">
                      {r.skillName}
                    </span>
                  </div>
                  <span className="text-[11px] font-normal text-[#98a1ba]">
                    {r.yourLevel === null ? L("Not assessed") : `L${r.yourLevel}`} / required L{r.minLevel}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onBack}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-semibold text-white"
              style={{ background: "#1667e0" }}
            >
              {L("View Career Roadmap")}
            </button>
            <button
              onClick={onBack}
              className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-[#f0f6fc] hover:bg-[#e4ebf5] transition-all"
            >
              {L("Browse projects")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function DuplicateScreen({ project, application, onViewStatus, onBack }) {
  const { L } = useProjectsText();
  const submittedAt = formatDateTime(application?.submitted_at ?? application?.created_at);
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full bg-white border border-[rgba(245,158,11,0.25)] rounded-[16px] overflow-hidden">
        <div className="h-[4px] bg-[#f9a01f]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div>
              <h3 className="font-bold text-[17px] text-[#9a5b00] mb-[4px]">
                {L("You already have an active application")}
              </h3>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.65]">
                A duplicate application cannot be created. Your existing active application to{" "}
                <strong className="font-semibold text-[#05103d] rtl:text-right" dir="auto">{project.title}</strong> is still
                open.
              </p>
            </div>
          </div>
          <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-[10px] p-[14px] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-[#05103d] mb-[1px]">
                {application?.id != null ? L("Application #{n}", { n: application.id }) : L("Your application")}
              </p>
              <p className="text-[11px] font-normal text-[#98a1ba]">
                {submittedAt ? `${L("Submitted {d}", { d: submittedAt })} · ` : ""}{L(appStatusLabel(application?.status))}
              </p>
            </div>
            <StatusPill status={application?.status} />
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onViewStatus}
              className="flex-1 py-[10px] rounded-[10px] text-[13px] font-semibold text-white"
              style={{ background: "#1667e0" }}
            >
              {L("View existing application")}
            </button>
            <button
              onClick={onBack}
              className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-[#f0f6fc] hover:bg-[#e4ebf5] transition-all"
            >
              {L("Back")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ExpiredFullScreen({ project, variant, onBack }) {
  const { L } = useProjectsText();
  const isExpired = variant === "expired";
  return (
    <div className="flex flex-col h-full overflow-hidden items-center justify-center px-[32px] py-[32px]">
      <div className="max-w-[520px] w-full bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="h-[4px] bg-[#98a1ba]" />
        <div className="p-[28px] flex flex-col gap-[18px]">
          <div className="flex items-start gap-[12px]">
            <div>
              <h3 className="font-bold text-[17px] text-[#6b7593] mb-[4px]">
                {isExpired ? L("Application period has closed") : L("Project is fully booked")}
              </h3>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.65]">
                {isExpired
                  ? `The application deadline for ${project.title} passed on ${project.deadline}. This project is no longer accepting applications.`
                  : `All${hasValue(project.totalSpots) ? ` ${project.totalSpots}` : ""} spots for ${project.title} have been filled. No further applications are being accepted.`}
              </p>
            </div>
          </div>
          <div className="bg-[#f7fafe] border border-[#eef0f8] rounded-[10px] px-[14px] py-[10px] flex items-center justify-between text-[12px]">
            <span className="font-normal text-[#98a1ba]">
              {isExpired ? L("Deadline") : L("Capacity")}
            </span>
            <span className="font-semibold text-[#6b7593]">
              {isExpired ? project.deadline : hasValue(project.totalSpots) ? `${project.totalSpots}/${project.totalSpots} spots taken` : L("All spots taken")}
            </span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <button
              onClick={onBack}
              className="w-full py-[10px] rounded-[10px] text-[13px] font-semibold text-white"
              style={{ background: "#1667e0" }}
            >
              {L("Browse other projects")}
            </button>
            <p className="text-[11px] font-normal text-[#98a1ba] text-center">
              {L("Similar projects may be available, check the projects list")}
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
  const { L } = useProjectsText();
  const [rawProject, setRawProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");
  const project = useMemo(() => rawProject ? normalizeProject(rawProject) : null, [rawProject]);
  useEffect(() => {
    let active = true;
    if (!projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset missing-id error
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
  const [application, setApplication] = useState(null);
  // Existing application for this project (GET /applications), so the page does
  // not offer "Apply" again and the status screen shows real data.
  useEffect(() => {
    let active = true;
    getApplications({ page: 1, perPage: 100 }).then((payload) => {
      const value = unwrapApiData(payload);
      const rows = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
      const mine = rows
        .filter((row) => String(row.project_id ?? row.project?.id ?? "") === String(projectId))
        .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0];
      if (active && mine) {
        setApplication(mine);
        setActiveApplicationId(mine.id ?? null);
        setAppStatus(mine.status ?? "submitted");
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [projectId]);
  const hasActiveApplication = Boolean(application && (application.is_active ?? !["withdrawn", "rejected"].includes(String(application.status).toLowerCase())));
  const handleApply = () => {
    if (hasActiveApplication) return setScreen("duplicate");
    if (project?.isPastDeadline) return setScreen("expired");
    if (project?.isFull) return setScreen("full");
    if (project?.eligible === false) return setScreen("ineligible");
    return setScreen("apply-form");
  };
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
            onApply={handleApply}
            hasActiveApplication={hasActiveApplication}
            onViewApplication={() => setScreen("app-status")}
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
            recommendationId={recommendationId}
            onConfirm={(created) => {
              const row = created?.application ?? created;
              setApplication(row ?? null);
              setActiveApplicationId(row?.id ?? row?.application_id ?? null);
              setScreen("app-status");
              setAppStatus(row?.status ?? "submitted");
            }}
            onBack={() => setScreen("apply-form")}
          />
        );
      case "app-status":
        return (
          <AppStatusScreen
            project={project}
            status={appStatus}
            application={application}
            onWithdraw={() => setScreen("withdraw-confirm")}
            onBack={() => setScreen("details")}
          />
        );
      case "withdraw-confirm":
        return (
          <WithdrawConfirmScreen
            project={{ ...project, application_id: activeApplicationId ?? project.application_id }}
            onConfirm={(row) => {
              setApplication(row && typeof row === "object" ? row : application ? { ...application, status: "withdrawn", is_active: false } : null);
              setAppStatus("withdrawn");
              setScreen("withdrawn");
            }}
            onCancel={() => setScreen("app-status")}
          />
        );
      case "withdrawn":
        return <WithdrawnScreen project={project} withdrawnAt={application?.withdrawn_at} onBack={() => setScreen("details")} />;
      case "duplicate":
        return <DuplicateScreen project={project} application={application} onViewStatus={() => setScreen("app-status")} onBack={() => setScreen("details")} />;
      case "ineligible":
        return <IneligibleScreen project={project} onBack={() => setScreen("details")} />;
      case "expired":
      case "full":
        return <ExpiredFullScreen project={project} variant={screen} onBack={() => setScreen("details")} />;
      default:
        return null;
    }
  };
  if (loadingProject) return <StateBlock kind="loading" title={L("Loading project details…")} />;
  if (loadError || !project) return <StateBlock kind="error" title={L("Unable to load project details from the server.")} message={loadError ? L(loadError) : L("The service did not return project details.")} action={{ label: L("Back to Projects"), onClick: onBack }} />;
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f0f6fc]">
      {feedbackError && <p role="alert" className="mx-[32px] max-sm:mx-[16px] mt-[16px] rounded-[10px] border border-[#f3c9c9] bg-[#fdf3f3] px-[14px] py-[10px] text-[13px] text-[#b42828]">{L(feedbackError)}</p>}
      <div className="flex-1 overflow-hidden bg-[#f0f6fc]">{renderContent()}</div>

   </div>
  );
}
