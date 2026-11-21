import { useProjectsText } from "../../i18n/useProjectsText";
import { useState, useMemo } from "react";
import { applyToProject, matchProject, unwrapApiData } from "../../api";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const TYPE_META = {
  "Practice Task": {
    emoji: "🔧",
    label: "Practice Task",
    color: "#1667e0",
    bg: "rgba(22,103,224,0.08)",
    border: "rgba(22,103,224,0.2)",
  },
  "Simulation Project": {
    emoji: "🧪",
    label: "Simulation",
    color: "#5b5bd6",
    bg: "rgba(91,91,214,0.08)",
    border: "rgba(91,91,214,0.2)",
  },
  "Real Project": {
    emoji: "🚀",
    label: "Real Project",
    color: "#15925a",
    bg: "rgba(21,146,90,0.08)",
    border: "rgba(21,146,90,0.2)",
  },
  Assessment: {
    emoji: "📝",
    label: "Assessment",
    color: "#f9a01f",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  Capstone: {
    emoji: "🎯",
    label: "Capstone",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.2)",
  },
};
const DIFF_META = {
  Beginner: { label: "Beginner", color: "#15925a", dots: 1 },
  Intermediate: { label: "Intermediate", color: "#f9a01f", dots: 2 },
  Advanced: { label: "Advanced", color: "#d13b3b", dots: 3 },
  Expert: { label: "Expert", color: "#5b5bd6", dots: 4 },
};
const ELIG_META = {
  Eligible: {
    text: "text-[#15925a]",
    bg: "bg-[rgba(21,146,90,0.08)]",
    border: "border-[rgba(21,146,90,0.2)]",
    dot: "bg-[#15925a]",
    icon: "✓",
  },
  "Conditionally Eligible": {
    text: "text-[#9a5b00]",
    bg: "bg-[rgba(245,158,11,0.08)]",
    border: "border-[rgba(245,158,11,0.2)]",
    dot: "bg-[#f9a01f]",
    icon: "◑",
  },
  "Not Eligible": {
    text: "text-[#d13b3b]",
    bg: "bg-[rgba(209,59,59,0.08)]",
    border: "border-[rgba(209,59,59,0.2)]",
    dot: "bg-[#d13b3b]",
    icon: "✕",
  },
  Completed: {
    text: "text-[#1667e0]",
    bg: "bg-[rgba(22,103,224,0.08)]",
    border: "border-[rgba(22,103,224,0.2)]",
    dot: "bg-[#1667e0]",
    icon: "★",
  },
};
const IMPACT_META = {
  High: { color: "#15925a", bg: "rgba(21,146,90,0.1)" },
  Medium: { color: "#f9a01f", bg: "rgba(245,158,11,0.1)" },
  Low: { color: "#98a1ba", bg: "rgba(148,163,184,0.1)" },
};
// ═══════════════════════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
// Match score ring
function MatchRing({ score, size = 56, evaluated = true }) {
  const { L } = useProjectsText();
  const r = size / 2 - 5;
  const C = 2 * Math.PI * r;
  const filled = (score / 100) * C;
  const col = score >= 80 ? "#15925a" : score >= 60 ? "#f9a01f" : "#d13b3b";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f6fc" strokeWidth="4" />
        {evaluated !== false && filled > 0 && <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="4"
          strokeDasharray={`${filled} ${C - filled}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size > 48 ? 14 : 11, color: evaluated === false ? "#98a1ba" : col }}
        >
          {evaluated === false ? L("N/A") : score}
        </span>
        {evaluated !== false && <span className="font-medium text-[8px] text-[#98a1ba] leading-none mt-[1px]">{L("match")}</span>}
      </div>
    </div>
  );
}
// Difficulty dots
function DifficultyDots({ d }) {
  const { L } = useProjectsText();
  const dm = DIFF_META[d] ?? { label: d || "Not specified", color: "#6b7593", dots: 0 };
  return (
    <span className="text-[11px] font-medium" style={{ color: dm.color }}>
      {L(d)}
    </span>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectDetailPanel({ project, onClose, onStart }) {
  const { L } = useProjectsText();
  const [activeTab, setActiveTab] = useState("match");
  const tm = TYPE_META[project.type] ?? { emoji: "📌", label: project.type || "Not specified", color: "#6b7593", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" };
  const em = ELIG_META[project.eligibility] ?? { text: "text-[#6b7593]", bg: "bg-[rgba(100,116,139,0.08)]", border: "border-[rgba(100,116,139,0.2)]", dot: "bg-[#6b7593]", icon: "?" };
  const matchedCount = project.skillMatches.filter((s) => s.matched).length;
  const gapCount = project.skillMatches.filter((s) => !s.matched).length;
  return (
    <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden flex flex-col">
      {/* Top accent */}
      <div className="h-[4px]" style={{ background: tm.color }} />

      {/* Header */}
      <div className="px-[24px] max-sm:px-[16px] pt-[20px] pb-[16px] border-b border-[#e4ebf5]">
        <div className="flex items-start gap-[14px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[10px]">
              <h3 className="font-semibold text-[17px] tracking-[-0.01em] text-[#05103d] leading-[1.3] rtl:text-right" dir="auto">
                {project.title}
              </h3>
              <div className="flex items-center gap-[8px] shrink-0">
                <MatchRing score={project.matchScore} size={52} evaluated={project.eligibility !== "Not evaluated"} />
                <button
                  onClick={onClose}
                  className="w-[28px] h-[28px] rounded-[8px] bg-[#f0f6fc] hover:bg-[#e4ebf5] flex items-center justify-center transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="#6b7593" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-[8px] mt-[6px] flex-wrap">
              <span
                className="text-[11px] font-medium px-[8px] py-[2px] rounded-full border"
                style={{ color: tm.color, background: tm.bg, borderColor: tm.border }}
              >
                {L(tm.label)}
              </span>
              <DifficultyDots d={project.difficulty} />
              <span className="text-[11px] font-normal text-[#98a1ba]">
                {[/^\d+(\.\d+)?$/.test(project.estimatedHours) ? L("{n} h", { n: project.estimatedHours }) : null, project.durationWeeks ? L("{n} weeks", { n: project.durationWeeks }) : (project.estimatedDuration && project.estimatedDuration !== "Not specified" ? project.estimatedDuration : null)].filter(Boolean).join(" · ")}
              </span>
              {project.sponsor && (
                <span className="text-[11px] font-medium text-[#6b7593] bg-[#f7fafe] border border-[#e4ebf5] px-[7px] py-[2px] rounded-full">
                  {project.sponsor}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Eligibility bar */}
        <div
          className={`flex items-start gap-[8px] mt-[14px] rounded-[10px] px-[12px] py-[10px] border ${em.border} ${em.bg}`}
        >
                    <div>
            <p className={`text-[12px] font-semibold ${em.text}`}>
              {L(project.eligibility)}
            </p>
            <p className="text-[11px] font-normal text-[#6b7593] mt-[1px] leading-[1.5] rtl:text-right" dir="auto">
              {project.eligibilityReason}
            </p>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-[4px] px-[24px] max-sm:px-[16px] pt-[16px] pb-[0px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          ["match", "Why this project"],
          ["skills", "Skill alignment"],
          ["learning", "Learning value"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setActiveTab(k)}
            className={`px-[12px] py-[8px] rounded-t-[8px] text-[13px] font-medium transition-all border-b-2 whitespace-nowrap shrink-0
              ${activeTab === k ? "text-[#1667e0] font-semibold border-[#1667e0]" : "text-[#6b7593] border-transparent hover:text-[#05103d]"}`}
          >
            {L(l)}
          </button>
        ))}
      </div>
      <div className="mx-[24px] max-sm:mx-[16px] h-px bg-[#e4ebf5] mb-[16px]" />

      {/* Tab content */}
      <div className="px-[24px] max-sm:px-[16px] pb-[20px] flex flex-col gap-[12px] overflow-y-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* ── Match explanation ── */}
        {activeTab === "match" && (
          <>
            {project.isRecommended && (
              <div
                className="relative overflow-hidden rounded-[12px] p-[16px]"
                style={{ background: "#060d2e" }}
              >
                <div
                  className="absolute -top-6 -right-4 w-28 h-28 rounded-full opacity-20 pointer-events-none"
                  style={{ background: "transparent" }}
                />
                <div className="relative flex items-start gap-[10px]">
                  <div>
                    <div className="flex items-center gap-[6px] mb-[4px]">
                      <p className="text-[12px] font-semibold text-[#7ca8ff]">
                        {L("AI Recommended #{n}", { n: project.recommendationRank })}
                      </p>
                    </div>
                    <p className="text-[12px] font-normal text-[rgba(255,255,255,0.65)] leading-[1.6]">
                      {project.recommendationReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[6px]">
                {L("Match explanation")}
              </p>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.65] rtl:text-right" dir="auto">
                {project.matchExplanation}
              </p>
            </div>
            {project.alignsWithNBA && (
              <div className="flex items-center gap-[8px] bg-[rgba(22,103,224,0.05)] border border-[rgba(22,103,224,0.15)] rounded-[10px] px-[12px] py-[10px]">
                
                <p className="text-[12px] font-normal text-[#1667e0]">
                  {L("This project aligns with your Next Best Action in your active career roadmap")}
                </p>
              </div>
            )}
            {project.roadmapPhase && (
              <div className="flex items-center gap-[8px] bg-[#f8f9ff] border border-[#eef0f8] rounded-[10px] px-[12px] py-[10px]">
                <p className="text-[11px] font-normal text-[#6b7593]">
                  {L("Counts toward Phase {n} of your Career Roadmap", { n: project.roadmapPhase })}
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-[8px]">
              {[
                { l: "Skills matched", v: `${matchedCount}/${project.skillMatches.length}`, c: "#15925a" },
                { l: "Skill gaps", v: `${gapCount}`, c: gapCount > 0 ? "#d13b3b" : "#15925a" },
                {
                  l: "Match score",
                  v: `${project.matchScore}%`,
                  c: project.matchScore >= 80 ? "#15925a" : project.matchScore >= 60 ? "#f9a01f" : "#d13b3b",
                },
              ].map((s) => (
                <div key={s.l} className="bg-[#f7fafe] border border-[#eef0f8] rounded-[10px] p-[10px] text-center">
                  <p
                    className="font-bold text-[20px] leading-none"
                    style={{ color: s.c }}
                  >
                    <bdi dir="ltr">{s.v}</bdi>
                  </p>
                  <p className="text-[11px] font-normal text-[#98a1ba] mt-[3px]">{L(s.l)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Skill alignment ── */}
        {activeTab === "skills" && (
          <>
            <div className="flex items-center gap-[16px] text-[11px] font-normal text-[#98a1ba] mb-[4px] flex-wrap">
              <div className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#15925a]" />
                <span>{L("Met / Exceeded")}</span>
              </div>
              <div className="flex items-center gap-[5px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#d13b3b]" />
                <span>{L("Gap, below requirement")}</span>
              </div>
              <div className="flex items-center gap-[5px]">
                
                <span>{L("Growth target for this project")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-[8px]">
              {project.skillMatches.map((sm) => (
                <div
                  key={sm.skillName}
                  className={`rounded-[10px] border p-[12px] ${sm.matched ? "border-[rgba(21,146,90,0.15)] bg-[rgba(21,146,90,0.03)]" : "border-[rgba(209,59,59,0.18)] bg-[rgba(209,59,59,0.03)]"}`}
                >
                  <div className="flex items-center justify-between gap-[8px] mb-[6px]">
                    <div className="flex items-center gap-[6px]">
                      <span
                        className={`w-[6px] h-[6px] rounded-full shrink-0 ${sm.matched ? "bg-[#15925a]" : "bg-[#d13b3b]"}`}
                      />
                      <span className="font-semibold text-[12px] text-[#05103d]">
                        {sm.skillName}
                      </span>
                      <span className="text-[11px] font-normal text-[#98a1ba]">
                        {sm.category}
                      </span>
                      {sm.isGrowthTarget && (
                        <span className="text-[11px] font-medium text-[#1667e0] bg-[rgba(22,103,224,0.1)] px-[6px] py-[1px] rounded-full">
                          {L("Growth target")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-[10px] text-[11px] font-normal text-[#98a1ba] shrink-0">
                      <span>
                        {L("You:")}{" "}
                        <strong className="font-semibold text-[#05103d]">L{sm.yourLevel}</strong>
                      </span>
                      <span>
                        {L("Required:")}{" "}
                        <strong className="font-semibold text-[#6b7593]">
                          L{sm.requiredLevel}
                        </strong>
                      </span>
                      {!sm.matched && (
                        <span className="text-[#d13b3b] font-semibold">
                          −{sm.gap}
                        </span>
                      )}
                      
                    </div>
                  </div>
                  {/* Level bar */}
                  <div className="relative w-full h-[6px] bg-[#f0f6fc] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(sm.yourLevel / sm.maxLevel) * 100}%`,
                        background: sm.matched ? "#15925a" : "#d13b3b",
                      }}
                    />
                    <div
                      className="absolute top-0 h-full w-[2px] bg-[#6b7593] opacity-40"
                      style={{ left: `${(sm.requiredLevel / sm.maxLevel) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-[3px] text-[11px] font-normal text-[#d1d5db]">
                    <span>0</span>
                    <span>L{sm.maxLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Learning value ── */}
        {activeTab === "learning" && (
          <>
            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.6]">
              {L("Completing this project produces verified evidence for the following skills, improving your Assessment Reliability and Practical Experience components.")}
            </p>
            <div className="flex flex-col gap-[10px]">
              {project.learningValue.map((lv) => {
                const im = IMPACT_META[lv.impact];
                return (
                  <div
                    key={lv.skillName}
                    className="bg-[#f7fafe] border border-[#eef0f8] rounded-[12px] p-[14px] flex gap-[12px]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
                        <span className="font-semibold text-[13px] text-[#05103d]">
                          {lv.skillName}
                        </span>
                        <span
                          className="text-[11px] font-bold px-[7px] py-[2px] rounded-full border"
                          style={{ color: im.color, background: im.bg, borderColor: `${im.color}25` }}
                        >
                          {L(lv.gain)}
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: im.color }}
                        >
                          {L("{x} impact", { x: L(lv.impact) })}
                        </span>
                      </div>
                      <p className="text-[12px] font-normal text-[#6b7593] leading-[1.55]">
                        {lv.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Readiness components affected */}
            <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] p-[14px]">
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[8px]">
                {L("Readiness components this project improves")}
              </p>
              <div className="flex flex-col gap-[6px]">
                {[
                  // Qualitative only: the API sends no per-project readiness numbers.
                  { l: "Practical Experience", note: "Adds verified project evidence" },
                  { l: "Assessment Reliability", note: "Verified source raises skill confidence" },
                ].map((c) => (
                  <div key={c.l} className="flex items-center justify-between gap-[10px] py-[2px]">
                    <span className="text-[12px] font-medium text-[#3b4565]">
                      {L(c.l)}
                    </span>
                    <span className="text-[11px] font-normal text-[#98a1ba] text-end">
                      {L(c.note)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action footer */}
      <div className="px-[24px] py-[16px] border-t border-[#f0f6fc] flex items-center gap-[10px]">
        {project.eligibility === "Eligible" || project.eligibility === "Conditionally Eligible" ? (
          <>
            <button
              type="button"
              onClick={() => onStart?.(project)}
              className="flex-1 h-[40px] rounded-[10px] text-[13px] font-semibold text-white bg-[#1667e0] hover:bg-[#0f52ba] transition-colors"
            >
              {project.eligibility === "Eligible" ? L("Start Project") : L("Start (Conditional)")}
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-[8px] bg-[rgba(209,59,59,0.05)] border border-[rgba(209,59,59,0.15)] rounded-[10px] px-[14px] py-[10px]">
            
            <p className="text-[12px] font-normal text-[#6b7593]">
              {L("Complete the required skill gaps to unlock this project")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT CARD
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectCard({ project, isSelected, onClick }) {
  const { L, isRtl } = useProjectsText();
  const tm = TYPE_META[project.type] ?? { emoji: "📌", label: project.type || "Not specified", color: "#6b7593", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" };
  const em = ELIG_META[project.eligibility] ?? { text: "text-[#6b7593]", bg: "bg-[rgba(100,116,139,0.08)]", border: "border-[rgba(100,116,139,0.2)]", dot: "bg-[#6b7593]", icon: "?" };
  const matched = project.skillMatches.filter((s) => s.matched);
  const gaps = project.skillMatches.filter((s) => !s.matched);
  const topGain = project.learningValue[0];
  const im = topGain ? IMPACT_META[topGain.impact] : null;
  return (
    <button
      onClick={onClick}
      className={`w-full text-start bg-white border rounded-[16px] overflow-hidden transition-all flex flex-col hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]
      ${
        isSelected
          ? "border-[rgba(22,103,224,0.45)] shadow-[0_0_0_3px_rgba(22,103,224,0.08)]"
          : project.eligibility === "Not Eligible"
            ? "border-[#e4ebf5] opacity-75"
            : "border-[#e4ebf5]"
      }`}
    >
      {/* Top gradient stripe — recommended */}
      {project.isRecommended && (
        <div className="h-[3px]" style={{ background: `#1667e0` }} />
      )}
      {/* Non-recommended stripe */}
      {!project.isRecommended && <div className="h-[3px]" style={{ background: tm.color + "30" }} />}

      <div className="p-[20px] max-sm:p-[16px] flex flex-col gap-[12px] flex-1">
        {/* Header row */}
        <div className="flex items-start gap-[10px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-[6px]">
              <div className="flex-1 min-w-0">
                {/* Rec + rank badge */}
                {project.isRecommended && (
                  <div className="flex items-center gap-[4px] mb-[3px]">
                    <span className="text-[11px] font-semibold text-[#1667e0] bg-[rgba(22,103,224,0.1)] px-[6px] py-[1px] rounded-full">
                      {L("Recommended #{n}", { n: project.recommendationRank })}
                    </span>
                    {project.alignsWithNBA && (
                      <span className="text-[11px] font-medium text-[#5b5bd6] bg-[rgba(91,91,214,0.08)] px-[6px] py-[1px] rounded-full">
                        {L("Roadmap action")}
                      </span>
                    )}
                  </div>
                )}
                <p className="font-semibold text-[14.5px] text-[#05103d] leading-[1.3] line-clamp-2 rtl:text-right" dir="auto">
                  {project.title}
                </p>
              </div>
              <MatchRing score={project.matchScore} size={44} evaluated={project.eligibility !== "Not evaluated"} />
            </div>
            <div className="flex items-center gap-[6px] mt-[4px] flex-wrap">
              <span
                className="text-[11px] font-medium px-[6px] py-[1px] rounded-full"
                style={{ color: tm.color, background: tm.bg }}
              >
                {L(tm.label)}
              </span>
              <DifficultyDots d={project.difficulty} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] font-normal text-[#6b7593] leading-[1.55] line-clamp-2 rtl:text-right" dir="auto">
          {project.description}
        </p>

        {/* Skill alignment mini-row */}
        <div className="flex items-center gap-[6px] flex-wrap">
          {matched.slice(0, 3).map((s) => (
            <span
              key={s.skillName}
              className="text-[11px] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(21,146,90,0.08)] text-[#15925a] border border-[rgba(21,146,90,0.15)]"
            >
              {s.skillName}
            </span>
          ))}
          {gaps.slice(0, 2).map((s) => (
            <span
              key={s.skillName}
              className="text-[11px] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(209,59,59,0.06)] text-[#d13b3b] border border-[rgba(209,59,59,0.15)]"
            >
              <bdi dir="ltr">−{s.gap}</bdi> {s.skillName}
            </span>
          ))}
          {project.skillMatches.length > 5 && (
            <span className="text-[11px] font-normal text-[#98a1ba]">
              {L("+{n} more", { n: project.skillMatches.length - 5 })}
            </span>
          )}
        </div>

        {/* Learning value pill */}
        {topGain && im && (
          <div
            className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[8px] border"
            style={{ background: im.bg, borderColor: `${im.color}25` }}
          >
            
            <span className="text-[11px] font-normal" style={{ color: im.color }}>
              <strong className="font-semibold">{L(topGain.gain)}</strong> {L("{gain} for {skill}", { gain: "", skill: topGain.skillName }).trim()}{isRtl ? "، " : ", "}
              {L("{x} impact", { x: L(topGain.impact) })}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-[10px] border-t border-[#f7fafe]">
          <div className="flex items-center gap-[5px]">
            <span className={`text-[11px] font-medium ${em.text}`}>
              {L(project.eligibility)}
            </span>
          </div>
          <div className="flex items-center gap-[8px] text-[11px] font-normal text-[#98a1ba]">
            {/^\d+(\.\d+)?$/.test(project.estimatedHours) && <span>{L("{n} h", { n: project.estimatedHours })}</span>}
            {project.openSpots ? <span className="text-[#9a5b00]">{L("{n} spots left", { n: project.openSpots })}</span> : null}
            <span className="text-[#1667e0] font-medium">{L("View")}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function RecommendationBanner({ count }) {
  const { L } = useProjectsText();
  return (
    <div
      className="relative overflow-hidden rounded-[16px] px-[20px] py-[15px] mb-[4px]"
      style={{ background: "#060d2e" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "transparent" }}
      />
      <div className="relative flex items-center justify-center gap-[8px] text-center">
        <span className="font-bold text-[14px] leading-[20px] text-white">
          {L("AI Project Recommendations")}
        </span>
        <span className="text-[11px] font-semibold text-[#b8ceff] bg-[rgba(22,103,224,0.2)] border border-[rgba(124,168,255,0.18)] px-[8px] py-[2px] rounded-full">
          {L("{n} matches", { n: count })}
        </span>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// STATE SCREENS
// ═══════════════════════════════════════════════════════════════════════════════
function NoProjectsState({ hasFilters, onClear }) {
  const { L } = useProjectsText();
  return (
    <div className="bg-white border border-[#e4ebf5] rounded-[16px] p-[48px] flex flex-col items-center text-center gap-[18px]">
      <div>
        <h3 className="font-bold text-[17px] text-[#05103d] mb-[6px]">
          {hasFilters ? L("No projects match your filters") : L("No eligible projects found")}
        </h3>
        <p className="text-[13px] font-normal text-[#6b7593] max-w-[420px] leading-[1.65]">
          {hasFilters
            ? "Try removing some filters, eligible projects may be hidden by the current filter combination."
            : "Your current skill levels do not yet meet the entry requirements for any available project. Complete the assessments on your career roadmap to unlock projects."}
        </p>
      </div>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold text-[#1667e0] border border-[rgba(22,103,224,0.3)] bg-[rgba(22,103,224,0.05)]"
        >
          {L("Clear all filters")}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-[6px]">
          <button
            className="px-[18px] py-[9px] rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: "#1667e0" }}
          >
            {L("View Career Roadmap")}
          </button>
          <p className="text-[11px] font-normal text-[#98a1ba]">
            {L("Projects unlock as you close skill gaps")}
          </p>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const ALL_TYPES = ["Practice Task", "Simulation Project", "Real Project", "Assessment", "Capstone"];
const ALL_ELIGIBILITY = ["Eligible", "Conditionally Eligible", "Not Eligible", "Completed", "Not evaluated"];

/**
 * The answer from POST /projects/{id}/match, in the shape this screen renders.
 *
 * The list endpoint carries no score and no eligibility — those are computed
 * per project by the matching service — so this is the only place the card can
 * learn them. `skill_results` is deliberately not mapped: the service returns it
 * empty today, and inventing rows would show skills that were never compared.
 */
function matchPatch(result) {
  const state = String(result?.eligibility_state || "").toLowerCase();
  const eligibility = state === "eligible" ? "Eligible" : state ? "Not Eligible" : "Not evaluated";
  const explanation = Array.isArray(result?.explanation) ? result.explanation.join(" ") : "";
  const limiting = Array.isArray(result?.limiting_factors) ? result.limiting_factors.join(" ") : "";

  return {
    matchScore: Number(result?.score ?? 0),
    eligibility,
    eligibilityReason: limiting,
    matchExplanation: explanation,
  };
}

export default function ProjectsView({ onOpenDetails, initialProjects = null, onApply, onMatch, roleLabel = "" }) {
  const { L } = useProjectsText();
  // Match results keyed by project id. Without this the "Check match" button
  // fired the request and threw the answer away, so every card stayed on
  // "Not evaluated" and the header always read "0 eligible".
  const [matches, setMatches] = useState({});
  const projectData = useMemo(() => (initialProjects ?? []).map((raw) => {
    const p = unwrapApiData(raw) || raw;
    let mappedType = "Real Project";
    if (p.type === "simulation") mappedType = "Simulation Project";
    else if (p.type === "company_sponsored") mappedType = "Real Project";
    else if (p.type) mappedType = p.type;

    let mappedDiff = "Intermediate";
    if (typeof p.difficulty === "number" || (!isNaN(Number(p.difficulty)) && p.difficulty !== null && p.difficulty !== "")) {
      const dNum = Number(p.difficulty);
      if (dNum <= 1) mappedDiff = "Beginner";
      else if (dNum <= 3) mappedDiff = "Intermediate";
      else if (dNum === 4) mappedDiff = "Advanced";
      else mappedDiff = "Expert";
    } else if (p.difficulty) {
      mappedDiff = p.difficulty;
    }

    return {
      ...p,
      id: String(p.id ?? p.project_id ?? p.uuid ?? ""),
      title: p.title ?? p.name ?? "Untitled project",
      description: p.description ?? p.summary ?? "",
      type: mappedType,
      difficulty: mappedDiff,
      estimatedHours: String(p.estimated_hours ?? p.estimatedHours ?? "-"),
      estimatedDuration: p.estimated_duration ?? (p.duration_days ? `${Math.round(p.duration_days / 7)} weeks` : null) ?? p.duration ?? "Not specified",
      durationWeeks: (() => {
        const m = String(p.estimated_duration ?? p.duration ?? "").match(/^\s*(\d+)\s*weeks?\s*$/i);
        if (m) return Number(m[1]);
        return !p.estimated_duration && p.duration_days ? Math.max(1, Math.round(p.duration_days / 7)) : null;
      })(),
      matchScore: Number(p.match_score ?? p.matchScore ?? 0),
      isRecommended: Boolean(p.is_recommended ?? p.isRecommended),
      recommendationRank: p.recommendation_rank ?? p.recommendationRank ?? 0,
      recommendationReason: p.recommendation_reason ?? p.recommendationReason ?? "",
      eligibility: p.eligibility ?? "Not evaluated",
      eligibilityReason: p.eligibility_reason ?? "",
      matchExplanation: p.match_explanation ?? "",
      skillMatches: p.skill_matches ?? p.skillMatches ?? [],
      learningValue: p.learning_value ?? p.learningValue ?? [],
      tags: p.tags ?? [],
      roadmapPhase: p.roadmap_phase ?? p.roadmapPhase ?? null,
      alignsWithNBA: Boolean(p.aligns_with_nba ?? p.alignsWithNBA),
      ...(matches[String(p.id ?? p.project_id ?? p.uuid ?? "")] || {}),
    };
  }), [initialProjects, matches]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [eligFilter, setEligFilter] = useState("all");
  const [showRec, setShowRec] = useState(true);
  const [sortBy, setSortBy] = useState("match");
  const [selected, setSelected] = useState("");
  // Pre-select the first project once on wide screens only. On phones the list
  // would be hidden behind the panel, and re-selecting after "close" made the
  // close button do nothing.
  // Done during render (once), not in an effect.
  const [autoSelected, setAutoSelected] = useState(false);
  if (!autoSelected && projectData.length > 0) {
    setAutoSelected(true);
    const wide = typeof window === "undefined" || !window.innerWidth || window.innerWidth >= 1024;
    if (wide && !projectData.some((p) => p.id === selected)) setSelected(projectData[0]?.id ?? "");
  }
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const recommended = projectData.filter((p) => p.isRecommended);
  const filtered = useMemo(() => {
    let list = [...projectData];
    if (search)
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.tags || []).some((t) => String(t).toLowerCase().includes(search.toLowerCase())),
      );
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (eligFilter !== "all") list = list.filter((p) => p.eligibility === eligFilter);
    if (sortBy === "match") list.sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === "difficulty")
      list.sort(
        (a, b) =>
          ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(a.difficulty) -
          ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(b.difficulty),
      );
    if (sortBy === "effort") list.sort((a, b) => parseInt(a.estimatedHours) - parseInt(b.estimatedHours));
    return list;
  }, [projectData, search, typeFilter, eligFilter, sortBy]);
  const selectedProject = projectData.find((p) => p.id === selected) ?? null;
  const hasActiveFilter = typeFilter !== "all" || eligFilter !== "all" || !!search;
  const isLoaded = true;
  const handleApply = async (project) => { try { setActionBusy(true); setActionError(""); if (onApply) await onApply(project); else await applyToProject(project.id); } catch (error) { setActionError(error?.message || "Could not submit the application."); } finally { setActionBusy(false); } };
  const handleMatch = async (project) => {
    try {
      setActionBusy(true);
      setActionError("");
      if (onMatch) return await onMatch(project);
      const result = unwrapApiData(await matchProject(project.id)) || {};
      setMatches((prev) => ({ ...prev, [project.id]: matchPatch(result) }));
    } catch (error) {
      setActionError(error?.message || "Could not calculate the match.");
    } finally {
      setActionBusy(false);
    }
  };
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f0f6fc]">
      {projectData.length === 0 && <div role="status" className="mx-[32px] max-sm:mx-[16px] mt-[20px] rounded-[12px] border border-[#d0e3fa] bg-[#e2eefc] px-[16px] py-[12px] text-[13px] leading-[1.5] text-[#0f52ba]">{L("No projects are currently available from the server. Projects will appear here when data becomes available.")}</div>}
      {actionError && <div role="alert" className="mx-[32px] max-sm:mx-[16px] mt-[12px] rounded-[12px] border border-[#f1d3d3] bg-[#fdecec] px-[16px] py-[12px] text-[13px] text-[#d13b3b]">{actionError}</div>}
      {/* Page header */}
      <div className="bg-[#f0f6fc] px-[32px] max-sm:px-[16px] pt-[28px] max-sm:pt-[20px] pb-[18px] shrink-0 border-b border-[#e4ebf5]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-[26px] max-sm:text-[22px] tracking-[-0.02em] text-[#05103d] leading-tight">
              {L("Projects")}
            </h1>
            <p className="font-normal text-[13.5px] text-[#6b7593] mt-[6px] leading-[1.5]">
              {L("Matched to")}{" "}
              <span className="font-semibold text-[#05103d]">
                {roleLabel || L("your selected career role")}
              </span>
              {isLoaded && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-[#15925a] font-medium">
                    {L("{n} eligible", { n: projectData.filter((p) => p.eligibility === "Eligible").length })}
                  </span>{" "}
                  ·{" "}
                  <span className="text-[#1667e0] font-medium">
                    {L("{n} recommended", { n: recommended.length })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Search + filters */}
        {isLoaded && (
          <div className="flex items-center gap-[8px] mt-[16px] flex-wrap">
            {/* Search */}
            <div className="relative flex-1 max-w-[340px] min-w-[200px] max-sm:max-w-none max-sm:basis-full">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L("Search projects, skills, tags…")}
                className="w-full h-[40px] px-[14px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13.5px] font-normal text-[#05103d] placeholder:text-[#98a1ba] focus:outline-none focus:border-[#1667e0] focus:shadow-[0_0_0_3px_rgba(22,103,224,0.12)] transition-colors"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-[40px] px-[12px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-medium text-[#3b4565] focus:outline-none focus:border-[#1667e0] focus:shadow-[0_0_0_3px_rgba(22,103,224,0.12)] transition-colors cursor-pointer max-sm:flex-1 max-sm:min-w-[calc(50%-4px)]"
            >
              <option value="all">{L("All types")}</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {L(t)}
                </option>
              ))}
            </select>

            {/* Eligibility filter */}
            <select
              value={eligFilter}
              onChange={(e) => setEligFilter(e.target.value)}
              className="h-[40px] px-[12px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-medium text-[#3b4565] focus:outline-none focus:border-[#1667e0] focus:shadow-[0_0_0_3px_rgba(22,103,224,0.12)] transition-colors cursor-pointer max-sm:flex-1 max-sm:min-w-[calc(50%-4px)]"
            >
              <option value="all">{L("All eligibility")}</option>
              {ALL_ELIGIBILITY.map((e) => (
                <option key={e} value={e}>
                  {L(e)}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-[40px] px-[12px] bg-white border border-[#e4ebf5] rounded-[10px] text-[13px] font-medium text-[#3b4565] focus:outline-none focus:border-[#1667e0] focus:shadow-[0_0_0_3px_rgba(22,103,224,0.12)] transition-colors cursor-pointer max-sm:flex-[3] max-sm:min-w-0"
            >
              <option value="match">{L("Sort: Match score")}</option>
              <option value="difficulty">{L("Sort: Difficulty")}</option>
              <option value="effort">{L("Sort: Effort")}</option>
            </select>

            {/* Rec toggle */}
            <button
              onClick={() => setShowRec(!showRec)}
              className={`h-[40px] px-[14px] rounded-[10px] text-[13px] font-medium whitespace-nowrap border transition-all max-sm:flex-[2]
                ${showRec ? "bg-[#e2eefc] border-[#d0e3fa] text-[#1667e0]" : "bg-white border-[#e4ebf5] text-[#3b4565] hover:bg-[#f7fafe]"}`}
            >
              {L("Recommended")}
            </button>

            {hasActiveFilter && (
              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setEligFilter("all");
                }}
                className="h-[40px] px-[12px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-white border border-[#e4ebf5] hover:border-[#d13b3b] hover:text-[#d13b3b] transition-all"
              >
                {L("Clear")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: project list */}
        <div
          className={`overflow-y-auto px-[32px] max-sm:px-[16px] py-[24px] max-sm:py-[16px] flex flex-col gap-[16px] transition-all [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${selectedProject && isLoaded ? "flex-1 min-w-0 max-lg:hidden" : "flex-1"}`}
        >
          
          
          {projectData.length === 0 && (
            <NoProjectsState
              hasFilters={hasActiveFilter}
              onClear={() => {
                setSearch("");
                setTypeFilter("all");
                setEligFilter("all");
              }}
            />
          )}

          {isLoaded && (
            <>
              {/* Recommendation banner */}
              {showRec && recommended.length > 0 && <RecommendationBanner count={recommended.length} />}

              {/* Recommended section */}
              {showRec && recommended.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[10px]">
                    {L("Recommended for you")}
                  </p>
                  <div className="flex flex-col gap-[12px]">
                    {recommended
                      .filter(
                        (p) =>
                          (!search ||
                            p.title.toLowerCase().includes(search.toLowerCase()) ||
                            (p.tags || []).some((t) => String(t).toLowerCase().includes(search.toLowerCase()))) &&
                          (typeFilter === "all" || p.type === typeFilter) &&
                          (eligFilter === "all" || p.eligibility === eligFilter),
                      )
                      .map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          isSelected={selected === p.id}
                          onClick={() => setSelected(selected === p.id ? null : p.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* All projects */}
              <div>
                <div className="flex items-center justify-between mb-[10px]">
                  <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide">
                    {showRec ? L("All projects") : L("Projects")}{" "}
                    <span className="normal-case font-normal">({filtered.length})</span>
                  </p>
                </div>

                {filtered.length === 0 ? (
                  <NoProjectsState
                    hasFilters={hasActiveFilter}
                    onClear={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setEligFilter("all");
                    }}
                  />
                ) : (
                  <div className="flex flex-col gap-[12px]">
                    {filtered.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        isSelected={selected === p.id}
                        onClick={() => setSelected(selected === p.id ? null : p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: detail panel */}
        {selectedProject && isLoaded && (
          <div className="w-[440px] max-lg:w-full shrink-0 border-l max-lg:border-l-0 border-[#e4ebf5] overflow-y-auto bg-[#f7fafe] p-[20px] max-sm:p-[14px] flex flex-col gap-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(selectedProject.id)}
                className="w-full h-[42px] flex items-center justify-center gap-[6px] rounded-[10px] text-[13.5px] font-semibold text-white hover:bg-[#0f52ba] transition-colors"
                style={{ background: "#1667e0" }}
              >
                {L("View Full Details & Apply")}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={actionBusy} onClick={() => handleMatch(selectedProject)} className="h-[40px] rounded-[10px] border border-[#d0e3fa] bg-[#e2eefc] px-3 text-[13px] font-semibold text-[#1667e0] hover:bg-[#d0e3fa] transition-colors disabled:opacity-50">{actionBusy ? L("Working…") : L("Check match")}</button>
              <button type="button" disabled={actionBusy} onClick={() => handleApply(selectedProject)} className="h-[40px] rounded-[10px] bg-[#1667e0] px-3 text-[13px] font-semibold text-white hover:bg-[#0f52ba] transition-colors disabled:opacity-50">{actionBusy ? L("Working…") : L("Apply")}</button>
            </div>
            <ProjectDetailPanel project={selectedProject} onClose={() => setSelected(null)} onStart={onOpenDetails ? (p) => onOpenDetails(p.id) : handleApply} />
          </div>
        )}
      </div>

   </div>
  );
}
