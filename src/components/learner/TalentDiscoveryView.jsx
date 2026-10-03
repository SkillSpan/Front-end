import React, { useState, useMemo } from "react";
// ── Mock Data ─────────────────────────────────────────────────────────────────
const COMPANY = {
  name: "TechVenture Inc.",
  rep: "Jordan Blake",
  initials: "JB",
  interests: ["Software Engineering", "Full-Stack Development", "ML Engineering"],
};
const STUDENTS = [
  {
    id: "t1",
    displayName: "Lena Kim",
    initials: "LK",
    track: "Software Engineering",
    phase: "Phase 2 — Applied",
    readiness: 73,
    topSkills: [
      { name: "TypeScript", level: 4, maxLevel: 4, category: "Frontend", verified: true, evidenceCount: 6 },
      { name: "React", level: 4, maxLevel: 4, category: "Frontend", verified: true, evidenceCount: 5 },
      { name: "System Design", level: 2, maxLevel: 4, category: "Architecture", verified: true, evidenceCount: 2 },
      { name: "Node.js", level: 3, maxLevel: 4, category: "Backend", verified: true, evidenceCount: 4 },
      { name: "CI/CD", level: 2, maxLevel: 4, category: "DevOps", verified: false, evidenceCount: 1 },
    ],
    projects: [
      {
        id: "p1",
        title: "E-Commerce Platform Rebuild",
        role: "Frontend Lead",
        outcomes: ["Reduced page load by 42%", "Delivered 3 weeks ahead of schedule", "98% test coverage achieved"],
        skills: ["React", "TypeScript", "GraphQL"],
        completedDate: "Sep 2025",
        verified: true,
        sponsorOrg: "RetailCo Digital",
      },
      {
        id: "p2",
        title: "Real-Time Analytics Dashboard",
        role: "Full-Stack Developer",
        outcomes: ["Built streaming data pipeline", "Handled 50k concurrent users"],
        skills: ["Node.js", "WebSockets", "PostgreSQL"],
        completedDate: "Jul 2025",
        verified: true,
        sponsorOrg: "DataStream Labs",
      },
    ],
    evalSummary: {
      authorized: true,
      overallRating: 4.4,
      criteriaScores: [
        { label: "Technical Quality", score: 4.6 },
        { label: "Problem Solving", score: 4.3 },
        { label: "Collaboration", score: 4.5 },
        { label: "Communication", score: 4.2 },
      ],
      reviewedBy: "Senior Engineering Panel",
      reviewDate: "Oct 2025",
      notes: "Strong frontend fundamentals with demonstrated delivery. Growing system design capability.",
    },
    visibility: "full",
    consent: "open",
    contactable: true,
    matchScore: 91,
    availableFrom: "Jan 2026",
    location: "Remote / Dubai",
    hiddenFields: [],
  },
  {
    id: "t2",
    displayName: "Marcus Chen",
    initials: "MC",
    track: "Full-Stack Development",
    phase: "Phase 3 — Specialized",
    readiness: 79,
    topSkills: [
      { name: "Python", level: 4, maxLevel: 4, category: "Backend", verified: true, evidenceCount: 8 },
      { name: "Django", level: 4, maxLevel: 4, category: "Backend", verified: true, evidenceCount: 7 },
      { name: "PostgreSQL", level: 3, maxLevel: 4, category: "Database", verified: true, evidenceCount: 5 },
      { name: "Docker", level: 3, maxLevel: 4, category: "DevOps", verified: true, evidenceCount: 4 },
      { name: "Vue.js", level: 3, maxLevel: 4, category: "Frontend", verified: true, evidenceCount: 3 },
    ],
    projects: [
      {
        id: "p3",
        title: "API Gateway Microservices Migration",
        role: "Backend Lead",
        outcomes: ["Migrated 12 services", "Reduced API latency by 35%", "Zero-downtime deployment"],
        skills: ["Python", "Django", "Docker", "Kubernetes"],
        completedDate: "Oct 2025",
        verified: true,
        sponsorOrg: "CloudScale Ventures",
      },
    ],
    evalSummary: {
      authorized: true,
      overallRating: 4.7,
      criteriaScores: [
        { label: "Technical Quality", score: 4.8 },
        { label: "Problem Solving", score: 4.7 },
        { label: "Collaboration", score: 4.6 },
        { label: "Communication", score: 4.5 },
      ],
      reviewedBy: "Backend Architecture Panel",
      reviewDate: "Oct 2025",
      notes: "Exceptional backend engineering. High-quality code and strong architectural thinking.",
    },
    visibility: "full",
    consent: "open",
    contactable: true,
    matchScore: 88,
    availableFrom: "Feb 2026",
    location: "Remote / Singapore",
    hiddenFields: [],
  },
  {
    id: "t3",
    displayName: "Elena Rodriguez",
    initials: "ER",
    track: "ML Engineering",
    phase: "Phase 2 — Applied",
    readiness: 68,
    topSkills: [
      { name: "Python", level: 4, maxLevel: 4, category: "Core", verified: true, evidenceCount: 9 },
      { name: "PyTorch", level: 3, maxLevel: 4, category: "ML", verified: true, evidenceCount: 4 },
      { name: "MLOps", level: 2, maxLevel: 4, category: "DevOps", verified: true, evidenceCount: 2 },
      { name: "Feature Engineering", level: 3, maxLevel: 4, category: "ML", verified: true, evidenceCount: 5 },
      { name: "Model Deployment", level: 2, maxLevel: 4, category: "DevOps", verified: false, evidenceCount: 1 },
    ],
    projects: [
      {
        id: "p4",
        title: "NLP Sentiment Classification Pipeline",
        role: "ML Engineer",
        outcomes: ["91.3% accuracy on benchmark", "Deployed to production serving 10k req/day"],
        skills: ["PyTorch", "Python", "FastAPI"],
        completedDate: "Aug 2025",
        verified: true,
        sponsorOrg: "Lingua AI",
      },
    ],
    evalSummary: {
      authorized: false,
      overallRating: 0,
      criteriaScores: [],
      reviewedBy: "",
      reviewDate: "",
      notes: "",
    },
    visibility: "full",
    consent: "open",
    contactable: true,
    matchScore: 76,
    availableFrom: "Mar 2026",
    location: "Remote / London",
    hiddenFields: [],
  },
  {
    id: "t4",
    displayName: "— (Limited Visibility)",
    initials: "??",
    track: "Data Science",
    phase: "Phase 1 — Foundation",
    readiness: 58,
    topSkills: [
      { name: "Python", level: 3, maxLevel: 4, category: "Core", verified: true, evidenceCount: 4 },
      { name: "Statistics", level: 2, maxLevel: 4, category: "Analysis", verified: true, evidenceCount: 2 },
      { name: "SQL", level: 3, maxLevel: 4, category: "Database", verified: true, evidenceCount: 3 },
    ],
    projects: [],
    evalSummary: { authorized: false, overallRating: 0, criteriaScores: [], reviewedBy: "", reviewDate: "", notes: "" },
    visibility: "partial",
    consent: "limited",
    contactable: false,
    matchScore: 62,
    availableFrom: "Unknown",
    location: "— (hidden)",
    hiddenFields: ["name", "location", "contact", "projects"],
  },
  {
    id: "t5",
    displayName: "Priya Sharma",
    initials: "PS",
    track: "UX / Product Design",
    phase: "Phase 3 — Specialized",
    readiness: 81,
    topSkills: [
      { name: "Figma", level: 4, maxLevel: 4, category: "Design", verified: true, evidenceCount: 10 },
      { name: "User Research", level: 3, maxLevel: 4, category: "Research", verified: true, evidenceCount: 6 },
      { name: "Design Systems", level: 4, maxLevel: 4, category: "Design", verified: true, evidenceCount: 8 },
      { name: "Prototyping", level: 4, maxLevel: 4, category: "Design", verified: true, evidenceCount: 9 },
      { name: "Accessibility", level: 3, maxLevel: 4, category: "Standards", verified: true, evidenceCount: 4 },
    ],
    projects: [
      {
        id: "p5",
        title: "Design System Accessibility Audit",
        role: "Lead Designer",
        outcomes: [
          "WCAG 2.1 AA compliance achieved",
          "40% reduction in accessibility issues",
          "Documentation published",
        ],
        skills: ["Figma", "Accessibility", "Design Systems"],
        completedDate: "Nov 2025",
        verified: true,
        sponsorOrg: "GovTech UAE",
      },
    ],
    evalSummary: {
      authorized: true,
      overallRating: 4.8,
      criteriaScores: [
        { label: "Design Quality", score: 4.9 },
        { label: "Research Rigor", score: 4.7 },
        { label: "Delivery", score: 4.8 },
        { label: "Collaboration", score: 4.8 },
      ],
      reviewedBy: "Design Leadership Panel",
      reviewDate: "Nov 2025",
      notes: "Outstanding design system work. Exceptional attention to accessibility and inclusive design principles.",
    },
    visibility: "full",
    consent: "open",
    contactable: true,
    matchScore: 83,
    availableFrom: "Dec 2025",
    location: "Remote / Abu Dhabi",
    hiddenFields: [],
  },
  {
    id: "t6",
    displayName: "— (Restricted)",
    initials: "🔒",
    track: "DevOps Engineering",
    phase: "Phase 2 — Applied",
    readiness: 0,
    topSkills: [],
    projects: [],
    evalSummary: { authorized: false, overallRating: 0, criteriaScores: [], reviewedBy: "", reviewDate: "", notes: "" },
    visibility: "locked",
    consent: "restricted",
    contactable: false,
    matchScore: 0,
    availableFrom: "—",
    location: "—",
    hiddenFields: ["all"],
  },
];
const TRACKS = [
  "Software Engineering",
  "Full-Stack Development",
  "ML Engineering",
  "Data Science",
  "UX / Product Design",
  "DevOps Engineering",
];
// ── Atoms ─────────────────────────────────────────────────────────────────────
function Sk({ w, h, r = 6 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />;
}
function SkillBar({ skill }) {
  const pct = (skill.level / skill.maxLevel) * 100;
  const color = skill.level >= skill.maxLevel ? "#059669" : skill.level >= 3 ? "#3b8bff" : "#f59e0b";
  return (
    <div className="flex items-center gap-[8px]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-[3px]">
          <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14] truncate">
            {skill.name}
          </span>
          <div className="flex items-center gap-[4px] shrink-0">
            {skill.verified && (
              <span className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#059669]">
                ✓ Verified
              </span>
            )}
            <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
              L{skill.level}/{skill.maxLevel}
            </span>
          </div>
        </div>
        <div className="h-[5px] bg-[#f1f3fa] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.2 3.7H11L8.1 6.9l1.1 3.7L6 8.5 2.8 10.6l1.1-3.7L1 4.7h3.8L6 1z"
            fill={i <= Math.round(rating) ? "#f59e0b" : "#e8eaf0"}
          />
        </svg>
      ))}
      <span className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] ml-[4px]">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
