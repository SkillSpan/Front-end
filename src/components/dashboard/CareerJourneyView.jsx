import "../../skillspan-animations.css";
import { useState } from "react";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const READINESS = {
    score: 67, band: "Progressing",
    roleTitle: "Software Engineer", roleVersion: "v2.3",
    algorithmVersion: "v1.4.2", configVersion: "v2.1",
    calculatedAt: "2026-09-09T14:32:00Z", decisionVersion: "dec-2026090914",
    explanation: "Your readiness is driven by a strong Skill Match (74%), but limited Practical Experience (52%) and a critical Python deficiency are the main limiters. Closing the Python gap is the highest-leverage move — it removes the critical flag, unlocks Phase 3, and adds an estimated +8 pts to your score.",
    warning: {
        skillName: "Python", currentLevel: 3, requiredLevel: 4,
        capApplied: 75, uncappedScore: 73,
        explanation: "Python is a critical skill for Software Engineer (Level 4 required, you have Level 3). A cap of 75 is configured — your score of 67 is currently below the cap so it is not yet restricting you, but it will apply if your overall score reaches 75 before this gap is resolved.",
    },
    components: [
        { key: "skillMatch", label: "Skill Match", abbr: "SM", score: 74, weight: 0.65, contribution: 48.1, color: "#3b8bff", icon: "◈", explanation: "Your validated skill levels vs. the required levels. Python and React are the two largest gaps reducing this component. Each level gained in a high-importance skill has an outsized effect here." },
        { key: "practicalExp", label: "Practical Experience", abbr: "PE", score: 52, weight: 0.20, contribution: 10.4, color: "#7c3aed", icon: "◉", explanation: "Verified project and applied-experience evidence relevant to this role. 2 active projects count; no completed SkillSpan simulations yet. Completing one simulation adds significant points here." },
        { key: "assessmentRel", label: "Assessment Reliability", abbr: "AR", score: 68, weight: 0.10, contribution: 6.8, color: "#f59e0b", icon: "◑", explanation: "How well-verified your skill levels are across the required set. Most skills have at least one verified source; Python and React have pending verification items that would raise this score." },
        { key: "profileComp", label: "Profile Completeness", abbr: "PC", score: 80, weight: 0.05, contribution: 4.0, color: "#059669", icon: "◐", explanation: "Whether your profile contains the information needed for a reliable calculation. Adding detailed work-experience history will push this to 100%." },
    ],
};
const GAPS = [
    { skillId: "s1", skillName: "Python", category: "Programming", currentLevel: 3, requiredLevel: 4, maxLevel: 5, gap: 1, match: 75, importance: 0.90, isCritical: true, confidence: 0.82, confidenceLabel: "High", evidenceSummary: "2 assessments (verified) · 1 project (verified)", explanation: "Highest-weight critical skill. 1 level away from the requirement. Complete the Python Intermediate Assessment to close this gap and remove the critical deficiency flag.", bucket: "priority-gap" },
    { skillId: "s2", skillName: "React", category: "Frontend", currentLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, match: 67, importance: 0.80, isCritical: true, confidence: 0.61, confidenceLabel: "Medium", evidenceSummary: "1 self-assessment · 1 project (pending verification)", explanation: "Critical skill with medium confidence. A verified assessment would improve level accuracy and roadmap reliability for this skill.", bucket: "priority-gap" },
    { skillId: "s3", skillName: "System Design", category: "Architecture", currentLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, match: 67, importance: 0.75, isCritical: false, confidence: 0.40, confidenceLabel: "Low", evidenceSummary: "1 self-assessment only — no verified evidence", explanation: "Low confidence: self-assessment only. Complete a practice task or simulation to produce verified evidence and raise roadmap accuracy.", bucket: "developing" },
    { skillId: "s4", skillName: "REST API Design", category: "Backend", currentLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, match: 67, importance: 0.65, isCritical: false, confidence: 0.55, confidenceLabel: "Medium", evidenceSummary: "1 project submission (verified)", explanation: "Partially verified through the E-commerce REST API project. A second project raises confidence to High.", bucket: "developing" },
    { skillId: "s5", skillName: "SQL", category: "Databases", currentLevel: 3, requiredLevel: 3, maxLevel: 5, gap: 0, match: 100, importance: 0.70, isCritical: false, confidence: 0.91, confidenceLabel: "High", evidenceSummary: "3 assessments (verified) · 2 projects (verified)", explanation: "Requirement met with high confidence. No action needed.", bucket: "strength" },
    { skillId: "s6", skillName: "Git & CI/CD", category: "DevOps", currentLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, match: 100, importance: 0.60, isCritical: false, confidence: 0.78, confidenceLabel: "High", evidenceSummary: "2 projects (verified)", explanation: "Requirement met. Practical use confirmed via project submissions.", bucket: "strength" },
];
const MILESTONES = [
    {
        phase: 1, title: "Foundations Cleared", badge: "🏁",
        description: "Core baseline knowledge verified. Phase 2 actions are unlocked.",
        criteria: ["CS Fundamentals Assessment ≥ 70%", "At least one baseline skill level confirmed"],
        status: "Achieved", achievedDate: "15 Aug 2026", unlocksPhase: 2,
    },
    {
        phase: 2, title: "Core Skills Verified", badge: "⚡",
        description: "All critical skill gaps resolved to required level. Practical tracks unlock.",
        criteria: ["Python: Level 4 (Assessment ≥ 80%)", "React: Level 3 (Assessment ≥ 75%)", "Both critical skills marked Verified"],
        status: "In Progress", unlocksPhase: 3,
    },
    {
        phase: 3, title: "Applied Practice Complete", badge: "🔬",
        description: "Practical experience verified through projects and simulations.",
        criteria: ["≥1 verified Simulation Project evaluated", "REST API practice task submitted", "System Design verified evidence collected"],
        status: "Locked", unlocksPhase: 4,
    },
    {
        phase: 4, title: "Career Ready", badge: "🎯",
        description: "Final readiness score reaches the Ready band. Eligible for talent-matching.",
        criteria: ["Final Readiness Score ≥ 85 (Ready band)", "≥1 Real Project submitted and evaluated", "All critical skills at Required level"],
        status: "Locked",
    },
];
const ACTIONS = [
    { id: "a0", type: "Assessment", phase: 1, phaseName: "Foundations", objective: "Verify baseline CS proficiency", targetSkill: "CS Fundamentals", priority: 0, currentLevel: 3, requiredLevel: 3, gap: 0, isCritical: false, importance: 0.5, prerequisites: [], completionCriteria: "Score ≥ 70% on CS Fundamentals Baseline Assessment", status: "Completed", estimatedEffort: "2 h", estimatedDuration: "3 days", explanation: "Confirmed your baseline knowledge. Contributed to Assessment Reliability.", unlocksWhat: "Achieved Phase 1 Milestone" },
    { id: "a1", type: "Assessment", phase: 2, phaseName: "Core Skills", objective: "Assess and validate Python intermediate proficiency", targetSkill: "Python", priority: 1, currentLevel: 3, requiredLevel: 4, gap: 1, isCritical: true, importance: 0.90, prerequisites: [], completionCriteria: "Score ≥ 80% on the Python Intermediate Assessment", status: "Not Started", estimatedEffort: "4 h study + 1.5 h assessment", estimatedDuration: "1–2 weeks", explanation: "Highest-weight critical skill with no prerequisites — you can start immediately. Closing this gap has the largest single impact on your readiness.", isNBA: true, unlocksWhat: "Removes critical Python flag · Unlocks Phase 3 · +8 pts est. readiness" },
    { id: "a2", type: "Learning Resource", phase: 2, phaseName: "Core Skills", objective: "Complete React Fundamentals → Intermediate learning path", targetSkill: "React", priority: 2, currentLevel: 2, requiredLevel: 3, gap: 1, isCritical: true, importance: 0.80, prerequisites: ["JavaScript ES6+ (Level 2+)"], completionCriteria: "Complete all modules and pass the integrated quiz ≥ 75%", status: "Not Started", estimatedEffort: "12 h", estimatedDuration: "2–3 weeks", explanation: "Building the React knowledge base before the assessment produces a more reliable result.", unlocksWhat: "Unlocks React Intermediate Assessment" },
    { id: "a3", type: "Assessment", phase: 2, phaseName: "Core Skills", objective: "Assess React intermediate proficiency", targetSkill: "React", priority: 3, currentLevel: 2, requiredLevel: 3, gap: 1, isCritical: true, importance: 0.80, prerequisites: ["a2 — React Learning Resource"], completionCriteria: "Score ≥ 75% on the React Intermediate Assessment", status: "Not Started", estimatedEffort: "2 h", estimatedDuration: "1 week", explanation: "Validates your React level and removes the low-confidence flag from this critical skill.", unlocksWhat: "Closes React gap · +6 pts est. readiness" },
    { id: "a4", type: "Practice Task", phase: 3, phaseName: "Applied Practice", objective: "Build a REST API using Python with SQL integration", targetSkill: "REST API Design", priority: 4, currentLevel: 2, requiredLevel: 3, gap: 1, isCritical: false, importance: 0.65, prerequisites: ["a1 — Python Assessment"], completionCriteria: "Submit working API with documented endpoints, passing test suite, peer review ≥ 3/5", status: "Not Started", estimatedEffort: "10–15 h", estimatedDuration: "2 weeks", explanation: "Applies Python in a practical context and closes the REST API Design gap. Improves Practical Experience component.", unlocksWhat: "Closes REST API gap · Improves Practical Experience" },
    { id: "a5", type: "Simulation Project", phase: 3, phaseName: "Applied Practice", objective: "System Design Simulation: Scalable Chat Architecture", targetSkill: "System Design", priority: 5, currentLevel: 2, requiredLevel: 3, gap: 1, isCritical: false, importance: 0.75, prerequisites: ["a4 — REST API Practice Task"], completionCriteria: "Submit design document and receive evaluator score ≥ 3.5/5", status: "Blocked", estimatedEffort: "8–12 h", estimatedDuration: "2 weeks", explanation: "System Design confidence is currently low (self-assessment only). The simulation creates the first verified evidence for this skill.", unlocksWhat: "First verified System Design evidence · Unlocks Phase 4" },
    { id: "a6", type: "Real Project", phase: 4, phaseName: "Career Readiness", objective: "Complete a full-stack real-world Software Engineering project", targetSkill: "Full-Stack Dev", priority: 6, currentLevel: 2, requiredLevel: 4, gap: 2, isCritical: false, importance: 0.85, prerequisites: ["a3", "a4", "a5"], completionCriteria: "Deliver a production-grade feature with code review and evaluator sign-off", status: "Not Started", estimatedEffort: "40–60 h", estimatedDuration: "6–8 weeks", explanation: "Capstone milestone combining Python, React, and API skills in a deployed production context.", unlocksWhat: "Achieves Ready band (85%+) · Qualifies for talent-matching" },
];
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const BAND = {
    "Not Started": { text: "text-[#94a3b8]", bg: "bg-[rgba(148,163,184,0.08)]", border: "border-[rgba(148,163,184,0.2)]", stop0: "#94a3b8", stop1: "#64748b" },
    Developing: { text: "text-[#ef4444]", bg: "bg-[rgba(239,68,68,0.08)]", border: "border-[rgba(239,68,68,0.2)]", stop0: "#ef4444", stop1: "#f97316" },
    Progressing: { text: "text-[#f59e0b]", bg: "bg-[rgba(245,158,11,0.08)]", border: "border-[rgba(245,158,11,0.2)]", stop0: "#f59e0b", stop1: "#fbbf24" },
    Advanced: { text: "text-[#3b8bff]", bg: "bg-[rgba(59,139,255,0.08)]", border: "border-[rgba(59,139,255,0.2)]", stop0: "#3b8bff", stop1: "#7c3aed" },
    Ready: { text: "text-[#059669]", bg: "bg-[rgba(5,150,105,0.08)]", border: "border-[rgba(5,150,105,0.2)]", stop0: "#059669", stop1: "#10b981" },
};
const ST = {
    "Not Started": { bg: "bg-[rgba(100,116,139,0.08)]", text: "text-[#64748b]", dot: "bg-[#94a3b8]" },
    "In Progress": { bg: "bg-[rgba(59,139,255,0.10)]", text: "text-[#3b8bff]", dot: "bg-[#3b8bff]" },
    Blocked: { bg: "bg-[rgba(239,68,68,0.10)]", text: "text-[#ef4444]", dot: "bg-[#ef4444]" },
    Completed: { bg: "bg-[rgba(5,150,105,0.10)]", text: "text-[#059669]", dot: "bg-[#059669]" },
    Skipped: { bg: "bg-[rgba(100,116,139,0.06)]", text: "text-[#94a3b8]", dot: "bg-[#d1d5db]" },
};
const MS = {
    Achieved: { bg: "bg-[rgba(5,150,105,0.06)]", border: "border-[rgba(5,150,105,0.25)]", text: "text-[#059669]", ring: "#059669", badgeBg: "rgba(5,150,105,0.12)" },
    "In Progress": { bg: "bg-[rgba(59,139,255,0.06)]", border: "border-[rgba(59,139,255,0.25)]", text: "text-[#3b8bff]", ring: "#3b8bff", badgeBg: "rgba(59,139,255,0.12)" },
    Locked: { bg: "bg-[rgba(148,163,184,0.04)]", border: "border-[rgba(148,163,184,0.18)]", text: "text-[#94a3b8]", ring: "#94a3b8", badgeBg: "rgba(148,163,184,0.08)" },
};
const PT = {
    1: { accent: "#64748b", bg: "rgba(100,116,139,0.06)", border: "rgba(100,116,139,0.2)", text: "text-[#64748b]", track: "#e2e5ef" },
    2: { accent: "#3b8bff", bg: "rgba(59,139,255,0.06)", border: "rgba(59,139,255,0.18)", text: "text-[#3b8bff]", track: "#dbeafe" },
    3: { accent: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", text: "text-[#f59e0b]", track: "#fef3c7" },
    4: { accent: "#059669", bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.18)", text: "text-[#059669]", track: "#d1fae5" },
};
const TM = {
    "Assessment": { emoji: "📝", label: "Assessment" },
    "Learning Resource": { emoji: "📚", label: "Learning Resource" },
    "Practice Task": { emoji: "🔧", label: "Practice Task" },
    "Simulation Project": { emoji: "🧪", label: "Simulation" },
    "Real Project": { emoji: "🚀", label: "Real Project" },
};
const CT = {
    "High": { text: "text-[#059669]", dot: "bg-[#059669]", bar: "#059669" },
    "Medium": { text: "text-[#f59e0b]", dot: "bg-[#f59e0b]", bar: "#f59e0b" },
    "Low": { text: "text-[#ef4444]", dot: "bg-[#ef4444]", bar: "#ef4444" },
    "Self-Assessment Only": { text: "text-[#94a3b8]", dot: "bg-[#d1d5db]", bar: "#d1d5db" },
};
// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Sk({ w = "100%", h = 14, r = 8, className = "" }) {
    return <div className={`shimmer ${className}`} style={{ width: w, height: h, borderRadius: r }}/>;
}
function Bar({ pct, color, h = 5 }) {
    return (<div className="w-full rounded-full bg-[#f1f3fa] overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}/>
    </div>);
}
function InfoIcon() {
    return (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#3b8bff" strokeWidth="1.2"/>
      <path d="M6.5 5.5v3.5" stroke="#3b8bff" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="6.5" cy="4" r=".6" fill="#3b8bff"/>
    </svg>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// READINESS GAUGE
// ═══════════════════════════════════════════════════════════════════════════════
function Gauge({ score, band, size = 180 }) {
    const bt = BAND[band];
    const r = 54;
    const C = 2 * Math.PI * r;
    const arc = C * 0.75;
    const filled = (Math.min(Math.max(score, 0), 100) / 100) * arc;
    const id = `g-${score}`;
    return (<svg width={size} height={size} viewBox="0 0 180 180">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#eef0f8" strokeWidth="12" strokeDasharray={`${arc} ${C - arc}`} strokeLinecap="round" transform="rotate(135 90 90)"/>
      <circle cx="90" cy="90" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="12" strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="round" transform="rotate(135 90 90)"/>
      <defs>
        <linearGradient id={id} x1="30" y1="90" x2="150" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor={bt.stop0}/><stop offset="1" stopColor={bt.stop1}/>
        </linearGradient>
      </defs>
      <text x="90" y="82" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="38" fill="#0a0b14">{score}</text>
      <text x="90" y="102" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="400" fontSize="13" fill="#94a3b8">/ 100</text>
    </svg>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// NBA BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function NBABanner({ action }) {
    return (<div className="relative overflow-hidden rounded-[20px] mb-[20px]" style={{ background: "linear-gradient(130deg,#0d0f24 0%,#1a1d40 100%)" }}>
      <div className="absolute -top-12 -right-8 w-56 h-56 rounded-full pointer-events-none opacity-15" style={{ background: "radial-gradient(circle,#3b8bff,transparent 70%)" }}/>
      <div className="absolute -bottom-8 left-16 w-40 h-40 rounded-full pointer-events-none opacity-10" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }}/>
      <div className="relative px-[26px] py-[22px]">
        {/* Header */}
        <div className="flex items-center gap-[8px] mb-[10px]">
          <div className="flex items-center gap-[5px] bg-[rgba(59,139,255,0.2)] border border-[rgba(59,139,255,0.3)] px-[10px] py-[4px] rounded-full">
            <span className="text-[11px]">⚡</span>
            <span className="text-[11px] font-semibold text-[#7ca8ff]">Next Best Action</span>
          </div>
          <span className="text-[11px] font-normal text-[rgba(255,255,255,0.35)]">Phase {action.phase} · {action.phaseName} · {TM[action.type].label}</span>
          {action.isCritical && <span className="text-[10px] font-medium text-[#ef4444] bg-[rgba(239,68,68,0.2)] px-[8px] py-[2px] rounded-full">Critical Skill</span>}
        </div>
        <div className="grid gap-[20px]" style={{ gridTemplateColumns: "1fr 172px" }}>
          <div>
            <h3 className="font-bold text-[20px] text-white mb-[6px] leading-tight">{action.objective}</h3>
            <p className="text-[13px] font-normal text-[rgba(255,255,255,0.5)] leading-[1.65] max-w-[520px] mb-[16px]">{action.explanation}</p>
            <div className="flex gap-[10px] flex-wrap">
              <div className="flex-1 min-w-[180px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[14px] py-[10px]">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-[5px]">Why this is next</p>
                <p className="text-[12px] font-normal text-[rgba(255,255,255,0.65)]">Highest-weight critical skill · No prerequisites · Can start immediately · Largest single readiness impact</p>
              </div>
              <div className="flex-1 min-w-[180px] bg-[rgba(59,139,255,0.1)] border border-[rgba(59,139,255,0.2)] rounded-[10px] px-[14px] py-[10px]">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[rgba(124,168,255,0.5)] mb-[5px]">Completing this unlocks</p>
                <p className="text-[12px] font-normal text-[#7ca8ff]">{action.unlocksWhat}</p>
              </div>
            </div>
          </div>
          {/* CTA */}
          <div className="flex flex-col gap-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-[16px] items-center text-center shrink-0">
            <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[20px]" style={{ background: "rgba(59,139,255,0.15)" }}>{TM[action.type].emoji}</div>
            <div>
              <p className="text-[10px] font-normal text-[rgba(255,255,255,0.3)] mb-[2px]">Effort</p>
              <p className="font-semibold text-[12px] text-white">{action.estimatedEffort}</p>
            </div>
            <div className="w-full h-px bg-[rgba(255,255,255,0.06)]"/>
            <div>
              <p className="text-[10px] font-normal text-[rgba(255,255,255,0.3)] mb-[2px]">Timeline</p>
              <p className="font-semibold text-[12px] text-white">{action.estimatedDuration}</p>
            </div>
            <button className="w-full mt-[2px] py-[9px] rounded-[9px] text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(59,139,255,0.4)] hover:shadow-[0_6px_20px_rgba(59,139,255,0.5)] transition-all" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>
              Start Now →
            </button>
          </div>
        </div>
      </div>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// READINESS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ReadinessTab({ data }) {
    const [showHow, setShowHow] = useState(false);
    const bt = BAND[data.band];
    const BANDS = ["Not Started", "Developing", "Progressing", "Advanced", "Ready"];
    const bandIdx = BANDS.indexOf(data.band);
    return (<div className="flex flex-col gap-[16px]">

      {/* ── Critical warning ── */}
      {data.warning && (<div className="flex gap-[14px] items-start bg-[#fff5f5] border border-[rgba(239,68,68,0.3)] rounded-[14px] px-[18px] py-[14px]">
          <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(239,68,68,0.12)] flex items-center justify-center shrink-0">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 2L15.5 14H1.5L8.5 2Z" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M8.5 7.5V10" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8.5" cy="12" r=".7" fill="#ef4444"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
              <span className="font-semibold text-[13px] text-[#ef4444]">Critical Skill Deficiency — {data.warning.skillName}</span>
              <span className="bg-[rgba(239,68,68,0.1)] text-[#ef4444] text-[10px] font-bold px-[8px] py-[2px] rounded-full border border-[rgba(239,68,68,0.2)]">Readiness cap: {data.warning.capApplied}</span>
            </div>
            <p className="text-[12px] font-normal text-[#64748b] leading-[1.6]">{data.warning.explanation}</p>
            <div className="flex gap-[14px] mt-[8px] text-[11px] font-normal text-[#94a3b8]">
              <span>Current: <strong className="text-[#ef4444] font-semibold">L{data.warning.currentLevel}</strong></span>
              <span>Required: <strong className="text-[#0a0b14] font-semibold">L{data.warning.requiredLevel}</strong></span>
              <span>Gap: <strong className="text-[#ef4444] font-semibold">−{data.warning.requiredLevel - data.warning.currentLevel}</strong></span>
            </div>
          </div>
        </div>)}

      {/* ── Score hero ── */}
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "230px 1fr" }}>
          {/* Gauge side */}
          <div className="flex flex-col items-center justify-center gap-[10px] border-r border-[#f1f3fa] px-[22px] py-[26px]" style={{ backgroundImage: `radial-gradient(circle at 50% 40%,${bt.stop0}10 0%,transparent 70%)` }}>
            <Gauge score={data.score} band={data.band} size={162}/>
            <div className={`flex items-center gap-[6px] px-[14px] py-[5px] rounded-full border ${bt.bg} ${bt.border}`}>
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: bt.stop0 }}/>
              <span className={`font-semibold text-[12px] ${bt.text}`}>{data.band}</span>
            </div>
          </div>

          {/* Detail side */}
          <div className="flex flex-col px-[24px] py-[22px] gap-[18px]">
            {/* Role + explanation */}
            <div>
              <div className="flex items-center gap-[8px] mb-[6px]">
                <span className="font-bold text-[16px] text-[#0a0b14]">{data.roleTitle}</span>
                <span className="text-[11px] font-medium text-[#94a3b8] bg-[#f1f3fa] px-[8px] py-[2px] rounded-full">{data.roleVersion}</span>
              </div>
              <p className="text-[13px] font-normal text-[#64748b] leading-[1.65]">{data.explanation}</p>
            </div>

            {/* Band scale */}
            <div>
              <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide mb-[8px]">Your position in the readiness scale</p>
              <div className="flex items-center gap-[4px]">
                {BANDS.map((b, i) => {
            const bt2 = BAND[b];
            const isActive = b === data.band;
            const isPast = i < bandIdx;
            return (<div key={b} className="flex-1 flex flex-col gap-[4px]">
                      <div className="h-[4px] rounded-full" style={{ background: isActive || isPast ? bt2.stop0 : "#f1f3fa" }}/>
                      <span className={`text-[9px] font-medium text-center truncate ${isActive ? bt2.text : "text-[#d1d5db]"}`}>
                        {b.split(" ")[0]}
                      </span>
                    </div>);
        })}
              </div>
            </div>

            {/* Score composition */}
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide">Score composition</p>
                <span className="text-[12px] font-bold text-[#0a0b14]">{data.score} pts total</span>
              </div>
              <div className="flex h-[9px] rounded-full overflow-hidden gap-[2px]">
                {data.components.map(c => (<div key={c.key} title={`${c.label}: +${c.contribution.toFixed(1)} pts`} className="h-full rounded-full" style={{ width: `${(c.contribution / data.score) * 100}%`, background: c.color }}/>))}
              </div>
              <div className="flex gap-[12px] mt-[6px] flex-wrap">
                {data.components.map(c => (<div key={c.key} className="flex items-center gap-[4px]">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: c.color }}/>
                    <span className="text-[10px] font-normal text-[#94a3b8]">{c.abbr} +{c.contribution.toFixed(1)}</span>
                  </div>))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Component breakdown cards ── */}
      <div className="grid grid-cols-2 gap-[12px]">
        {data.components.map(c => (<div key={c.key} className="bg-white border border-[#e8eaf0] rounded-[16px] p-[18px] flex flex-col gap-[10px] hover:border-[#c7d2e8] transition-colors">
            {/* Header row */}
            <div className="flex items-start justify-between gap-[8px]">
              <div className="flex items-center gap-[8px]">
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] shrink-0" style={{ background: `${c.color}15` }}>{c.icon}</div>
                <div>
                  <p className="font-semibold text-[13px] text-[#0a0b14] leading-tight">{c.label}</p>
                  <p className="text-[10px] font-normal text-[#94a3b8]">Weight: {Math.round(c.weight * 100)}% of score</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-[24px] leading-none" style={{ color: c.color }}>{c.score}</span>
                <span className="text-[11px] font-normal text-[#94a3b8]">%</span>
              </div>
            </div>
            {/* Score bar */}
            <Bar pct={c.score} color={c.color} h={7}/>
            {/* Contribution */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-normal text-[#94a3b8]">Contribution to final score</span>
              <span className="text-[12px] font-semibold" style={{ color: c.color }}>+{c.contribution.toFixed(1)} pts</span>
            </div>
            {/* Divider + explanation */}
            <div className="border-t border-[#f8f9fd] pt-[8px]">
              <p className="text-[11px] font-normal text-[#64748b] leading-[1.55]">{c.explanation}</p>
            </div>
          </div>))}
      </div>

      {/* ── Meta + explainer toggle ── */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="flex items-center gap-[8px] flex-wrap text-[11px] font-normal text-[#94a3b8]">
          <span>Calculated {new Date(data.calculatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span className="opacity-40">·</span><span>Algo {data.algorithmVersion}</span>
          <span className="opacity-40">·</span><span>Config {data.configVersion}</span>
          <span className="opacity-40">·</span><span>{data.decisionVersion}</span>
        </div>
        <button onClick={() => setShowHow(!showHow)} className="ml-auto text-[11px] font-medium text-[#3b8bff] hover:underline whitespace-nowrap">
          {showHow ? "Hide explanation" : "How is this calculated?"}
        </button>
      </div>

      {showHow && (<div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[14px] p-[18px]">
          <p className="font-semibold text-[13px] text-[#0a0b14] mb-[10px]">Readiness formula (BR-12)</p>
          <p className="text-[12px] font-normal text-[#64748b] leading-[1.7] mb-[12px]">
            <strong className="font-semibold text-[#0a0b14]">Score = </strong>
            (Skill Match × 65%) + (Practical Experience × 20%) + (Assessment Reliability × 10%) + (Profile Completeness × 5%)
          </p>
          <div className="grid grid-cols-2 gap-[8px]">
            {data.components.map(c => (<div key={c.key} className="flex items-center gap-[8px] bg-white border border-[#e8eaf0] rounded-[8px] px-[10px] py-[8px]">
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: c.color }}/>
                <span className="text-[11px] font-normal text-[#64748b] flex-1">{c.label}</span>
                <span className="text-[11px] font-normal text-[#64748b]">
                  {c.score}% × {Math.round(c.weight * 100)}% = <strong className="font-semibold" style={{ color: c.color }}>+{c.contribution.toFixed(1)}</strong>
                </span>
              </div>))}
          </div>
          <p className="text-[11px] font-normal text-[#94a3b8] mt-[10px] italic leading-[1.6]">
            Critical skill deficiencies apply a configured cap (BR-08). Weights and thresholds are versioned — every result is reproducible and auditable (BR-10, BR-13).
          </p>
        </div>)}
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// SKILL GAP TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SkillGapTab({ gaps }) {
    const [expanded, setExpanded] = useState(null);
    const wtMatch = gaps.reduce((a, g) => a + g.match * g.importance, 0) / gaps.reduce((a, g) => a + g.importance, 0);
    const buckets = [
        { key: "priority-gap", label: "Priority Gaps", dot: "bg-[#ef4444]", col: "text-[#ef4444]", bg: "bg-[rgba(239,68,68,0.04)]", border: "border-[rgba(239,68,68,0.12)]", items: gaps.filter(g => g.bucket === "priority-gap") },
        { key: "developing", label: "Developing", dot: "bg-[#f59e0b]", col: "text-[#f59e0b]", bg: "bg-[rgba(245,158,11,0.04)]", border: "border-[rgba(245,158,11,0.12)]", items: gaps.filter(g => g.bucket === "developing") },
        { key: "strength", label: "Strengths", dot: "bg-[#059669]", col: "text-[#059669]", bg: "bg-[rgba(5,150,105,0.04)]", border: "border-[rgba(5,150,105,0.12)]", items: gaps.filter(g => g.bucket === "strength") },
    ];
    return (<div className="flex flex-col gap-[16px]">
      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-[12px]">
        {[
            { l: "Weighted Match", v: `${Math.round(wtMatch)}%`, s: "across required skills", c: "text-[#3b8bff]" },
            { l: "Priority Gaps", v: `${buckets[0].items.length}`, s: "need immediate action", c: "text-[#ef4444]" },
            { l: "Critical Unmet", v: `${gaps.filter(g => g.isCritical && g.gap > 0).length}`,
                s: `of ${gaps.filter(g => g.isCritical).length} critical skills`,
                c: gaps.some(g => g.isCritical && g.gap > 0) ? "text-[#ef4444]" : "text-[#059669]" },
            { l: "Strengths", v: `${buckets[2].items.length}`, s: "requirements met", c: "text-[#059669]" },
        ].map(s => (<div key={s.l} className="bg-white border border-[#e8eaf0] rounded-[14px] p-[16px]">
            <p className="text-[11px] font-normal text-[#94a3b8] mb-[4px]">{s.l}</p>
            <p className={`font-bold text-[28px] leading-none ${s.c}`}>{s.v}</p>
            <p className="text-[10px] font-normal text-[#94a3b8] mt-[3px]">{s.s}</p>
          </div>))}
      </div>

      {/* Evidence/confidence callout */}
      <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] px-[16px] py-[12px] flex items-start gap-[10px]">
        <InfoIcon />
        <p className="text-[12px] font-normal text-[#64748b] leading-[1.6]">
          <strong className="font-semibold text-[#0a0b14]">Confidence reflects evidence quality.</strong>{" "}
          High = multiple verified sources · Medium = one verified or pending verification · Low = self-assessment only.
          Low-confidence levels are flagged — submitting an assessment or project raises accuracy and roadmap reliability.
          Missing optional evidence does not count as zero; available evidence is re-weighted (BR-09).
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8eaf0] rounded-[16px] overflow-hidden">
        {/* Column headers */}
        <div className="grid items-center px-[20px] py-[10px] border-b border-[#f1f3fa] bg-[#fafbff]" style={{ gridTemplateColumns: "14px 1fr 76px 76px 52px 72px 68px 80px 88px 20px" }}>
          {["", "Skill", "Current", "Required", "Gap", "Match %", "Importance", "Criticality", "Confidence", ""].map((h, i) => (<span key={i} className="text-[9.5px] font-semibold text-[#94a3b8] uppercase tracking-wide">{h}</span>))}
        </div>

        {buckets.map(bk => bk.items.length > 0 && (<div key={bk.key}>
            {/* Bucket section header */}
            <div className={`flex items-center gap-[8px] px-[20px] py-[7px] border-b ${bk.border} ${bk.bg}`}>
              <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${bk.dot}`}/>
              <span className={`text-[11px] font-semibold ${bk.col}`}>{bk.label}</span>
              <span className="text-[11px] font-normal text-[#94a3b8]">({bk.items.length})</span>
            </div>

            {bk.items.map(gap => {
                const isExp = expanded === gap.skillId;
                const mc = gap.match >= 100 ? "#059669" : gap.match >= 70 ? "#f59e0b" : "#ef4444";
                const ct = CT[gap.confidenceLabel];
                return (<div key={gap.skillId} className={`border-b border-[#f1f3fa] last:border-0 ${isExp ? "bg-[#fafbff]" : ""}`}>
                  <button onClick={() => setExpanded(isExp ? null : gap.skillId)} className="w-full text-left hover:bg-[#f8f9fd] transition-colors">
                    <div className="grid items-center gap-[6px] px-[20px] py-[12px]" style={{ gridTemplateColumns: "14px 1fr 76px 76px 52px 72px 68px 80px 88px 20px" }}>

                      {/* Critical dot */}
                      <div className="flex items-center justify-center">
                        {gap.isCritical
                        ? <span className="w-[6px] h-[6px] rounded-full bg-[#ef4444]" title="Critical skill"/>
                        : <span />}
                      </div>

                      {/* Skill */}
                      <div>
                        <p className="font-semibold text-[13px] text-[#0a0b14] leading-tight">{gap.skillName}</p>
                        <p className="text-[10px] font-normal text-[#94a3b8]">{gap.category}</p>
                      </div>

                      {/* Current */}
                      <div>
                        <p className="font-bold text-[13px] text-[#0a0b14]">
                          {gap.currentLevel}<span className="text-[10px] text-[#94a3b8] font-normal">/{gap.maxLevel}</span>
                        </p>
                        <Bar pct={(gap.currentLevel / gap.maxLevel) * 100} color="#3b8bff"/>
                      </div>

                      {/* Required */}
                      <div>
                        <p className="font-normal text-[12px] text-[#64748b]">
                          {gap.requiredLevel}<span className="text-[10px] text-[#94a3b8]">/{gap.maxLevel}</span>
                        </p>
                        <Bar pct={(gap.requiredLevel / gap.maxLevel) * 100} color="#e2e5ef"/>
                      </div>

                      {/* Gap */}
                      <p className={`font-bold text-[13px] ${gap.gap > 0 ? "text-[#ef4444]" : "text-[#059669]"}`}>
                        {gap.gap === 0 ? "✓ 0" : `−${gap.gap}`}
                      </p>

                      {/* Match */}
                      <div>
                        <p className="font-bold text-[12px]" style={{ color: mc }}>{gap.match}%</p>
                        <Bar pct={gap.match} color={mc}/>
                      </div>

                      {/* Importance */}
                      <div>
                        <p className="text-[12px] font-medium text-[#64748b]">{Math.round(gap.importance * 100)}%</p>
                        <Bar pct={gap.importance * 100} color="#7c3aed"/>
                      </div>

                      {/* Criticality */}
                      <p className={`text-[11px] font-semibold ${gap.isCritical ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
                        {gap.isCritical ? "⚑ Critical" : "Standard"}
                      </p>

                      {/* Confidence */}
                      <div className="flex items-center gap-[5px]">
                        <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${ct.dot}`}/>
                        <div>
                          <p className={`text-[11px] font-semibold leading-tight ${ct.text}`}>{gap.confidenceLabel}</p>
                          <p className="text-[9px] font-normal text-[#d1d5db]">{Math.round(gap.confidence * 100)}%</p>
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${isExp ? "rotate-180" : ""}`}>
                        <path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExp && (<div className="px-[26px] pb-[16px] pt-[10px] border-t border-[#f1f3fa] grid gap-[16px]" style={{ gridTemplateColumns: "1fr 260px" }}>
                      <div>
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[5px]">Why this matters</p>
                        <p className="text-[12px] font-normal text-[#64748b] leading-[1.65]">{gap.explanation}</p>
                        {gap.isCritical && (<div className="flex items-start gap-[6px] mt-[8px] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] rounded-[8px] px-[10px] py-[8px]">
                            <span className="text-[11px] text-[#ef4444]">⚑</span>
                            <p className="text-[11px] font-normal text-[#ef4444]">Critical skill — a severe deficiency can trigger a readiness cap (currently: {READINESS.warning?.capApplied})</p>
                          </div>)}
                      </div>
                      <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[10px] p-[12px]">
                        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[6px]">Evidence & Confidence</p>
                        <p className="text-[11px] font-normal text-[#64748b] mb-[8px] leading-[1.5]">{gap.evidenceSummary}</p>
                        <div className="flex items-center gap-[5px] mb-[6px]">
                          <span className={`w-[6px] h-[6px] rounded-full ${ct.dot}`}/>
                          <p className={`text-[11px] font-semibold ${ct.text}`}>{gap.confidenceLabel} ({Math.round(gap.confidence * 100)}%)</p>
                        </div>
                        <Bar pct={gap.confidence * 100} color={ct.bar} h={4}/>
                        {gap.confidence < 0.65 && (<p className="text-[10px] font-normal text-[#94a3b8] mt-[6px] italic leading-[1.5]">Submit an assessment or project to raise confidence and improve roadmap accuracy.</p>)}
                      </div>
                    </div>)}
                </div>);
            })}
          </div>))}
      </div>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP TAB — phases + milestones + actions
// ═══════════════════════════════════════════════════════════════════════════════
const PHASES_META = [
    { id: 1, name: "Foundations", focus: "Baseline knowledge · Prerequisites · Initial assessments" },
    { id: 2, name: "Core Skills", focus: "Critical gaps · Required proficiency improvements" },
    { id: 3, name: "Applied Practice", focus: "Practice tasks · Simulations · Practical projects" },
    { id: 4, name: "Career Readiness", focus: "Real projects · Career preparation · Final milestones" },
];
// ── Milestone card ────────────────────────────────────────────────────────────
function MilestoneCard({ m }) {
    const ms = MS[m.status];
    const pt = PT[m.phase];
    return (<div className={`rounded-[14px] border-2 ${ms.border} p-[18px] flex gap-[14px]`} style={{ background: ms.bg.replace("bg-", "") || undefined }}>
      {/* Badge */}
      <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center text-[20px] shrink-0 border" style={{ background: ms.badgeBg, borderColor: ms.ring + "40" }}>
        {m.status === "Achieved" ? "✓" : m.status === "In Progress" ? m.badge : "🔒"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[8px] mb-[4px] flex-wrap">
          <p className="font-bold text-[14px] text-[#0a0b14]">Phase {m.phase} Milestone</p>
          <span className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${ms.text}`} style={{ background: `${ms.ring}12`, border: `1px solid ${ms.ring}30` }}>
            {m.status}
          </span>
          {m.achievedDate && <span className="text-[10px] font-normal text-[#94a3b8]">Achieved {m.achievedDate}</span>}
          {m.unlocksPhase && m.status !== "Achieved" && (<span className="text-[10px] font-normal text-[#94a3b8]">Unlocks Phase {m.unlocksPhase}</span>)}
          {m.unlocksPhase && m.status === "Achieved" && (<span className="text-[10px] font-medium text-[#059669]">✓ Phase {m.unlocksPhase} unlocked</span>)}
        </div>
        <p className="font-semibold text-[13px]" style={{ color: ms.ring }}>{m.title}</p>
        <p className="text-[12px] font-normal text-[#64748b] mt-[3px] mb-[8px]">{m.description}</p>
        {/* Criteria checklist */}
        <div className="flex flex-col gap-[4px]">
          {m.criteria.map(cr => (<div key={cr} className="flex items-start gap-[6px] text-[11px] font-normal">
              <span className={`mt-[1px] shrink-0 ${m.status === "Achieved" ? "text-[#059669]" : m.status === "In Progress" ? "text-[#94a3b8]" : "text-[#d1d5db]"}`}>
                {m.status === "Achieved" ? "✓" : "○"}
              </span>
              <span className={m.status === "Achieved" ? "text-[#059669] line-through" : m.status === "Locked" ? "text-[#94a3b8]" : "text-[#64748b]"}>{cr}</span>
            </div>))}
        </div>
      </div>
    </div>);
}
// ── Action card ────────────────────────────────────────────────────────────────
function ActionCard({ action }) {
    const [open, setOpen] = useState(action.isNBA ?? false);
    const st = ST[action.status];
    const tm = TM[action.type];
    const pt = PT[action.phase];
    const isBlocked = action.status === "Blocked";
    const isDone = action.status === "Completed";
    return (<div className={`border rounded-[14px] overflow-hidden bg-white transition-all
      ${action.isNBA ? "border-[rgba(59,139,255,0.35)] shadow-[0_0_0_3px_rgba(59,139,255,0.06)]"
            : isDone ? "border-[rgba(5,150,105,0.2)]"
                : isBlocked ? "border-[rgba(239,68,68,0.18)]"
                    : "border-[#e8eaf0]"}`}>
      {action.isNBA && <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg,#3b8bff,#7c3aed)" }}/>}

      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-start gap-[12px] px-[18px] py-[13px]">
          {/* Icon */}
          <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[16px] shrink-0 mt-[1px]
            ${isDone ? "bg-[rgba(5,150,105,0.1)]" : isBlocked ? "bg-[rgba(239,68,68,0.07)]" : action.isNBA ? "bg-[rgba(59,139,255,0.1)]" : "bg-[#f8f9fd]"}`}>
            {isDone ? "✓" : tm.emoji}
          </div>
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-[5px] mb-[4px] flex-wrap">
              <span className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full flex items-center gap-[3px] ${st.bg} ${st.text}`}>
                <span className={`w-[4px] h-[4px] rounded-full ${st.dot}`}/>{action.status}
              </span>
              <span className="text-[10px] font-normal text-[#94a3b8]">{tm.label}</span>
              {action.isCritical && <span className="text-[10px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] px-[6px] py-[1px] rounded-full font-medium">Critical</span>}
              {action.isNBA && <span className="text-[10px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.1)] px-[7px] py-[1px] rounded-full">⚡ Next Best Action</span>}
              {isBlocked && <span className="text-[10px] text-[#ef4444] font-normal">🔒 Blocked — awaiting prerequisite</span>}
            </div>
            <p className="font-semibold text-[13px] text-[#0a0b14] leading-tight mb-[2px]">{action.objective}</p>
            <div className="flex items-center gap-[12px] text-[11px] font-normal text-[#94a3b8] flex-wrap">
              <span>Skill: <span className="text-[#64748b] font-medium">{action.targetSkill}</span></span>
              {action.gap > 0 && <span>Gap: <span className="text-[#ef4444] font-medium">−{action.gap}</span></span>}
              {action.gap === 0 && <span className="text-[#059669]">Requirement met</span>}
              <span className="ml-auto">{action.estimatedEffort}</span>
              <span className="text-[#0a0b14] font-medium">{action.estimatedDuration}</span>
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 mt-[4px] transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open && (<div className="px-[18px] pb-[16px] pt-[4px] border-t border-[#f8f9fd] flex flex-col gap-[12px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <div className="bg-[#f8f9fd] rounded-[10px] p-[12px]">
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[4px]">Completion criteria</p>
              <p className="text-[12px] font-normal text-[#64748b] leading-[1.55]">{action.completionCriteria}</p>
            </div>
            <div className="bg-[#f8f9fd] rounded-[10px] p-[12px]">
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[4px]">Effort / Duration</p>
              <p className="text-[12px] font-normal text-[#64748b]">{action.estimatedEffort}</p>
              <p className="text-[12px] font-medium text-[#0a0b14]">{action.estimatedDuration}</p>
            </div>
          </div>
          {action.prerequisites.length > 0 && (<div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[5px]">Prerequisites</p>
              <div className="flex flex-col gap-[4px]">
                {action.prerequisites.map(p => (<div key={p} className={`flex items-center gap-[6px] text-[11px] font-normal ${isBlocked ? "text-[#ef4444]" : "text-[#64748b]"}`}>
                    <span>{isBlocked ? "🔒" : "✓"}</span> {p}
                  </div>))}
              </div>
            </div>)}
          <div>
            <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[4px]">Why this action</p>
            <p className="text-[12px] font-normal text-[#64748b] leading-[1.6]">{action.explanation}</p>
          </div>
          {action.unlocksWhat && (<div className="bg-[rgba(59,139,255,0.05)] border border-[rgba(59,139,255,0.15)] rounded-[10px] px-[14px] py-[10px]">
              <p className="text-[10px] font-semibold text-[rgba(59,139,255,0.6)] uppercase tracking-wide mb-[3px]">Completing this unlocks</p>
              <p className="text-[12px] font-normal text-[#3b8bff]">{action.unlocksWhat}</p>
            </div>)}
        </div>)}
    </div>);
}
function RoadmapTab({ actions, milestones }) {
    const [filterPhase, setFilterPhase] = useState("all");
    const [showMilestones, setShowMilestones] = useState(true);
    const done = actions.filter(a => a.status === "Completed").length;
    const curPhase = (actions.find(a => a.status !== "Completed")?.phase ?? 4);
    const displayActions = (filterPhase === "all" ? actions : actions.filter(a => a.phase === filterPhase))
        .slice().sort((a, b) => a.priority - b.priority);
    const filteredMilestones = filterPhase === "all" ? milestones : milestones.filter(m => m.phase === filterPhase);
    return (<div className="flex flex-col gap-[16px]">
      {/* Journey overview card */}
      <div className="bg-white border border-[#e8eaf0] rounded-[18px] p-[20px]">
        <div className="flex items-center justify-between mb-[14px]">
          <div>
            <h3 className="font-bold text-[15px] text-[#0a0b14]">Career Roadmap — Software Engineer v2.3</h3>
            <p className="text-[11px] font-normal text-[#94a3b8] mt-[2px]">
              Phase {curPhase}: {PHASES_META.find(p => p.id === curPhase)?.name} · {done}/{actions.length} actions complete
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-[24px] text-[#0a0b14] leading-none">{Math.round((done / actions.length) * 100)}%</p>
            <p className="text-[10px] font-normal text-[#94a3b8]">overall progress</p>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="w-full bg-[#f1f3fa] rounded-full h-[8px] mb-[16px]">
          <div className="h-[8px] rounded-full transition-all" style={{ width: `${(done / actions.length) * 100}%`, background: "linear-gradient(90deg,#3b8bff,#7c3aed)" }}/>
        </div>

        {/* 4 phase cards */}
        <div className="grid grid-cols-4 gap-[10px]">
          {PHASES_META.map(p => {
            const pt2 = PT[p.id];
            const pa = actions.filter(a => a.phase === p.id);
            const pd = pa.filter(a => a.status === "Completed").length;
            const m = milestones.find(m => m.phase === p.id);
            const ms2 = m ? MS[m.status] : null;
            const isCur = p.id === curPhase;
            return (<button key={p.id} onClick={() => setFilterPhase(filterPhase === p.id ? "all" : p.id)} className={`rounded-[12px] p-[12px] border transition-all text-left
                  ${filterPhase === p.id ? `border-[${pt2.accent}] shadow-[0_0_0_2px_${pt2.accent}20]`
                    : isCur ? "border-transparent" : "border-[#eef0f8]"}`} style={{ background: isCur || filterPhase === p.id ? pt2.bg : "#f8f9fd",
                    borderColor: filterPhase === p.id ? pt2.accent : isCur ? pt2.accent + "40" : "#eef0f8" }}>
                <div className="flex items-center justify-between mb-[4px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: isCur || filterPhase === p.id ? pt2.accent : "#94a3b8" }}>P{p.id}</span>
                  <span className="text-[10px] font-normal text-[#94a3b8]">{pd}/{pa.length}</span>
                </div>
                <p className="font-semibold text-[12px] mb-[6px] leading-tight" style={{ color: isCur || filterPhase === p.id ? pt2.accent : "#64748b" }}>{p.name}</p>
                <div className="w-full h-[3px] rounded-full mb-[6px]" style={{ background: pt2.track }}>
                  <div className="h-[3px] rounded-full" style={{ width: pa.length ? `${(pd / pa.length) * 100}%` : "0%", background: pt2.accent }}/>
                </div>
                {m && ms2 && (<div className="flex items-center gap-[4px]">
                    <span className="text-[8px]">{m.status === "Achieved" ? "✓" : m.status === "In Progress" ? "◑" : "🔒"}</span>
                    <span className="text-[9px] font-medium" style={{ color: ms2.ring }}>{m.status}</span>
                  </div>)}
              </button>);
        })}
        </div>
      </div>

      {/* Filter + milestone toggle */}
      <div className="flex items-center gap-[8px] flex-wrap justify-between">
        <div className="flex items-center gap-[6px] flex-wrap">
          {["all", 1, 2, 3, 4].map(f => {
            const active = filterPhase === f;
            const pt2 = f !== "all" ? PT[f] : null;
            return (<button key={f} onClick={() => setFilterPhase(f)} className={`px-[12px] py-[5px] rounded-[8px] text-[12px] font-medium transition-all border whitespace-nowrap
                  ${active && pt2 ? `text-white border-transparent`
                    : active ? "text-white border-transparent"
                        : "bg-white border-[#e8eaf0] text-[#64748b] hover:border-[#c7d2e8]"}`} style={active ? { background: pt2 ? pt2.accent : "linear-gradient(135deg,#3b8bff,#7c3aed)", borderColor: "transparent" } : undefined}>
                {f === "all" ? "All actions" : `Phase ${f} — ${PHASES_META.find(p => p.id === f)?.name}`}
              </button>);
        })}
        </div>
        <button onClick={() => setShowMilestones(!showMilestones)} className="text-[11px] font-medium text-[#3b8bff] hover:underline whitespace-nowrap">
          {showMilestones ? "Hide milestones" : "Show milestones"}
        </button>
      </div>

      {/* Milestones section */}
      {showMilestones && (<div>
          <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[10px]">
            Phase milestones — completion gates
          </p>
          <div className="flex flex-col gap-[10px]">
            {filteredMilestones.map(m => <MilestoneCard key={m.phase} m={m}/>)}
          </div>
        </div>)}

      {/* Action list */}
      <div>
        <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[10px]">
          Development actions
        </p>
        <div className="flex flex-col gap-[10px]">
          {displayActions.map(a => <ActionCard key={a.id} action={a}/>)}
        </div>
      </div>

      <p className="text-[11px] font-normal text-[#94a3b8] italic px-[2px] leading-[1.6]">
        Roadmap version <span className="font-medium not-italic">rm-2026090914</span> · 10 h/week availability · Prerequisite ordering enforced (BR-14) · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </p>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// STATE SCREENS — loading / error / incomplete / historical
// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOADING ──────────────────────────────────────────────────────────────────
function LoadingState() {
    return (<div className="flex flex-col gap-[16px]">
      {/* NBA ghost */}
      <div className="rounded-[20px] overflow-hidden px-[26px] py-[22px] flex flex-col gap-[12px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
        <div className="flex gap-[8px]"><Sk w={100} h={22} r={11}/><Sk w={160} h={14} r={6}/></div>
        <Sk w="58%" h={26} r={7}/><Sk w="82%" h={14} r={5}/>
        <div className="flex gap-[10px] mt-[4px]"><Sk w="52%" h={68} r={10}/><Sk w={164} h={68} r={10}/></div>
      </div>
      {/* Score hero */}
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "230px 1fr" }}>
          <div className="flex flex-col items-center justify-center gap-[14px] border-r border-[#f1f3fa] px-[22px] py-[28px]">
            <Sk w={162} h={162} r={81}/>
            <Sk w={100} h={26} r={13}/>
          </div>
          <div className="flex flex-col px-[24px] py-[22px] gap-[16px]">
            <div className="flex flex-col gap-[8px]"><Sk w="52%" h={18} r={6}/><Sk w="90%" h={12} r={5}/><Sk w="76%" h={12} r={5}/></div>
            <div className="flex flex-col gap-[6px]"><Sk w={110} h={10} r={4}/><Sk w="100%" h={4} r={2}/></div>
            <div className="flex flex-col gap-[6px]"><Sk w={130} h={10} r={4}/><Sk w="100%" h={9} r={5}/></div>
          </div>
        </div>
      </div>
      {/* 4 component skeletons */}
      <div className="grid grid-cols-2 gap-[12px]">
        {[0, 1, 2, 3].map(i => (<div key={i} className="bg-white border border-[#e8eaf0] rounded-[16px] p-[18px] flex flex-col gap-[10px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-[8px]"><Sk w={34} h={34} r={9}/><div className="flex flex-col gap-[5px]"><Sk w={100} h={13} r={4}/><Sk w={78} h={9} r={4}/></div></div>
              <Sk w={38} h={26} r={5}/>
            </div>
            <Sk w="100%" h={7} r={4}/>
            <Sk w="55%" h={10} r={4}/>
            <div className="border-t border-[#f8f9fd] pt-[8px] flex flex-col gap-[4px]"><Sk w="92%" h={10} r={4}/><Sk w="76%" h={10} r={4}/></div>
          </div>))}
      </div>
      <div className="flex items-center justify-center gap-[10px] py-[4px]">
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="#e2e8f0" strokeWidth="2"/>
          <path d="M7 1.5C10.59 1.5 13.5 4.41 13.5 7" stroke="url(#lspin)" strokeWidth="2" strokeLinecap="round"/>
          <defs><linearGradient id="lspin" x1="7" y1="1.5" x2="13.5" y2="7" gradientUnits="userSpaceOnUse"><stop stopColor="#3b8bff"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
        </svg>
        <span className="text-[12px] font-normal text-[#94a3b8]">Analysing your skills against <strong className="text-[#64748b] font-semibold">Software Engineer v2.3</strong>…</span>
      </div>
    </div>);
}
// 2. ERROR / FALLBACK ─────────────────────────────────────────────────────────
function ErrorState({ variant }) {
    const CFG = {
        error: { title: "Calculation failed", body: "Something went wrong during readiness analysis. No fabricated score has been saved.", icon: "✕", col: "#ef4444", canRetry: true, note: "Your previous results are intact and have not been modified." },
        timeout: { title: "Request timed out", body: "The analysis took too long to complete. No score has been generated from this attempt.", icon: "⏱", col: "#f59e0b", canRetry: true, note: "This does not affect your previous results. Try again or contact support if it persists." },
        unavailable: { title: "Intelligence service unavailable", body: "The readiness engine is temporarily offline. No score has been fabricated. Your last known result is preserved.", icon: "○", col: "#ef4444", canRetry: true, note: "Please try again shortly. If the issue persists, contact support." },
        "invalid-config": { title: "Role configuration error", body: "The selected career role has an invalid configuration and cannot be used for a production readiness calculation.", icon: "⚠", col: "#f59e0b", canRetry: false, note: "This is not your error — our team has been notified. No result can be generated until the configuration is corrected." },
    };
    const c = CFG[variant];
    return (<div className="flex flex-col gap-[16px]">
      {/* Ghost NBA */}
      <div className="rounded-[20px] border-2 border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center py-[26px] gap-[10px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
        <div className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center" style={{ background: `${c.col}18`, border: `1px solid ${c.col}30` }}>
          <span style={{ color: c.col, fontSize: 14 }}>{c.icon}</span>
        </div>
        <span className="text-[13px] font-normal text-[rgba(255,255,255,0.35)]">Next Best Action unavailable</span>
      </div>

      {/* Error card */}
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="h-[4px]" style={{ background: `linear-gradient(90deg,${c.col},${c.col}55)` }}/>
        <div className="flex flex-col items-center text-center px-[48px] py-[40px] gap-[20px]">
          <div className="w-[70px] h-[70px] rounded-[20px] flex items-center justify-center text-[26px] font-bold" style={{ background: `${c.col}10`, border: `2px solid ${c.col}25`, color: c.col }}>
            {c.icon}
          </div>
          <div>
            <h3 className="font-bold text-[20px] mb-[6px]" style={{ color: c.col }}>{c.title}</h3>
            <p className="text-[14px] font-normal text-[#64748b] max-w-[420px] leading-[1.65]">{c.body}</p>
          </div>
          <div className="flex items-start gap-[8px] bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] px-[16px] py-[12px] text-left max-w-[460px]">
            <InfoIcon />
            <p className="text-[12px] font-normal text-[#64748b] leading-[1.6]">{c.note}</p>
          </div>
          <div className="flex items-center gap-[10px]">
            {c.canRetry && (<button className="flex items-center gap-[6px] px-[20px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(59,139,255,0.3)] transition-all" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9 5.5A3.5 3.5 0 1 1 5.5 2c.96 0 1.84.39 2.47 1.03L9 2v3.5H5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Try Again
              </button>)}
            <button className="px-[20px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#64748b] bg-[#f1f3fa] hover:bg-[#e8eaf0] transition-all">Contact Support</button>
          </div>
        </div>
        {/* Preserved last result ghost */}
        <div className="border-t border-[#f1f3fa] px-[28px] py-[18px] bg-[#fafbff]">
          <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[12px]">Last successful result — preserved</p>
          <div className="grid gap-[16px] items-center opacity-35 pointer-events-none" style={{ gridTemplateColumns: "130px 1fr" }}>
            <Sk w={120} h={120} r={60} className="mx-auto"/>
            <div className="flex flex-col gap-[8px]"><Sk w="52%" h={16} r={5}/><Sk w="88%" h={12} r={4}/><Sk w="70%" h={12} r={4}/><Sk w="100%" h={6} r={3} className="mt-[4px]"/></div>
          </div>
          <p className="text-[11px] font-normal text-[#94a3b8] italic mt-[10px]">Last calculated 09 Sep 2026, 17:32 · Result preserved (BR-12)</p>
        </div>
      </div>
    </div>);
}
// 3. INCOMPLETE / EMPTY / NO-EVIDENCE ─────────────────────────────────────────
function IncompleteState({ variant }) {
    const STEPS = {
        empty: [
            { n: 1, label: "Select a career goal", sub: "Choose an approved career role target — e.g. Software Engineer, Data Analyst.", done: false, cta: "Browse Career Roles →", accent: "#3b8bff" },
            { n: 2, label: "Record your skills", sub: "Set your current skill levels so the system can calculate your gaps.", done: false, accent: "#94a3b8" },
            { n: 3, label: "Submit verified evidence", sub: "Complete assessments or add project evidence to verify your levels.", done: false, accent: "#94a3b8" },
            { n: 4, label: "Get your Readiness Score", sub: "See your personalised score, skill gaps, and career roadmap.", done: false, accent: "#94a3b8" },
        ],
        incomplete: [
            { n: 1, label: "Career goal selected", sub: "Software Engineer v2.3 is your active target.", done: true, accent: "#059669" },
            { n: 2, label: "Complete your profile", sub: "Add education and work experience — required for the Profile Completeness component.", done: false, cta: "Complete Profile →", accent: "#f59e0b" },
            { n: 3, label: "Submit evidence", sub: "At least one verified evidence item is needed for a reliable readiness score.", done: false, cta: "Add Evidence →", accent: "#f59e0b" },
            { n: 4, label: "Get your Readiness Score", sub: "Calculation runs automatically once required data is available.", done: false, accent: "#94a3b8" },
        ],
        "no-evidence": [
            { n: 1, label: "Career goal selected", sub: "Software Engineer v2.3 is your active target.", done: true, accent: "#059669" },
            { n: 2, label: "Profile complete", sub: "Your profile information is filled in.", done: true, accent: "#059669" },
            { n: 3, label: "Add verified evidence", sub: "No verified evidence found. Self-assessment only produces low-confidence provisional results.", done: false, cta: "Add Evidence →", accent: "#ef4444" },
            { n: 4, label: "Get your Readiness Score", sub: "Calculation runs once validated evidence is submitted.", done: false, accent: "#94a3b8" },
        ],
    };
    const TITLES = { empty: "No career role selected", incomplete: "Profile not complete", "no-evidence": "No verified evidence" };
    const SUBS = { empty: "Follow the steps below to unlock your personalised Career Journey.", incomplete: "A few more steps needed before we can calculate a reliable readiness score.", "no-evidence": "Submit at least one verified evidence item to generate an accurate result." };
    const ICONS = { empty: "🗺", incomplete: "📋", "no-evidence": "🔍" };
    return (<div className="flex flex-col gap-[16px]">
      {/* Ghost NBA */}
      <div className="rounded-[20px] border-2 border-dashed border-[rgba(59,139,255,0.12)] flex flex-col items-center justify-center py-[22px] gap-[7px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
        <div className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[17px] opacity-50 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">🎯</div>
        <span className="text-[12px] font-normal text-[rgba(255,255,255,0.3)]">Next Best Action will appear once your readiness is calculated</span>
      </div>

      {/* Progress card */}
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="px-[32px] pt-[28px] pb-[24px]">
          <div className="flex items-start gap-[16px] mb-[28px]">
            <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[22px] shrink-0 bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.15)]">
              {ICONS[variant]}
            </div>
            <div>
              <h3 className="font-bold text-[18px] text-[#0a0b14] mb-[4px]">{TITLES[variant]}</h3>
              <p className="text-[13px] font-normal text-[#64748b] leading-[1.6] max-w-[520px]">{SUBS[variant]}</p>
            </div>
          </div>
          <div className="flex flex-col gap-0">
            {STEPS[variant].map((s, i, arr) => (<div key={s.n} className="flex gap-[16px]">
                <div className="flex flex-col items-center">
                  <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 border-2 transition-all
                    ${s.done ? "bg-[#059669] border-[#059669] text-white" : s.cta ? "border-current bg-white text-current" : "border-[#e2e5ef] bg-white text-[#94a3b8]"}`} style={s.cta && !s.done ? { borderColor: s.accent, color: s.accent } : undefined}>
                    {s.done ? "✓" : s.n}
                  </div>
                  {i < arr.length - 1 && <div className="w-[2px] my-[4px]" style={{ flex: 1, background: s.done ? "#d1fae5" : "#f1f3fa", minHeight: 20 }}/>}
                </div>
                <div className={`min-w-0 ${i < arr.length - 1 ? "pb-[20px]" : ""}`}>
                  <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
                    <p className={`font-semibold text-[14px] leading-tight ${s.done ? "text-[#059669]" : s.cta ? "text-[#0a0b14]" : "text-[#94a3b8]"}`}>{s.label}</p>
                    {s.done && <span className="text-[10px] font-medium text-[#059669] bg-[rgba(5,150,105,0.08)] px-[7px] py-[2px] rounded-full">Done</span>}
                    {!s.done && s.cta && <span className="text-[10px] font-medium px-[7px] py-[2px] rounded-full border" style={{ color: s.accent, background: `${s.accent}10`, borderColor: `${s.accent}30` }}>Required</span>}
                  </div>
                  <p className="text-[12px] font-normal text-[#94a3b8] leading-[1.55] mb-[7px]">{s.sub}</p>
                  {s.cta && <button className="text-[12px] font-semibold px-[14px] py-[6px] rounded-[8px] border transition-all" style={{ color: s.accent, borderColor: `${s.accent}40`, background: `${s.accent}08` }}>{s.cta}</button>}
                </div>
              </div>))}
          </div>
        </div>
        {/* Preview ghost */}
        <div className="border-t border-[#f1f3fa] px-[32px] py-[18px] bg-[#fafbff]">
          <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[10px]">What you will see once ready</p>
          <div className="grid grid-cols-4 gap-[10px] opacity-30 pointer-events-none">
            {["Readiness Score", "Skill Gaps", "Career Roadmap", "Next Best Action"].map(l => (<div key={l} className="bg-white border border-[#e8eaf0] rounded-[12px] p-[12px] flex flex-col gap-[6px]">
                <Sk w="70%" h={10} r={4}/><Sk w="100%" h={22} r={6}/><Sk w="55%" h={10} r={4}/>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
// 4. HISTORICAL VERSION STATE ─────────────────────────────────────────────────
function HistoricalState({ onViewLatest }) {
    const HIST = [
        { v: "v2.3", date: "9 Sep 2026", score: 67, band: "Progressing", algo: "v1.4.2", cfg: "v2.1", isViewing: true },
        { v: "v2.2", date: "2 Aug 2026", score: 58, band: "Developing", algo: "v1.3.1", cfg: "v2.0", isViewing: false },
        { v: "v2.1", date: "15 Jul 2026", score: 44, band: "Developing", algo: "v1.3.0", cfg: "v1.9", isViewing: false },
    ];
    return (<div className="flex flex-col gap-[16px]">
      {/* Viewing banner */}
      <div className="flex items-center gap-[14px] bg-[rgba(100,116,139,0.07)] border border-[rgba(100,116,139,0.2)] rounded-[14px] px-[18px] py-[13px]">
        <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(100,116,139,0.12)] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#64748b" strokeWidth="1.3"/><path d="M8 4.5V8.5L10.5 10" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-[#0a0b14]">Viewing historical result — 9 Sep 2026</p>
          <p className="text-[11px] font-normal text-[#64748b]">Role v2.3 · Algorithm v1.4.2 · Config v2.1 · This snapshot is read-only. Your skills may have changed since this calculation.</p>
        </div>
        <button onClick={onViewLatest} className="shrink-0 px-[14px] py-[7px] rounded-[9px] text-[12px] font-semibold text-white whitespace-nowrap transition-all shadow-[0_2px_8px_rgba(59,139,255,0.25)]" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>
          View Current →
        </button>
      </div>

      {/* Version timeline */}
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[#f1f3fa] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[15px] text-[#0a0b14]">Readiness history — Software Engineer</h3>
            <p className="text-[11px] font-normal text-[#94a3b8] mt-[2px]">All snapshots are immutable · Scores cannot be retroactively modified (BR-13)</p>
          </div>
          <span className="text-[11px] font-medium text-[#94a3b8] bg-[#f1f3fa] px-[10px] py-[4px] rounded-full">{HIST.length} snapshots</span>
        </div>
        <div className="px-[24px] py-[20px] flex flex-col gap-0">
          {HIST.map((h, i) => {
            const bt2 = BAND[h.band];
            const prev = HIST[i + 1];
            const delta = prev ? h.score - prev.score : null;
            const r2 = 20;
            const C2 = 2 * Math.PI * r2;
            const arc2 = C2 * 0.75;
            return (<div key={h.v} className="flex gap-[16px]">
                <div className="flex flex-col items-center">
                  <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                    ${h.isViewing ? "border-[#3b8bff] bg-[rgba(59,139,255,0.1)]" : "border-[#e2e5ef] bg-white"}`}>
                    {h.isViewing ? <span className="w-[10px] h-[10px] rounded-full bg-[#3b8bff]"/> : <span className="w-[8px] h-[8px] rounded-full bg-[#d1d5db]"/>}
                  </div>
                  {i < HIST.length - 1 && <div className="w-[2px] my-[4px]" style={{ background: "#f1f3fa", minHeight: 20, flex: 1 }}/>}
                </div>
                <div className={`flex-1 ${i < HIST.length - 1 ? "mb-[20px]" : ""}`}>
                  <div className={`rounded-[14px] border p-[16px] transition-all ${h.isViewing ? "border-[rgba(59,139,255,0.3)] bg-[rgba(59,139,255,0.03)]" : "border-[#f1f3fa] bg-[#fafbff]"}`}>
                    <div className="flex items-center justify-between gap-[12px] flex-wrap">
                      <div className="flex items-center gap-[12px]">
                        {/* Mini gauge */}
                        <div className="relative w-[52px] h-[52px] shrink-0">
                          <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r={r2} fill="none" stroke="#eef0f8" strokeWidth="5" strokeDasharray={`${arc2} ${C2 - arc2}`} strokeLinecap="round" transform="rotate(135 26 26)"/>
                            <circle cx="26" cy="26" r={r2} fill="none" stroke={bt2.stop0} strokeWidth="5" strokeDasharray={`${arc2 * h.score / 100} ${C2 - arc2 * h.score / 100}`} strokeLinecap="round" transform="rotate(135 26 26)"/>
                            <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0a0b14" fontFamily="Inter,sans-serif">{h.score}</text>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                            <span className="font-bold text-[16px] text-[#0a0b14]">{h.score}/100</span>
                            <span className={`text-[11px] font-medium px-[7px] py-[2px] rounded-full ${bt2.bg} ${bt2.border} ${bt2.text}`}>{h.band}</span>
                            {h.isViewing && <span className="text-[10px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.1)] px-[7px] py-[2px] rounded-full">Viewing</span>}
                            {delta !== null && <span className={`text-[11px] font-medium ${delta > 0 ? "text-[#059669]" : "text-[#ef4444]"}`}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts</span>}
                          </div>
                          <p className="text-[11px] font-normal text-[#94a3b8]">{h.date} · Role {h.v} · Algo {h.algo} · Config {h.cfg}</p>
                        </div>
                      </div>
                      {/* Mini component bars */}
                      <div className="flex gap-[6px] items-end shrink-0">
                        {[["SM", 74], ["PE", 52], ["AR", 68], ["PC", 80]].map(([l, v]) => (<div key={l} className="flex flex-col items-center gap-[3px]">
                            <div className="w-[6px] bg-[#f1f3fa] rounded-full relative" style={{ height: 28 }}>
                              <div className="absolute bottom-0 w-full rounded-full" style={{ height: `${v * 28 / 100}px`, background: bt2.stop0 }}/>
                            </div>
                            <span className="text-[8px] font-normal text-[#94a3b8]">{l}</span>
                          </div>))}
                      </div>
                    </div>
                    {delta !== null && (<div className="mt-[10px] pt-[10px] border-t border-[#f1f3fa] text-[11px] font-normal text-[#64748b]">
                        Progress since previous snapshot: <span className={`font-semibold ${delta > 0 ? "text-[#059669]" : "text-[#ef4444]"}`}>{delta > 0 ? "+" : ""}{delta} pts ({HIST[i + 1].score} → {h.score})</span>
                      </div>)}
                  </div>
                </div>
              </div>);
        })}
        </div>
        <div className="border-t border-[#f1f3fa] px-[24px] py-[12px] bg-[#fafbff] flex items-center gap-[7px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#94a3b8" strokeWidth="1"/><path d="M6 4v3l2 1" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round"/></svg>
          <p className="text-[11px] font-normal text-[#94a3b8]">Historical snapshots are immutable — scores cannot be retroactively changed. Each snapshot references the exact role version, algorithm, and configuration used at calculation time.</p>
        </div>
      </div>

      {/* Historical readiness content — read-only */}
      <div className="opacity-65 pointer-events-none select-none">
        <ReadinessTab data={READINESS}/>
      </div>
    </div>);
}
export default function CareerJourneyView({ status = "loaded", onViewLatest }) {
    const [tab, setTab] = useState("readiness");
    const nba = ACTIONS.find(a => a.isNBA);
    const isLoaded = status === "loaded";
    const TABS = [
        { key: "readiness", label: "Readiness Score" },
        { key: "skill-gap", label: "Skill Gaps" },
        { key: "roadmap", label: "Career Roadmap" },
    ];
    const isError = status === "error" || status === "timeout" || status === "unavailable" || status === "invalid-config";
    const isIncomplete = status === "empty" || status === "incomplete" || status === "no-evidence";
    return (<div className="flex flex-col h-full overflow-hidden bg-[#f1f3fa]">

      {/* Page header */}
      <div className="bg-[#f1f3fa] px-[32px] pt-[24px] pb-[14px] shrink-0 border-b border-[#e8eaf0]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-[26px] text-[#0a0b14] leading-tight">Career Journey</h1>
            <p className="font-normal text-[13px] text-[#64748b] mt-[3px]">
              Readiness · Skill Gaps · Roadmap for{" "}
              <span className="font-semibold text-[#0a0b14]">Software Engineer</span>{" "}
              <span className="text-[#94a3b8]">v2.3</span>
            </p>
          </div>
          {status === "historical" && (<div className="flex items-center gap-[6px] bg-[rgba(100,116,139,0.08)] border border-[rgba(100,116,139,0.18)] px-[12px] py-[7px] rounded-[10px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#94a3b8" strokeWidth="1"/><path d="M6 3.5V6.5l1.5 1" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="text-[12px] font-medium text-[#64748b]">Historical · 9 Sep 2026</span>
            </div>)}
        </div>
        {/* Tabs — always visible, dimmed when not loaded */}
        <div className={`flex items-center gap-[4px] mt-[14px] bg-[rgba(0,0,0,0.04)] p-[3px] rounded-[10px] w-fit transition-opacity ${isLoaded ? "opacity-100" : "opacity-35 pointer-events-none"}`}>
          {TABS.map(t => (<button key={t.key} onClick={() => setTab(t.key)} className={`px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition-all whitespace-nowrap
                ${tab === t.key ? "bg-white text-[#0a0b14] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#64748b] hover:text-[#0a0b14]"}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[32px] py-[20px]">
        {status === "loading" && <LoadingState />}
        {isError && <ErrorState variant={status}/>}
        {isIncomplete && <IncompleteState variant={status}/>}
        {status === "historical" && <HistoricalState onViewLatest={() => onViewLatest?.()}/>}
        {isLoaded && (<>
            {tab === "readiness" && <><NBABanner action={nba}/><ReadinessTab data={READINESS}/></>}
            {tab === "skill-gap" && <SkillGapTab gaps={GAPS}/>}
            {tab === "roadmap" && <RoadmapTab actions={ACTIONS} milestones={MILESTONES}/>}
          </>)}
      </div>

    </div>);
}
