import { useState, useRef, useEffect } from "react";
import { askAssistant, unwrapApiData } from "../../api";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const PRIVACY_MSG = {
  id: "privacy",
  role: "system",
  type: "privacy",
  text: "",
  timestamp: "now",
};
const WELCOME_MSGS = [
  {
    id: "a-welcome",
    role: "assistant",
    type: "text",
    timestamp: "14:30",
    text: "Hi Ahmed! I'm your SkillSpan assistant. I can help you understand your readiness score, skill gaps, career roadmap, and project recommendations — all based on your verified profile data.\n\nWhat would you like to explore today?",
  },
];
const READINESS_MSGS = [
  { id: "u-1", role: "user", type: "text", timestamp: "14:31", text: "Why is my readiness score only 67?" },
  {
    id: "a-readiness",
    role: "assistant",
    type: "readiness",
    timestamp: "14:31",
    text: "Your **67/100 Readiness Score** for **Software Engineer v2.3** breaks down across four components. Here is what is holding it back:",
    payload: {
      score: 67,
      band: "Progressing",
      components: [
        {
          label: "Skill Match",
          weight: 65,
          score: 68,
          contribution: 44,
          color: "#3b8bff",
          note: "Python (L3→L4 required) and System Design (L2→L3 required) are your two largest gaps dragging this component down.",
        },
        {
          label: "Practical Experience",
          weight: 20,
          score: 55,
          contribution: 11,
          color: "#7c3aed",
          note: "You have 2 verified project evidence items. Completing the REST API Practice Task adds a third.",
        },
        {
          label: "Assessment Reliability",
          weight: 10,
          score: 70,
          contribution: 7,
          color: "#f59e0b",
          note: "System Design evidence is currently Self-Assessment Only (Low confidence). A verified assessment would raise this.",
        },
        {
          label: "Profile Completeness",
          weight: 5,
          score: 90,
          contribution: 5,
          color: "#059669",
          note: "Profile is well-completed.",
        },
      ],
      next: "Your quickest path to 75+ is completing the REST API Practice Task, which adds Practical Experience and closes your Python gap simultaneously.",
    },
  },
];
const SKILL_GAP_MSGS = [
  { id: "u-2", role: "user", type: "text", timestamp: "14:32", text: "Why do I need to improve Python to level 4?" },
  {
    id: "a-skillgap",
    role: "assistant",
    type: "skill-gap",
    timestamp: "14:32",
    text: "Here is a detailed breakdown of your **Python** skill gap and why it matters for your target role:",
    payload: {
      skillName: "Python",
      category: "Programming",
      yourLevel: 3,
      requiredLevel: 4,
      maxLevel: 5,
      gap: 1,
      isCritical: false,
      confidence: "Medium",
      evidenceSummary:
        "2 verified items — Python Fundamentals Assessment (L3, Sep 2026) + SQL & Python Mini-Project (L3, Aug 2026)",
      importance: "High",
      explanation:
        "Python at Level 4 is required because Software Engineers at this seniority are expected to write production-quality, idiomatic code — not just scripts. This includes proper error handling, type annotations, async patterns, and testable module design. Your current Level 3 shows solid fundamentals but the gap means your code quality evidence does not yet demonstrate production readiness.",
      roadmapAction: "REST API with Python & PostgreSQL — Practice Task (Phase 3, your Next Best Action)",
      limitationNote:
        "Your evidence is from Aug–Sep 2026. If you have completed additional Python work since then, adding evidence would update this assessment.",
    },
  },
];
const ROADMAP_MSGS = [
  { id: "u-3", role: "user", type: "text", timestamp: "14:33", text: "What should I do next on my roadmap?" },
  {
    id: "a-roadmap",
    role: "assistant",
    type: "roadmap",
    timestamp: "14:33",
    text: "Based on your current skill gaps and roadmap progress, here is your **Next Best Action** and the broader Phase 3 context:",
    payload: {
      nba: {
        title: "Build a REST API with Python & PostgreSQL",
        type: "Practice Task",
        phase: 3,
        phaseName: "Applied Practice",
        effort: "12–16 h over 2–3 weeks",
        why: "Addresses your highest-priority gap (Python L3→L4) and simultaneously generates verified Practical Experience evidence. Completing it unlocks Phase 3 milestone.",
        unlocks: "Phase 3 completion milestone + System Design Simulation (Phase 3)",
      },
      upNext: [
        { title: "Scalable Chat System — System Design Simulation", type: "Simulation Project", phase: 3 },
        { title: "React Intermediate Assessment", type: "Assessment", phase: 3 },
      ],
      phaseProgress: 1,
      phaseName: "Applied Practice",
      limitationNote:
        "Roadmap order is based on skill gaps as of 9 Sep 2026. Completing new evidence may reorder priorities.",
    },
  },
];
const PROJECT_MSGS = [
  {
    id: "u-4",
    role: "user",
    type: "text",
    timestamp: "14:34",
    text: "Why was the REST API project recommended to me?",
  },
  {
    id: "a-project",
    role: "assistant",
    type: "project-rec",
    timestamp: "14:34",
    text: "This project was recommended because it aligns strongly with your active skill gaps and career roadmap. Here is the full match explanation:",
    payload: {
      projectTitle: "Build a REST API with Python & PostgreSQL",
      matchScore: 91,
      matchedSkills: [
        "Python (L3, meets min L3)",
        "SQL (L3, meets min L3)",
        "REST API Design (L2, meets min L2)",
        "Git & CI/CD (L2, meets min L2)",
      ],
      gaps: ["System Design (yours L2, required L3) — does not block eligibility but is a growth target"],
      learningValue: [
        { skill: "Python", gain: "+1 Level (L3→L4)", impact: "High" },
        { skill: "REST API Design", gain: "+1 Level (L2→L3)", impact: "High" },
        { skill: "SQL", gain: "Verified Evidence", impact: "Medium" },
      ],
      eligibility: "Eligible",
      availabilityNote: "4 of 6 spots remaining. Deadline: 29 Sep 2026.",
      limitations:
        "Match score is based on your profile as of 9 Sep 2026. Recommendation does not guarantee project acceptance — the project owner makes the final decision.",
      rank: 1,
    },
  },
];
const UNCERTAINTY_MSGS = [
  {
    id: "u-5",
    role: "user",
    type: "text",
    timestamp: "14:35",
    text: "Will I definitely get a job as a Software Engineer after completing this roadmap?",
  },
  {
    id: "a-uncertainty",
    role: "assistant",
    type: "uncertainty",
    timestamp: "14:35",
    text: "",
    payload: {
      category: "out-of-scope",
      explanation:
        "I cannot provide employment guarantees. Completing your career roadmap improves your verified skill profile and practical experience — which are valuable signals for hiring — but employment outcomes depend on many factors outside SkillSpan: job market conditions, individual employer decisions, interview performance, and more.",
      canHelp:
        "What I can help with: understanding your current readiness score, identifying which specific skill gaps to close next, explaining project and learning recommendations, and helping you plan your next learning step.",
      boundaryType: "no-guarantee",
    },
  },
];
const UNAVAILABLE_MSGS = [
  { id: "u-6", role: "user", type: "text", timestamp: "14:36", text: "Can you explain my skill gaps in detail?" },
  {
    id: "a-unavailable",
    role: "assistant",
    type: "uncertainty",
    timestamp: "14:36",
    text: "",
    payload: {
      category: "service-unavailable",
      explanation:
        "I am currently unable to retrieve your skill-gap data. The intelligence service returned an error and I will not provide a fabricated response.",
      canHelp:
        "Your last readiness result (67/100, calculated 9 Sep 2026) is still available in your Career Journey view. You can review your skill gaps there while the service is unavailable.",
      boundaryType: "unavailable",
    },
  },
];
const SCENARIOS = [
  { key: "welcome", label: "Welcome", messages: WELCOME_MSGS },
  { key: "readiness", label: "Readiness", messages: [...WELCOME_MSGS, ...READINESS_MSGS] },
  { key: "skill-gap", label: "Skill Gap", messages: [...WELCOME_MSGS, ...SKILL_GAP_MSGS] },
  { key: "roadmap", label: "Roadmap", messages: [...WELCOME_MSGS, ...ROADMAP_MSGS] },
  { key: "project-rec", label: "Project Rec", messages: [...WELCOME_MSGS, ...PROJECT_MSGS] },
  { key: "uncertainty", label: "Uncertainty", messages: [...WELCOME_MSGS, ...UNCERTAINTY_MSGS] },
  { key: "unavailable", label: "Service Unavailable", messages: [...WELCOME_MSGS, ...UNAVAILABLE_MSGS] },
];
const SUGGESTED_QUESTIONS = [
  { text: "Why is my readiness score 67?", intent: "explain_readiness" },
  { text: "What should I do next on my roadmap?", intent: "explain_next_best_action" },
  { text: "Why was the REST API project recommended to me?", intent: "explain_project_recommendation" },
  { text: "What skills am I missing for Software Engineer?", intent: "explain_skill_gap" },
  { text: "Explain my System Design skill gap", intent: "explain_skill_gap" },
  { text: "How do I improve my Practical Experience score?", intent: "explain_readiness" },
];

