import React, { useState, useRef, useEffect } from "react";
// ── Mock data ─────────────────────────────────────────────────────────────────
const STUDENTS = [
  {
    id: "s1",
    name: "Lena Kim",
    initials: "LK",
    track: "Software Engineer",
    readiness: 73,
    phase: "Phase 2 — Applied",
    lastActive: "2 hours ago",
    unread: 0,
    status: "on-track",
    skills: [
      { name: "System Design", level: 2, required: 4, gap: 2, critical: true },
      { name: "Algorithms", level: 3, required: 4, gap: 1, critical: true },
      { name: "Cloud Deployment", level: 1, required: 3, gap: 2, critical: false },
      { name: "TypeScript", level: 4, required: 4, gap: 0, critical: false },
    ],
    projects: [
      { title: "Microservices Architecture Prototype", match: 84, eligible: true },
      { title: "Cloud-Native API Gateway", match: 76, eligible: false },
    ],
    roadmapAction: "Complete System Design module — 3 units remaining",
  },
  {
    id: "s2",
    name: "Omar Hassan",
    initials: "OH",
    track: "Data Scientist",
    readiness: 58,
    phase: "Phase 1 — Foundation",
    lastActive: "1 day ago",
    unread: 3,
    status: "at-risk",
    skills: [
      { name: "ML Fundamentals", level: 1, required: 4, gap: 3, critical: true },
      { name: "Python", level: 3, required: 4, gap: 1, critical: false },
      { name: "Statistics", level: 2, required: 4, gap: 2, critical: true },
      { name: "Data Visualization", level: 3, required: 3, gap: 0, critical: false },
    ],
    projects: [
      { title: "Predictive Analytics Dashboard", match: 69, eligible: false },
      { title: "NLP Sentiment Pipeline", match: 55, eligible: false },
    ],
    roadmapAction: "Start ML Fundamentals — 8 units required",
  },
  {
    id: "s3",
    name: "Priya Sharma",
    initials: "PS",
    track: "UX Designer",
    readiness: 81,
    phase: "Phase 3 — Specialized",
    lastActive: "30 minutes ago",
    unread: 0,
    status: "on-track",
    skills: [
      { name: "Figma Prototyping", level: 4, required: 4, gap: 0, critical: false },
      { name: "User Research", level: 3, required: 4, gap: 1, critical: true },
      { name: "Motion Design", level: 1, required: 3, gap: 2, critical: false },
      { name: "Design Systems", level: 4, required: 4, gap: 0, critical: false },
    ],
    projects: [
      { title: "Design System Accessibility Audit", match: 91, eligible: true },
      { title: "Onboarding Flow Redesign", match: 88, eligible: true },
    ],
    roadmapAction: "Submit User Research project — deadline in 5 days",
  },
  {
    id: "s4",
    name: "Ethan Park",
    initials: "EP",
    track: "Product Manager",
    readiness: 45,
    phase: "Phase 1 — Foundation",
    lastActive: "3 days ago",
    unread: 0,
    status: "behind",
    skills: [
      { name: "Roadmap Planning", level: 1, required: 4, gap: 3, critical: true },
      { name: "Stakeholder Mgmt", level: 2, required: 3, gap: 1, critical: true },
      { name: "Agile / Scrum", level: 2, required: 3, gap: 1, critical: false },
      { name: "Data Analysis", level: 1, required: 3, gap: 2, critical: false },
    ],
    projects: [{ title: "Product Discovery Sprint", match: 72, eligible: false }],
    roadmapAction: "Complete Roadmap Planning fundamentals — 12 units",
  },
  {
    id: "s5",
    name: "Aisha Mohammed",
    initials: "AM",
    track: "DevOps Engineer",
    readiness: 62,
    phase: "Phase 2 — Applied",
    lastActive: "5 hours ago",
    unread: 1,
    status: "at-risk",
    skills: [
      { name: "Kubernetes", level: 1, required: 4, gap: 3, critical: true },
      { name: "CI/CD Pipelines", level: 3, required: 4, gap: 1, critical: false },
      { name: "Infrastructure as Code", level: 2, required: 4, gap: 2, critical: true },
      { name: "Linux Administration", level: 3, required: 3, gap: 0, critical: false },
    ],
    projects: [
      { title: "Kubernetes Cluster Deployment", match: 78, eligible: false },
      { title: "CI/CD Automation Pipeline", match: 85, eligible: true },
    ],
    roadmapAction: "Enroll in Kubernetes Fundamentals — next cohort open",
  },
];
const CHAT_MSGS = {
  s1: [
    { id: "1", role: "system", text: "Conversation started · Nov 14, 2025", time: "" },
    {
      id: "2",
      role: "mentor",
      text: "Hi Lena! I reviewed your latest skill assessment. Great progress on TypeScript — you've hit the required level. Let's focus on System Design next.",
      time: "2:15 PM",
    },
    {
      id: "3",
      role: "student",
      text: "Thank you Dr. Chen! I've been practicing but system design still feels abstract. Where should I start?",
      time: "2:18 PM",
      status: "read",
    },
    {
      id: "4",
      role: "mentor",
      text: "I'd suggest starting with the Microservices Architecture Prototype project — it will give you hands-on experience and counts toward your Phase 2 milestone.",
      time: "2:21 PM",
    },
    {
      id: "5",
      role: "student",
      text: "That sounds good. Is it on SkillSpan? How do I apply?",
      time: "2:22 PM",
      status: "read",
    },
    {
      id: "6",
      role: "mentor",
      text: "Yes, I've flagged it as a recommended project for you. You're fully eligible — 84% match. Apply through the Projects section and I can write a support note.",
      time: "2:24 PM",
    },
    {
      id: "7",
      role: "student",
      text: "Perfect, I'll apply today. Should I finish the System Design module first or start the project simultaneously?",
      time: "2:26 PM",
      status: "delivered",
    },
  ],
  s2: [
    { id: "1", role: "system", text: "Conversation started · Nov 10, 2025", time: "" },
    {
      id: "2",
      role: "mentor",
      text: "Omar, I noticed you haven't started the ML Fundamentals module yet. It's a critical blocker for your Data Scientist track. Can we talk about what's holding you back?",
      time: "Yesterday, 3:00 PM",
    },
    {
      id: "3",
      role: "student",
      text: "Hi Dr. Chen. Honestly, the math prerequisites are intimidating. I'm not sure I have a strong enough statistics background.",
      time: "Yesterday, 3:45 PM",
      status: "read",
    },
    {
      id: "4",
      role: "mentor",
      text: "That's very honest. Your Statistics level is 2/4 — there's a gap, but it's bridgeable. Have you tried the Statistics refresher course in your roadmap?",
      time: "Yesterday, 4:00 PM",
    },
    {
      id: "5",
      role: "student",
      text: "Not yet. Should I finish Statistics before attempting ML Fundamentals?",
      time: "Yesterday, 4:12 PM",
      status: "read",
    },
    {
      id: "6",
      role: "mentor",
      text: "Yes — complete the Statistics refresher first. It usually takes 2–3 weeks. Then we can revisit ML Fundamentals together. I'll check in next Monday.",
      time: "Yesterday, 4:15 PM",
    },
  ],
  s3: [
    { id: "1", role: "system", text: "Conversation started · Nov 15, 2025", time: "" },
    {
      id: "2",
      role: "student",
      text: "Dr. Chen, I wanted to share my progress on the Design System Accessibility Audit! I've completed the initial audit and the report draft is ready for review.",
      time: "10:30 AM",
      status: "read",
    },
    {
      id: "3",
      role: "mentor",
      text: "Excellent work, Priya! That's ahead of schedule. Please share the draft through the project submission channel so the project sponsor can review it formally.",
      time: "10:45 AM",
    },
    {
      id: "4",
      role: "student",
      text: "Will do! Is there a project that combines both design systems and motion?",
      time: "10:47 AM",
      status: "read",
    },
    {
      id: "5",
      role: "mentor",
      text: "Great initiative. I don't have a direct match right now but I'll check upcoming projects next week. Keep the Motion Design work going — you only need 2 more levels.",
      time: "10:52 AM",
    },
  ],
  s4: [],
  s5: [
    { id: "1", role: "system", text: "Conversation started · Nov 12, 2025", time: "" },
    {
      id: "2",
      role: "student",
      text: "Hi, the Kubernetes project requires Level 4 but I'm at Level 1. Can the mentor override the eligibility?",
      time: "5 hours ago",
      status: "read",
    },
    {
      id: "3",
      role: "mentor",
      text: "Hi Aisha. I understand the frustration. However, mentor connections cannot bypass the platform's eligibility rules. The gap needs to be closed through the approved learning path first.",
      time: "4 hours ago",
    },
    {
      id: "4",
      role: "student",
      text: "That makes sense. What do you recommend then?",
      time: "4 hours ago",
      status: "delivered",
    },
  ],
};
// ── Atoms ─────────────────────────────────────────────────────────────────────
function Sk({ w, h, r = 6 }) {
  return <div className="shimmer" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />;
}
function studentGradient(status) {
  return status === "on-track"
    ? "linear-gradient(135deg,#059669,#34d399)"
    : status === "at-risk"
      ? "linear-gradient(135deg,#f59e0b,#fbbf24)"
      : "linear-gradient(135deg,#ef4444,#f87171)";
}
function ReadinessBadge({ score }) {
  const color = score >= 75 ? "#059669" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${color}30`, background: `${color}12` }}
    >
      <span className="text-[10px] font-['Inter:Bold',sans-serif] font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
function StatusPill({ status }) {
  const m = {
    "on-track": { bg: "rgba(5,150,105,0.1)", text: "#059669", label: "On Track" },
    "at-risk": { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", label: "At Risk" },
    behind: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", label: "Behind" },
  };
  const s = m[status];
  return (
    <span
      className="text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
function LevelDots({ level, required }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: i < level ? "#3b8bff" : i < required ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.08)" }}
        />
      ))}
    </div>
  );
}
// ── Student List Panel ────────────────────────────────────────────────────────
function StudentListPanel({ students, selectedId, onSelect, loading }) {
  const [q, setQ] = useState("");
  const filtered = q
    ? students.filter(
        (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.track.toLowerCase().includes(q.toLowerCase()),
      )
    : students;
  return (
    <div className="w-[240px] shrink-0 bg-[#0e1130] border-r border-[rgba(255,255,255,0.05)] flex flex-col overflow-hidden">
      <div className="px-[14px] pt-[18px] pb-[12px] border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between mb-[10px]">
          <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white">My Students</p>
          <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(59,139,255,0.12)] text-[#7ca8ff]">
            {students.length}
          </span>
        </div>
        <div className="relative">
          <div className="absolute left-[9px] top-[8px] opacity-25">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="5" cy="5" r="3.5" stroke="white" strokeWidth="1.2" />
              <path d="M8 8L10 10" stroke="white" strokeLinecap="round" strokeWidth="1.2" />
            </svg>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] rounded-[8px] h-[28px] pl-[27px] pr-[10px] text-[11px] text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(59,139,255,0.4)]"
            placeholder="Search students..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-[6px]">
        {loading ? (
          <div className="px-[12px] flex flex-col gap-[6px] pt-[6px]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-[10px] p-[10px]">
                <Sk w={34} h={34} r={17} />
                <div className="flex flex-col gap-[6px] flex-1">
                  <Sk w="65%" h={11} />
                  <Sk w="45%" h={9} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filtered.map((s) => {
            const active = selectedId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`w-full text-left pl-[10px] pr-[12px] py-[10px] flex items-center gap-[9px] transition-all border-l-2 ${active ? "bg-[rgba(59,139,255,0.1)] border-[#3b8bff]" : "hover:bg-[rgba(255,255,255,0.03)] border-transparent"}`}
              >
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0"
                  style={{ background: studentGradient(s.status) }}
                >
                  {s.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-[4px]">
                    <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-white truncate">
                      {s.name}
                    </p>
                    {s.unread > 0 && (
                      <span
                        className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
                      >
                        {s.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.3)] truncate">
                    {s.track}
                  </p>
                </div>
                <ReadinessBadge score={s.readiness} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
// ── Student Summary Panel ─────────────────────────────────────────────────────
function StudentSummaryPanel({ student, loading, onConnectProject }) {
  const [expanded, setExpanded] = useState("skills");
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-[20px] flex flex-col gap-[14px]">
        <div className="flex items-center gap-[12px]">
          <Sk w={52} h={52} r={26} />
          <div className="flex flex-col gap-[7px] flex-1">
            <Sk w="50%" h={18} />
            <Sk w="35%" h={12} />
          </div>
        </div>
        <Sk w="100%" h={68} r={10} />
        <Sk w="100%" h={140} r={12} />
        <Sk w="100%" h={110} r={12} />
      </div>
    );
  }
  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-[220px]">
          <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(59,139,255,0.06)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center mx-auto mb-[12px]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="7" r="3.5" stroke="#3b8bff" strokeWidth="1.4" />
              <path d="M3.5 19c0-4 3.36-7 7.5-7s7.5 3 7.5 7" stroke="#3b8bff" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14] mb-[4px]">
            Select a student
          </p>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] leading-[1.6]">
            Choose a student from the list to view their career profile and skill gaps.
          </p>
        </div>
      </div>
    );
  }
  const readColor = student.readiness >= 75 ? "#059669" : student.readiness >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Student header */}
      <div className="px-[22px] py-[18px] border-b border-[#e8eaf0] bg-white">
        <div className="flex items-start gap-[14px]">
          <div
            className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-[17px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0"
            style={{ background: studentGradient(student.status) }}
          >
            {student.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[8px] flex-wrap mb-[2px]">
              <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14]">{student.name}</h2>
              <StatusPill status={student.status} />
            </div>
            <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b]">
              {student.track} · {student.phase}
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[1px]">
              Last active {student.lastActive}
            </p>
          </div>
          <div className="flex flex-col items-center gap-[2px] shrink-0">
            <div
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center"
              style={{ border: `3px solid ${readColor}`, background: `${readColor}10` }}
            >
              <span className="font-['Inter:Bold',sans-serif] font-bold text-[15px]" style={{ color: readColor }}>
                {student.readiness}
              </span>
            </div>
            <p className="text-[9px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Readiness</p>
          </div>
        </div>
        {/* Next Best Action */}
        <div className="mt-[12px] flex items-start gap-[10px] bg-[rgba(59,139,255,0.04)] border border-[rgba(59,139,255,0.14)] rounded-[10px] px-[12px] py-[10px]">
          <span className="text-[13px] shrink-0 mt-[1px]">⚡</span>
          <div>
            <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] mb-[2px]">
              Next Best Action
            </p>
            <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#475569] leading-[1.5]">
              {student.roadmapAction}
            </p>
          </div>
        </div>
      </div>

      <div className="px-[22px] py-[14px] flex flex-col gap-[12px]">
        {/* Skill Gaps */}
        <div className="bg-white rounded-[12px] border border-[#e8eaf0] overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === "skills" ? null : "skills")}
            className="w-full flex items-center justify-between px-[14px] py-[11px] hover:bg-[#f8f9fd] transition-colors"
          >
            <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">Skill Gaps</p>
            <div className="flex items-center gap-[8px]">
              <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(239,68,68,0.08)] text-[#ef4444]">
                {student.skills.filter((s) => s.gap > 0).length} gaps
              </span>
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                style={{ transform: expanded === "skills" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              >
                <path d="M2.5 4.5l4 4 4-4" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
          </button>
          {expanded === "skills" && (
            <div className="px-[14px] pb-[12px] flex flex-col gap-[10px]">
              {student.skills.map((sk) => (
                <div key={sk.name} className="flex items-center gap-[10px]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[6px] mb-[4px]">
                      <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14] truncate">
                        {sk.name}
                      </p>
                      {sk.critical && (
                        <span className="text-[9px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#ef4444] bg-[rgba(239,68,68,0.08)] px-[5px] py-[1px] rounded-full shrink-0">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-[8px]">
                      <LevelDots level={sk.level} required={sk.required} />
                      <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                        L{sk.level} / L{sk.required}
                      </span>
                      {sk.gap > 0 && (
                        <span className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#ef4444]">
                          −{sk.gap}
                        </span>
                      )}
                      {sk.gap === 0 && (
                        <span className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#059669]">
                          ✓ Met
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="bg-white rounded-[12px] border border-[#e8eaf0] overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === "projects" ? null : "projects")}
            className="w-full flex items-center justify-between px-[14px] py-[11px] hover:bg-[#f8f9fd] transition-colors"
          >
            <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
              Matching Projects
            </p>
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              style={{ transform: expanded === "projects" ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            >
              <path d="M2.5 4.5l4 4 4-4" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
          {expanded === "projects" && (
            <div className="px-[14px] pb-[12px] flex flex-col gap-[8px]">
              {student.projects.map((p) => (
                <div
                  key={p.title}
                  className={`rounded-[10px] border p-[10px] flex items-center gap-[10px] ${p.eligible ? "border-[rgba(5,150,105,0.15)] bg-[rgba(5,150,105,0.03)]" : "border-[#e8eaf0] bg-[#f8f9fd]"}`}
                >
                  <div className="w-[30px] h-[30px] rounded-[8px] bg-[rgba(59,139,255,0.08)] border border-[rgba(59,139,255,0.12)] flex items-center justify-center text-[13px] shrink-0">
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14] truncate">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-[6px] mt-[2px]">
                      <span className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff]">
                        {p.match}% match
                      </span>
                      {p.eligible ? (
                        <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[#059669]">
                          ✓ Eligible
                        </span>
                      ) : (
                        <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                          Not eligible yet
                        </span>
                      )}
                    </div>
                  </div>
                  {p.eligible && (
                    <button
                      onClick={onConnectProject}
                      className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#3b8bff] bg-[rgba(59,139,255,0.08)] hover:bg-[rgba(59,139,255,0.15)] border border-[rgba(59,139,255,0.2)] px-[9px] py-[4px] rounded-[7px] transition-all shrink-0"
                    >
                      Connect →
                    </button>
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
// ── Project Connection Modal ──────────────────────────────────────────────────
function ProjectConnectionModal({ student, onClose, scene, setScene }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const isIneligible = scene === "connect-ineligible";
  const isSuccess = scene === "connect-success";
  const eligible = student.projects.filter((p) => p.eligible);
  const ineligible = student.projects.filter((p) => !p.eligible);
  const handleConnect = () => {
    if (!selectedProject || connecting) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setScene("connect-success");
    }, 1600);
  };
  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="bg-white rounded-[16px] w-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-[#e8eaf0]">
          <div>
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14]">
              Connect Student to Project
            </h3>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#64748b] mt-[2px]">
              {student.name} · {student.track}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-[28px] h-[28px] rounded-full hover:bg-[#f1f3fa] flex items-center justify-center transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 2l9 9M11 2L2 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-[32px] text-center">
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
              Connection Recorded
            </p>
            <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] leading-[1.65] max-w-[320px]">
              {student.name} has been connected to the selected project. They will receive a notification.
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[10px] max-w-[320px] leading-[1.6]">
              Note: The student must still complete the application workflow. This connection does not bypass
              eligibility or acceptance rules.
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
          <>
            <div className="flex-1 overflow-y-auto p-[18px] flex flex-col gap-[14px]">
              {/* Disclaimer */}
              <div className="flex items-start gap-[10px] bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.18)] rounded-[10px] px-[13px] py-[10px]">
                <span className="text-[13px] shrink-0">⚠️</span>
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#78350f] leading-[1.6]">
                  Recording a mentor connection does not bypass the student's required application process or override
                  project eligibility rules.
                </p>
              </div>

              {isIneligible && (
                <div className="flex items-start gap-[10px] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.18)] rounded-[10px] px-[13px] py-[10px]">
                  <span className="text-[13px] shrink-0">🚫</span>
                  <div>
                    <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#ef4444] mb-[2px]">
                      Connection not permitted
                    </p>
                    <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#7f1d1d] leading-[1.6]">
                      The selected project has eligibility conditions that are not met. The student must close the skill
                      gaps first.
                    </p>
                  </div>
                </div>
              )}

              {eligible.length > 0 && (
                <div>
                  <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
                    Available Connections
                  </p>
                  <div className="flex flex-col gap-[7px]">
                    {eligible.map((p) => (
                      <button
                        key={p.title}
                        onClick={() => !isIneligible && setSelectedProject(p.title)}
                        className={`w-full text-left rounded-[10px] border p-[12px] flex items-center gap-[12px] transition-all ${selectedProject === p.title ? "border-[#3b8bff] bg-[rgba(59,139,255,0.05)]" : "border-[#e8eaf0] hover:border-[rgba(59,139,255,0.3)]"}`}
                      >
                        <div
                          className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center shrink-0 ${selectedProject === p.title ? "border-[#3b8bff] bg-[#3b8bff]" : "border-[#d1d5db]"}`}
                        >
                          {selectedProject === p.title && (
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
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14]">
                            {p.title}
                          </p>
                          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
                            {p.match}% skill match · Eligible ✓
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ineligible.length > 0 && (
                <div>
                  <p className="text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
                    Not Yet Eligible
                  </p>
                  <div className="flex flex-col gap-[6px]">
                    {ineligible.map((p) => (
                      <div
                        key={p.title}
                        className="rounded-[10px] border border-[#e8eaf0] p-[11px] flex items-center gap-[10px] opacity-50"
                      >
                        <div className="w-[17px] h-[17px] rounded-full border-2 border-[#d1d5db] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b]">
                            {p.title}
                          </p>
                          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                            {p.match}% match · Eligibility not met
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-[10px] px-[18px] py-[13px] border-t border-[#e8eaf0]">
              <button
                onClick={onClose}
                className="px-[14px] py-[7px] rounded-[9px] text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] hover:bg-[#f1f3fa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!selectedProject || connecting || isIneligible}
                className="px-[16px] py-[7px] rounded-[9px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-[7px]"
                style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
              >
                {connecting && (
                  <div className="w-[11px] h-[11px] rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {connecting ? "Connecting..." : "Confirm Connection"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({ student, msgs, loading, empty, unauthorized, sending, onSend }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  const taRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, sending]);
  const handleSend = () => {
    const t = input.trim();
    if (!t || sending) return;
    onSend(t);
    setInput("");
    if (taRef.current) taRef.current.style.height = "34px";
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const isEmpty = empty || (msgs.filter((m) => m.role !== "system").length === 0 && !loading && !unauthorized);
  if (!student) {
    return (
      <div className="w-[340px] shrink-0 bg-[#0d0f24] border-l border-[rgba(255,255,255,0.06)] flex items-center justify-center">
        <div className="text-center px-[20px]">
          <div className="w-[40px] h-[40px] rounded-[12px] bg-[rgba(59,139,255,0.1)] flex items-center justify-center mx-auto mb-[10px]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1.5C5.69 1.5 3 4.19 3 7.5c0 1.4.5 2.7 1.3 3.7L3 16l3.7-1.4c.6.26 1.25.4 1.95.4 3.31 0 6-2.69 6-6s-2.69-6-6-6z"
                stroke="#3b8bff"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[rgba(255,255,255,0.4)]">
            No conversation selected
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-[340px] shrink-0 bg-[#0d0f24] border-l border-[rgba(255,255,255,0.06)] flex flex-col">
      {/* Header */}
      <div className="px-[14px] py-[11px] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-[9px] shrink-0">
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0"
          style={{ background: studentGradient(student.status) }}
        >
          {student.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white truncate">
            {student.name}
          </p>
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.3)]">{student.track}</p>
        </div>
        {!unauthorized && (
          <div className="flex items-center gap-[4px]">
            <div className="w-[5px] h-[5px] rounded-full bg-[#34d399] pulse-glow" />
            <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.3)]">Active</span>
          </div>
        )}
        {unauthorized && (
          <div className="flex items-center gap-[4px]">
            <div className="w-[5px] h-[5px] rounded-full bg-[#ef4444]" />
            <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(239,68,68,0.7)]">Restricted</span>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-[12px] py-[12px] flex flex-col gap-[8px]">
        {unauthorized ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-[16px]">
            <div className="w-[48px] h-[48px] rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center mb-[12px]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="9" width="14" height="9" rx="2" stroke="#ef4444" strokeWidth="1.3" />
                <path d="M7 9V6.5a3 3 0 016 0V9" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white mb-[6px]">
              Access Denied
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)] leading-[1.65]">
              You do not have permission to access this conversation. This event has been recorded for security review.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-[12px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`flex gap-[8px] ${i % 2 === 1 ? "justify-end" : "justify-start"}`}>
                {i % 2 !== 1 && <Sk w={26} h={26} r={13} />}
                <div className={`max-w-[72%] flex flex-col gap-[4px] ${i % 2 === 1 ? "items-end" : ""}`}>
                  <Sk w={i % 2 === 1 ? 160 : 190} h={38} r={10} />
                  <Sk w={55} h={9} />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-[16px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[rgba(59,139,255,0.1)] border border-[rgba(59,139,255,0.15)] flex items-center justify-center mb-[12px]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 1.5C5.69 1.5 3 4.19 3 7.5c0 1.4.5 2.7 1.3 3.7L3 16l3.7-1.4c.6.26 1.25.4 1.95.4 3.31 0 6-2.69 6-6s-2.69-6-6-6z"
                  stroke="#3b8bff"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white mb-[4px]">
              No messages yet
            </p>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.4)] leading-[1.65]">
              Start the conversation with {student.name} to offer guidance and support their learning journey.
            </p>
          </div>
        ) : (
          <>
            {msgs.map((msg) => {
              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex items-center gap-[8px] my-[4px]">
                    <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.05)]" />
                    <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.2)] shrink-0 px-[6px]">
                      {msg.text}
                    </span>
                    <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.05)]" />
                  </div>
                );
              }
              const isMentor = msg.role === "mentor";
              return (
                <div key={msg.id} className={`flex gap-[7px] ${isMentor ? "justify-end" : "justify-start"}`}>
                  {!isMentor && (
                    <div
                      className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[8px] font-['Inter:Bold',sans-serif] font-bold text-white shrink-0 mt-[2px]"
                      style={{ background: studentGradient(student.status) }}
                    >
                      {student.initials}
                    </div>
                  )}
                  <div className={`max-w-[76%] flex flex-col gap-[3px] ${isMentor ? "items-end" : ""}`}>
                    <div
                      className={`rounded-[11px] px-[11px] py-[8px] text-[12px] font-['Inter:Regular',sans-serif] leading-[1.65] ${isMentor ? "rounded-tr-[4px] text-white" : "rounded-tl-[4px] text-[rgba(255,255,255,0.82)] bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.05)]"}`}
                      style={isMentor ? { background: "linear-gradient(135deg,#1a3460,#251660)" } : {}}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-[4px] ${isMentor ? "justify-end" : ""}`}>
                      <span className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.22)]">
                        {msg.time}
                      </span>
                      {isMentor && msg.status === "read" && <span className="text-[9px] text-[#7ca8ff]">✓✓</span>}
                      {isMentor && msg.status === "delivered" && (
                        <span className="text-[9px] text-[rgba(255,255,255,0.3)]">✓✓</span>
                      )}
                      {isMentor && msg.status === "sent" && (
                        <span className="text-[9px] text-[rgba(255,255,255,0.3)]">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex justify-end">
                <div className="bg-[rgba(59,139,255,0.1)] border border-[rgba(59,139,255,0.15)] rounded-[11px] rounded-tr-[4px] px-[13px] py-[9px] flex items-center gap-[5px]">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-[4px] h-[4px] rounded-full bg-[#7ca8ff] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        className={`border-t border-[rgba(255,255,255,0.06)] px-[11px] py-[9px] shrink-0 ${unauthorized ? "opacity-35 pointer-events-none" : ""}`}
      >
        <div className="flex items-end gap-[7px]">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onInput={() => {
              if (taRef.current) {
                taRef.current.style.height = "34px";
                taRef.current.style.height = Math.min(taRef.current.scrollHeight, 110) + "px";
              }
            }}
            placeholder="Message the student..."
            rows={1}
            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[9px] px-[11px] py-[7px] text-[12px] text-[rgba(255,255,255,0.82)] placeholder-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(59,139,255,0.4)] resize-none leading-[1.5] overflow-hidden"
            style={{ height: "34px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 11.5L11.5 6.5 1.5 1.5v3.5L8.5 6.5l-7 1.5V11.5z" fill="white" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] font-['Inter:Regular',sans-serif] text-[rgba(255,255,255,0.18)] mt-[5px] px-[2px]">
          Communication is recorded for audit purposes. Do not share unauthorized information.
        </p>
      </div>
    </div>
  );
}
// ── Main MentorView ───────────────────────────────────────────────────────────
export default function MentorView() {
  const [selectedStudentId, setSelectedStudentId] = useState("s1");
  const [scene, setScene] = useState("normal");
  const [msgs, setMsgs] = useState(CHAT_MSGS.s1);
  const selectedStudent = STUDENTS.find((s) => s.id === selectedStudentId) ?? null;
  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    setScene("normal");
    setMsgs(CHAT_MSGS[id] ?? []);
  };
  const handleSend = (text) => {
    const newMsg = { id: Date.now().toString(), role: "mentor", text, time: "Now", status: "sending" };
    setMsgs((prev) => [...prev, newMsg]);
    setScene("sending");
    setTimeout(() => {
      setMsgs((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, status: "delivered" } : m)));
      setScene("normal");
    }, 1600);
  };
  const applyScene = (s) => {
    setScene(s);
    if (s === "loading-students") {
      setSelectedStudentId(null);
      setMsgs([]);
    } else if (s === "loading-chat") {
      setSelectedStudentId("s1");
      setMsgs([]);
    } else if (s === "empty-chat") {
      setSelectedStudentId("s4");
      setMsgs([]);
    } else if (s === "notification") {
      setSelectedStudentId("s2");
      setMsgs(CHAT_MSGS.s2);
    } else if (s === "unauthorized") {
      setSelectedStudentId("s3");
      setMsgs([]);
    } else if (s === "error-chat") {
      setSelectedStudentId("s1");
      setMsgs([]);
    } else if (s === "connect-project" || s === "connect-success" || s === "connect-ineligible") {
      setSelectedStudentId("s1");
      setMsgs(CHAT_MSGS.s1);
    } else if (s === "sending") {
      setSelectedStudentId("s1");
      setMsgs(CHAT_MSGS.s1);
    } else {
      setSelectedStudentId("s1");
      setMsgs(CHAT_MSGS.s1);
    }
  };
  const showModal = scene === "connect-project" || scene === "connect-success" || scene === "connect-ineligible";
  const DEMO_BUTTONS = [
    { label: "Normal", s: "normal" },
    { label: "Loading Students", s: "loading-students" },
    { label: "Loading Chat", s: "loading-chat" },
    { label: "Empty Chat", s: "empty-chat" },
    { label: "Unauthorized", s: "unauthorized" },
    { label: "Sending", s: "sending" },
    { label: "Notification", s: "notification" },
    { label: "Connect Project", s: "connect-project" },
    { label: "Connect Ineligible", s: "connect-ineligible" },
    { label: "Error", s: "error-chat" },
  ];
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* View header */}
      <div className="bg-white border-b border-[#e8eaf0] px-[24px] py-[13px] flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14]">Mentor Dashboard</h1>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
            Dr. Sarah Chen · Software Engineering · {STUDENTS.length} permitted students
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[8px] bg-[rgba(5,150,105,0.06)] border border-[rgba(5,150,105,0.14)]">
            <div className="w-[6px] h-[6px] rounded-full bg-[#059669] pulse-glow" />
            <span className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#059669]">
              Authorized Mentor
            </span>
          </div>
        </div>
      </div>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden relative">
        <StudentListPanel
          students={STUDENTS}
          selectedId={selectedStudentId}
          onSelect={handleSelectStudent}
          loading={scene === "loading-students"}
        />

        <div className="flex-1 bg-[#f1f3fa] overflow-hidden flex flex-col relative">
          <StudentSummaryPanel
            student={selectedStudent}
            loading={scene === "loading-chat"}
            onConnectProject={() => setScene("connect-project")}
          />

          {/* Error overlay */}
          {scene === "error-chat" && (
            <div className="absolute inset-0 bg-[rgba(241,243,250,0.95)] flex items-center justify-center z-20">
              <div className="text-center">
                <div className="w-[50px] h-[50px] rounded-[14px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.14)] flex items-center justify-center mx-auto mb-[12px]">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="#ef4444" strokeWidth="1.4" />
                    <path d="M11 7v4.5M11 14.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14] mb-[4px]">
                  Failed to load student data
                </p>
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[14px]">
                  There was a problem retrieving the student profile.
                </p>
                <button
                  onClick={() => applyScene("normal")}
                  className="px-[16px] py-[8px] rounded-[9px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#3b8bff,#7c3aed)" }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        <ChatPanel
          student={selectedStudent}
          msgs={msgs}
          loading={scene === "loading-chat"}
          empty={scene === "empty-chat"}
          unauthorized={scene === "unauthorized"}
          sending={scene === "sending"}
          onSend={handleSend}
        />

        {/* Project connection modal */}
        {showModal && selectedStudent && (
          <ProjectConnectionModal
            student={selectedStudent}
            onClose={() => setScene("normal")}
            scene={scene}
            setScene={setScene}
          />
        )}
      </div>

   </div>
  );
}
