import React, { useState, useRef, useEffect } from "react";
import { getMentorStudents, getConversations, getConversationMessages, sendConversationMessage, createMentorConnection, hideConversation, unwrapApiData } from "../../api";
import { useAuth } from "../auth/AuthContext";
// ── Mock data ─────────────────────────────────────────────────────────────────
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
  const studentProjects = Array.isArray(student.projects) ? student.projects : [];
  const eligible = studentProjects.filter((p) => p.eligible);
  const ineligible = studentProjects.filter((p) => !p.eligible);
  const [connectError, setConnectError] = useState("");
  const handleConnect = async () => {
    if (!selectedProject || connecting) return;
    setConnecting(true);
    setConnectError("");
    try {
      await createMentorConnection({ student_id: student.id, project_id: selectedProject.id });
      setScene("connect-success");
    } catch (error) {
      setConnectError(error?.message || "Unable to create the connection on the server.");
    } finally {
      setConnecting(false);
    }
  };
  return (
    <div
      className="absolute inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="bg-white rounded-[16px] w-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {connectError && <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{connectError}</div>}
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
function ChatPanel({ student, msgs, loading, empty, unauthorized, sending, onSend, onDelete }) {
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
        {onDelete && !unauthorized && !empty && (
          <button
            type="button"
            onClick={onDelete}
            title="Remove this conversation from your list"
            aria-label="Remove this conversation from your list"
            className="shrink-0 w-[24px] h-[24px] rounded-[7px] flex items-center justify-center text-[rgba(255,255,255,0.3)] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5h10M5.5 3.5V2.2h3v1.3M3.2 3.5l.5 8a1 1 0 001 .9h4.6a1 1 0 001-.9l.5-8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
  const { authUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([getMentorStudents(), getConversations({ page: 1, perPage: 100 })]).then(([payload, conversationPayload]) => {
      if (!active) return;
      const value = unwrapApiData(payload);
      const rows = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.students) ? value.students : [];
      setStudents(rows.map((row) => ({ ...row, id: String(row.id ?? row.user_id ?? row.learner_id ?? ""), name: row.name ?? row.full_name ?? row.student?.name ?? "Student", initials: (row.name ?? row.full_name ?? "S").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), track: row.track ?? row.career_role?.title ?? row.role_title ?? "Not specified", readiness: Number(row.readiness ?? row.readiness_score ?? 0) || 0, email: row.email ?? row.student?.email ?? "", avatar: row.avatar ?? row.profile_photo_url ?? "" })).filter((row) => row.id));
      const conversationsValue = unwrapApiData(conversationPayload);
      setConversations(Array.isArray(conversationsValue) ? conversationsValue : Array.isArray(conversationsValue?.data) ? conversationsValue.data : Array.isArray(conversationsValue?.conversations) ? conversationsValue.conversations : []);
    }).catch((error) => { if (active) setStudentsError(error?.message || "Unable to load mentor students."); }).finally(() => { if (active) setStudentsLoading(false); });
    return () => { active = false; };
  }, []);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [scene, setScene] = useState("normal");
  const [msgs, setMsgs] = useState([]);
  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;
  const handleSelectStudent = async (id) => {
    setSelectedStudentId(id);
    setScene("loading-chat");
    setMsgs([]);
    // The API nests the participants under `connection` (see the backend's
    // ConversationResource), so a top-level `student_id` never exists. Looking
    // only at the top level made every lookup miss, which is why selecting a
    // student always landed on "no conversation" and no message could be sent.
    const conversation = conversations.find((item) => {
      const studentId =
        item.connection?.student_id ??
        item.connection?.student?.id ??
        item.student_id ??
        item.learner_id ??
        item.participant_id ??
        item.student?.id ??
        item.learner?.id ??
        '';
      return String(studentId) === String(id);
    });
    const conversationId = conversation?.id ?? conversation?.conversation_id;
    setActiveConversationId(conversationId ?? null);
    if (!conversationId) { setScene("empty-chat"); return; }
    try {
      const payload = await getConversationMessages(conversationId, { page: 1, perPage: 100 });
      const value = unwrapApiData(payload);
      const rows = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.messages) ? value.messages : [];
      // The API exposes `sender_id`, not `sender_type` (see the backend's
      // MessageResource), so comparing it with the signed-in mentor's id is the
      // only reliable way to tell the two sides apart. Without this every
      // message — including the mentor's own — was attributed to the student.
      setMsgs(rows.map((message) => {
        const isMine =
          message.sender_id != null &&
          authUser?.id != null &&
          String(message.sender_id) === String(authUser.id);
        const role = isMine || message.sender_type === "mentor" || message.sender?.role === "mentor" ? "mentor" : "student";
        return {
          id: String(message.id),
          role,
          text: message.body ?? message.message ?? message.content ?? "",
          time: message.created_at ?? "",
          status: "delivered",
        };
      }));
      setScene("normal");
    } catch (error) { setStudentsError(error?.message || "Unable to load conversation messages."); setScene("error-chat"); }
  };
  const handleSend = async (text) => {
    if (!activeConversationId) { setStudentsError("There is no conversation associated with this student yet."); return; }
    try {
      setScene("sending");
      const payload = await sendConversationMessage(activeConversationId, { message: text, body: text });
      const value = unwrapApiData(payload);
      const message = value?.message ?? value;
      setMsgs((prev) => [...prev, { id: String(message?.id ?? Date.now()), role: "mentor", text: message?.body ?? message?.message ?? text, time: message?.created_at ?? new Date().toISOString(), status: "delivered" }]);
      setScene("normal");
    } catch (error) { setStudentsError(error?.message || "Unable to send the message to the server."); setScene("error-chat"); }
  };
  const applyScene = () => { setStudentsError(""); if (selectedStudentId) handleSelectStudent(selectedStudentId); };

  // Removes the conversation from THIS mentor's list only. The student keeps the
  // thread, and it reappears here the moment the student sends a new message.
  const handleDeleteConversation = async () => {
    if (!activeConversationId) return;
    const confirmed = window.confirm(
      "Remove this conversation from your list?\n\nThe student keeps their copy, and it will reappear here if they message you again."
    );
    if (!confirmed) return;
    try {
      await hideConversation(activeConversationId);
      setConversations((prev) => prev.filter((item) => String(item.id) !== String(activeConversationId)));
      setSelectedStudentId(null);
      setActiveConversationId(null);
      setMsgs([]);
      setScene("normal");
    } catch (error) {
      setStudentsError(error?.message || "Unable to remove the conversation.");
    }
  };
  const showModal = scene === "connect-project" || scene === "connect-success" || scene === "connect-ineligible";
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* View header */}
      <div className="bg-white border-b border-[#e8eaf0] px-[24px] py-[13px] flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14]">Mentor Dashboard</h1>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
            Mentor workspace · {studentsLoading ? "Loading…" : `${students.length} students`}{studentsError ? ` — ${studentsError}` : ""}
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
          students={students}
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
                  onClick={applyScene}
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
          onDelete={activeConversationId ? handleDeleteConversation : undefined}
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