function inferAssistantIntent(question) {
  const q = question.toLowerCase();
  if (/readiness|score|جاهزي|درجة/.test(q)) return "explain_readiness";
  if (/skill gap|skill.?gap|missing skill|skills? .*missing|فجوة|مهار/.test(q)) return "explain_skill_gap";
  if (/roadmap|career path|مسار|خطة/.test(q)) return "explain_roadmap";
  if (/next|do next|should i do|التالي|الخطوة/.test(q)) return "explain_next_best_action";
  if (/how do i (build|implement|fix|use)|implementation|build this|implement this|كيف (أبني|أنفذ|أصلح|أستخدم)|تنفيذ/.test(q)) return "project_bounded_help";
  if (/project|recommended|recommendation|مشروع|موصى/.test(q)) return "explain_project_recommendation";
  return "explain_readiness";
}
// ═══════════════════════════════════════════════════════════════════════════════
// REPORT POPOVER
// ═══════════════════════════════════════════════════════════════════════════════
function ReportPopover({ onReport, onClose }) {
  const reasons = [
    { key: "unsafe", label: "Unsafe", desc: "Contains harmful or inappropriate content" },
    { key: "irrelevant", label: "Irrelevant", desc: "Does not address my question" },
    { key: "unfair", label: "Unfair", desc: "Biased or discriminatory" },
    { key: "incorrect", label: "Incorrect", desc: "Factually wrong or misleading" },
  ];
  return (
    <div className="absolute right-0 bottom-[32px] w-[230px] bg-white border border-[#e8eaf0] rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
      <div className="px-[14px] pt-[12px] pb-[8px] border-b border-[#f1f3fa]">
        <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
          Report this response
        </p>
        <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[1px]">
          Reports are reviewed by the SkillSpan team
        </p>
      </div>
      {reasons.map((r) => (
        <button
          key={r.key}
          onClick={() => onReport(r.key)}
          className="w-full text-left px-[14px] py-[8px] hover:bg-[#f8f9fd] transition-colors flex flex-col gap-[1px]"
        >
          <span className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14]">{r.label}</span>
          <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">{r.desc}</span>
        </button>
      ))}
      <button
        onClick={onClose}
        className="w-full text-center py-[8px] text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] hover:text-[#64748b] border-t border-[#f1f3fa]"
      >
        Cancel
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE CARDS (structured responses)
// ═══════════════════════════════════════════════════════════════════════════════
function ReadinessCard({ payload }) {
  const components = payload.components;
  const score = payload.score;
  const band = payload.band;
  const r = (size) => size / 2 - 5;
  const sz = 72;
  const C = 2 * Math.PI * r(sz);
  const filled = (score / 100) * C;
  return (
    <div className="mt-[10px] flex flex-col gap-[10px]">
      {/* Score mini gauge */}
      <div className="flex items-center gap-[12px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] px-[14px] py-[12px]">
        <div className="relative shrink-0" style={{ width: sz, height: sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
            <circle cx={sz / 2} cy={sz / 2} r={r(sz)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle
              cx={sz / 2}
              cy={sz / 2}
              r={r(sz)}
              fill="none"
              stroke="url(#assGrad)"
              strokeWidth="5"
              strokeDasharray={`${filled} ${C - filled}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${sz / 2} ${sz / 2})`}
            />
            <defs>
              <linearGradient id="assGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b8bff" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-white leading-none">
              {score}
            </span>
            <span className="text-[8px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.45)]">/ 100</span>
          </div>
        </div>
        <div>
          <p className="font-['Inter:Bold',sans-serif] font-bold text-[14px] text-white">{band}</p>
          <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.5)] mt-[1px]">
            Software Engineer v2.3
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-[6px]">
        {components.map((c) => (
          <div
            key={c.label}
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-[10px]"
          >
            <div className="flex items-center justify-between mb-[5px]">
              <div className="flex items-center gap-[6px]">
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[rgba(255,255,255,0.8)]">
                  {c.label}
                </span>
              </div>
              <div className="flex items-center gap-[8px] text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)]">
                <span>{c.weight}% weight</span>
                <span className="font-['Inter:Bold',sans-serif] font-bold" style={{ color: c.color }}>
                  {c.score}/100
                </span>
              </div>
            </div>
            <div className="w-full h-[4px] rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden mb-[6px]">
              <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: c.color }} />
            </div>
            <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.45)] leading-[1.5]">
              {c.note}
            </p>
          </div>
        ))}
      </div>
      {payload.next && (
        <div className="flex items-start gap-[7px] bg-[rgba(59,139,255,0.12)] border border-[rgba(59,139,255,0.25)] rounded-[10px] px-[12px] py-[9px]">
          <span className="text-[12px] shrink-0">⚡</span>
          <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.7)] leading-[1.5]">
            {payload.next}
          </p>
        </div>
      )}
    </div>
  );
}
function SkillGapCard({ payload }) {
  const yourLevel = payload.yourLevel;
  const reqLevel = payload.requiredLevel;
  const max = payload.maxLevel;
  const met = yourLevel >= reqLevel;
  return (
    <div className="mt-[10px] flex flex-col gap-[8px]">
      {/* Level visual */}
      <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] p-[12px]">
        <div className="flex items-center justify-between mb-[8px]">
          <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] text-white">{payload.skillName}</span>
          <span
            className={`text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold px-[7px] py-[2px] rounded-full ${met ? "text-[#34d399] bg-[rgba(52,211,153,0.15)]" : "text-[#f87171] bg-[rgba(248,113,113,0.15)]"}`}
          >
            {met ? "Met" : `Gap: −${reqLevel - yourLevel}`}
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[8px] rounded-full"
              style={{
                background:
                  i < yourLevel
                    ? met
                      ? "#059669"
                      : "#f59e0b"
                    : i < reqLevel
                      ? "rgba(239,68,68,0.3)"
                      : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-[4px] text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.35)]">
          <span>Your level: L{yourLevel}</span>
          <span>Required: L{reqLevel}</span>
          <span>Max: L{max}</span>
        </div>
      </div>
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[10px] divide-y divide-[rgba(255,255,255,0.06)]">
        {[
          { l: "Importance", v: payload.importance },
          { l: "Confidence", v: payload.confidence },
          { l: "Evidence", v: payload.evidenceSummary },
          { l: "Roadmap action", v: payload.roadmapAction },
        ].map((row) => (
          <div key={row.l} className="flex gap-[8px] px-[12px] py-[8px]">
            <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[rgba(255,255,255,0.35)] w-[90px] shrink-0">
              {row.l}
            </span>
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.65)] leading-[1.5] flex-1">
              {row.v}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-[rgba(255,255,255,0.05)] rounded-[10px] px-[12px] py-[9px]">
        <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.55)] leading-[1.6]">
          {payload.explanation}
        </p>
      </div>
      {payload.limitationNote && (
        <div className="flex items-start gap-[6px] px-[12px] py-[9px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[10px]">
          <span className="text-[11px] shrink-0 mt-[1px]">ℹ</span>
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.5)] leading-[1.5]">
            {payload.limitationNote}
          </p>
        </div>
      )}
    </div>
  );
}
function RoadmapCard({ payload }) {
  const nba = payload.nba;
  const upNext = payload.upNext;
  return (
    <div className="mt-[10px] flex flex-col gap-[8px]">
      {/* NBA */}
      <div
        className="relative overflow-hidden rounded-[12px] p-[14px]"
        style={{ background: "linear-gradient(130deg,rgba(59,139,255,0.15),rgba(124,58,237,0.15))" }}
      >
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#3b8bff,transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-[6px] mb-[6px]">
            <span className="text-[10px] font-['Inter:Bold',sans-serif] font-bold text-[#7ca8ff] bg-[rgba(59,139,255,0.2)] px-[7px] py-[2px] rounded-full">
              ⚡ Next Best Action
            </span>
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)]">
              Phase {nba.phase} · {nba.phaseName}
            </span>
          </div>
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] text-white mb-[4px]">
            {nba.title}
          </p>
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)] mb-[6px]">
            {nba.type} · {nba.effort}
          </p>
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)] leading-[1.5] mb-[6px]">
            {nba.why}
          </p>
          <div className="flex items-center gap-[6px]">
            <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.35)]">Unlocks:</span>
            <span className="text-[9px] font-['Inter:Medium',sans-serif] font-medium text-[rgba(255,255,255,0.5)]">
              {nba.unlocks}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[4px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wide px-[2px]">
          After NBA — coming up
        </p>
        {upNext.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[9px] px-[10px] py-[7px]"
          >
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.35)] shrink-0">
              Phase {a.phase}
            </span>
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)] flex-1 leading-tight">
              {a.title}
            </span>
            <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.3)] shrink-0">
              {a.type}
            </span>
          </div>
        ))}
      </div>
      {payload.limitationNote && (
        <div className="flex items-start gap-[6px] px-[12px] py-[9px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[10px]">
          <span className="text-[11px] shrink-0">ℹ</span>
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.5)] leading-[1.5]">
            {payload.limitationNote}
          </p>
        </div>
      )}
    </div>
  );
}
function ProjectRecCard({ payload }) {
  const matched = payload.matchedSkills;
  const gaps = payload.gaps;
  const learning = payload.learningValue;
  const impCol = (imp) => (imp === "High" ? "#34d399" : imp === "Medium" ? "#fbbf24" : "#94a3b8");
  return (
    <div className="mt-[10px] flex flex-col gap-[8px]">
      {/* Header */}
      <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] px-[14px] py-[11px] flex items-center gap-[10px]">
        <div className="w-[36px] h-[36px] rounded-[9px] bg-[rgba(59,139,255,0.15)] border border-[rgba(59,139,255,0.25)] flex items-center justify-center text-[14px] shrink-0">
          🔧
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] text-white leading-tight">
            {payload.projectTitle}
          </p>
          <div className="flex items-center gap-[6px] mt-[2px]">
            <span className="text-[9px] font-['Inter:Bold',sans-serif] font-bold text-[#34d399]">
              ✓ {payload.eligibility}
            </span>
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">·</span>
            <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)]">
              Rank #{payload.rank}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-['Inter:Bold',sans-serif] font-bold text-[18px] text-[#34d399] leading-none">
            {payload.matchScore}
          </p>
          <p className="text-[8px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.35)]">% match</p>
        </div>
      </div>
      {/* Skills met */}
      <div className="bg-[rgba(5,150,105,0.08)] border border-[rgba(5,150,105,0.2)] rounded-[10px] px-[12px] py-[9px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(52,211,153,0.7)] uppercase tracking-wide mb-[5px]">
          Skills matched ({matched.length})
        </p>
        {matched.map((s) => (
          <div key={s} className="flex items-center gap-[5px] py-[2px]">
            <span className="text-[10px] text-[#34d399]">✓</span>
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)]">{s}</span>
          </div>
        ))}
      </div>
      {/* Gaps */}
      {gaps.length > 0 && (
        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[10px] px-[12px] py-[9px]">
          <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(251,191,36,0.7)] uppercase tracking-wide mb-[5px]">
            Gaps / growth targets
          </p>
          {gaps.map((g) => (
            <div key={g} className="flex items-start gap-[5px] py-[2px]">
              <span className="text-[10px] text-[#fbbf24] shrink-0 mt-[1px]">△</span>
              <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)] leading-[1.5]">
                {g}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Learning value */}
      <div className="flex flex-col gap-[3px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wide px-[2px]">
          What you gain
        </p>
        {learning.map((lv) => (
          <div
            key={lv.skill}
            className="flex items-center justify-between bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-[10px] py-[6px]"
          >
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.6)]">
              {lv.skill}
            </span>
            <div className="flex items-center gap-[6px]">
              <span
                className="text-[10px] font-['Inter:Bold',sans-serif] font-bold"
                style={{ color: impCol(lv.impact) }}
              >
                {lv.gain}
              </span>
              <span className="text-[9px] font-['Inter:Regular',sans-serif]" style={{ color: impCol(lv.impact) }}>
                {lv.impact}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Limitation */}
      <div className="flex items-start gap-[6px] px-[12px] py-[9px] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[10px]">
        <span className="text-[11px] shrink-0">ℹ</span>
        <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.5)] leading-[1.5]">
          {payload.limitations}
        </p>
      </div>
    </div>
  );
}
function UncertaintyCard({ payload }) {
  const isUnavailable = payload.boundaryType === "unavailable";
  return (
    <div className="mt-[10px] flex flex-col gap-[8px]">
      <div
        className={`flex items-start gap-[10px] rounded-[12px] p-[14px] border ${isUnavailable ? "bg-[rgba(239,68,68,0.07)] border-[rgba(239,68,68,0.2)]" : "bg-[rgba(148,163,184,0.07)] border-[rgba(148,163,184,0.15)]"}`}
      >
        <span className="text-[16px] shrink-0">{isUnavailable ? "🔌" : "🤔"}</span>
        <div>
          <p
            className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] mb-[4px]"
            style={{ color: isUnavailable ? "#f87171" : "rgba(255,255,255,0.75)" }}
          >
            {isUnavailable ? "Service temporarily unavailable" : "Outside my guidance scope"}
          </p>
          <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.55)] leading-[1.6]">
            {payload.explanation}
          </p>
        </div>
      </div>
      <div className="bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.2)] rounded-[10px] px-[12px] py-[9px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(124,168,255,0.8)] uppercase tracking-wide mb-[4px]">
          What I can help with
        </p>
        <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.55)] leading-[1.5]">
          {payload.canHelp}
        </p>
      </div>
    </div>
  );
}
function PrivacyBanner() {
  return (
    <div className="mx-[12px] mt-[12px] bg-[rgba(59,139,255,0.07)] border border-[rgba(59,139,255,0.15)] rounded-[12px] p-[14px]">
      <div className="flex items-center gap-[7px] mb-[6px]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L2 3.5v3.5C2 9.14 3.9 11 6 11s4-1.86 4-4V3.5L6 1z"
            stroke="#7ca8ff"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#7ca8ff]">Privacy & scope</p>
      </div>
      <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.45)] leading-[1.6] mb-[6px]">
        The assistant uses your verified SkillSpan profile data — including readiness scores, skill gaps, roadmap, and
        project recommendations. Only your own data is used.
      </p>
      <div className="flex flex-col gap-[3px]">
        {[
          "Will not complete assignments or submit deliverables on your behalf",
          "Will not fabricate skills, evidence, or achievements",
          "Will not guarantee employment or project acceptance",
          "Will not override eligibility rules or readiness calculations",
        ].map((b) => (
          <div key={b} className="flex items-start gap-[5px]">
            <span className="text-[8px] text-[rgba(255,255,255,0.3)] mt-[2px] shrink-0">✕</span>
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)] leading-[1.4]">
              {b}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ChatMessage({ msg, onReport }) {
  const [showReport, setShowReport] = useState(false);
  if (msg.type === "privacy") return <PrivacyBanner />;
  if (msg.role === "system") return null;
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-[10px] px-[12px] py-[6px] ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0 mt-[2px]">
          ⚡
        </div>
      )}

      {/* Bubble */}
      <div className={`flex flex-col gap-[4px] max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-[14px] px-[13px] py-[10px] text-[12px] font-['Inter:Regular',sans-serif] leading-[1.65]
          ${
            isUser
              ? "bg-gradient-to-br from-[#3b8bff] to-[#2563eb] text-white rounded-tr-[4px]"
              : "bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)] rounded-tl-[4px]"
          }`}
        >
          {/* Bold markdown in text */}
          <p
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:white">$1</strong>'),
            }}
          />

          {/* Structured payload cards */}
          {msg.type === "readiness" && msg.payload && <ReadinessCard payload={msg.payload} />}
          {msg.type === "skill-gap" && msg.payload && <SkillGapCard payload={msg.payload} />}
          {msg.type === "roadmap" && msg.payload && <RoadmapCard payload={msg.payload} />}
          {msg.type === "project-rec" && msg.payload && <ProjectRecCard payload={msg.payload} />}
          {msg.type === "uncertainty" && msg.payload && <UncertaintyCard payload={msg.payload} />}
        </div>

        {/* Footer: timestamp + actions */}
        <div className={`flex items-center gap-[8px] ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.25)]">
            {msg.timestamp}
          </span>
          {!isUser && (
            <div className="flex items-center gap-[4px]">
              {msg.reported ? (
                <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(245,158,11,0.6)]">
                  Reported
                </span>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="flex items-center gap-[3px] text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.25)] hover:text-[rgba(255,255,255,0.5)] transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1 1.5h5l-1 3h4L3 9.5l1.5-4H1V1.5z"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Report
                  </button>
                  {showReport && (
                    <ReportPopover
                      onReport={(r) => {
                        onReport(msg.id, r);
                        setShowReport(false);
                      }}
                      onClose={() => setShowReport(false)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
function TypingIndicator() {
  return (
    <div className="flex gap-[10px] px-[12px] py-[6px]">
      <div className="w-[28px] h-[28px] rounded-full bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0">
        ⚡
      </div>
      <div className="bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] rounded-[14px] rounded-tl-[4px] px-[14px] py-[12px] flex items-center gap-[4px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-[rgba(255,255,255,0.35)]"
            style={{ animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT BADGE (shows what context is loaded)
// ═══════════════════════════════════════════════════════════════════════════════
function ContextBadge() {
  return (
    <div className="flex items-center gap-[5px] px-[10px] py-[5px] bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] rounded-full">
      <span className="w-[5px] h-[5px] rounded-full bg-[#34d399] shrink-0 pulse-glow" />
      <span className="text-[9px] font-['Inter:Medium',sans-serif] font-medium text-[#34d399]">
        Career context loaded — Software Engineer v2.3
      </span>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ASSISTANT PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AssistantPanel({ onClose }) {
  const [messages, setMessages] = useState([PRIVACY_MSG, ...WELCOME_MSGS]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [scenario, setScenario] = useState("welcome");
  const [showSuggested, setShowSuggested] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);
  function applyScenario(key) {
    setScenario(key);
    const s = SCENARIOS.find((x) => x.key === key);
    if (!s) return;
    setMessages([PRIVACY_MSG, ...s.messages]);
    setShowSuggested(key === "welcome");
    setIsTyping(false);
  }
  async function sendMessage(text, intent) {
    const question = text.trim();
    if (!question || isTyping) return;
    const selectedIntent = intent || inferAssistantIntent(question);
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      type: "text",
      text: question,
      timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggested(false);
    setIsTyping(true);
    try {
      const response = await askAssistant({ intent: selectedIntent, question });
      const payload = unwrapApiData(response) || {};
      const replyText = typeof payload.reply === "string" ? payload.reply : "The assistant returned an empty response. Please try again.";
      setMessages((prev) => [...prev, {
        id: payload.interaction_id ?? payload.id ?? `a-${Date.now()}`,
        interactionId: payload.interaction_id ?? payload.id,
        role: "assistant",
        type: "text",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        text: replyText,
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        type: "text",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        text: error?.status === 422
          ? "I couldn't process that question. Please choose a supported assistant topic such as readiness, skill gaps, roadmap, next best action, project recommendations, or bounded project help."
          : (error?.message || "The assistant could not be reached. Please try again in a few seconds."),
      }]);
    } finally {
      setIsTyping(false);
    }
  }
  function handleReport(id, reason) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reported: true, reportReason: reason } : m)));
  }
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }
  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0f24" }}>
      {/* Header */}
      <div className="px-[16px] pt-[16px] pb-[12px] border-b border-[rgba(255,255,255,0.07)] shrink-0">
        <div className="flex items-center justify-between mb-[10px]">
          <div className="flex items-center gap-[10px]">
            <div
              className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[14px] shrink-0"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              ⚡
            </div>
            <div>
              <p className="font-['Inter:Bold',sans-serif] font-bold text-[14px] text-white leading-tight">
                SkillSpan Assistant
              </p>
              <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)]">
                Personalized career guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-[8px] bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.12)] flex items-center justify-center transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M1.5 1.5l8 8M9.5 1.5l-8 8"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <ContextBadge />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-[8px]">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} onReport={handleReport} />
        ))}
        {isTyping && <TypingIndicator />}

        {/* Suggested questions */}
        {showSuggested && !isTyping && (
          <div className="px-[12px] pt-[8px] pb-[4px]">
            <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[rgba(255,255,255,0.3)] uppercase tracking-wide mb-[8px]">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q.text, q.intent)}
                  className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-full px-[10px] py-[5px] hover:bg-[rgba(59,139,255,0.15)] hover:border-[rgba(59,139,255,0.3)] hover:text-[#7ca8ff] transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-[12px] pb-[12px] pt-[8px] border-t border-[rgba(255,255,255,0.07)] shrink-0">
        <div className="flex items-end gap-[8px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[14px] px-[12px] py-[8px] focus-within:border-[rgba(59,139,255,0.5)] transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about your readiness, skill gaps, roadmap…"
            className="flex-1 bg-transparent text-[12px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.8)] placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none resize-none leading-[1.5] max-h-[100px] overflow-y-auto"
            style={{ minHeight: "20px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 100) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center transition-all shrink-0 mb-[1px] disabled:opacity-30"
            style={{ background: input.trim() ? "linear-gradient(135deg,#3b8bff,#7c3aed)" : "rgba(255,255,255,0.1)" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 10L10 5.5 1 1v3.5l6 1-6 1V10z" fill="white" />
            </svg>
          </button>
        </div>
        <p className="text-[8px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.2)] text-center mt-[6px]">
          Guided by verified profile data · Will not guarantee employment or override eligibility
        </p>
      </div>

   </div>
  );
}
