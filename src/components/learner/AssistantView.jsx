import { useState, useRef, useEffect } from "react";
import { askAssistant, reportAssistantInteraction, unwrapApiData } from "../../api";
import { getTextDirection, getTextLanguage } from "../../utils/textDirection";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SUGGESTED = [
  { label: "Why is my readiness 67?", scenario: "readiness", intent: "explain_readiness" },
  { label: "What should I do next?", scenario: "roadmap", intent: "explain_next_best_action" },
  { label: "Explain my Python skill gap", scenario: "skill-gap", intent: "explain_skill_gap" },
  { label: "Why was the REST API recommended?", scenario: "project-rec", intent: "explain_project_recommendation" },
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
const CONTEXT_PILLS = [
  { icon: "📊", label: "Readiness 67/100", color: "#3b8bff" },
  { icon: "🎯", label: "Software Engineer", color: "#7c3aed" },
  { icon: "🗺️", label: "Phase 3 Roadmap", color: "#059669" },
  { icon: "🔧", label: "3 projects matched", color: "#f59e0b" },
];
const CONVOS = {
  welcome: [],
  readiness: [
    { id: "u1", role: "user", type: "text", ts: "14:31", text: "Why is my readiness score only 67?" },
    {
      id: "a1",
      role: "assistant",
      type: "readiness",
      ts: "14:31",
      text: "Your **67 / 100 Readiness Score** for **Software Engineer v2.3** breaks down across four weighted components. Here is what is holding you back and what to address next:",
      payload: {
        score: 67,
        band: "Progressing",
        components: [
          {
            label: "Skill Match",
            pct: 68,
            weight: 65,
            color: "#3b8bff",
            note: "Python (L3→L4) and System Design (L2→L3) are your two largest gaps.",
          },
          {
            label: "Practical Experience",
            pct: 55,
            weight: 20,
            color: "#7c3aed",
            note: "2 verified project items. Completing the REST API Practice Task adds a third.",
          },
          {
            label: "Assessment Reliability",
            pct: 70,
            weight: 10,
            color: "#f59e0b",
            note: "System Design is Self-Assessment Only (Low confidence). A verified assessment raises this.",
          },
          {
            label: "Profile Completeness",
            pct: 90,
            weight: 5,
            color: "#059669",
            note: "Profile is well-completed — no action needed here.",
          },
        ],
        next: "Complete the REST API Practice Task to close your Python gap and add verified Practical Experience in one step. This alone is projected to move your score to ~74.",
      },
    },
  ],
  "skill-gap": [
    { id: "u2", role: "user", type: "text", ts: "14:32", text: "Explain my Python skill gap in detail" },
    {
      id: "a2",
      role: "assistant",
      type: "skill-gap",
      ts: "14:32",
      text: "Here is a full breakdown of your **Python** gap and why it matters for Software Engineer:",
      payload: {
        skill: "Python",
        category: "Programming",
        yours: 3,
        required: 4,
        max: 5,
        gap: 1,
        isCritical: false,
        importance: "High",
        confidence: "Medium",
        evidence: "Python Fundamentals Assessment (L3, Sep 2026) · SQL & Python Mini-Project (L3, Aug 2026)",
        explanation:
          "Python Level 4 is required because Software Engineers at this seniority write production-quality, idiomatic code — proper error handling, type annotations, async patterns, and testable module design. Your Level 3 demonstrates solid fundamentals but does not yet show production readiness.",
        roadmapAction: "REST API with Python & PostgreSQL — Practice Task (Phase 3, your Next Best Action)",
        limitation:
          "Your evidence is from Aug–Sep 2026. If you have done additional Python work since, adding it would update this assessment.",
      },
    },
  ],
  roadmap: [
    { id: "u3", role: "user", type: "text", ts: "14:33", text: "What should I do next on my roadmap?" },
    {
      id: "a3",
      role: "assistant",
      type: "roadmap",
      ts: "14:33",
      text: "Based on your current skill gaps and roadmap progress, here is your **Next Best Action** and the full Phase 3 sequence:",
      payload: {
        nba: {
          title: "Build a REST API with Python & PostgreSQL",
          type: "Practice Task",
          phase: 3,
          phaseName: "Applied Practice",
          effort: "12–16 h · 2–3 weeks",
          why: "Addresses your highest-priority gap (Python L3→L4) and generates verified Practical Experience evidence simultaneously. Completing it unlocks your Phase 3 milestone.",
          unlocks: "Phase 3 milestone · System Design Simulation (next)",
        },
        next: [
          { title: "Scalable Chat System — System Design Simulation", type: "Simulation Project", phase: 3 },
          { title: "React Intermediate Assessment", type: "Assessment", phase: 3 },
          { title: "Phase 3 Completion Milestone", type: "Milestone", phase: 3 },
        ],
        limitation: "Roadmap order reflects gaps as of 9 Sep 2026. New evidence may reorder priorities.",
      },
    },
  ],
  "project-rec": [
    { id: "u4", role: "user", type: "text", ts: "14:34", text: "Why was the REST API project recommended to me?" },
    {
      id: "a4",
      role: "assistant",
      type: "project-rec",
      ts: "14:34",
      text: "This project was ranked **#1** because it aligns with your top skill gaps, career roadmap, and practical experience component simultaneously:",
      payload: {
        title: "Build a REST API with Python & PostgreSQL",
        matchScore: 91,
        rank: 1,
        eligibility: "Eligible",
        matched: [
          "Python L3 ≥ required L3 ✓",
          "SQL L3 ≥ required L3 ✓",
          "REST API Design L2 ≥ required L2 ✓",
          "Git & CI/CD L2 ≥ required L2 ✓",
        ],
        gaps: ["System Design L2 < required L3 (growth target — does not block eligibility)"],
        learning: [
          { skill: "Python", gain: "+1 Level (L3→L4)", impact: "High" },
          { skill: "REST API Design", gain: "+1 Level (L2→L3)", impact: "High" },
          { skill: "SQL", gain: "Verified Evidence", impact: "Medium" },
        ],
        limitation:
          "Match score uses your profile as of 9 Sep 2026. Recommendation does not guarantee acceptance — the project owner makes the final decision.",
      },
    },
  ],
  uncertainty: [
    {
      id: "u5",
      role: "user",
      type: "text",
      ts: "14:35",
      text: "Will I definitely get a job after completing this roadmap?",
    },
    {
      id: "a5",
      role: "assistant",
      type: "out-of-scope",
      ts: "14:35",
      text: "",
      payload: {
        icon: "🤔",
        title: "Outside my guidance scope",
        explanation:
          "I cannot provide employment guarantees. Completing your roadmap strengthens your verified skill profile and practical experience — valuable hiring signals — but outcomes depend on market conditions, employer decisions, interview performance, and many other factors outside SkillSpan.",
        canHelp:
          "I can help you understand your readiness score, identify which skill gaps to close next, explain why projects or learning resources were recommended, and help you plan your next step.",
        type: "no-guarantee",
      },
    },
  ],
  unavailable: [
    { id: "u6", role: "user", type: "text", ts: "14:36", text: "Can you explain all my skill gaps in detail?" },
    {
      id: "a6",
      role: "assistant",
      type: "unavailable",
      ts: "14:36",
      text: "",
      payload: {
        icon: "🔌",
        title: "Intelligence service temporarily unavailable",
        explanation:
          "I could not retrieve your skill-gap data — the intelligence service returned an error. I will not invent an answer. No data has been modified.",
        canHelp:
          "Your last readiness result (67/100, 9 Sep 2026) is still available in your Career Journey view. You can review your skill gaps there while this service is unavailable.",
        type: "service-error",
      },
    },
  ],
};
// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED RESPONSE CARDS
// ═══════════════════════════════════════════════════════════════════════════════
function ReadinessResponseCard({ p }) {
  const comps = p.components;
  const score = p.score;
  const band = p.band;
  const sz = 68;
  const r = sz / 2 - 5;
  const C = 2 * Math.PI * r;
  const arc = (score / 100) * C;
  return (
    <div className="mt-[10px] space-y-[8px]">
      {/* Mini gauge row */}
      <div className="flex items-center gap-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-[12px] px-[14px] py-[12px]">
        <div className="relative shrink-0" style={{ width: sz, height: sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
            <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <circle
              cx={sz / 2}
              cy={sz / 2}
              r={r}
              fill="none"
              stroke="url(#rg)"
              strokeWidth="5"
              strokeDasharray={`${arc} ${C - arc}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${sz / 2} ${sz / 2})`}
            />
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#3b8bff" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-['Inter:Bold',sans-serif] text-[17px] text-white leading-none">{score}</span>
            <span className="text-[7px] text-[rgba(255,255,255,0.35)]">/ 100</span>
          </div>
        </div>
        <div>
          <p className="font-['Inter:Bold',sans-serif] text-[14px] text-white leading-none">{band}</p>
          <p className="text-[10px] text-[rgba(255,255,255,0.45)] mt-[2px]">Software Engineer v2.3</p>
          <div className="flex items-center gap-[4px] mt-[6px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#f59e0b]" />
            <span className="text-[9px] text-[rgba(255,255,255,0.5)]">2 components below 65</span>
          </div>
        </div>
      </div>
      {/* Component rows */}
      {comps.map((c) => (
        <div
          key={c.label}
          className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[10px] p-[10px]"
        >
          <div className="flex justify-between items-center mb-[5px]">
            <div className="flex items-center gap-[5px]">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: c.color }} />
              <span className="text-[11px] font-['Inter:Medium',sans-serif] text-[rgba(255,255,255,0.8)]">
                {c.label}
              </span>
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="text-[9px] text-[rgba(255,255,255,0.3)]">{c.weight}% weight</span>
              <span className="text-[11px] font-['Inter:Bold',sans-serif]" style={{ color: c.color }}>
                {c.pct}%
              </span>
            </div>
          </div>
          <div className="w-full h-[4px] rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden mb-[5px]">
            <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.color }} />
          </div>
          <p className="text-[10px] text-[rgba(255,255,255,0.42)] leading-[1.5]">{c.note}</p>
        </div>
      ))}
      {p.next && (
        <div className="flex gap-[8px] bg-[rgba(59,139,255,0.1)] border border-[rgba(59,139,255,0.22)] rounded-[10px] px-[12px] py-[9px]">
          <span className="text-[12px] shrink-0">⚡</span>
          <p className="text-[10px] text-[rgba(255,255,255,0.65)] leading-[1.55]">{p.next}</p>
        </div>
      )}
    </div>
  );
}
function SkillGapResponseCard({ p }) {
  const yours = p.yours,
    req = p.required,
    max = p.max;
  const met = yours >= req;
  return (
    <div className="mt-[10px] space-y-[7px]">
      <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-[12px] p-[12px]">
        <div className="flex justify-between items-center mb-[8px]">
          <div>
            <span className="font-['Inter:Bold',sans-serif] text-[13px] text-white">{p.skill}</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.35)] ml-[6px]">{p.category}</span>
          </div>
          <span
            className={`text-[10px] font-['Inter:Semi_Bold',sans-serif] px-[8px] py-[2px] rounded-full ${met ? "text-[#34d399] bg-[rgba(52,211,153,0.12)]" : "text-[#f87171] bg-[rgba(248,113,113,0.12)]"}`}
          >
            {met ? "Met" : `Gap: −${req - yours}`}
          </span>
        </div>
        <div className="flex gap-[3px] mb-[5px]">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[7px] rounded-full"
              style={{
                background:
                  i < yours
                    ? met
                      ? "#059669"
                      : "#f59e0b"
                    : i < req
                      ? "rgba(239,68,68,0.25)"
                      : "rgba(255,255,255,0.07)",
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-[rgba(255,255,255,0.3)]">
          <span>Yours: L{yours}</span>
          <span>Required: L{req}</span>
          <span>Max: L{max}</span>
        </div>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[10px] overflow-hidden">
        {[
          ["Importance", p.importance],
          ["Confidence", p.confidence],
          ["Evidence", p.evidence],
          ["Roadmap action", p.roadmapAction],
        ].map(([l, v]) => (
          <div key={l} className="flex gap-[8px] px-[11px] py-[7px]">
            <span className="text-[9px] font-['Inter:Medium',sans-serif] text-[rgba(255,255,255,0.3)] w-[90px] shrink-0 pt-[1px]">
              {l}
            </span>
            <span className="text-[10px] text-[rgba(255,255,255,0.6)] leading-[1.5]">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[12px] py-[9px]">
        <p className="text-[10px] text-[rgba(255,255,255,0.55)] leading-[1.65]">{p.explanation}</p>
      </div>
      {p.limitation && (
        <div className="flex gap-[7px] bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[12px] py-[9px]">
          <span className="text-[11px] shrink-0">ℹ</span>
          <p className="text-[10px] text-[rgba(255,255,255,0.48)] leading-[1.5]">{p.limitation}</p>
        </div>
      )}
    </div>
  );
}
function RoadmapResponseCard({ p }) {
  const nba = p.nba;
  const next = p.next;
  return (
    <div className="mt-[10px] space-y-[7px]">
      <div
        className="relative overflow-hidden rounded-[12px] p-[14px]"
        style={{ background: "linear-gradient(130deg,rgba(59,139,255,0.14),rgba(124,58,237,0.14))" }}
      >
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#3b8bff,transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-[6px] mb-[7px]">
            <span className="text-[9px] font-['Inter:Bold',sans-serif] text-[#7ca8ff] bg-[rgba(59,139,255,0.18)] px-[7px] py-[2px] rounded-full">
              ⚡ Next Best Action
            </span>
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">
              Phase {nba.phase} · {nba.phaseName}
            </span>
          </div>
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[12px] text-white mb-[3px]">{nba.title}</p>
          <p className="text-[9px] text-[rgba(255,255,255,0.4)] mb-[7px]">
            {nba.type} · {nba.effort}
          </p>
          <p className="text-[10px] text-[rgba(255,255,255,0.6)] leading-[1.55] mb-[7px]">{nba.why}</p>
          <div className="flex items-start gap-[5px]">
            <span className="text-[9px] text-[rgba(255,255,255,0.3)] shrink-0 mt-[1px]">Unlocks →</span>
            <span className="text-[9px] text-[rgba(255,255,255,0.5)] leading-[1.4]">{nba.unlocks}</span>
          </div>
        </div>
      </div>
      <div className="space-y-[3px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(255,255,255,0.3)] uppercase tracking-wide px-[1px]">
          Coming up in Phase 3
        </p>
        {next.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-[8px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-[10px] py-[7px]"
          >
            <span className="text-[9px] text-[rgba(255,255,255,0.3)] shrink-0 w-[14px]">{i + 2}</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.6)] flex-1 leading-tight">{a.title}</span>
            <span className="text-[9px] text-[rgba(255,255,255,0.3)] shrink-0">{a.type}</span>
          </div>
        ))}
      </div>
      {p.limitation && (
        <div className="flex gap-[7px] bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[12px] py-[9px]">
          <span className="text-[11px] shrink-0">ℹ</span>
          <p className="text-[10px] text-[rgba(255,255,255,0.48)] leading-[1.5]">{p.limitation}</p>
        </div>
      )}
    </div>
  );
}
function ProjectRecResponseCard({ p }) {
  const matched = p.matched;
  const gaps = p.gaps;
  const learning = p.learning;
  const impCol = (i) => (i === "High" ? "#34d399" : i === "Medium" ? "#fbbf24" : "#94a3b8");
  return (
    <div className="mt-[10px] space-y-[7px]">
      <div className="flex items-center gap-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-[12px] px-[13px] py-[11px]">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-[rgba(59,139,255,0.14)] border border-[rgba(59,139,255,0.22)] flex items-center justify-center text-[13px] shrink-0">
          🔧
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-['Inter:Semi_Bold',sans-serif] text-[11px] text-white leading-tight">{p.title}</p>
          <div className="flex items-center gap-[5px] mt-[2px]">
            <span className="text-[9px] font-['Inter:Bold',sans-serif] text-[#34d399]">✓ {p.eligibility}</span>
            <span className="text-[rgba(255,255,255,0.25)]">·</span>
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">Rank #{p.rank}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-['Inter:Bold',sans-serif] text-[20px] text-[#34d399] leading-none">{p.matchScore}</p>
          <p className="text-[8px] text-[rgba(255,255,255,0.35)]">% match</p>
        </div>
      </div>
      <div className="bg-[rgba(5,150,105,0.07)] border border-[rgba(5,150,105,0.18)] rounded-[10px] px-[11px] py-[9px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(52,211,153,0.7)] uppercase tracking-wide mb-[5px]">
          Skills matched
        </p>
        {matched.map((s) => (
          <div key={s} className="flex items-start gap-[5px] py-[1px]">
            <span className="text-[9px] text-[#34d399] shrink-0 mt-[1px]">✓</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.6)] leading-[1.4]">{s}</span>
          </div>
        ))}
      </div>
      {gaps.length > 0 && (
        <div className="bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[11px] py-[9px]">
          <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(251,191,36,0.7)] uppercase tracking-wide mb-[5px]">
            Gaps / growth targets
          </p>
          {gaps.map((g) => (
            <div key={g} className="flex items-start gap-[5px] py-[1px]">
              <span className="text-[9px] text-[#fbbf24] shrink-0 mt-[1px]">△</span>
              <span className="text-[10px] text-[rgba(255,255,255,0.6)] leading-[1.4]">{g}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-[2px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(255,255,255,0.3)] uppercase tracking-wide px-[1px]">
          What you gain
        </p>
        {learning.map((lv) => (
          <div
            key={lv.skill}
            className="flex items-center justify-between bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-[10px] py-[6px]"
          >
            <span className="text-[10px] text-[rgba(255,255,255,0.6)]">{lv.skill}</span>
            <div className="flex items-center gap-[6px]">
              <span className="text-[10px] font-['Inter:Bold',sans-serif]" style={{ color: impCol(lv.impact) }}>
                {lv.gain}
              </span>
              <span className="text-[9px]" style={{ color: impCol(lv.impact) }}>
                {lv.impact}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-[7px] bg-[rgba(245,158,11,0.07)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[12px] py-[9px]">
        <span className="text-[11px] shrink-0">ℹ</span>
        <p className="text-[10px] text-[rgba(255,255,255,0.48)] leading-[1.5]">{p.limitation}</p>
      </div>
    </div>
  );
}
function BoundaryCard({ p }) {
  const isUnavailable = p.type === "service-error";
  return (
    <div className="mt-[10px] space-y-[7px]">
      <div
        className={`flex items-start gap-[10px] rounded-[12px] p-[13px] border ${isUnavailable ? "bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.18)]" : "bg-[rgba(148,163,184,0.05)] border-[rgba(148,163,184,0.14)]"}`}
      >
        <span className="text-[16px] shrink-0">{p.icon}</span>
        <div>
          <p
            className={`font-['Inter:Semi_Bold',sans-serif] text-[12px] mb-[4px] ${isUnavailable ? "text-[#f87171]" : "text-[rgba(255,255,255,0.75)]"}`}
          >
            {p.title}
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.52)] leading-[1.6]">{p.explanation}</p>
        </div>
      </div>
      <div className="flex gap-[7px] bg-[rgba(59,139,255,0.07)] border border-[rgba(59,139,255,0.18)] rounded-[10px] px-[12px] py-[9px]">
        <div className="shrink-0 mt-[1px]">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="5" stroke="#7ca8ff" strokeWidth="1.1" />
            <path d="M5.5 5v3" stroke="#7ca8ff" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="5.5" cy="3.5" r=".6" fill="#7ca8ff" />
          </svg>
        </div>
        <p className="text-[10px] text-[rgba(255,255,255,0.55)] leading-[1.5]">{p.canHelp}</p>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// PRIVACY DISCLOSURE
// ═══════════════════════════════════════════════════════════════════════════════
function PrivacySection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-[14px] my-[10px] bg-[rgba(59,139,255,0.06)] border border-[rgba(59,139,255,0.14)] rounded-[12px] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-[14px] py-[11px] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <div className="flex items-center gap-[7px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1L2 3.5v3.5C2 9.14 3.9 11 6 11s4-1.86 4-4V3.5L6 1z"
              stroke="#7ca8ff"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-['Inter:Semi_Bold',sans-serif] text-[#7ca8ff]">
            Privacy & scope information
          </span>
        </div>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l3 3 3-3" stroke="#7ca8ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="px-[14px] pb-[12px] border-t border-[rgba(59,139,255,0.1)]">
          <p className="text-[10px] text-[rgba(255,255,255,0.45)] leading-[1.6] mt-[10px] mb-[8px]">
            The assistant uses only your verified SkillSpan data — readiness scores, skill gaps, roadmap, and project
            recommendations. Only your own data is referenced.
          </p>
          <div className="space-y-[5px]">
            {[
              ["✕", "Will not complete or submit your assignments or project deliverables"],
              ["✕", "Will not fabricate skills, evidence, or project outcomes"],
              ["✕", "Will not guarantee employment or project acceptance"],
              ["✕", "Will not override eligibility rules or readiness calculations"],
              ["✕", "Will not expose other learners' data"],
              ["✓", "Interactions are recorded per configured privacy and audit rules"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-[5px]">
                <span
                  className={`text-[9px] shrink-0 mt-[1px] font-['Inter:Bold',sans-serif] ${icon === "✓" ? "text-[rgba(52,211,153,0.5)]" : "text-[rgba(248,113,113,0.5)]"}`}
                >
                  {icon}
                </span>
                <span className="text-[10px] text-[rgba(255,255,255,0.38)] leading-[1.4]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// REPORT POPOVER
// ═══════════════════════════════════════════════════════════════════════════════
function ReportMenu({ onReport, onClose }) {
  const reasons = [
    ["unsafe", "Unsafe", "Harmful or inappropriate content"],
    ["irrelevant", "Irrelevant", "Doesn't address my question"],
    ["unfair", "Unfair", "Biased or discriminatory"],
    ["incorrect", "Incorrect", "Factually wrong or misleading"],
  ];
  return (
    <div className="absolute right-0 bottom-[28px] w-[220px] bg-[#1a1d3a] border border-[rgba(255,255,255,0.12)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden">
      <div className="px-[13px] pt-[11px] pb-[8px] border-b border-[rgba(255,255,255,0.07)]">
        <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] text-white">Report this response</p>
        <p className="text-[9px] text-[rgba(255,255,255,0.35)] mt-[1px]">Reviewed by the SkillSpan team</p>
      </div>
      {reasons.map(([k, l, d]) => (
        <button
          key={k}
          onClick={() => onReport(k)}
          className="w-full text-left px-[13px] py-[8px] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <p className="text-[11px] font-['Inter:Medium',sans-serif] text-[rgba(255,255,255,0.8)]">{l}</p>
          <p className="text-[9px] text-[rgba(255,255,255,0.35)]">{d}</p>
        </button>
      ))}
      <button
        onClick={onClose}
        className="w-full text-[10px] text-[rgba(255,255,255,0.35)] py-[8px] border-t border-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.55)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════════════════════
function MessageBubble({ msg, onReport }) {
  const [showReport, setShowReport] = useState(false);
  const isUser = msg.role === "user";
  const textDirection = getTextDirection(msg.text);
  const textLanguage = getTextLanguage(msg.text);
  const isSpecial = [
    "readiness",
    "skill-gap",
    "roadmap",
    "project-rec",
    "uncertainty",
    "unavailable",
    "out-of-scope",
  ].includes(msg.type);
  return (
    <div className={`flex gap-[8px] px-[14px] py-[5px] group ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div
          className="w-[26px] h-[26px] rounded-full shrink-0 mt-[2px] flex items-center justify-center text-[11px]"
          style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
        >
          ⚡
        </div>
      )}
      <div className={`flex flex-col max-w-[88%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-[14px] px-[13px] py-[10px] text-[12px] leading-[1.65]
          ${
            isUser
              ? "bg-gradient-to-br from-[#3b8bff] to-[#2563eb] text-white rounded-tr-[3px]"
              : isSpecial
                ? "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.78)] rounded-tl-[3px] w-full"
                : "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.78)] rounded-tl-[3px]"
          }`}
        >
          {msg.text && (
            <p
              dir={textDirection}
              lang={textLanguage}
              className="assistant-message-content whitespace-pre-wrap break-words"
              style={{
                direction: textDirection,
                textAlign: textDirection === "rtl" ? "right" : "left",
                unicodeBidi: "plaintext",
                overflowWrap: "anywhere",
              }}
              dangerouslySetInnerHTML={{
                __html: msg.text.replace(/\*\*(.+?)\*\*/g, '<strong dir="auto" style="font-weight:700;color:white;unicode-bidi:isolate">$1</strong>'),
              }}
            />
          )}
          {msg.type === "readiness" && msg.payload && <ReadinessResponseCard p={msg.payload} />}
          {msg.type === "skill-gap" && msg.payload && <SkillGapResponseCard p={msg.payload} />}
          {msg.type === "roadmap" && msg.payload && <RoadmapResponseCard p={msg.payload} />}
          {msg.type === "project-rec" && msg.payload && <ProjectRecResponseCard p={msg.payload} />}
          {(msg.type === "uncertainty" || msg.type === "out-of-scope" || msg.type === "unavailable") && msg.payload && (
            <BoundaryCard p={msg.payload} />
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-[8px] mt-[3px] ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[9px] text-[rgba(255,255,255,0.22)]">{msg.ts}</span>
          {!isUser && (
            <div className="relative">
              {msg.reported ? (
                <span className="text-[9px] text-[rgba(245,158,11,0.55)]">Reported</span>
              ) : (
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="flex items-center gap-[3px] text-[9px] text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1 1.5h4l-.8 2.5H7L2.5 8l1-3H1z"
                      stroke="currentColor"
                      strokeWidth=".9"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Report
                </button>
              )}
              {showReport && (
                <ReportMenu
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
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════
function Typing() {
  return (
    <div className="flex gap-[8px] px-[14px] py-[5px]">
      <div
        className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center text-[11px]"
        style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
      >
        ⚡
      </div>
      <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.09)] rounded-[14px] rounded-tl-[3px] px-[14px] py-[12px] flex items-center gap-[4px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-[rgba(255,255,255,0.3)]"
            style={{ animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT PANEL (right sidebar)
// ═══════════════════════════════════════════════════════════════════════════════
function ContextPanel() {
  return (
    <div className="w-[220px] shrink-0 border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-y-auto py-[18px] px-[14px] gap-[18px]">
      {/* Live context */}
      <div>
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(255,255,255,0.3)] uppercase tracking-wide mb-[8px]">
          Active context
        </p>
        <div className="space-y-[5px]">
          {CONTEXT_PILLS.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-[7px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-[9px] py-[6px]"
            >
              <span className="text-[11px] shrink-0">{c.icon}</span>
              <span className="text-[10px] font-['Inter:Medium',sans-serif] text-[rgba(255,255,255,0.65)]">
                {c.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[5px] mt-[8px]">
          <span className="w-[5px] h-[5px] rounded-full bg-[#34d399] pulse-glow shrink-0" />
          <span className="text-[9px] text-[rgba(255,255,255,0.35)]">Context up to date · 9 Sep 2026</span>
        </div>
      </div>

      {/* Quick questions */}
      <div>
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(255,255,255,0.3)] uppercase tracking-wide mb-[8px]">
          Quick questions
        </p>
        <div className="space-y-[4px]">
          {SUGGESTED.map((s) => (
            <div
              key={s.label}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[8px] px-[9px] py-[6px]"
            >
              <p className="text-[10px] text-[rgba(255,255,255,0.5)] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scope reminder */}
      <div className="bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.1)] rounded-[10px] p-[10px]">
        <p className="text-[9px] font-['Inter:Semi_Bold',sans-serif] text-[rgba(255,255,255,0.3)] uppercase tracking-wide mb-[5px]">
          Scope
        </p>
        {[
          "Readiness explanations",
          "Skill gap analysis",
          "Roadmap guidance",
          "Project match explanations",
          "Bounded project help",
        ].map((s) => (
          <div key={s} className="flex items-center gap-[4px] py-[2px]">
            <span className="text-[8px] text-[rgba(52,211,153,0.5)]">✓</span>
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">{s}</span>
          </div>
        ))}
        {["Completing assignments", "Guaranteeing employment", "Overriding eligibility"].map((s) => (
          <div key={s} className="flex items-center gap-[4px] py-[2px]">
            <span className="text-[8px] text-[rgba(248,113,113,0.5)]">✕</span>
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const DEMOS = [
  { key: "welcome", label: "Welcome" },
  { key: "readiness", label: "Readiness" },
  { key: "skill-gap", label: "Skill Gap" },
  { key: "roadmap", label: "Roadmap" },
  { key: "project-rec", label: "Project Rec" },
  { key: "uncertainty", label: "Uncertainty" },
  { key: "unavailable", label: "Unavailable" },
];
export default function AssistantView() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [scenario, setScenario] = useState("welcome");
  const [fresh, setFresh] = useState(true);
  const bottomRef = useRef(null);
  const textRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);
  function loadScenario(key) {
    setScenario(key);
    setMessages(CONVOS[key]);
    setFresh(key === "welcome");
    setTyping(false);
  }
  async function send(text, intent) {
    const question = text.trim();
    if (!question || typing) return;
    const userMsg = {
      id: `u${Date.now()}`,
      role: "user",
      type: "text",
      text: question,
      ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setFresh(false);
    setScenario("welcome");
    setTyping(true);
    try {
      const selectedIntent = intent || inferAssistantIntent(question);
      const response = await askAssistant({ intent: selectedIntent, question });
      const payload = unwrapApiData(response) || {};
      const replyText = typeof payload.reply === "string"
        ? payload.reply
        : "The assistant returned an empty response. Please try again.";
      setMessages((prev) => [...prev, {
        id: payload.interaction_id ?? payload.id ?? `a${Date.now()}`,
        interactionId: payload.interaction_id ?? payload.id,
        role: "assistant",
        type: "text",
        ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        text: replyText || "The assistant returned an empty response. Please try again.",
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `a${Date.now()}`,
        role: "assistant",
        type: "unavailable",
        ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        text: "",
        payload: {
          icon: "🔌",
          title: "Assistant temporarily unavailable",
          explanation: error?.status === 422
            ? "The question could not be mapped to a supported assistant topic. Please use one of the suggested topics and try again."
            : (error?.message || "The AI service could not be reached. No data was changed."),
          canHelp: error?.status === 422
            ? "Supported topics: readiness, skill gaps, roadmap, next best action, project recommendations, and bounded project help."
            : "Please try the question again in a few seconds.",
          type: "service-error",
        },
      }]);
    } finally {
      setTyping(false);
    }
  }
  async function handleReport(id, reason) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reported: true, reportReason: reason } : m)));
    const item = messages.find((m) => m.id === id);
    if (item?.interactionId) {
      try { await reportAssistantInteraction(item.interactionId, { reason }); } catch { /* reporting is best effort */ }
    }
  }
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#0d0f24" }}>
      {/* Header */}
      <div className="shrink-0 border-b border-[rgba(255,255,255,0.07)] px-[20px] py-[14px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
            <div
              className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[16px]"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              ⚡
            </div>
            <div>
              <h1 className="font-['Inter:Bold',sans-serif] text-[16px] text-white leading-tight">
                SkillSpan Assistant
              </h1>
              <p className="text-[11px] text-[rgba(255,255,255,0.4)]">Personalized career guidance · Bounded scope</p>
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center gap-[5px] px-[10px] py-[5px] bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] rounded-full">
              <span className="w-[5px] h-[5px] rounded-full bg-[#34d399] shrink-0 pulse-glow" />
              <span className="text-[9px] font-['Inter:Medium',sans-serif] text-[#34d399]">
                Career context loaded — Software Engineer v2.3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Privacy banner — collapsible */}
          <PrivacySection />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-[6px]">
            {/* Welcome / empty state */}
            {fresh && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-[24px] px-[32px]">
                <div className="text-center">
                  <div
                    className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center text-[24px] mx-auto mb-[14px]"
                    style={{
                      background: "linear-gradient(135deg,rgba(59,139,255,0.15),rgba(124,58,237,0.15))",
                      border: "1px solid rgba(59,139,255,0.2)",
                    }}
                  >
                    ⚡
                  </div>
                  <h2 className="font-['Inter:Bold',sans-serif] text-[18px] text-white mb-[6px]">
                    How can I help you today?
                  </h2>
                  <p className="text-[13px] text-[rgba(255,255,255,0.45)] max-w-[360px] leading-[1.65]">
                    I have access to your verified SkillSpan profile. Ask me about your readiness score, skill gaps,
                    roadmap, or why a project was recommended.
                  </p>
                </div>
                {/* Suggested question cards */}
                <div className="grid grid-cols-2 gap-[8px] w-full max-w-[500px]">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => send(s.label, s.intent)}
                      className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.09)] rounded-[12px] px-[14px] py-[12px] text-left hover:bg-[rgba(59,139,255,0.1)] hover:border-[rgba(59,139,255,0.25)] transition-all"
                    >
                      <p className="text-[12px] font-['Inter:Medium',sans-serif] text-[rgba(255,255,255,0.75)] leading-[1.45]">
                        {s.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} onReport={handleReport} />
            ))}
            {typing && <Typing />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-[14px] pb-[14px] pt-[8px] border-t border-[rgba(255,255,255,0.07)]">
            <div className="flex items-end gap-[8px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[14px] px-[13px] py-[9px] focus-within:border-[rgba(59,139,255,0.45)] transition-colors">
              <textarea
                ref={textRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask about your readiness, skill gaps, roadmap, or recommendations…"
                className="flex-1 bg-transparent text-[12px] text-[rgba(255,255,255,0.8)] placeholder:text-[rgba(255,255,255,0.22)] focus:outline-none resize-none leading-[1.5] max-h-[80px] overflow-y-auto"
                style={{ minHeight: "20px" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 80) + "px";
                }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || typing}
                className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center transition-all shrink-0 mb-[1px] disabled:opacity-30"
                style={{
                  background: input.trim() ? "linear-gradient(135deg,#3b8bff,#7c3aed)" : "rgba(255,255,255,0.08)",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 10L10 5.5 1 1v3.5l6 1-6 1V10z" fill="white" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[9px] text-[rgba(255,255,255,0.18)] mt-[6px]">
              Guided by verified profile data · Will not guarantee employment or override eligibility ·{" "}
              <button
                onClick={() => document.querySelector("[data-privacy]")?.scrollIntoView()}
                className="underline hover:text-[rgba(255,255,255,0.4)] transition-colors"
              >
                Privacy info ↑
              </button>
            </p>
          </div>
        </div>

        {/* Right: context panel */}
        <ContextPanel />
      </div>

   </div>
  );
}
