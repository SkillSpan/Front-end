import "../../skillspan-animations.css";
import { useState, useMemo } from "react";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
const PROJECTS = [
    {
        id: "p1",
        title: "Build a REST API with Python & PostgreSQL",
        description: "Design, implement, and document a production-grade REST API for a task-management service using FastAPI and PostgreSQL. Covers authentication, CRUD operations, pagination, and OpenAPI documentation.",
        type: "Practice Task", difficulty: "Intermediate",
        estimatedHours: "12–16 h", estimatedDuration: "2–3 weeks",
        matchScore: 91, isRecommended: true, recommendationRank: 1,
        recommendationReason: "Directly addresses your highest-priority skill gap (Python L3→L4) and aligns with your active roadmap action. Completing this project provides verified evidence for both Python and REST API Design.",
        eligibility: "Eligible",
        eligibilityReason: "Your Python (L3) and SQL (L3) skills meet the minimum entry requirements for this project.",
        matchExplanation: "This project targets your two largest skill gaps simultaneously — Python (your most critical gap) and REST API Design. It also builds Practical Experience evidence which improves your readiness score component at 20% weight. Completing it unlocks Phase 3 of your career roadmap.",
        skillMatches: [
            { skillName: "Python", category: "Programming", yourLevel: 3, requiredLevel: 3, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: true },
            { skillName: "SQL", category: "Databases", yourLevel: 3, requiredLevel: 3, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "REST API Design", category: "Backend", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: true },
            { skillName: "Git & CI/CD", category: "DevOps", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "System Design", category: "Architecture", yourLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, matched: false, isGrowthTarget: false },
        ],
        learningValue: [
            { skillName: "Python", gain: "+1 Level (L3→L4)", impact: "High", description: "Practical implementation produces verified evidence toward the Level 4 Python requirement." },
            { skillName: "REST API Design", gain: "+1 Level (L2→L3)", impact: "High", description: "Full API lifecycle experience closes the REST API Design gap entirely." },
            { skillName: "SQL", gain: "Verified Evidence", impact: "Medium", description: "Production database integration adds a verified evidence item for SQL." },
        ],
        tags: ["Python", "FastAPI", "PostgreSQL", "REST", "Authentication"],
        roadmapPhase: 3, alignsWithNBA: true,
    },
    {
        id: "p2",
        title: "Scalable Chat System — System Design Simulation",
        description: "Design and document a horizontally scalable real-time chat architecture supporting 100k concurrent users. Produce architecture diagrams, capacity estimates, data-flow documentation, and a written trade-off analysis.",
        type: "Simulation Project", difficulty: "Advanced",
        estimatedHours: "10–14 h", estimatedDuration: "2 weeks",
        matchScore: 78, isRecommended: true, recommendationRank: 2,
        recommendationReason: "Addresses your System Design confidence gap (currently self-assessment only, Low confidence). This simulation produces the first verified System Design evidence in your profile.",
        eligibility: "Conditionally Eligible",
        eligibilityReason: "Recommended after completing the REST API Practice Task (your active roadmap prerequisite). You can begin now, but results will carry higher weight after prerequisite completion.",
        matchExplanation: "System Design has Low confidence in your profile because only self-assessment evidence exists. This simulation creates verified evidence and raises confidence to Medium or High depending on evaluator score. It is a prerequisite gate for Phase 4.",
        skillMatches: [
            { skillName: "System Design", category: "Architecture", yourLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, matched: false, isGrowthTarget: true },
            { skillName: "REST API Design", category: "Backend", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "SQL", category: "Databases", yourLevel: 3, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "Python", category: "Programming", yourLevel: 3, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
        ],
        learningValue: [
            { skillName: "System Design", gain: "First Verified Evidence", impact: "High", description: "Moves System Design confidence from Low (self-assessment) to Medium (evaluator-verified)." },
            { skillName: "REST API Design", gain: "Applied Reinforcement", impact: "Medium", description: "Architectural reasoning reinforces REST API knowledge in a system-level context." },
        ],
        tags: ["System Design", "Architecture", "Scalability", "WebSockets", "Redis"],
        roadmapPhase: 3,
    },
    {
        id: "p3",
        title: "E-Commerce Frontend — React & TypeScript",
        description: "Build a complete e-commerce product catalogue, cart, and checkout flow using React 18 and TypeScript. Includes state management with Zustand, client-side routing, and integration with a mock REST API.",
        type: "Practice Task", difficulty: "Intermediate",
        estimatedHours: "14–20 h", estimatedDuration: "3 weeks",
        matchScore: 72, isRecommended: true, recommendationRank: 3,
        recommendationReason: "Builds React proficiency — a critical skill gap in your profile (React L2, Required L3). Provides verified practical evidence for React before your React Intermediate Assessment.",
        eligibility: "Eligible",
        eligibilityReason: "Your current skill levels meet the entry requirements for this project.",
        matchExplanation: "React is a critical skill for Software Engineer with Medium confidence in your profile. Building a full application provides verified practical evidence that strengthens your assessment preparation and adds to Practical Experience.",
        skillMatches: [
            { skillName: "React", category: "Frontend", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: true },
            { skillName: "Git & CI/CD", category: "DevOps", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "REST API Design", category: "Backend", yourLevel: 2, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "SQL", category: "Databases", yourLevel: 3, requiredLevel: 1, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
        ],
        learningValue: [
            { skillName: "React", gain: "+1 Level (L2→L3)", impact: "High", description: "Full-application React experience provides verified evidence toward the Level 3 requirement." },
            { skillName: "TypeScript", gain: "New Evidence", impact: "Medium", description: "Typed React introduces TypeScript evidence, a valued adjacent skill for Software Engineer." },
        ],
        tags: ["React", "TypeScript", "Zustand", "E-Commerce", "Frontend"],
        roadmapPhase: 3,
    },
    {
        id: "p4",
        title: "ML Pipeline Deployment — Real Project",
        description: "Work with an industry partner to containerize and deploy a machine-learning inference pipeline using Docker and Kubernetes. Includes CI/CD setup, monitoring, and production rollout documentation.",
        type: "Real Project", difficulty: "Expert",
        estimatedHours: "40–60 h", estimatedDuration: "6–8 weeks",
        matchScore: 44, isRecommended: false,
        eligibility: "Not Eligible",
        eligibilityReason: "Requires System Design (L4) and Python (L5) — your current levels (L2, L3) are below the minimum entry threshold. Complete Phases 2 and 3 first.",
        matchExplanation: "This is a Phase 4 capstone project. Your current skill gaps are too large to meet the entry requirements. It becomes available after you close the Python and System Design gaps.",
        skillMatches: [
            { skillName: "Python", category: "Programming", yourLevel: 3, requiredLevel: 5, maxLevel: 5, gap: 2, matched: false, isGrowthTarget: false },
            { skillName: "System Design", category: "Architecture", yourLevel: 2, requiredLevel: 4, maxLevel: 5, gap: 2, matched: false, isGrowthTarget: false },
            { skillName: "Git & CI/CD", category: "DevOps", yourLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, matched: false, isGrowthTarget: false },
            { skillName: "REST API Design", category: "Backend", yourLevel: 2, requiredLevel: 3, maxLevel: 5, gap: 1, matched: false, isGrowthTarget: false },
        ],
        learningValue: [
            { skillName: "DevOps", gain: "+2 Levels", impact: "High", description: "Production deployment experience across the full MLOps lifecycle." },
            { skillName: "Python", gain: "+2 Levels", impact: "High", description: "Advanced Python in a production ML context." },
        ],
        tags: ["Docker", "Kubernetes", "MLOps", "CI/CD", "Python"],
        sponsor: "DataFlow Systems", openSpots: 3,
        roadmapPhase: 4,
    },
    {
        id: "p5",
        title: "Database Optimization & Query Analysis",
        description: "Analyze and optimize slow-running SQL queries in a legacy e-commerce database. Produce an optimization report, implement index strategies, and measure before/after performance metrics.",
        type: "Practice Task", difficulty: "Beginner",
        estimatedHours: "6–8 h", estimatedDuration: "1 week",
        matchScore: 85, isRecommended: false,
        eligibility: "Eligible",
        eligibilityReason: "Your SQL (L3) comfortably exceeds the entry requirement (L2) for this project.",
        matchExplanation: "Although SQL is already a strength in your profile, this project adds a second verified evidence item for SQL and contributes to Practical Experience. A quick win that improves your Assessment Reliability component.",
        skillMatches: [
            { skillName: "SQL", category: "Databases", yourLevel: 3, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "Python", category: "Programming", yourLevel: 3, requiredLevel: 2, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
            { skillName: "Git & CI/CD", category: "DevOps", yourLevel: 2, requiredLevel: 1, maxLevel: 5, gap: 0, matched: true, isGrowthTarget: false },
        ],
        learningValue: [
            { skillName: "SQL", gain: "2nd Verified Evidence", impact: "Medium", description: "Adds a second verified evidence item, raising SQL confidence." },
        ],
        tags: ["SQL", "PostgreSQL", "Performance", "Indexing", "Optimization"],
    },
];
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const TYPE_META = {
    "Practice Task": { emoji: "🔧", label: "Practice Task", color: "#3b8bff", bg: "rgba(59,139,255,0.08)", border: "rgba(59,139,255,0.2)" },
    "Simulation Project": { emoji: "🧪", label: "Simulation", color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
    "Real Project": { emoji: "🚀", label: "Real Project", color: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)" },
    "Assessment": { emoji: "📝", label: "Assessment", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    "Capstone": { emoji: "🎯", label: "Capstone", color: "#ec4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)" },
};
const DIFF_META = {
    Beginner: { label: "Beginner", color: "#059669", dots: 1 },
    Intermediate: { label: "Intermediate", color: "#f59e0b", dots: 2 },
    Advanced: { label: "Advanced", color: "#ef4444", dots: 3 },
    Expert: { label: "Expert", color: "#7c3aed", dots: 4 },
};
const ELIG_META = {
    "Eligible": { text: "text-[#059669]", bg: "bg-[rgba(5,150,105,0.08)]", border: "border-[rgba(5,150,105,0.2)]", dot: "bg-[#059669]", icon: "✓" },
    "Conditionally Eligible": { text: "text-[#f59e0b]", bg: "bg-[rgba(245,158,11,0.08)]", border: "border-[rgba(245,158,11,0.2)]", dot: "bg-[#f59e0b]", icon: "◑" },
    "Not Eligible": { text: "text-[#ef4444]", bg: "bg-[rgba(239,68,68,0.08)]", border: "border-[rgba(239,68,68,0.2)]", dot: "bg-[#ef4444]", icon: "✕" },
    "Completed": { text: "text-[#3b8bff]", bg: "bg-[rgba(59,139,255,0.08)]", border: "border-[rgba(59,139,255,0.2)]", dot: "bg-[#3b8bff]", icon: "★" },
};
const IMPACT_META = {
    High: { color: "#059669", bg: "rgba(5,150,105,0.1)" },
    Medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    Low: { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};
// ═══════════════════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Sk({ w = "100%", h = 14, r = 8 }) {
    return <div className="shimmer" style={{ width: w, height: h, borderRadius: r }}/>;
}
function Bar({ pct, color, h = 5 }) {
    return (<div className="w-full rounded-full bg-[#f1f3fa] overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}/>
    </div>);
}
// Match score ring
function MatchRing({ score, size = 56 }) {
    const r = (size / 2) - 5;
    const C = 2 * Math.PI * r;
    const filled = (score / 100) * C;
    const col = score >= 80 ? "#059669" : score >= 60 ? "#f59e0b" : "#ef4444";
    return (<div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3fa" strokeWidth="4"/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="4" strokeDasharray={`${filled} ${C - filled}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none" style={{ fontSize: size > 48 ? 14 : 11, color: col }}>{score}</span>
        <span className="font-normal text-[8px] text-[#94a3b8] leading-none">match</span>
      </div>
    </div>);
}
// Difficulty dots
function DifficultyDots({ d }) {
    const dm = DIFF_META[d];
    return (<div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4].map(i => (<span key={i} className="w-[5px] h-[5px] rounded-full" style={{ background: i <= dm.dots ? dm.color : "#e2e5ef" }}/>))}
      <span className="text-[10px] font-normal ml-[4px]" style={{ color: dm.color }}>{d}</span>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectDetailPanel({ project, onClose }) {
    const [activeTab, setActiveTab] = useState("match");
    const tm = TYPE_META[project.type];
    const em = ELIG_META[project.eligibility];
    const matchedCount = project.skillMatches.filter(s => s.matched).length;
    const gapCount = project.skillMatches.filter(s => !s.matched).length;
    return (<div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden flex flex-col">
      {/* Top accent */}
      <div className="h-[4px]" style={{ background: `linear-gradient(90deg,${tm.color},${tm.color}66)` }}/>

      {/* Header */}
      <div className="px-[24px] pt-[20px] pb-[16px] border-b border-[#f1f3fa]">
        <div className="flex items-start gap-[14px]">
          <div className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-[20px] shrink-0 border" style={{ background: tm.bg, borderColor: tm.border }}>{tm.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[10px]">
              <h3 className="font-bold text-[16px] text-[#0a0b14] leading-tight">{project.title}</h3>
              <div className="flex items-center gap-[8px] shrink-0">
                <MatchRing score={project.matchScore} size={52}/>
                <button onClick={onClose} className="w-[28px] h-[28px] rounded-[8px] bg-[#f1f3fa] hover:bg-[#e8eaf0] flex items-center justify-center transition-all">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-[8px] mt-[6px] flex-wrap">
              <span className="text-[11px] font-medium px-[8px] py-[2px] rounded-full border" style={{ color: tm.color, background: tm.bg, borderColor: tm.border }}>{tm.label}</span>
              <DifficultyDots d={project.difficulty}/>
              <span className="text-[11px] font-normal text-[#94a3b8]">{project.estimatedHours} · {project.estimatedDuration}</span>
              {project.sponsor && <span className="text-[10px] font-medium text-[#64748b] bg-[#f8f9fd] border border-[#e8eaf0] px-[7px] py-[2px] rounded-full">🏢 {project.sponsor}</span>}
            </div>
          </div>
        </div>
        {/* Eligibility bar */}
        <div className={`flex items-start gap-[8px] mt-[14px] rounded-[10px] px-[12px] py-[10px] border ${em.border} ${em.bg}`}>
          <span className={`text-[12px] font-bold mt-[1px] ${em.text}`}>{em.icon}</span>
          <div>
            <p className={`text-[12px] font-semibold ${em.text}`}>{project.eligibility}</p>
            <p className="text-[11px] font-normal text-[#64748b] mt-[1px] leading-[1.5]">{project.eligibilityReason}</p>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-[2px] px-[24px] pt-[14px] pb-[0px]">
        {[["match", "Why this project"], ["skills", "Skill alignment"], ["learning", "Learning value"]].map(([k, l]) => (<button key={k} onClick={() => setActiveTab(k)} className={`px-[12px] py-[7px] rounded-t-[8px] text-[12px] font-medium transition-all border-b-2 whitespace-nowrap
              ${activeTab === k ? "text-[#0a0b14] border-[#3b8bff] bg-[rgba(59,139,255,0.04)]" : "text-[#94a3b8] border-transparent hover:text-[#64748b]"}`}>
            {l}
          </button>))}
      </div>
      <div className="mx-[24px] h-px bg-[#f1f3fa] mb-[16px]"/>

      {/* Tab content */}
      <div className="px-[24px] pb-[20px] flex flex-col gap-[12px] overflow-y-auto flex-1">

        {/* ── Match explanation ── */}
        {activeTab === "match" && (<>
            {project.isRecommended && (<div className="relative overflow-hidden rounded-[14px] p-[16px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
                <div className="absolute -top-6 -right-4 w-28 h-28 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle,#3b8bff,transparent 70%)" }}/>
                <div className="relative flex items-start gap-[10px]">
                  <div className="w-[32px] h-[32px] rounded-[9px] bg-[rgba(59,139,255,0.2)] border border-[rgba(59,139,255,0.3)] flex items-center justify-center shrink-0">
                    <span className="text-[13px]">⚡</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-[6px] mb-[4px]">
                      <p className="text-[12px] font-semibold text-[#7ca8ff]">AI Recommended #{project.recommendationRank}</p>
                    </div>
                    <p className="text-[12px] font-normal text-[rgba(255,255,255,0.65)] leading-[1.6]">{project.recommendationReason}</p>
                  </div>
                </div>
              </div>)}
            <div>
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[6px]">Match explanation</p>
              <p className="text-[13px] font-normal text-[#64748b] leading-[1.65]">{project.matchExplanation}</p>
            </div>
            {project.alignsWithNBA && (<div className="flex items-center gap-[8px] bg-[rgba(59,139,255,0.05)] border border-[rgba(59,139,255,0.15)] rounded-[10px] px-[12px] py-[10px]">
                <span className="text-[14px]">⚡</span>
                <p className="text-[12px] font-normal text-[#3b8bff]">This project aligns with your <strong className="font-semibold">Next Best Action</strong> in your active career roadmap</p>
              </div>)}
            {project.roadmapPhase && (<div className="flex items-center gap-[8px] bg-[#f8f9ff] border border-[#eef0f8] rounded-[10px] px-[12px] py-[10px]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#3b8bff" strokeWidth="1.2"/><path d="M6.5 5.5v3.5" stroke="#3b8bff" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6.5" cy="4" r=".6" fill="#3b8bff"/></svg>
                <p className="text-[11px] font-normal text-[#64748b]">Counts toward <strong className="font-semibold text-[#0a0b14]">Phase {project.roadmapPhase}</strong> of your Career Roadmap</p>
              </div>)}
            <div className="grid grid-cols-3 gap-[8px]">
              {[
                { l: "Skills matched", v: `${matchedCount}/${project.skillMatches.length}`, c: "#059669" },
                { l: "Skill gaps", v: `${gapCount}`, c: gapCount > 0 ? "#ef4444" : "#059669" },
                { l: "Match score", v: `${project.matchScore}%`, c: project.matchScore >= 80 ? "#059669" : project.matchScore >= 60 ? "#f59e0b" : "#ef4444" },
            ].map(s => (<div key={s.l} className="bg-[#fafbff] border border-[#eef0f8] rounded-[10px] p-[10px] text-center">
                  <p className="font-bold text-[20px] leading-none" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-[10px] font-normal text-[#94a3b8] mt-[3px]">{s.l}</p>
                </div>))}
            </div>
          </>)}

        {/* ── Skill alignment ── */}
        {activeTab === "skills" && (<>
            <div className="flex items-center gap-[16px] text-[11px] font-normal text-[#94a3b8] mb-[4px] flex-wrap">
              <div className="flex items-center gap-[5px]"><span className="w-[8px] h-[8px] rounded-full bg-[#059669]"/><span>Met / Exceeded</span></div>
              <div className="flex items-center gap-[5px]"><span className="w-[8px] h-[8px] rounded-full bg-[#ef4444]"/><span>Gap — below requirement</span></div>
              <div className="flex items-center gap-[5px]"><span className="text-[10px]">📈</span><span>Growth target for this project</span></div>
            </div>
            <div className="flex flex-col gap-[8px]">
              {project.skillMatches.map(sm => (<div key={sm.skillName} className={`rounded-[10px] border p-[12px] ${sm.matched ? "border-[rgba(5,150,105,0.15)] bg-[rgba(5,150,105,0.03)]" : "border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.03)]"}`}>
                  <div className="flex items-center justify-between gap-[8px] mb-[6px]">
                    <div className="flex items-center gap-[6px]">
                      <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${sm.matched ? "bg-[#059669]" : "bg-[#ef4444]"}`}/>
                      <span className="font-semibold text-[12px] text-[#0a0b14]">{sm.skillName}</span>
                      <span className="text-[10px] font-normal text-[#94a3b8]">{sm.category}</span>
                      {sm.isGrowthTarget && <span className="text-[9px] font-medium text-[#3b8bff] bg-[rgba(59,139,255,0.1)] px-[6px] py-[1px] rounded-full">📈 Growth target</span>}
                    </div>
                    <div className="flex items-center gap-[10px] text-[11px] font-normal text-[#94a3b8] shrink-0">
                      <span>You: <strong className="font-semibold text-[#0a0b14]">L{sm.yourLevel}</strong></span>
                      <span>Required: <strong className="font-semibold text-[#64748b]">L{sm.requiredLevel}</strong></span>
                      {!sm.matched && <span className="text-[#ef4444] font-semibold">−{sm.gap}</span>}
                      {sm.matched && <span className="text-[#059669]">✓</span>}
                    </div>
                  </div>
                  {/* Level bar */}
                  <div className="relative w-full h-[6px] bg-[#f1f3fa] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(sm.yourLevel / sm.maxLevel) * 100}%`, background: sm.matched ? "#059669" : "#ef4444" }}/>
                    <div className="absolute top-0 h-full w-[2px] bg-[#64748b] opacity-40" style={{ left: `${(sm.requiredLevel / sm.maxLevel) * 100}%` }}/>
                  </div>
                  <div className="flex justify-between mt-[3px] text-[9px] font-normal text-[#d1d5db]">
                    <span>0</span><span>L{sm.maxLevel}</span>
                  </div>
                </div>))}
            </div>
          </>)}

        {/* ── Learning value ── */}
        {activeTab === "learning" && (<>
            <p className="text-[12px] font-normal text-[#64748b] leading-[1.6]">Completing this project produces verified evidence for the following skills, improving your Assessment Reliability and Practical Experience components.</p>
            <div className="flex flex-col gap-[10px]">
              {project.learningValue.map(lv => {
                const im = IMPACT_META[lv.impact];
                return (<div key={lv.skillName} className="bg-[#fafbff] border border-[#eef0f8] rounded-[12px] p-[14px] flex gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center text-[14px] shrink-0 font-bold border" style={{ background: im.bg, borderColor: `${im.color}25`, color: im.color }}>
                      {lv.impact === "High" ? "↑↑" : lv.impact === "Medium" ? "↑" : "→"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
                        <span className="font-semibold text-[13px] text-[#0a0b14]">{lv.skillName}</span>
                        <span className="text-[11px] font-bold px-[7px] py-[2px] rounded-full border" style={{ color: im.color, background: im.bg, borderColor: `${im.color}25` }}>{lv.gain}</span>
                        <span className="text-[10px] font-medium" style={{ color: im.color }}>{lv.impact} impact</span>
                      </div>
                      <p className="text-[12px] font-normal text-[#64748b] leading-[1.55]">{lv.description}</p>
                    </div>
                  </div>);
            })}
            </div>
            {/* Readiness components affected */}
            <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] p-[14px]">
              <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">Readiness components this project improves</p>
              <div className="flex flex-col gap-[6px]">
                {[
                { l: "Practical Experience", pct: 20, col: "#7c3aed", note: "Adds verified project evidence" },
                { l: "Assessment Reliability", pct: 10, col: "#f59e0b", note: "Verified source raises skill confidence" },
            ].map(c => (<div key={c.l} className="flex items-center gap-[10px]">
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: c.col }}/>
                    <span className="text-[11px] font-normal text-[#64748b] w-[160px] shrink-0">{c.l}</span>
                    <Bar pct={100} color={c.col} h={4}/>
                    <span className="text-[10px] font-normal text-[#94a3b8] shrink-0 w-[140px] text-right">{c.note}</span>
                  </div>))}
              </div>
            </div>
          </>)}
      </div>

      {/* Action footer */}
      <div className="px-[24px] py-[16px] border-t border-[#f1f3fa] flex items-center gap-[10px]">
        {project.eligibility === "Eligible" || project.eligibility === "Conditionally Eligible" ? (<>
            <button className="flex-1 py-[10px] rounded-[10px] text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(59,139,255,0.3)] transition-all hover:shadow-[0_6px_18px_rgba(59,139,255,0.4)]" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>
              {project.eligibility === "Eligible" ? "Start Project →" : "Start (Conditional) →"}
            </button>
            <button className="px-[16px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#64748b] bg-[#f1f3fa] hover:bg-[#e8eaf0] transition-all">Save</button>
          </>) : (<div className="flex-1 flex items-center gap-[8px] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] rounded-[10px] px-[14px] py-[10px]">
            <span className="text-[14px]">🔒</span>
            <p className="text-[12px] font-normal text-[#64748b]">Complete the required skill gaps to unlock this project</p>
          </div>)}
      </div>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CARD
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectCard({ project, isSelected, onClick }) {
    const tm = TYPE_META[project.type];
    const em = ELIG_META[project.eligibility];
    const matched = project.skillMatches.filter(s => s.matched);
    const gaps = project.skillMatches.filter(s => !s.matched);
    const topGain = project.learningValue[0];
    const im = topGain ? IMPACT_META[topGain.impact] : null;
    return (<button onClick={onClick} className={`w-full text-left bg-white border rounded-[18px] overflow-hidden transition-all flex flex-col hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]
      ${isSelected
            ? "border-[rgba(59,139,255,0.45)] shadow-[0_0_0_3px_rgba(59,139,255,0.08)]"
            : project.eligibility === "Not Eligible"
                ? "border-[#e8eaf0] opacity-75"
                : "border-[#e8eaf0]"}`}>

      {/* Top gradient stripe — recommended */}
      {project.isRecommended && <div className="h-[3px]" style={{ background: `linear-gradient(90deg,#3b8bff,#7c3aed)` }}/>}
      {/* Non-recommended stripe */}
      {!project.isRecommended && <div className="h-[3px]" style={{ background: tm.color + "30" }}/>}

      <div className="p-[18px] flex flex-col gap-[12px] flex-1">
        {/* Header row */}
        <div className="flex items-start gap-[10px]">
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[16px] shrink-0 border" style={{ background: tm.bg, borderColor: tm.border }}>{tm.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[6px]">
              <div className="flex-1 min-w-0">
                {/* Rec + rank badge */}
                {project.isRecommended && (<div className="flex items-center gap-[4px] mb-[3px]">
                    <span className="text-[9px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.1)] px-[6px] py-[1px] rounded-full">⚡ Recommended #{project.recommendationRank}</span>
                    {project.alignsWithNBA && <span className="text-[9px] font-medium text-[#7c3aed] bg-[rgba(124,58,237,0.08)] px-[6px] py-[1px] rounded-full">Roadmap action</span>}
                  </div>)}
                <p className="font-semibold text-[13px] text-[#0a0b14] leading-tight line-clamp-2">{project.title}</p>
              </div>
              <MatchRing score={project.matchScore} size={44}/>
            </div>
            <div className="flex items-center gap-[6px] mt-[4px] flex-wrap">
              <span className="text-[10px] font-medium px-[6px] py-[1px] rounded-full" style={{ color: tm.color, background: tm.bg }}>{tm.label}</span>
              <DifficultyDots d={project.difficulty}/>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[12px] font-normal text-[#64748b] leading-[1.55] line-clamp-2">{project.description}</p>

        {/* Skill alignment mini-row */}
        <div className="flex items-center gap-[6px] flex-wrap">
          {matched.slice(0, 3).map(s => (<span key={s.skillName} className="text-[10px] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(5,150,105,0.08)] text-[#059669] border border-[rgba(5,150,105,0.15)]">✓ {s.skillName}</span>))}
          {gaps.slice(0, 2).map(s => (<span key={s.skillName} className="text-[10px] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(239,68,68,0.06)] text-[#ef4444] border border-[rgba(239,68,68,0.15)]">−{s.gap} {s.skillName}</span>))}
          {project.skillMatches.length > 5 && (<span className="text-[10px] font-normal text-[#94a3b8]">+{project.skillMatches.length - 5} more</span>)}
        </div>

        {/* Learning value pill */}
        {topGain && im && (<div className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[8px] border" style={{ background: im.bg, borderColor: `${im.color}25` }}>
            <span className="text-[11px]">📈</span>
            <span className="text-[11px] font-normal" style={{ color: im.color }}>
              <strong className="font-semibold">{topGain.gain}</strong> for {topGain.skillName} · {topGain.impact} impact
            </span>
          </div>)}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-[10px] border-t border-[#f8f9fd]">
          <div className="flex items-center gap-[5px]">
            <span className={`w-[5px] h-[5px] rounded-full ${em.dot}`}/>
            <span className={`text-[10px] font-medium ${em.text}`}>{project.eligibility}</span>
          </div>
          <div className="flex items-center gap-[8px] text-[10px] font-normal text-[#94a3b8]">
            <span>⏱ {project.estimatedHours}</span>
            {project.openSpots && <span className="text-[#f59e0b]">⚠ {project.openSpots} spots left</span>}
            <span className="text-[#3b8bff] font-medium">View →</span>
          </div>
        </div>
      </div>
    </button>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function RecommendationBanner({ count }) {
    return (<div className="relative overflow-hidden shrink-0 rounded-[18px] px-[22px] py-[18px] mb-[4px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
      <div className="absolute -top-8 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle,#3b8bff,transparent 70%)" }}/>
      <div className="relative flex items-center gap-[14px]">
        <div className="w-[42px] h-[42px] rounded-[12px] bg-[rgba(59,139,255,0.2)] border border-[rgba(59,139,255,0.3)] flex items-center justify-center shrink-0">
          <span className="text-[18px]">⚡</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-[6px] mb-[2px]">
            <span className="font-bold text-[14px] text-white">AI Project Recommendations</span>
            <span className="text-[10px] font-semibold text-[#7ca8ff] bg-[rgba(59,139,255,0.2)] px-[7px] py-[1px] rounded-full">{count} matches</span>
          </div>
          <p className="text-[12px] font-normal text-[rgba(255,255,255,0.5)] leading-[1.5]">
            Projects selected based on your skill gaps, career roadmap, and learning priorities for <strong className="text-[rgba(255,255,255,0.7)] font-medium">Software Engineer v2.3</strong>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-normal text-[rgba(255,255,255,0.35)]">Updated</p>
          <p className="text-[11px] font-medium text-[rgba(255,255,255,0.5)]">9 Sep 2026</p>
        </div>
      </div>
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// STATE SCREENS
// ═══════════════════════════════════════════════════════════════════════════════
function LoadingState() {
    return (<div className="flex flex-col gap-[16px]">
      {/* Banner skeleton */}
      <div className="rounded-[18px] px-[22px] py-[18px]" style={{ background: "linear-gradient(130deg,#0d0f24,#1a1d40)" }}>
        <div className="flex items-center gap-[14px]">
          <Sk w={42} h={42} r={12}/><div className="flex-1 flex flex-col gap-[6px]"><Sk w="40%" h={16} r={5}/><Sk w="65%" h={12} r={4}/></div>
        </div>
      </div>
      {/* Filter skeleton */}
      <div className="flex gap-[8px]"><Sk w="100%" h={40} r={10}/><Sk w={100} h={40} r={10}/><Sk w={100} h={40} r={10}/></div>
      {/* Card skeletons */}
      <div className="grid grid-cols-2 gap-[14px]">
        {[0, 1, 2, 3].map(i => (<div key={i} className="bg-white border border-[#e8eaf0] rounded-[18px] p-[18px] flex flex-col gap-[12px]">
            <div className="flex gap-[10px]"><Sk w={38} h={38} r={10}/><div className="flex-1 flex flex-col gap-[5px]"><Sk w="70%" h={13} r={4}/><Sk w="45%" h={10} r={4}/></div><Sk w={44} h={44} r={22}/></div>
            <Sk w="100%" h={11} r={4}/><Sk w="80%" h={11} r={4}/>
            <div className="flex gap-[5px]"><Sk w={70} h={20} r={10}/><Sk w={80} h={20} r={10}/><Sk w={60} h={20} r={10}/></div>
            <Sk w="100%" h={34} r={8}/>
            <div className="flex justify-between pt-[10px] border-t border-[#f8f9fd]"><Sk w={80} h={10} r={4}/><Sk w={60} h={10} r={4}/></div>
          </div>))}
      </div>
      <div className="flex items-center justify-center gap-[8px] py-[4px]">
        <svg className="animate-spin" width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#e2e8f0" strokeWidth="2"/>
          <path d="M6.5 1.5C9.8 1.5 12.5 4.2 12.5 7" stroke="url(#pspin)" strokeWidth="2" strokeLinecap="round"/>
          <defs><linearGradient id="pspin" x1="6.5" y1="1.5" x2="12.5" y2="7" gradientUnits="userSpaceOnUse"><stop stopColor="#3b8bff"/><stop offset="1" stopColor="#7c3aed"/></linearGradient></defs>
        </svg>
        <span className="text-[12px] font-normal text-[#94a3b8]">Matching projects to your skill profile…</span>
      </div>
    </div>);
}
function ErrorState() {
    return (<div className="flex flex-col gap-[16px]">
      <div className="bg-white border border-[#e8eaf0] rounded-[20px] overflow-hidden">
        <div className="h-[4px] bg-[#ef4444]"/>
        <div className="flex flex-col items-center text-center px-[48px] py-[40px] gap-[18px]">
          <div className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center text-[24px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">✕</div>
          <div>
            <h3 className="font-bold text-[18px] text-[#ef4444] mb-[6px]">Project discovery unavailable</h3>
            <p className="text-[13px] font-normal text-[#64748b] max-w-[400px] leading-[1.65]">We could not load project recommendations. No data has been modified. Please try again — if the problem continues, contact support.</p>
          </div>
          <div className="flex items-center gap-[8px]">
            <button className="flex items-center gap-[6px] px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M9 5.5A3.5 3.5 0 1 1 5.5 2c.96 0 1.84.39 2.47 1.03L9 2v3.5H5.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Try Again
            </button>
            <button className="px-[18px] py-[9px] rounded-[10px] text-[13px] font-medium text-[#64748b] bg-[#f1f3fa]">Contact Support</button>
          </div>
        </div>
      </div>
    </div>);
}
function NoProjectsState({ hasFilters, onClear }) {
    return (<div className="bg-white border border-[#e8eaf0] rounded-[20px] p-[48px] flex flex-col items-center text-center gap-[18px]">
      <div className="w-[64px] h-[64px] rounded-[18px] bg-[rgba(148,163,184,0.08)] border border-[rgba(148,163,184,0.15)] flex items-center justify-center text-[26px]">
        {hasFilters ? "🔍" : "🗂"}
      </div>
      <div>
        <h3 className="font-bold text-[17px] text-[#0a0b14] mb-[6px]">
          {hasFilters ? "No projects match your filters" : "No eligible projects found"}
        </h3>
        <p className="text-[13px] font-normal text-[#64748b] max-w-[420px] leading-[1.65]">
          {hasFilters
            ? "Try removing some filters — eligible projects may be hidden by the current filter combination."
            : "Your current skill levels do not yet meet the entry requirements for any available project. Complete the assessments on your career roadmap to unlock projects."}
        </p>
      </div>
      {hasFilters ? (<button onClick={onClear} className="px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold text-[#3b8bff] border border-[rgba(59,139,255,0.3)] bg-[rgba(59,139,255,0.05)]">Clear all filters</button>) : (<div className="flex flex-col items-center gap-[6px]">
          <button className="px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold text-white" style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}>View Career Roadmap →</button>
          <p className="text-[11px] font-normal text-[#94a3b8]">Projects unlock as you close skill gaps</p>
        </div>)}
    </div>);
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const ALL_TYPES = ["Practice Task", "Simulation Project", "Real Project", "Assessment", "Capstone"];
const ALL_ELIGIBILITY = ["Eligible", "Conditionally Eligible", "Not Eligible", "Completed"];
export default function ProjectsView({ status = "loaded" }) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [eligFilter, setEligFilter] = useState("all");
    const [showRec, setShowRec] = useState(true);
    const [sortBy, setSortBy] = useState("match");
    const [selected, setSelected] = useState("p1");
    const recommended = PROJECTS.filter(p => p.isRecommended);
    const filtered = useMemo(() => {
        let list = [...PROJECTS];
        if (search)
            list = list.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
        if (typeFilter !== "all")
            list = list.filter(p => p.type === typeFilter);
        if (eligFilter !== "all")
            list = list.filter(p => p.eligibility === eligFilter);
        if (sortBy === "match")
            list.sort((a, b) => b.matchScore - a.matchScore);
        if (sortBy === "difficulty")
            list.sort((a, b) => ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(a.difficulty) - ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(b.difficulty));
        if (sortBy === "effort")
            list.sort((a, b) => parseInt(a.estimatedHours) - parseInt(b.estimatedHours));
        return list;
    }, [search, typeFilter, eligFilter, sortBy]);
    const selectedProject = PROJECTS.find(p => p.id === selected) ?? null;
    const hasActiveFilter = typeFilter !== "all" || eligFilter !== "all" || !!search;
    const isLoaded = status === "loaded";
    return (<div className="flex flex-col h-full overflow-hidden bg-[#f1f3fa]">

      {/* Page header */}
      <div className="bg-[#f1f3fa] px-[32px] pt-[24px] pb-[14px] shrink-0 border-b border-[#e8eaf0]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-[26px] text-[#0a0b14] leading-tight">Projects</h1>
            <p className="font-normal text-[13px] text-[#64748b] mt-[3px]">
              Matched to <span className="font-semibold text-[#0a0b14]">Software Engineer v2.3</span>
              {isLoaded && <> · <span className="text-[#059669] font-medium">{PROJECTS.filter(p => p.eligibility === "Eligible").length} eligible</span> · <span className="text-[#3b8bff] font-medium">{recommended.length} recommended</span></>}
            </p>
          </div>
        </div>

        {/* Search + filters */}
        {isLoaded && (<div className="flex items-center gap-[8px] mt-[14px] flex-wrap">
            {/* Search */}
            <div className="relative flex-1 max-w-[340px] min-w-[200px]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-[12px] top-[12px] opacity-40">
                <circle cx="6" cy="6" r="4.5" stroke="#0a0b14" strokeWidth="1.3"/>
                <path d="M9.5 9.5L12.5 12.5" stroke="#0a0b14" strokeLinecap="round" strokeWidth="1.3"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, skills, tags…" className="w-full h-[38px] pl-[34px] pr-[12px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-normal text-[#0a0b14] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b8bff] transition-colors"/>
            </div>

            {/* Type filter */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[38px] px-[10px] bg-white border border-[#e8eaf0] rounded-[10px] text-[12px] font-medium text-[#64748b] focus:outline-none focus:border-[#3b8bff] transition-colors cursor-pointer">
              <option value="all">All types</option>
              {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Eligibility filter */}
            <select value={eligFilter} onChange={e => setEligFilter(e.target.value)} className="h-[38px] px-[10px] bg-white border border-[#e8eaf0] rounded-[10px] text-[12px] font-medium text-[#64748b] focus:outline-none focus:border-[#3b8bff] transition-colors cursor-pointer">
              <option value="all">All eligibility</option>
              {ALL_ELIGIBILITY.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-[38px] px-[10px] bg-white border border-[#e8eaf0] rounded-[10px] text-[12px] font-medium text-[#64748b] focus:outline-none focus:border-[#3b8bff] transition-colors cursor-pointer">
              <option value="match">Sort: Match score</option>
              <option value="difficulty">Sort: Difficulty</option>
              <option value="effort">Sort: Effort</option>
            </select>

            {/* Rec toggle */}
            <button onClick={() => setShowRec(!showRec)} className={`h-[38px] px-[12px] rounded-[10px] text-[12px] font-medium whitespace-nowrap border transition-all
                ${showRec ? "bg-[rgba(59,139,255,0.08)] border-[rgba(59,139,255,0.25)] text-[#3b8bff]" : "bg-white border-[#e8eaf0] text-[#64748b]"}`}>
              ⚡ Recommended
            </button>

            {hasActiveFilter && (<button onClick={() => { setSearch(""); setTypeFilter("all"); setEligFilter("all"); }} className="h-[38px] px-[10px] rounded-[10px] text-[12px] font-medium text-[#94a3b8] bg-white border border-[#e8eaf0] hover:border-[#ef4444] hover:text-[#ef4444] transition-all">✕ Clear</button>)}
          </div>)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: project list */}
        <div className={`overflow-y-auto px-[32px] py-[20px] flex flex-col gap-[16px] transition-all ${selectedProject && isLoaded ? "w-[520px] shrink-0" : "flex-1"}`}>
          {status === "loading" && <LoadingState />}
          {status === "error" && <ErrorState />}
          {status === "no-projects" && <NoProjectsState hasFilters={hasActiveFilter} onClear={() => { setSearch(""); setTypeFilter("all"); setEligFilter("all"); }}/>}

          {isLoaded && (<>
              {/* Recommendation banner */}
              {showRec && recommended.length > 0 && <RecommendationBanner count={recommended.length}/>}

              {/* Recommended section */}
              {showRec && recommended.length > 0 && (<div>
                  <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[10px]">
                    Recommended for you
                  </p>
                  <div className="flex flex-col gap-[12px]">
                    {recommended.filter(p => (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
                    && (typeFilter === "all" || p.type === typeFilter)
                    && (eligFilter === "all" || p.eligibility === eligFilter)).map(p => (<ProjectCard key={p.id} project={p} isSelected={selected === p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}/>))}
                  </div>
                </div>)}

              {/* All projects */}
              <div>
                <div className="flex items-center justify-between mb-[10px]">
                  <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                    {showRec ? "All projects" : "Projects"} <span className="normal-case font-normal">({filtered.length})</span>
                  </p>
                </div>

                {filtered.length === 0
                ? <NoProjectsState hasFilters={hasActiveFilter} onClear={() => { setSearch(""); setTypeFilter("all"); setEligFilter("all"); }}/>
                : <div className="flex flex-col gap-[12px]">
                      {filtered.map(p => (<ProjectCard key={p.id} project={p} isSelected={selected === p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}/>))}
                    </div>}
              </div>
            </>)}
        </div>

        {/* Right: detail panel */}
        {selectedProject && isLoaded && (<div className="w-[440px] shrink-0 border-l border-[#e8eaf0] overflow-y-auto bg-[#fafbff] p-[20px]">
            <ProjectDetailPanel project={selectedProject} onClose={() => setSelected(null)}/>
          </div>)}
      </div>

    </div>);
}