function MatchBadge({ score }) {
  const color = score >= 85 ? "#059669" : score >= 70 ? "#3b8bff" : "#f59e0b";
  const label = score >= 85 ? "Strong Match" : score >= 70 ? "Good Match" : "Partial Match";
  return (
    <div
      className="flex items-center gap-[5px] px-[8px] py-[3px] rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}28` }}
    >
      <div className="w-[5px] h-[5px] rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold" style={{ color }}>
        {score}% · {label}
      </span>
    </div>
  );
}
function HiddenField({ label }) {
  return (
    <div className="flex items-center gap-[6px] px-[10px] py-[5px] rounded-[7px] bg-[#f1f3fa] border border-[#e8eaf0]">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <rect x="1.5" y="5" width="8" height="5.5" rx="1.2" stroke="#94a3b8" strokeWidth="1.1" />
        <path d="M3 5V3.5a2.5 2.5 0 015 0V5" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">{label} hidden</span>
    </div>
  );
}
// ── Student Talent Card ───────────────────────────────────────────────────────
function TalentCard({ student, selected, onClick, scene }) {
  const isLocked = student.visibility === "locked";
  const isPartial = student.visibility === "partial";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-[14px] border transition-all overflow-hidden ${selected ? "border-[#3b8bff] shadow-[0_0_0_3px_rgba(59,139,255,0.12)]" : "border-[#e8eaf0] hover:border-[rgba(59,139,255,0.3)] hover:shadow-sm"}`}
    >
      {isLocked ? (
        <div className="p-[16px] flex flex-col items-center justify-center text-center gap-[8px] min-h-[180px]">
          <div className="w-[44px] h-[44px] rounded-full bg-[#f1f3fa] border border-[#e8eaf0] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2.5" y="8" width="13" height="9" rx="2" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M5 8V6a4 4 0 018 0v2" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8]">
              Restricted Access
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#c4c9d4] mt-[2px]">
              This student profile is not visible to your organization
            </p>
          </div>
        </div>
      ) : (
        <div className="p-[16px]">
          {/* Card header */}
          <div className="flex items-start gap-[10px] mb-[12px]">
            <div
              className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[13px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0 ${isPartial ? "bg-[#94a3b8]" : ""}`}
              style={!isPartial ? { background: "linear-gradient(135deg,#3b8bff,#7c3aed)" } : {}}
            >
              {isPartial ? "?" : student.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold truncate ${isPartial ? "text-[#94a3b8] italic" : "text-[#0a0b14]"}`}
              >
                {student.displayName}
              </p>
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b] truncate">{student.track}</p>
              {!isPartial && (
                <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[1px]">{student.phase}</p>
              )}
            </div>
            {!isPartial && (
              <div className="flex flex-col items-center gap-[1px] shrink-0">
                <div
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
                  style={{
                    border: `2.5px solid ${student.readiness >= 75 ? "#059669" : student.readiness >= 55 ? "#f59e0b" : "#ef4444"}`,
                    background: `${student.readiness >= 75 ? "#05966912" : student.readiness >= 55 ? "#f59e0b12" : "#ef444412"}`,
                  }}
                >
                  <span
                    className="text-[10px] font-['Inter:Bold',sans-serif] font-bold"
                    style={{
                      color: student.readiness >= 75 ? "#059669" : student.readiness >= 55 ? "#f59e0b" : "#ef4444",
                    }}
                  >
                    {student.readiness}
                  </span>
                </div>
                <span className="text-[8px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Ready</span>
              </div>
            )}
          </div>

          {/* Match badge */}
          {!isPartial && (
            <div className="mb-[10px]">
              <MatchBadge score={student.matchScore} />
            </div>
          )}

          {/* Top skills */}
          {student.topSkills.length > 0 ? (
            <div className="flex flex-col gap-[5px] mb-[10px]">
              {student.topSkills.slice(0, 3).map((sk) => (
                <div key={sk.name} className="flex items-center justify-between">
                  <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#475569] truncate flex-1">
                    {sk.name}
                  </span>
                  <div className="flex gap-[2px] ml-[6px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[6px] h-[6px] rounded-full"
                        style={{ background: i < sk.level ? "#3b8bff" : "#e8eaf0" }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : isPartial ? (
            <div className="mb-[10px]">
              <HiddenField label="Skills" />
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-between pt-[8px] border-t border-[#f1f3fa]">
            {isPartial ? (
              <HiddenField label="Contact" />
            ) : (
              <>
                <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                  📍 {student.location}
                </span>
                <span
                  className={`text-[9px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full ${student.contactable ? "text-[#059669] bg-[rgba(5,150,105,0.08)]" : "text-[#94a3b8] bg-[#f1f3fa]"}`}
                >
                  {student.contactable ? "Contactable" : "Not contactable"}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </button>
  );
}
// ── Student Profile Panel ─────────────────────────────────────────────────────
function StudentProfilePanel({ student, onClose, onContact }) {
  const [activeTab, setActiveTab] = useState("skills");
  const isLocked = student.visibility === "locked";
  const isPartial = student.visibility === "partial";
  if (isLocked) {
    return (
      <div className="w-[400px] shrink-0 bg-white border-l border-[#e8eaf0] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[#e8eaf0]">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">
            Student Profile
          </p>
          <button
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-full hover:bg-[#f1f3fa] flex items-center justify-center transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2L2 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center flex-col text-center p-[32px]">
          <div className="w-[56px] h-[56px] rounded-full bg-[#f1f3fa] border border-[#e8eaf0] flex items-center justify-center mb-[14px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="12" rx="2.5" stroke="#94a3b8" strokeWidth="1.4" />
              <path d="M7 11V7.5a5 5 0 0110 0V11" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] text-[#0a0b14] mb-[6px]">
            Access Restricted
          </p>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] leading-[1.65]">
            This student profile is not within your organization's authorized visibility scope. No information can be
            displayed.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-[400px] shrink-0 bg-white border-l border-[#e8eaf0] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-[20px] py-[14px] border-b border-[#e8eaf0] flex items-center justify-between shrink-0">
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">Student Profile</p>
        <button
          onClick={onClose}
          className="w-[28px] h-[28px] rounded-full hover:bg-[#f1f3fa] flex items-center justify-center transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 2l9 9M11 2L2 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Student identity */}
      <div className="px-[20px] py-[16px] border-b border-[#e8eaf0] shrink-0">
        <div className="flex items-start gap-[12px]">
          <div
            className={`w-[48px] h-[48px] rounded-full flex items-center justify-center text-[16px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0 ${isPartial ? "bg-[#94a3b8]" : ""}`}
            style={!isPartial ? { background: "linear-gradient(135deg,#3b8bff,#7c3aed)" } : {}}
          >
            {isPartial ? "?" : student.initials}
          </div>
          <div className="flex-1 min-w-0">
            {isPartial ? (
              <div className="flex flex-col gap-[4px]">
                <HiddenField label="Full name" />
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b]">{student.track}</p>
              </div>
            ) : (
              <>
                <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#0a0b14]">
                  {student.displayName}
                </h3>
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] mt-[1px]">
                  {student.track} · {student.phase}
                </p>
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[1px]">
                  📍 {student.location} · Available {student.availableFrom}
                </p>
              </>
            )}
          </div>
          {!isPartial && (
            <div className="flex flex-col items-center gap-[2px] shrink-0">
              <div
                className="w-[44px] h-[44px] rounded-full flex items-center justify-center"
                style={{
                  border: `2.5px solid ${student.readiness >= 75 ? "#059669" : "#f59e0b"}`,
                  background: `${student.readiness >= 75 ? "#05966910" : "#f59e0b10"}`,
                }}
              >
                <span
                  className="font-['Inter:Bold',sans-serif] font-bold text-[14px]"
                  style={{ color: student.readiness >= 75 ? "#059669" : "#f59e0b" }}
                >
                  {student.readiness}
                </span>
              </div>
              <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Readiness</span>
            </div>
          )}
        </div>

        {!isPartial && (
          <div className="mt-[10px]">
            <MatchBadge score={student.matchScore} />
          </div>
        )}

        {/* Consent badge */}
        <div
          className={`mt-[10px] flex items-center gap-[6px] px-[10px] py-[6px] rounded-[8px] text-[11px] font-['Inter:Regular',sans-serif] ${student.consent === "open" ? "bg-[rgba(5,150,105,0.06)] border border-[rgba(5,150,105,0.15)] text-[#059669]" : "bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)] text-[#f59e0b]"}`}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1" />
            <path
              d="M3.5 5.5l1.5 1.5 2.5-2.5"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {student.consent === "open"
            ? "Student has consented to company visibility"
            : "Limited consent — some information restricted"}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e8eaf0] shrink-0">
        {["skills", "projects", "evaluation"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-[10px] text-[12px] font-['Inter:Medium',sans-serif] font-medium capitalize transition-all border-b-2 ${activeTab === tab ? "border-[#3b8bff] text-[#3b8bff]" : "border-transparent text-[#94a3b8] hover:text-[#64748b]"}`}
          >
            {tab === "evaluation" ? "Evaluation" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-[16px]">
        {activeTab === "skills" && (
          <div className="flex flex-col gap-[10px]">
            {isPartial ? (
              <div className="text-center py-[20px]">
                <HiddenField label="Skill details" />
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[8px] leading-[1.6]">
                  Detailed skill information is outside your organization's authorized visibility scope.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide">
                  Verified Skills ({student.topSkills.filter((s) => s.verified).length} verified)
                </p>
                {student.topSkills.map((sk) => (
                  <SkillBar key={sk.name} skill={sk} />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div className="flex flex-col gap-[12px]">
            {isPartial || student.hiddenFields.includes("projects") ? (
              <div className="text-center py-[20px]">
                <HiddenField label="Project evidence" />
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[8px] leading-[1.6]">
                  Project evidence is outside your authorized visibility scope.
                </p>
              </div>
            ) : student.projects.length === 0 ? (
              <div className="text-center py-[20px]">
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                  No completed project evidence available yet.
                </p>
              </div>
            ) : (
              student.projects.map((proj) => (
                <div key={proj.id} className="rounded-[12px] border border-[#e8eaf0] overflow-hidden">
                  <div className="px-[14px] py-[12px] bg-white">
                    <div className="flex items-start gap-[10px] mb-[8px]">
                      <div className="w-[32px] h-[32px] rounded-[8px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center text-[13px] shrink-0">
                        📋
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
                          {proj.title}
                        </p>
                        <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b]">
                          {proj.role} · {proj.completedDate}
                        </p>
                        <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                          Sponsored by {proj.sponsorOrg}
                        </p>
                      </div>
                      {proj.verified && (
                        <span className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#059669] bg-[rgba(5,150,105,0.08)] border border-[rgba(5,150,105,0.15)] px-[6px] py-[2px] rounded-full shrink-0">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {/* Outcomes */}
                    <div className="flex flex-col gap-[4px] mb-[8px]">
                      <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[2px]">
                        Outcomes
                      </p>
                      {proj.outcomes.map((o) => (
                        <div key={o} className="flex items-start gap-[6px]">
                          <span className="text-[#3b8bff] text-[10px] mt-[1px] shrink-0">→</span>
                          <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#475569] leading-[1.5]">
                            {o}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Skills used */}
                    <div className="flex flex-wrap gap-[4px]">
                      {proj.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[#3b8bff] bg-[rgba(59,139,255,0.08)] px-[7px] py-[2px] rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "evaluation" && (
          <div className="flex flex-col gap-[12px]">
            {!student.evalSummary.authorized ? (
              <div className="rounded-[12px] border border-[#e8eaf0] p-[20px] text-center">
                <div className="w-[44px] h-[44px] rounded-full bg-[#f1f3fa] border border-[#e8eaf0] flex items-center justify-center mx-auto mb-[10px]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2.5" y="8" width="13" height="9" rx="2" stroke="#94a3b8" strokeWidth="1.3" />
                    <path d="M5 8V6a4 4 0 018 0v2" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#64748b] mb-[4px]">
                  Evaluation Not Available
                </p>
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] leading-[1.6]">
                  No authorized evaluation summary is available for this student. Evaluations are only shared with
                  authorized company access and student consent.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-[#f8f9fd] rounded-[10px] px-[14px] py-[12px]">
                  <div>
                    <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[2px]">
                      Overall Rating
                    </p>
                    <StarRating rating={student.evalSummary.overallRating} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Reviewed by</p>
                    <p className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#475569]">
                      {student.evalSummary.reviewedBy}
                    </p>
                    <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                      {student.evalSummary.reviewDate}
                    </p>
                  </div>
                </div>
                {/* Criteria */}
                <div className="flex flex-col gap-[8px]">
                  <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide">
                    Evaluation Criteria
                  </p>
                  {student.evalSummary.criteriaScores.map((c) => (
                    <div key={c.label} className="flex items-center gap-[10px]">
                      <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#475569] w-[140px] shrink-0">
                        {c.label}
                      </span>
                      <div className="flex-1 h-[5px] bg-[#f1f3fa] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#3b8bff]"
                          style={{ width: `${(c.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] w-[28px] text-right">
                        {c.score}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Notes */}
                {student.evalSummary.notes && (
                  <div className="bg-[rgba(59,139,255,0.04)] border border-[rgba(59,139,255,0.12)] rounded-[10px] px-[13px] py-[10px]">
                    <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] mb-[4px] uppercase tracking-wide">
                      Evaluator Notes
                    </p>
                    <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#475569] leading-[1.65]">
                      {student.evalSummary.notes}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[8px] bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)]">
                  <span className="text-[11px]">ℹ️</span>
                  <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#78350f]">
                    Evaluation summaries support human review. Talent discovery does not make automatic hiring
                    decisions.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contact action */}
      <div className="px-[16px] py-[12px] border-t border-[#e8eaf0] shrink-0">
        {student.contactable ? (
          <button
            onClick={onContact}
            className="w-full py-[10px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white flex items-center justify-center gap-[8px] transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 7c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6c-.9 0-1.76-.2-2.53-.55L1 13l.55-3.47A5.97 5.97 0 011 7z"
                stroke="white"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            Send Contact Request
          </button>
        ) : (
          <div className="w-full py-[9px] rounded-[10px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] bg-[#f1f3fa] border border-[#e8eaf0] flex items-center justify-center gap-[6px]">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1.5" y="6" width="10" height="6.5" rx="1.5" stroke="#94a3b8" strokeWidth="1.1" />
              <path d="M3.5 6V4a3 3 0 016 0v2" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            Contact not available
          </div>
        )}
        {!student.contactable && (
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[6px] text-center leading-[1.5]">
            Contact requires student consent and platform authorization conditions to be satisfied.
          </p>
        )}
      </div>
    </div>
  );
}
// ── Contact Dialog ────────────────────────────────────────────────────────────
function ContactDialog({ student, onClose, onConfirm, sent }) {
  const [msg, setMsg] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const handleConfirm = () => {
    if (!confirmed || msg.length < 10) return;
    onConfirm();
  };
  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.35)] flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="bg-white rounded-[16px] w-[480px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-[#e8eaf0]">
          <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14]">Send Contact Request</h3>
          <button
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-full hover:bg-[#f1f3fa] flex items-center justify-center"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2L2 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center p-[36px] text-center">
            <div className="w-[56px] h-[56px] rounded-full bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.2)] flex items-center justify-center mb-[14px]">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path
                  d="M5 13l5 5 11-11"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14] mb-[6px]">
              Contact Request Sent
            </p>
            <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.65] mb-[4px]">
              {student.displayName} has been notified. They will decide whether to respond.
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] leading-[1.6]">
              This contact event has been recorded for audit purposes. Talent discovery does not guarantee a response or
              employment outcome.
            </p>
            <button
              onClick={onClose}
              className="mt-[18px] px-[20px] py-[9px] rounded-[10px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-[20px] flex flex-col gap-[14px]">
            {/* Who */}
            <div className="flex items-center gap-[10px] bg-[#f8f9fd] rounded-[10px] px-[14px] py-[10px]">
              <div
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[12px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
              >
                {student.initials}
              </div>
              <div>
                <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
                  {student.displayName}
                </p>
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b]">
                  {student.track} · {student.matchScore}% match
                </p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-[8px] bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[13px] py-[9px]">
              <span className="text-[12px] shrink-0">⚠️</span>
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#78350f] leading-[1.6]">
                Sending a contact request does not guarantee a response or employment outcome. The student may accept,
                decline, or not respond.
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#475569] block mb-[6px]">
                Message to student <span className="text-[#94a3b8] font-normal">(required, min 10 chars)</span>
              </label>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                placeholder="Introduce yourself and explain your interest in connecting with this student..."
                className="w-full bg-[#f8f9fd] border border-[#e8eaf0] rounded-[10px] px-[12px] py-[10px] text-[12px] font-['Inter:Regular',sans-serif] text-[#0a0b14] placeholder-[#94a3b8] outline-none focus:border-[rgba(59,139,255,0.4)] resize-none leading-[1.6]"
              />
              <div className="flex justify-between mt-[4px]">
                <span
                  className={`text-[10px] font-['Inter:Regular',sans-serif] ${msg.length < 10 ? "text-[#ef4444]" : "text-[#059669]"}`}
                >
                  {msg.length < 10 ? `${10 - msg.length} more characters needed` : "✓ Message ready"}
                </span>
                <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">{msg.length}/500</span>
              </div>
            </div>

            {/* Confirm checkbox */}
            <button onClick={() => setConfirmed(!confirmed)} className="flex items-start gap-[8px] text-left">
              <div
                className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center shrink-0 mt-[1px] transition-all ${confirmed ? "bg-[#3b8bff] border-[#3b8bff]" : "border-[#d1d5db]"}`}
              >
                {confirmed && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#475569] leading-[1.55]">
                I confirm this contact request is for legitimate professional purposes and complies with applicable
                privacy and platform rules.
              </span>
            </button>

            {/* Actions */}
            <div className="flex items-center justify-end gap-[10px] pt-[2px]">
              <button
                onClick={onClose}
                className="px-[14px] py-[7px] rounded-[9px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] hover:bg-[#f1f3fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!confirmed || msg.length < 10}
                className="px-[18px] py-[7px] rounded-[9px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
              >
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Main TalentDiscoveryView ──────────────────────────────────────────────────
export default function TalentDiscoveryView() {
  const [scene, setScene] = useState("normal");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [contactSent, setContactSent] = useState(false);
  const [trackFilter, setTrackFilter] = useState([]);
  const [minReadiness, setMinReadiness] = useState(0);
  const [sortBy, setSortBy] = useState("match");
  const [searchQ, setSearchQ] = useState("");
  const selectedStudent = STUDENTS.find((s) => s.id === selectedStudentId) ?? null;
  const showContact = scene === "contact-dialog" || scene === "contact-sent";
  const displayedStudents = useMemo(() => {
    if (scene === "loading" || scene === "error") return [];
    let list = [...STUDENTS];
    if (scene === "unauthorized") {
      list = list.map((s) => (s.id === "t4" || s.id === "t6" ? s : s));
    }
    if (searchQ) {
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(searchQ.toLowerCase()) ||
          s.track.toLowerCase().includes(searchQ.toLowerCase()),
      );
    }
    if (trackFilter.length > 0) {
      list = list.filter((s) => trackFilter.includes(s.track));
    }
    if (minReadiness > 0) {
      list = list.filter((s) => s.readiness >= minReadiness || s.visibility === "locked");
    }
    if (sortBy === "match") list.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === "readiness") list.sort((a, b) => b.readiness - a.readiness);
    return scene === "empty" ? [] : list;
  }, [scene, searchQ, trackFilter, minReadiness, sortBy]);
  const applyScene = (s) => {
    setScene(s);
    setContactSent(false);
    if (s === "profile") setSelectedStudentId("t1");
    else if (s === "unauthorized") setSelectedStudentId("t4");
    else if (s === "contact-dialog") setSelectedStudentId("t1");
    else if (s === "contact-sent") {
      setSelectedStudentId("t1");
      setContactSent(true);
    } else setSelectedStudentId(null);
  };
  const DEMO_BUTTONS = [
    { label: "Normal", s: "normal" },
    { label: "Loading", s: "loading" },
    { label: "Empty Results", s: "empty" },
    { label: "Error", s: "error" },
    { label: "Profile Open", s: "profile" },
    { label: "Unauthorized", s: "unauthorized" },
    { label: "Contact Dialog", s: "contact-dialog" },
    { label: "Contact Sent", s: "contact-sent" },
  ];
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-[#f1f3fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8eaf0] px-[24px] py-[13px] flex items-center justify-between shrink-0 min-h-[70px] relative z-10">
        <div>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14]">Talent Discovery</h1>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
            {COMPANY.name} · {COMPANY.rep} · {displayedStudents.filter((s) => s.visibility !== "locked").length}{" "}
            permitted students
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-[6px] px-[10px] py-[5px] rounded-[7px] bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)]">
            <span className="text-[11px]">ℹ️</span>
            <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#b45309]">
              Human review only — no automated hiring decisions
            </span>
          </div>
          <div className="flex items-center gap-[6px] px-[10px] py-[5px] rounded-[7px] bg-[rgba(5,150,105,0.06)] border border-[rgba(5,150,105,0.14)]">
            <div className="w-[5px] h-[5px] rounded-full bg-[#059669] pulse-glow" />
            <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#059669]">
              Verified Company Access
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {/* Filter Sidebar */}
        <div className="w-[220px] shrink-0 bg-white border-r border-[#e8eaf0] flex flex-col py-[16px] px-[14px] overflow-y-auto gap-[18px]">
          {/* Search */}
          <div>
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Search
            </p>
            <div className="relative">
              <div className="absolute left-[9px] top-[8px] opacity-40">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5" cy="5" r="3.5" stroke="#0a0b14" strokeWidth="1.2" />
                  <path d="M8 8l2 2" stroke="#0a0b14" strokeLinecap="round" strokeWidth="1.2" />
                </svg>
              </div>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Name or track..."
                className="w-full border border-[#e8eaf0] rounded-[8px] h-[30px] pl-[28px] pr-[10px] text-[11px] text-[#0a0b14] placeholder-[#94a3b8] outline-none focus:border-[rgba(59,139,255,0.4)] bg-[#f8f9fd]"
              />
            </div>
          </div>

          {/* Track filter */}
          <div>
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Career Track
            </p>
            <div className="flex flex-col gap-[5px]">
              {TRACKS.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setTrackFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                  className={`flex items-center gap-[7px] text-left text-[11px] font-['Inter:Medium',sans-serif] font-medium py-[4px] rounded-[6px] px-[6px] transition-all ${trackFilter.includes(t) ? "text-[#3b8bff] bg-[rgba(59,139,255,0.08)]" : "text-[#475569] hover:bg-[#f8f9fd]"}`}
                >
                  <div
                    className={`w-[13px] h-[13px] rounded-[3px] border flex items-center justify-center shrink-0 ${trackFilter.includes(t) ? "bg-[#3b8bff] border-[#3b8bff]" : "border-[#d1d5db]"}`}
                  >
                    {trackFilter.includes(t) && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1 4l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Readiness filter */}
          <div>
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Min Readiness
            </p>
            <div className="flex flex-col gap-[4px]">
              {[0, 60, 70, 80].map((v) => (
                <button
                  key={v}
                  onClick={() => setMinReadiness(v)}
                  className={`text-left text-[11px] font-['Inter:Medium',sans-serif] font-medium py-[5px] px-[8px] rounded-[6px] transition-all ${minReadiness === v ? "bg-[rgba(59,139,255,0.08)] text-[#3b8bff]" : "text-[#475569] hover:bg-[#f8f9fd]"}`}
                >
                  {v === 0 ? "Any" : `${v}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
              Sort By
            </p>
            <div className="flex flex-col gap-[4px]">
              {["match", "readiness", "recent"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`text-left text-[11px] font-['Inter:Medium',sans-serif] font-medium py-[5px] px-[8px] rounded-[6px] capitalize transition-all ${sortBy === s ? "bg-[rgba(59,139,255,0.08)] text-[#3b8bff]" : "text-[#475569] hover:bg-[#f8f9fd]"}`}
                >
                  {s === "match" ? "Match Score" : s === "readiness" ? "Readiness" : "Recently Active"}
                </button>
              ))}
            </div>
          </div>

          {(trackFilter.length > 0 || minReadiness > 0 || searchQ) && (
            <button
              onClick={() => {
                setTrackFilter([]);
                setMinReadiness(0);
                setSearchQ("");
              }}
              className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#ef4444] hover:text-[#dc2626] transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-[#f1f3fa] p-[20px]">
          {scene === "error" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.14)] flex items-center justify-center mx-auto mb-[12px]">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="#ef4444" strokeWidth="1.4" />
                    <path d="M11 7v4.5M11 14.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] text-[#0a0b14] mb-[4px]">
                  Failed to load talent discovery
                </p>
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[14px]">
                  There was a problem retrieving the student list.
                </p>
                <button
                  onClick={() => setScene("normal")}
                  className="px-[16px] py-[8px] rounded-[9px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : scene === "loading" ? (
            <div className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-[14px] border border-[#e8eaf0] p-[16px] flex flex-col gap-[10px]"
                >
                  <div className="flex items-center gap-[10px]">
                    <Sk w={40} h={40} r={20} />
                    <div className="flex flex-col gap-[6px] flex-1">
                      <Sk w="65%" h={13} />
                      <Sk w="45%" h={11} />
                    </div>
                  </div>
                  <Sk w={100} h={20} r={10} />
                  <div className="flex flex-col gap-[7px]">
                    <Sk w="100%" h={10} />
                    <Sk w="90%" h={10} />
                    <Sk w="80%" h={10} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-[280px]">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[rgba(59,139,255,0.06)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center mx-auto mb-[14px]">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="#3b8bff" strokeWidth="1.4" />
                    <path d="M15.5 15.5l4 4" stroke="#3b8bff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 10h4M10 8v4" stroke="#3b8bff" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] text-[#0a0b14] mb-[4px]">
                  No students found
                </p>
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] leading-[1.65]">
                  No permitted students match your current filters. Try adjusting your search criteria.
                </p>
                <button
                  onClick={() => {
                    setTrackFilter([]);
                    setMinReadiness(0);
                    setSearchQ("");
                  }}
                  className="mt-[14px] px-[14px] py-[7px] rounded-[9px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#3b8bff] bg-[rgba(59,139,255,0.08)] hover:bg-[rgba(59,139,255,0.14)] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
              {displayedStudents.map((s) => (
                <TalentCard
                  key={s.id}
                  student={s}
                  selected={selectedStudentId === s.id}
                  onClick={() => {
                    setSelectedStudentId(selectedStudentId === s.id ? null : s.id);
                    if (scene !== "contact-dialog" && scene !== "contact-sent") setScene("normal");
                  }}
                  scene={scene}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile panel */}
        {selectedStudent && scene !== "contact-dialog" && scene !== "contact-sent" && (
          <StudentProfilePanel
            student={selectedStudent}
            onClose={() => setSelectedStudentId(null)}
            onContact={() => setScene("contact-dialog")}
          />
        )}

        {/* Contact dialog */}
        {showContact && selectedStudent && (
          <ContactDialog
            student={selectedStudent}
            onClose={() => {
              setScene("profile");
              setContactSent(false);
            }}
            onConfirm={() => setContactSent(true)}
            sent={contactSent}
          />
        )}
      </div>

   </div>
  );
}
