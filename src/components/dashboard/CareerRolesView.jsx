import { useState } from "react";
// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ROLES = [
    {
        id: "role-se",
        title: "Software Engineer",
        category: "Engineering",
        version: "v2.3",
        effectiveDate: "2026-01-15",
        status: "approved",
        readinessScore: 67,
        isSaved: true,
        isSuggested: true,
        suggestionReason: "Your Python and React skills align strongly with 9 of 12 required competencies for this role.",
        demand: {
            demandLevel: "High",
            demandValue: 84,
            source: "LinkedIn Labor Insights",
            collectionDate: "2026-08-01",
            validUntil: "2027-01-31",
            isExpired: false,
        },
        skillRequirements: [
            { skillId: "s1", skillName: "Python", category: "Programming", requiredLevel: 4, maxLevel: 4, currentLevel: 3, importanceWeight: 0.9, isCritical: true, prerequisites: [] },
            { skillId: "s2", skillName: "React", category: "Frontend", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.8, isCritical: true, prerequisites: ["JavaScript"] },
            { skillId: "s3", skillName: "System Design", category: "Architecture", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.75, isCritical: false, prerequisites: [] },
            { skillId: "s4", skillName: "SQL", category: "Databases", requiredLevel: 3, maxLevel: 4, currentLevel: 3, importanceWeight: 0.7, isCritical: false, prerequisites: [] },
            { skillId: "s5", skillName: "Git & CI/CD", category: "DevOps", requiredLevel: 2, maxLevel: 4, currentLevel: 2, importanceWeight: 0.6, isCritical: false, prerequisites: [] },
            { skillId: "s6", skillName: "REST API Design", category: "Backend", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.65, isCritical: false, prerequisites: ["HTTP"] },
        ],
    },
    {
        id: "role-da",
        title: "Data Analyst",
        category: "Analytics",
        version: "v1.8",
        effectiveDate: "2026-02-01",
        status: "approved",
        readinessScore: 52,
        isSaved: true,
        isSuggested: true,
        suggestionReason: "Your Pandas and Tableau evidence suggests strong analytical capability matching 7 of 11 required skills.",
        demand: {
            demandLevel: "High",
            demandValue: 78,
            source: "Glassdoor Market Data",
            collectionDate: "2026-07-15",
            validUntil: "2027-01-15",
            isExpired: false,
        },
        skillRequirements: [
            { skillId: "d1", skillName: "SQL", category: "Databases", requiredLevel: 4, maxLevel: 4, currentLevel: 3, importanceWeight: 0.95, isCritical: true, prerequisites: [] },
            { skillId: "d2", skillName: "Python / Pandas", category: "Programming", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.85, isCritical: true, prerequisites: ["Python"] },
            { skillId: "d3", skillName: "Tableau", category: "Visualization", requiredLevel: 3, maxLevel: 4, currentLevel: 0, importanceWeight: 0.8, isCritical: false, prerequisites: [] },
            { skillId: "d4", skillName: "Statistics", category: "Mathematics", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.75, isCritical: false, prerequisites: [] },
            { skillId: "d5", skillName: "Excel / Sheets", category: "Productivity", requiredLevel: 2, maxLevel: 4, currentLevel: 3, importanceWeight: 0.5, isCritical: false, prerequisites: [] },
        ],
    },
    {
        id: "role-ml",
        title: "ML Engineer",
        category: "Machine Learning",
        version: "v1.2",
        effectiveDate: "2026-03-10",
        status: "approved",
        readinessScore: 38,
        isSaved: false,
        isSuggested: true,
        suggestionReason: "Your Python proficiency and interest in ML projects places you on a viable path to this role with targeted upskilling.",
        demand: {
            demandLevel: "High",
            demandValue: 91,
            source: "Indeed Job Market Index",
            collectionDate: "2026-06-01",
            validUntil: "2026-11-30",
            isExpired: false,
        },
        skillRequirements: [
            { skillId: "m1", skillName: "Python", category: "Programming", requiredLevel: 4, maxLevel: 4, currentLevel: 3, importanceWeight: 0.95, isCritical: true, prerequisites: [] },
            { skillId: "m2", skillName: "Machine Learning", category: "AI/ML", requiredLevel: 4, maxLevel: 4, currentLevel: 1, importanceWeight: 0.95, isCritical: true, prerequisites: ["Python", "Statistics"] },
            { skillId: "m3", skillName: "Deep Learning / PyTorch", category: "AI/ML", requiredLevel: 3, maxLevel: 4, currentLevel: 0, importanceWeight: 0.85, isCritical: true, prerequisites: ["Machine Learning"] },
            { skillId: "m4", skillName: "MLOps", category: "DevOps", requiredLevel: 2, maxLevel: 4, currentLevel: 0, importanceWeight: 0.7, isCritical: false, prerequisites: ["CI/CD"] },
            { skillId: "m5", skillName: "Statistics", category: "Mathematics", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.8, isCritical: false, prerequisites: [] },
        ],
    },
    {
        id: "role-pm",
        title: "Product Manager",
        category: "Product",
        version: "v2.0",
        effectiveDate: "2025-11-01",
        status: "approved",
        readinessScore: 44,
        isSaved: false,
        demand: {
            demandLevel: "Medium",
            demandValue: 62,
            source: "LinkedIn Labor Insights",
            collectionDate: "2026-05-01",
            validUntil: "2026-10-31",
            isExpired: false,
        },
        skillRequirements: [
            { skillId: "p1", skillName: "Product Strategy", category: "Strategy", requiredLevel: 3, maxLevel: 4, currentLevel: 1, importanceWeight: 0.9, isCritical: true, prerequisites: [] },
            { skillId: "p2", skillName: "User Research", category: "UX", requiredLevel: 3, maxLevel: 4, currentLevel: 1, importanceWeight: 0.85, isCritical: false, prerequisites: [] },
            { skillId: "p3", skillName: "Data Analysis", category: "Analytics", requiredLevel: 2, maxLevel: 4, currentLevel: 2, importanceWeight: 0.7, isCritical: false, prerequisites: [] },
            { skillId: "p4", skillName: "Roadmapping", category: "Planning", requiredLevel: 3, maxLevel: 4, currentLevel: 1, importanceWeight: 0.8, isCritical: false, prerequisites: [] },
        ],
    },
    {
        id: "role-devops",
        title: "DevOps Engineer",
        category: "Infrastructure",
        version: "v1.5",
        effectiveDate: "2026-01-20",
        status: "approved",
        readinessScore: 29,
        isSaved: false,
        demand: {
            demandLevel: "Medium",
            demandValue: 58,
            source: "Stack Overflow Developer Survey",
            collectionDate: "2026-04-01",
            validUntil: "2026-09-30",
            isExpired: true,
        },
        skillRequirements: [
            { skillId: "dv1", skillName: "Kubernetes", category: "Infrastructure", requiredLevel: 3, maxLevel: 4, currentLevel: 0, importanceWeight: 0.9, isCritical: true, prerequisites: ["Docker"] },
            { skillId: "dv2", skillName: "Terraform", category: "IaC", requiredLevel: 3, maxLevel: 4, currentLevel: 0, importanceWeight: 0.85, isCritical: false, prerequisites: [] },
            { skillId: "dv3", skillName: "CI/CD Pipelines", category: "DevOps", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.8, isCritical: true, prerequisites: [] },
            { skillId: "dv4", skillName: "Linux", category: "Systems", requiredLevel: 3, maxLevel: 4, currentLevel: 1, importanceWeight: 0.75, isCritical: false, prerequisites: [] },
            { skillId: "dv5", skillName: "Cloud (AWS/GCP)", category: "Cloud", requiredLevel: 3, maxLevel: 4, currentLevel: 0, importanceWeight: 0.85, isCritical: true, prerequisites: [] },
        ],
    },
    {
        id: "role-ds",
        title: "Data Scientist",
        category: "Data Science",
        version: "v2.1",
        effectiveDate: "2026-02-15",
        status: "approved",
        readinessScore: 41,
        isSaved: false,
        demand: {
            demandLevel: "High",
            demandValue: 86,
            source: "Bureau of Labor Statistics",
            collectionDate: "2026-07-01",
            validUntil: "2027-06-30",
            isExpired: false,
        },
        skillRequirements: [
            { skillId: "ds1", skillName: "Python", category: "Programming", requiredLevel: 4, maxLevel: 4, currentLevel: 3, importanceWeight: 0.9, isCritical: true, prerequisites: [] },
            { skillId: "ds2", skillName: "Statistics & Probability", category: "Mathematics", requiredLevel: 4, maxLevel: 4, currentLevel: 2, importanceWeight: 0.9, isCritical: true, prerequisites: [] },
            { skillId: "ds3", skillName: "Machine Learning", category: "AI/ML", requiredLevel: 3, maxLevel: 4, currentLevel: 1, importanceWeight: 0.85, isCritical: true, prerequisites: ["Statistics"] },
            { skillId: "ds4", skillName: "Data Visualization", category: "Analytics", requiredLevel: 3, maxLevel: 4, currentLevel: 2, importanceWeight: 0.7, isCritical: false, prerequisites: [] },
            { skillId: "ds5", skillName: "SQL", category: "Databases", requiredLevel: 3, maxLevel: 4, currentLevel: 3, importanceWeight: 0.75, isCritical: false, prerequisites: [] },
        ],
    },
];
// ── Utility helpers ──────────────────────────────────────────────────────────
function demandColor(level) {
    if (level === "High")
        return { bg: "bg-[rgba(5,150,105,0.1)]", text: "text-[#059669]", dot: "bg-[#059669]" };
    if (level === "Medium")
        return { bg: "bg-[rgba(245,158,11,0.1)]", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" };
    return { bg: "bg-[rgba(100,116,139,0.1)]", text: "text-[#64748b]", dot: "bg-[#64748b]" };
}
function readinessColor(score) {
    if (score >= 70)
        return "#059669";
    if (score >= 50)
        return "#f59e0b";
    return "#ef4444";
}
function skillGapColor(current, required) {
    if (current >= required)
        return { bar: "bg-[#059669]", text: "text-[#059669]" };
    if (current >= required - 1)
        return { bar: "bg-[#f59e0b]", text: "text-[#f59e0b]" };
    return { bar: "bg-[#ef4444]", text: "text-[#ef4444]" };
}
function categoryColor(category) {
    const map = {
        Engineering: "bg-[rgba(59,139,255,0.1)] text-[#3b8bff]",
        Analytics: "bg-[rgba(124,58,237,0.1)] text-[#7c3aed]",
        "Machine Learning": "bg-[rgba(5,150,105,0.1)] text-[#059669]",
        Product: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]",
        Infrastructure: "bg-[rgba(239,68,68,0.1)] text-[#ef4444]",
        "Data Science": "bg-[rgba(124,58,237,0.1)] text-[#7c3aed]",
    };
    return map[category] ?? "bg-[rgba(100,116,139,0.1)] text-[#64748b]";
}
// ── ReadinessGauge ────────────────────────────────────────────────────────────
function ReadinessGauge({ score, size = 100 }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const filled = (score / 100) * circumference * 0.75;
    const gap = circumference - filled;
    const color = readinessColor(score);
    return (<svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[135deg]">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round"/>
      <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${filled} ${gap + circumference * 0.25}`} strokeLinecap="round"/>
    </svg>);
}
// ── DemandIndicator ───────────────────────────────────────────────────────────
function DemandIndicator({ demand }) {
    const c = demandColor(demand.demandLevel);
    return (<div className="border border-[#e8eaf0] rounded-[12px] p-[16px] bg-white">
      <div className="flex items-center justify-between mb-[12px]">
        <span className="font-semibold text-[13px] text-[#0a0b14]">Labor-Market Demand</span>
        {demand.isExpired && (<span className="bg-[rgba(239,68,68,0.08)] text-[#ef4444] text-[11px] font-medium px-[8px] py-[3px] rounded-full">Data Expired</span>)}
      </div>
      <div className="flex items-center gap-[8px] mb-[10px]">
        <div className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-full ${c.bg}`}>
          <span className={`w-[6px] h-[6px] rounded-full ${c.dot}`}/>
          <span className={`font-semibold text-[12px] ${c.text}`}>{demand.demandLevel} Demand</span>
        </div>
        <span className="font-bold text-[14px] text-[#0a0b14]">{demand.demandValue}%</span>
      </div>
      <div className="w-full bg-[#f1f3fa] rounded-full h-[6px] mb-[12px]">
        <div className={`h-[6px] rounded-full ${c.dot}`} style={{ width: `${demand.demandValue}%` }}/>
      </div>
      <div className="flex items-start gap-[4px] flex-wrap">
        <span className="text-[11px] font-normal text-[#94a3b8]">Source:</span>
        <span className="text-[11px] font-medium text-[#64748b]">{demand.source}</span>
        <span className="text-[11px] text-[#94a3b8]">·</span>
        <span className="text-[11px] font-normal text-[#94a3b8]">Collected {demand.collectionDate}</span>
        <span className="text-[11px] text-[#94a3b8]">·</span>
        <span className={`text-[11px] font-medium ${demand.isExpired ? "text-[#ef4444]" : "text-[#94a3b8]"}`}>
          {demand.isExpired ? "Expired" : `Valid until ${demand.validUntil}`}
        </span>
      </div>
    </div>);
}
// ── SkillRequirementRow ────────────────────────────────────────────────────────
function SkillRequirementRow({ skill, expanded, onToggle }) {
    const gapPct = (skill.currentLevel / skill.maxLevel) * 100;
    const reqPct = (skill.requiredLevel / skill.maxLevel) * 100;
    const colors = skillGapColor(skill.currentLevel, skill.requiredLevel);
    const met = skill.currentLevel >= skill.requiredLevel;
    return (<div className={`border-b border-[#f1f3fa] last:border-0 ${expanded ? "bg-[#fafbff]" : ""}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-[12px] px-[20px] py-[14px] hover:bg-[#f8f9fd] transition-colors text-left">
        <div className="flex items-center gap-[8px] w-[180px] shrink-0">
          {skill.isCritical && (<span className="w-[6px] h-[6px] rounded-full bg-[#ef4444] shrink-0" title="Critical skill"/>)}
          {!skill.isCritical && <span className="w-[6px] h-[6px] shrink-0"/>}
          <span className="font-medium text-[13px] text-[#0a0b14] truncate">{skill.skillName}</span>
        </div>
        <span className="text-[11px] font-normal text-[#94a3b8] w-[80px] shrink-0">{skill.category}</span>
        <div className="flex-1 flex items-center gap-[8px]">
          <div className="flex-1 bg-[#f1f3fa] rounded-full h-[6px] relative">
            <div className="h-[6px] rounded-full bg-[rgba(59,139,255,0.2)] absolute left-0" style={{ width: `${reqPct}%` }}/>
            <div className={`h-[6px] rounded-full absolute left-0 transition-all ${colors.bar}`} style={{ width: `${gapPct}%` }}/>
          </div>
          <span className="text-[11px] font-medium text-[#64748b] w-[36px] text-right shrink-0">
            {skill.currentLevel}/{skill.requiredLevel}
          </span>
        </div>
        <span className={`text-[11px] font-semibold w-[28px] text-right shrink-0 ${colors.text}`}>
          {Math.round(skill.importanceWeight * 100)}%
        </span>
        <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${met ? "bg-[rgba(5,150,105,0.1)]" : "bg-[rgba(239,68,68,0.08)]"}`}>
          {met ? (<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>) : (<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3L7 7M7 3L3 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>)}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M2 4L6 8L10 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && (<div className="px-[20px] pb-[16px] pt-[4px] flex gap-[24px] flex-wrap">
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8] mb-[4px]">Importance Weight</p>
            <p className="text-[13px] font-semibold text-[#0a0b14]">{Math.round(skill.importanceWeight * 100)}% of role score</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8] mb-[4px]">Critical Skill</p>
            <p className={`text-[13px] font-semibold ${skill.isCritical ? "text-[#ef4444]" : "text-[#64748b]"}`}>
              {skill.isCritical ? "Yes — required for role approval" : "No"}
            </p>
          </div>
          {skill.prerequisites.length > 0 && (<div>
              <p className="text-[11px] font-medium text-[#94a3b8] mb-[4px]">Prerequisites</p>
              <div className="flex gap-[6px] flex-wrap">
                {skill.prerequisites.map(p => (<span key={p} className="bg-[rgba(59,139,255,0.08)] text-[#3b8bff] text-[11px] font-medium px-[8px] py-[2px] rounded-full">{p}</span>))}
              </div>
            </div>)}
          <div>
            <p className="text-[11px] font-medium text-[#94a3b8] mb-[4px]">Gap to Close</p>
            <p className={`text-[13px] font-semibold ${colors.text}`}>
              {met ? "Met" : `${skill.requiredLevel - skill.currentLevel} level${skill.requiredLevel - skill.currentLevel > 1 ? "s" : ""} to go`}
            </p>
          </div>
        </div>)}
    </div>);
}
// ── RoleDetailPanel ────────────────────────────────────────────────────────────
function RoleDetailPanel({ role, onBack, onSaveToggle }) {
    const [expandedSkill, setExpandedSkill] = useState(null);
    const criticalMet = role.skillRequirements.filter(s => s.isCritical && s.currentLevel >= s.requiredLevel).length;
    const criticalTotal = role.skillRequirements.filter(s => s.isCritical).length;
    const skillsMet = role.skillRequirements.filter(s => s.currentLevel >= s.requiredLevel).length;
    return (<div className="flex-1 overflow-y-auto">
      {/* Detail Header */}
      <div className="flex items-center gap-[12px] mb-[24px]">
        <button onClick={onBack} className="flex items-center gap-[6px] text-[#64748b] hover:text-[#0a0b14] transition-colors text-[13px] font-medium">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Roles
        </button>
      </div>

      {/* Role Summary Card */}
      <div className="rounded-[16px] border border-[#e8eaf0] bg-white p-[24px] mb-[16px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex-1">
            <div className="flex items-center gap-[8px] mb-[8px] flex-wrap">
              <span className={`text-[11px] font-medium px-[8px] py-[3px] rounded-full ${categoryColor(role.category)}`}>{role.category}</span>
              {/* Version Indicator */}
              <span className="flex items-center gap-[4px] bg-[rgba(59,139,255,0.08)] text-[#3b8bff] text-[11px] font-medium px-[8px] py-[3px] rounded-full border border-[rgba(59,139,255,0.15)]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#3b8bff" strokeWidth="1"/><path d="M5 3v2.5l1.5 1" stroke="#3b8bff" strokeWidth="1" strokeLinecap="round"/></svg>
                {role.version}
              </span>
              <span className="bg-[rgba(5,150,105,0.08)] text-[#059669] text-[11px] font-medium px-[8px] py-[3px] rounded-full">
                ✓ Approved
              </span>
              <span className="text-[11px] font-normal text-[#94a3b8]">Effective {role.effectiveDate}</span>
            </div>
            <h2 className="font-bold text-[22px] text-[#0a0b14] mb-[4px]">{role.title}</h2>
          </div>
          <button onClick={() => onSaveToggle(role.id)} className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-[10px] text-[13px] font-semibold transition-all shrink-0 ${role.isSaved
            ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff] border border-[rgba(59,139,255,0.2)]"
            : "bg-[#f1f3fa] text-[#64748b] border border-[#e8eaf0] hover:bg-[rgba(59,139,255,0.06)] hover:text-[#3b8bff]"}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill={role.isSaved ? "#3b8bff" : "none"} stroke={role.isSaved ? "#3b8bff" : "currentColor"} strokeWidth="1.4">
              <path d="M2 2h10v11l-5-3-5 3V2z" strokeLinejoin="round"/>
            </svg>
            {role.isSaved ? "Saved" : "Save Role"}
          </button>
        </div>

        {/* Readiness Context */}
        <div className="mt-[20px] grid grid-cols-3 gap-[16px]">
          <div className="col-span-1 flex flex-col items-center justify-center bg-[#f8f9ff] rounded-[12px] p-[20px] border border-[#eef0f8]">
            <div className="relative mb-[8px]">
              <ReadinessGauge score={role.readinessScore} size={80}/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center mt-[4px]">
                  <span className="font-bold text-[18px]" style={{ color: readinessColor(role.readinessScore) }}>{role.readinessScore}</span>
                  <span className="font-normal text-[10px] text-[#94a3b8] block">/ 100</span>
                </div>
              </div>
            </div>
            <p className="font-semibold text-[12px] text-[#0a0b14] text-center">Role Readiness</p>
            <p className="font-normal text-[11px] text-[#94a3b8] text-center mt-[2px]">Based on current evidence snapshot</p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-[12px]">
            <div className="bg-[#f8f9ff] rounded-[12px] p-[16px] border border-[#eef0f8]">
              <p className="text-[11px] font-normal text-[#94a3b8] mb-[6px]">Skills Met</p>
              <p className="font-bold text-[20px] text-[#0a0b14]">{skillsMet}<span className="text-[14px] text-[#64748b] font-normal">/{role.skillRequirements.length}</span></p>
            </div>
            <div className="bg-[#f8f9ff] rounded-[12px] p-[16px] border border-[#eef0f8]">
              <p className="text-[11px] font-normal text-[#94a3b8] mb-[6px]">Critical Skills Met</p>
              <p className={`font-bold text-[20px] ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#ef4444]"}`}>
                {criticalMet}<span className={`text-[14px] font-normal ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#64748b]"}`}>/{criticalTotal}</span>
              </p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-[6px]">
                <p className="text-[11px] font-normal text-[#94a3b8]">Overall progress toward role readiness</p>
                <p className="text-[11px] font-semibold text-[#0a0b14]">{role.readinessScore}%</p>
              </div>
              <div className="w-full bg-[#f1f3fa] rounded-full h-[8px]">
                <div className="h-[8px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] transition-all" style={{ width: `${role.readinessScore}%` }}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demand Indicator */}
      <div className="mb-[16px]">
        <DemandIndicator demand={role.demand}/>
      </div>

      {/* Skill Requirements */}
      <div className="rounded-[16px] border border-[#e8eaf0] bg-white overflow-hidden mb-[16px]">
        <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#f1f3fa]">
          <div>
            <h3 className="font-bold text-[15px] text-[#0a0b14]">Skill Requirements</h3>
            <p className="text-[11px] font-normal text-[#94a3b8] mt-[2px]">
              <span className="text-[#ef4444]">●</span> Critical skills must be met for role approval
            </p>
          </div>
          <div className="flex items-center gap-[8px] text-[11px] font-medium text-[#94a3b8]">
            <span className="w-[80px]">Category</span>
            <span className="w-[120px] text-center">Gap / Required</span>
            <span className="w-[28px] text-right">Wt.</span>
          </div>
        </div>
        {role.skillRequirements
            .slice()
            .sort((a, b) => b.importanceWeight - a.importanceWeight)
            .map(skill => (<SkillRequirementRow key={skill.skillId} skill={skill} expanded={expandedSkill === skill.skillId} onToggle={() => setExpandedSkill(expandedSkill === skill.skillId ? null : skill.skillId)}/>))}
      </div>
    </div>);
}
// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({ role, onSelect, onSaveToggle }) {
    const c = demandColor(role.demand.demandLevel);
    const criticalTotal = role.skillRequirements.filter(s => s.isCritical).length;
    const criticalMet = role.skillRequirements.filter(s => s.isCritical && s.currentLevel >= s.requiredLevel).length;
    return (<div className="bg-white border border-[#e8eaf0] rounded-[16px] p-[20px] flex flex-col gap-[16px] hover:border-[#c7d2e8] hover:shadow-[0_4px_20px_rgba(59,139,255,0.06)] transition-all group">
      <div className="flex items-start justify-between gap-[8px]">
        <div className="flex-1">
          <div className="flex items-center gap-[6px] mb-[8px] flex-wrap">
            <span className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full ${categoryColor(role.category)}`}>{role.category}</span>
            {/* Version indicator */}
            <span className="text-[10px] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(100,116,139,0.08)] text-[#64748b] flex items-center gap-[4px]">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#64748b" strokeWidth="1"/><path d="M5 3v2.5l1.5 1" stroke="#64748b" strokeWidth="1" strokeLinecap="round"/></svg>
              {role.version}
            </span>
          </div>
          <h3 className="font-bold text-[16px] text-[#0a0b14] leading-[1.3]">{role.title}</h3>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onSaveToggle(role.id); }} className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all shrink-0 ${role.isSaved ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff]" : "bg-[#f1f3fa] text-[#94a3b8] hover:bg-[rgba(59,139,255,0.08)] hover:text-[#3b8bff]"}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill={role.isSaved ? "#3b8bff" : "none"} stroke="currentColor" strokeWidth="1.4">
            <path d="M2 2h10v11l-5-3-5 3V2z" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Readiness bar */}
      <div>
        <div className="flex items-center justify-between mb-[6px]">
          <span className="text-[11px] font-normal text-[#94a3b8]">Your Readiness</span>
          <span className="font-bold text-[13px]" style={{ color: readinessColor(role.readinessScore) }}>{role.readinessScore}%</span>
        </div>
        <div className="w-full bg-[#f1f3fa] rounded-full h-[6px]">
          <div className="h-[6px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] transition-all" style={{ width: `${role.readinessScore}%` }}/>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-[12px] pt-[4px] border-t border-[#f1f3fa]">
        <div className="flex-1">
          <p className="text-[10px] font-normal text-[#94a3b8]">Skills required</p>
          <p className="font-semibold text-[13px] text-[#0a0b14]">{role.skillRequirements.length}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-normal text-[#94a3b8]">Critical skills</p>
          <p className={`font-semibold text-[13px] ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#ef4444]"}`}>
            {criticalMet}/{criticalTotal}
          </p>
        </div>
        <div className={`flex items-center gap-[4px] px-[8px] py-[3px] rounded-full ${c.bg}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${c.dot}`}/>
          <span className={`text-[10px] font-medium ${c.text}`}>{role.demand.demandLevel}</span>
        </div>
      </div>

      <button onClick={onSelect} className="w-full py-[9px] rounded-[10px] text-[13px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]">
        View Role Details →
      </button>
    </div>);
}
// ── BrowseRoles view ──────────────────────────────────────────────────────────
function BrowseRoles({ roles, onSelect, onSaveToggle, filter, onFilterChange, search, onSearchChange }) {
    const categories = ["All", ...Array.from(new Set(roles.map(r => r.category)))];
    const filtered = roles.filter(r => (filter === "All" || r.category === filter) &&
        r.title.toLowerCase().includes(search.toLowerCase()));
    return (<div>
      {/* Search + Filter bar */}
      <div className="flex items-center gap-[12px] mb-[24px] flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#94a3b8]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Search career roles..." value={search} onChange={e => onSearchChange(e.target.value)} className="w-full pl-[36px] pr-[14px] py-[9px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-normal text-[#0a0b14] placeholder:text-[#94a3b8] outline-none focus:border-[#3b8bff] transition-colors"/>
        </div>
        <div className="flex items-center gap-[6px] flex-wrap">
          {categories.map(cat => (<button key={cat} onClick={() => onFilterChange(cat)} className={`px-[12px] py-[7px] rounded-[8px] text-[12px] font-medium transition-all ${filter === cat
                ? "bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(59,139,255,0.3)]"
                : "bg-white border border-[#e8eaf0] text-[#64748b] hover:border-[#c7d2e8]"}`}>
              {cat}
            </button>))}
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-3 gap-[16px] mb-[32px]">
        {filtered.map(role => (<RoleCard key={role.id} role={role} onSelect={() => onSelect(role.id)} onSaveToggle={onSaveToggle}/>))}
      </div>

      {/* Suggested Roles Section */}
      <SuggestedRolesSection roles={roles} onSelect={onSelect} onSaveToggle={onSaveToggle}/>
    </div>);
}
// ── SuggestedRolesSection ─────────────────────────────────────────────────────
function SuggestedRolesSection({ roles, onSelect, onSaveToggle }) {
    const suggested = roles.filter(r => r.isSuggested);
    return (<div>
      <div className="flex items-center gap-[10px] mb-[16px]">
        <div className="flex items-center gap-[8px]">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5H5.5L7 1Z" fill="white"/></svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#0a0b14]">Suggested for You</h3>
            <p className="text-[11px] font-normal text-[#94a3b8]">Based on your skills, education & interests — you choose, we explain</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {suggested.map(role => {
            const c = demandColor(role.demand.demandLevel);
            return (<div key={role.id} className="bg-white border border-[#e8eaf0] rounded-[14px] p-[16px] flex items-center gap-[16px] hover:border-[rgba(59,139,255,0.3)] hover:bg-[rgba(59,139,255,0.01)] transition-all">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center shrink-0">
                <span className="font-bold text-[13px] text-white">{role.title.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[8px] mb-[2px]">
                  <span className="font-semibold text-[14px] text-[#0a0b14]">{role.title}</span>
                  <span className={`text-[10px] font-medium px-[6px] py-[2px] rounded-full ${c.bg} ${c.text}`}>{role.demand.demandLevel} Demand</span>
                </div>
                <p className="text-[12px] font-normal text-[#64748b] truncate">{role.suggestionReason}</p>
              </div>
              <div className="flex items-center gap-[8px] shrink-0">
                <div className="text-center">
                  <span className="font-bold text-[15px]" style={{ color: readinessColor(role.readinessScore) }}>{role.readinessScore}%</span>
                  <p className="text-[10px] font-normal text-[#94a3b8]">Readiness</p>
                </div>
                <button onClick={() => onSelect(role.id)} className="px-[12px] py-[7px] rounded-[8px] text-[12px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]">
                  Explore →
                </button>
              </div>
            </div>);
        })}
      </div>
      <p className="mt-[12px] text-[11px] font-normal text-[#94a3b8] italic">
        Suggestions are generated from your skill matrix, learning history, and interests. They are explanations, not decisions — you remain in control of your career path.
      </p>
    </div>);
}
// ── SavedRolesView ────────────────────────────────────────────────────────────
function SavedRolesView({ roles, onSelect, onSaveToggle, onCompare }) {
    const saved = roles.filter(r => r.isSaved);
    if (saved.length === 0) {
        return (<div className="flex flex-col items-center justify-center py-[64px] text-center">
        <div className="w-[56px] h-[56px] rounded-[14px] bg-[rgba(59,139,255,0.08)] flex items-center justify-center mb-[16px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 5h14v16l-7-4-7 4V5z" stroke="#3b8bff" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        </div>
        <h3 className="font-bold text-[16px] text-[#0a0b14] mb-[6px]">No saved roles yet</h3>
        <p className="text-[13px] font-normal text-[#64748b] max-w-[320px]">
          Browse career roles and save the ones that interest you. Saved roles can be compared side-by-side.
        </p>
      </div>);
    }
    return (<div>
      <div className="flex items-center justify-between mb-[20px]">
        <p className="text-[13px] font-normal text-[#64748b]">{saved.length} saved role{saved.length !== 1 ? "s" : ""}</p>
        {saved.length >= 2 && (<button onClick={onCompare} className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-[10px] bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white text-[13px] font-semibold shadow-[0_2px_8px_rgba(59,139,255,0.3)] hover:shadow-[0_4px_14px_rgba(59,139,255,0.4)] transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="5" height="8" rx="1" stroke="white" strokeWidth="1.3"/><rect x="8" y="3" width="5" height="8" rx="1" stroke="white" strokeWidth="1.3"/></svg>
            Compare Readiness
          </button>)}
      </div>
      <div className="flex flex-col gap-[12px]">
        {saved.map(role => {
            const c = demandColor(role.demand.demandLevel);
            const skillsMet = role.skillRequirements.filter(s => s.currentLevel >= s.requiredLevel).length;
            return (<div key={role.id} className="bg-white border border-[#e8eaf0] rounded-[14px] p-[20px] hover:border-[rgba(59,139,255,0.2)] transition-all">
              <div className="flex items-start gap-[16px]">
                <div className="flex-1">
                  <div className="flex items-center gap-[8px] mb-[6px]">
                    <span className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full ${categoryColor(role.category)}`}>{role.category}</span>
                    <span className="flex items-center gap-[4px] bg-[rgba(59,139,255,0.06)] text-[#3b8bff] text-[10px] font-medium px-[7px] py-[2px] rounded-full">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#3b8bff" strokeWidth="1"/><path d="M5 3v2.5l1.5 1" stroke="#3b8bff" strokeWidth="1" strokeLinecap="round"/></svg>
                      {role.version}
                    </span>
                  </div>
                  <h3 className="font-bold text-[16px] text-[#0a0b14] mb-[12px]">{role.title}</h3>
                  <div className="flex items-center gap-[24px]">
                    <div>
                      <p className="text-[11px] font-normal text-[#94a3b8] mb-[4px]">Readiness Score</p>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[100px] bg-[#f1f3fa] rounded-full h-[6px]">
                          <div className="h-[6px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed]" style={{ width: `${role.readinessScore}%` }}/>
                        </div>
                        <span className="font-bold text-[14px]" style={{ color: readinessColor(role.readinessScore) }}>{role.readinessScore}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-normal text-[#94a3b8] mb-[4px]">Skills Met</p>
                      <p className="font-semibold text-[14px] text-[#0a0b14]">{skillsMet}/{role.skillRequirements.length}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-normal text-[#94a3b8] mb-[4px]">Market Demand</p>
                      <div className={`flex items-center gap-[4px] px-[8px] py-[2px] rounded-full ${c.bg}`}>
                        <span className={`w-[5px] h-[5px] rounded-full ${c.dot}`}/>
                        <span className={`text-[11px] font-medium ${c.text}`}>{role.demand.demandLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-[8px] shrink-0">
                  <button onClick={() => onSelect(role.id)} className="px-[14px] py-[8px] rounded-[10px] text-[13px] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]">
                    View Details
                  </button>
                  <button onClick={() => onSaveToggle(role.id)} className="px-[14px] py-[8px] rounded-[10px] text-[13px] font-medium text-[#94a3b8] bg-[#f8f9fd] hover:bg-[rgba(239,68,68,0.06)] hover:text-[#ef4444] transition-colors border border-[#e8eaf0]">
                    Remove
                  </button>
                </div>
              </div>
            </div>);
        })}
      </div>
    </div>);
}
// ── CompareView ────────────────────────────────────────────────────────────────
function CompareView({ roles, onSelect }) {
    const saved = roles.filter(r => r.isSaved);
    const [selected, setSelected] = useState(saved.slice(0, 2).map(r => r.id));
    const compareRoles = roles.filter(r => selected.includes(r.id));
    function toggleSelect(id) {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
    }
    const allSkillNames = Array.from(new Set(compareRoles.flatMap(r => r.skillRequirements.map(s => s.skillName))));
    return (<div>
      {/* Role selector */}
      <div className="mb-[20px]">
        <p className="text-[12px] font-medium text-[#64748b] mb-[10px]">Select up to 3 saved roles to compare</p>
        <div className="flex gap-[8px] flex-wrap">
          {saved.map(role => (<button key={role.id} onClick={() => toggleSelect(role.id)} className={`flex items-center gap-[6px] px-[12px] py-[7px] rounded-[8px] text-[12px] font-medium transition-all border ${selected.includes(role.id)
                ? "bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white border-transparent shadow-[0_2px_8px_rgba(59,139,255,0.3)]"
                : "bg-white border-[#e8eaf0] text-[#64748b] hover:border-[#c7d2e8]"}`}>
              {selected.includes(role.id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              {role.title}
            </button>))}
        </div>
      </div>

      {compareRoles.length < 2 ? (<div className="flex items-center justify-center py-[48px] text-center bg-white border border-[#e8eaf0] rounded-[16px]">
          <p className="text-[13px] font-normal text-[#94a3b8]">Select at least 2 roles above to compare readiness scores.</p>
        </div>) : (<>
          {/* Readiness comparison header */}
          <div className="bg-white border border-[#e8eaf0] rounded-[16px] p-[24px] mb-[16px]">
            <div className="flex items-center gap-[6px] mb-[20px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#94a3b8]"/>
              <h3 className="font-bold text-[15px] text-[#0a0b14]">Readiness Comparison</h3>
              <span className="text-[11px] font-normal text-[#94a3b8] ml-[4px]">Same evidence snapshot — {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div className={`grid gap-[16px]`} style={{ gridTemplateColumns: `repeat(${compareRoles.length}, 1fr)` }}>
              {compareRoles.map((role, i) => {
                const colors = ["from-[#3b8bff] to-[#7c3aed]", "from-[#059669] to-[#10b981]", "from-[#f59e0b] to-[#ef4444]"];
                const textColors = ["text-[#3b8bff]", "text-[#059669]", "text-[#f59e0b]"];
                return (<div key={role.id} className="flex flex-col items-center p-[16px] bg-[#f8f9ff] rounded-[12px] border border-[#eef0f8]">
                    <div className="relative mb-[8px]">
                      <ReadinessGauge score={role.readinessScore} size={72}/>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`font-bold text-[16px] mt-[6px] ${textColors[i]}`}>{role.readinessScore}%</span>
                      </div>
                    </div>
                    <p className="font-semibold text-[13px] text-[#0a0b14] text-center mb-[4px]">{role.title}</p>
                    <div className="flex items-center gap-[6px]">
                      <span className="text-[10px] font-normal text-[#94a3b8]">{role.version}</span>
                      <span className="w-[3px] h-[3px] rounded-full bg-[#d1d5db]"/>
                      <span className={`text-[10px] font-medium ${categoryColor(role.category).split(" ")[1]}`}>{role.category}</span>
                    </div>
                    <div className="mt-[12px] w-full">
                      <div className={`w-full bg-gradient-to-r ${colors[i]} h-[4px] rounded-full`} style={{ width: `${role.readinessScore}%` }}/>
                      <div className="w-full bg-[#e8eaf0] h-[4px] rounded-full mt-[2px]"/>
                    </div>
                  </div>);
            })}
            </div>
          </div>

          {/* Skill gap comparison table */}
          <div className="bg-white border border-[#e8eaf0] rounded-[16px] overflow-hidden">
            <div className="px-[20px] py-[16px] border-b border-[#f1f3fa]">
              <h3 className="font-bold text-[14px] text-[#0a0b14]">Skill Gap Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f3fa]">
                    <th className="text-left px-[20px] py-[12px] text-[11px] font-medium text-[#94a3b8]">Skill</th>
                    {compareRoles.map(role => (<th key={role.id} className="text-center px-[16px] py-[12px] text-[11px] font-medium text-[#94a3b8]">{role.title}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {allSkillNames.slice(0, 8).map(skillName => (<tr key={skillName} className="border-b border-[#f1f3fa] last:border-0 hover:bg-[#fafbff]">
                      <td className="px-[20px] py-[11px] text-[13px] font-medium text-[#0a0b14]">{skillName}</td>
                      {compareRoles.map(role => {
                    const skill = role.skillRequirements.find(s => s.skillName === skillName);
                    if (!skill)
                        return <td key={role.id} className="px-[16px] py-[11px] text-center text-[#d1d5db]"><span className="text-[11px]">—</span></td>;
                    const colors = skillGapColor(skill.currentLevel, skill.requiredLevel);
                    const met = skill.currentLevel >= skill.requiredLevel;
                    return (<td key={role.id} className="px-[16px] py-[11px] text-center">
                            <div className="flex flex-col items-center gap-[4px]">
                              <span className={`text-[12px] font-semibold ${colors.text}`}>
                                {skill.currentLevel}/{skill.requiredLevel}
                              </span>
                              <div className="w-[48px] bg-[#f1f3fa] rounded-full h-[4px]">
                                <div className={`h-[4px] rounded-full ${colors.bar}`} style={{ width: `${(skill.currentLevel / skill.requiredLevel) * 100}%`, maxWidth: "100%" }}/>
                              </div>
                              {skill.isCritical && <span className="text-[9px] font-medium text-[#ef4444]">Critical</span>}
                            </div>
                          </td>);
                })}
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}
    </div>);
}
export default function CareerRolesView() {
    const [roles, setRoles] = useState(MOCK_ROLES);
    const [activeTab, setActiveTab] = useState("browse");
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const savedCount = roles.filter(r => r.isSaved).length;
    function toggleSave(id) {
        setRoles(prev => prev.map(r => r.id === id ? { ...r, isSaved: !r.isSaved } : r));
    }
    function selectRole(id) {
        setSelectedRoleId(id);
    }
    const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null;
    const tabs = [
        { key: "browse", label: "Browse Roles" },
        { key: "saved", label: "Saved Roles", count: savedCount },
        { key: "compare", label: "Compare Readiness" },
    ];
    return (<div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="px-[32px] pt-[28px] pb-[20px] shrink-0">
        <h1 className="font-bold text-[28px] text-[#0a0b14] leading-[1.2]">Career Roles</h1>
        <p className="font-normal text-[14px] text-[#64748b] mt-[4px]">Explore roles, understand requirements, and track your readiness.</p>

        {/* Tabs */}
        {!selectedRole && (<div className="flex items-center gap-[4px] mt-[20px] bg-[#f1f3fa] p-[4px] rounded-[10px] w-fit">
            {tabs.map(tab => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-[6px] px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition-all ${activeTab === tab.key
                    ? "bg-white text-[#0a0b14] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    : "text-[#64748b] hover:text-[#0a0b14]"}`}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (<span className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-[4px] ${activeTab === tab.key ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff]" : "bg-[#e2e5ef] text-[#64748b]"}`}>
                    {tab.count}
                  </span>)}
              </button>))}
          </div>)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[32px] pb-[32px]">
        {selectedRole ? (<RoleDetailPanel role={selectedRole} onBack={() => setSelectedRoleId(null)} onSaveToggle={toggleSave}/>) : activeTab === "browse" ? (<BrowseRoles roles={roles} onSelect={selectRole} onSaveToggle={toggleSave} filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch}/>) : activeTab === "saved" ? (<SavedRolesView roles={roles} onSelect={(id) => { selectRole(id); }} onSaveToggle={toggleSave} onCompare={() => setActiveTab("compare")}/>) : (<CompareView roles={roles} onSelect={selectRole}/>)}
      </div>
    </div>);
}
