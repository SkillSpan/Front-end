import { useEffect, useRef, useState } from "react";
import { getCareerRoleSkills, getCareerRoles, getSkillsMatrix, unwrapApiData } from "../../api";
// ── Mock Data ────────────────────────────────────────────────────────────────
// ── Utility helpers ──────────────────────────────────────────────────────────
function demandColor(level) {
  if (level === "High") return { bg: "bg-[rgba(5,150,105,0.1)]", text: "text-[#059669]", dot: "bg-[#059669]" };
  if (level === "Medium") return { bg: "bg-[rgba(245,158,11,0.1)]", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" };
  return { bg: "bg-[rgba(100,116,139,0.1)]", text: "text-[#64748b]", dot: "bg-[#64748b]" };
}
// Labour-market demand is OPTIONAL in the API payload. `career-roles` returns
// id/title/version and nothing else (see CareerRoleController::index), and
// `/career-roles/{id}` is just id/title/version/effective_date/status — neither
// carries a demand block. The role mapping therefore stores `demand: role.demand
// ?? null`, and reading `role.demand.demandLevel` threw
// "Cannot read properties of null (reading 'demandLevel')" on every card.
// One neutral shape is used everywhere instead of eight separate null checks.
const EMPTY_DEMAND = Object.freeze({
  demandLevel: null,
  demandValue: null,
  source: null,
  collectionDate: null,
  validUntil: null,
  isExpired: false,
});
const demandOf = (role) => role?.demand ?? EMPTY_DEMAND;
// A role with no market data must not look like a real "Low demand" reading.
const hasDemand = (demand) =>
  Boolean(demand) && demand.demandLevel != null && demand.demandLevel !== "";
// Skill requirements come from a SEPARATE endpoint (`/career-roles/{id}/skills`)
// and the list payload carries no `skillRequirements` field at all, so the same
// crash sits one line further down (`role.skillRequirements.filter`). Treated as
// "not loaded yet" rather than as an error.
const skillRequirementsOf = (role) =>
  Array.isArray(role?.skillRequirements) ? role.skillRequirements : [];
// Skills are rated 1..5 in the backend; the bars need a denominator.
const SKILL_MAX_LEVEL = 5;

/**
 * Turn `/career-roles/{id}/skills` + the learner's matrix into the shape the
 * requirement rows render.
 *
 * The career-roles payload carries no `skillRequirements`, and nothing ever
 * called the skills endpoint, so every role opened with an empty requirement
 * table and "Skills Met 0/0". `/career-roles/{id}/skills` sends
 * `{ skills: [{ skill_id, skill_name, required_level, importance_weight,
 * is_critical, prerequisites }] }` and no per-learner level at all — the
 * learner side comes from `/skills/matrix` and is joined on `skill_id` here.
 * A learner with no row for a skill is at level 0, which is the honest answer,
 * not a missing value.
 */
function buildSkillRequirements(payload, matrix) {
  const rows = unwrapApiData(payload);
  const skills = Array.isArray(rows) ? rows : rows?.skills ?? [];
  const levels = matrix instanceof Map ? matrix : new Map();

  return skills.map((skill) => {
    const id = skill.skill_id ?? skill.skillId ?? skill.id;
    const current = Number(levels.get(id) ?? levels.get(String(id)) ?? 0) || 0;
    return {
      skillId: id,
      skillName: skill.skill_name ?? skill.skillName ?? skill.name ?? "Unnamed skill",
      requiredLevel: Number(skill.required_level ?? skill.requiredLevel ?? 0) || 0,
      currentLevel: current,
      maxLevel: SKILL_MAX_LEVEL,
      importanceWeight: Number(skill.importance_weight ?? skill.importanceWeight ?? 0) || 0,
      isCritical: Boolean(skill.is_critical ?? skill.isCritical),
      prerequisites: skill.prerequisites ?? [],
    };
  });
}

/** `Map<skill_id, level>` from `/skills/matrix`, whose rows carry `skill.id`. */
function levelsBySkill(payload) {
  const rows = unwrapApiData(payload);
  const list = Array.isArray(rows) ? rows : rows?.data ?? [];
  const map = new Map();
  for (const row of list) {
    const id = row?.skill?.id ?? row?.skill_id;
    if (id == null) continue;
    map.set(id, Number(row.level ?? 0) || 0);
  }
  return map;
}
function readinessColor(score) {
  if (score >= 70) return "#059669";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}
function skillGapColor(current, required) {
  if (current >= required) return { bar: "bg-[#059669]", text: "text-[#059669]" };
  if (current >= required - 1) return { bar: "bg-[#f59e0b]", text: "text-[#f59e0b]" };
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
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[135deg]">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        strokeLinecap="round"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${filled} ${gap + circumference * 0.25}`}
        strokeLinecap="round"
      />
    </svg>
  );
}
// ── DemandIndicator ───────────────────────────────────────────────────────────
function DemandIndicator({ demand }) {
  const d = demand ?? EMPTY_DEMAND;
  // No market data is the normal case today, not an error: render the panel
  // with an explicit "not available yet" line so the page still reads correctly.
  if (!hasDemand(d)) {
    return (
      <div
        data-testid="demand-unavailable"
        className="border border-dashed border-[#e8eaf0] rounded-[12px] p-[16px] bg-[#fafbff]"
      >
        <div className="flex items-center justify-between mb-[8px]">
          <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14]">
            Labor-Market Demand
          </span>
        </div>
        <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b]">
          Labor-market demand data is not available for this role yet. Everything else on this
          page is unaffected.
        </p>
      </div>
    );
  }
  const c = demandColor(d.demandLevel);
  return (
    <div className="border border-[#e8eaf0] rounded-[12px] p-[16px] bg-white">
      <div className="flex items-center justify-between mb-[12px]">
        <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14]">
          Labor-Market Demand
        </span>
        {d.isExpired && (
          <span className="bg-[rgba(239,68,68,0.08)] text-[#ef4444] text-[11px] font-['Inter:Medium',sans-serif] font-medium px-[8px] py-[3px] rounded-full">
            Data Expired
          </span>
        )}
      </div>
      <div className="flex items-center gap-[8px] mb-[10px]">
        <div className={`flex items-center gap-[6px] px-[10px] py-[4px] rounded-full ${c.bg}`}>
          <span className={`w-[6px] h-[6px] rounded-full ${c.dot}`} />
          <span className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] ${c.text}`}>
            {d.demandLevel} Demand
          </span>
        </div>
        <span className="font-['Inter:Bold',sans-serif] font-bold text-[14px] text-[#0a0b14]">
          {d.demandValue}%
        </span>
      </div>
      <div className="w-full bg-[#f1f3fa] rounded-full h-[6px] mb-[12px]">
        <div className={`h-[6px] rounded-full ${c.dot}`} style={{ width: `${d.demandValue}%` }} />
      </div>
      <div className="flex items-start gap-[4px] flex-wrap">
        <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Source:</span>
        <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b]">{d.source}</span>
        <span className="text-[11px] text-[#94a3b8]">·</span>
        <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
          Collected {d.collectionDate}
        </span>
        <span className="text-[11px] text-[#94a3b8]">·</span>
        <span
          className={`text-[11px] font-['Inter:Medium',sans-serif] font-medium ${d.isExpired ? "text-[#ef4444]" : "text-[#94a3b8]"}`}
        >
          {d.isExpired ? "Expired" : `Valid until ${d.validUntil}`}
        </span>
      </div>
    </div>
  );
}
// ── SkillRequirementRow ────────────────────────────────────────────────────────
function SkillRequirementRow({ skill, expanded, onToggle }) {
  const gapPct = (skill.currentLevel / skill.maxLevel) * 100;
  const reqPct = (skill.requiredLevel / skill.maxLevel) * 100;
  const colors = skillGapColor(skill.currentLevel, skill.requiredLevel);
  const met = skill.currentLevel >= skill.requiredLevel;
  return (
    <div className={`border-b border-[#f1f3fa] last:border-0 ${expanded ? "bg-[#fafbff]" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-[12px] px-[20px] py-[14px] hover:bg-[#f8f9fd] transition-colors text-left"
      >
        <div className="flex items-center gap-[8px] w-[180px] shrink-0">
          {skill.isCritical && (
            <span className="w-[6px] h-[6px] rounded-full bg-[#ef4444] shrink-0" title="Critical skill" />
          )}
          {!skill.isCritical && <span className="w-[6px] h-[6px] shrink-0" />}
          <span className="font-['Inter:Medium',sans-serif] font-medium text-[13px] text-[#0a0b14] truncate">
            {skill.skillName}
          </span>
        </div>
        <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] w-[80px] shrink-0">
          {skill.category}
        </span>
        <div className="flex-1 flex items-center gap-[8px]">
          <div className="flex-1 bg-[#f1f3fa] rounded-full h-[6px] relative">
            <div
              className="h-[6px] rounded-full bg-[rgba(59,139,255,0.2)] absolute left-0"
              style={{ width: `${reqPct}%` }}
            />
            <div
              className={`h-[6px] rounded-full absolute left-0 transition-all ${colors.bar}`}
              style={{ width: `${gapPct}%` }}
            />
          </div>
          <span className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] w-[36px] text-right shrink-0">
            {skill.currentLevel}/{skill.requiredLevel}
          </span>
        </div>
        <span
          className={`text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold w-[28px] text-right shrink-0 ${colors.text}`}
        >
          {Math.round(skill.importanceWeight * 100)}%
        </span>
        <span
          className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${met ? "bg-[rgba(5,150,105,0.1)]" : "bg-[rgba(239,68,68,0.08)]"}`}
        >
          {met ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 3L7 7M7 3L3 7" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M2 4L6 8L10 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className="px-[20px] pb-[16px] pt-[4px] flex gap-[24px] flex-wrap">
          <div>
            <p className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] mb-[4px]">
              Importance Weight
            </p>
            <p className="text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
              {Math.round(skill.importanceWeight * 100)}% of role score
            </p>
          </div>
          <div>
            <p className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] mb-[4px]">
              Critical Skill
            </p>
            <p
              className={`text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold ${skill.isCritical ? "text-[#ef4444]" : "text-[#64748b]"}`}
            >
              {skill.isCritical ? "Yes — required for role approval" : "No"}
            </p>
          </div>
          {skill.prerequisites.length > 0 && (
            <div>
              <p className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] mb-[4px]">
                Prerequisites
              </p>
              <div className="flex gap-[6px] flex-wrap">
                {skill.prerequisites.map((p) => (
                  <span
                    key={p}
                    className="bg-[rgba(59,139,255,0.08)] text-[#3b8bff] text-[11px] font-['Inter:Medium',sans-serif] font-medium px-[8px] py-[2px] rounded-full"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] mb-[4px]">
              Gap to Close
            </p>
            <p className={`text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold ${colors.text}`}>
              {met
                ? "Met"
                : `${skill.requiredLevel - skill.currentLevel} level${skill.requiredLevel - skill.currentLevel > 1 ? "s" : ""} to go`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
// ── RoleDetailPanel ────────────────────────────────────────────────────────────
function RoleDetailPanel({ role, onBack, onSaveToggle }) {
  const [expandedSkill, setExpandedSkill] = useState(null);
  // Requirements are NOT part of the list payload: they come from
  // `/career-roles/{id}/skills`, joined with the learner's own levels. Before
  // this every detail page showed an empty table and 0/0 counts.
  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role?.id == null) { setFetched(null); return; }
    let alive = true;
    setLoading(true);
    setFetched(null);
    (async () => {
      // The matrix is only needed for "skills met"; a failure there must not
      // hide the requirements themselves, so it degrades to level 0.
      const [skillsResult, matrixResult] = await Promise.allSettled([
        getCareerRoleSkills(role.id),
        getSkillsMatrix(),
      ]);
      if (!alive) return;
      if (skillsResult.status === "fulfilled") {
        const matrix = matrixResult.status === "fulfilled" ? levelsBySkill(matrixResult.value) : new Map();
        setFetched(buildSkillRequirements(skillsResult.value, matrix));
      } else {
        setFetched([]);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [role?.id]);

  // Props win when a caller already supplied them; otherwise the fetched rows.
  const requirements = fetched ?? skillRequirementsOf(role);
  const criticalMet = requirements.filter((s) => s.isCritical && s.currentLevel >= s.requiredLevel).length;
  const criticalTotal = requirements.filter((s) => s.isCritical).length;
  const skillsMet = requirements.filter((s) => s.currentLevel >= s.requiredLevel).length;
  // Readiness is derived from what the learner actually has against the role, so
  // an empty requirement list cannot show a misleading 0%: with nothing to
  // measure against, there is no score to report.
  const readiness = requirements.length === 0
    ? null
    : Math.round((requirements.reduce((sum, s) => {
        const ratio = s.requiredLevel > 0 ? Math.min(1, s.currentLevel / s.requiredLevel) : 1;
        return sum + ratio * (s.importanceWeight || 1);
      }, 0) / requirements.reduce((sum, s) => sum + (s.importanceWeight || 1), 0)) * 100);
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Detail Header */}
      <div className="flex items-center gap-[12px] mb-[24px]">
        <button
          onClick={onBack}
          className="flex items-center gap-[6px] text-[#64748b] hover:text-[#0a0b14] transition-colors text-[13px] font-['Inter:Medium',sans-serif] font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 11L5 7L9 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Roles
        </button>
      </div>

      {/* Role Summary Card */}
      <div className="rounded-[16px] border border-[#e8eaf0] bg-white p-[24px] mb-[16px]">
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex-1">
            <div className="flex items-center gap-[8px] mb-[8px] flex-wrap">
              <span
                className={`text-[11px] font-['Inter:Medium',sans-serif] font-medium px-[8px] py-[3px] rounded-full ${categoryColor(role.category)}`}
              >
                {role.category}
              </span>
              {/* Version Indicator */}
              <span className="flex items-center gap-[4px] bg-[rgba(59,139,255,0.08)] text-[#3b8bff] text-[11px] font-['Inter:Medium',sans-serif] font-medium px-[8px] py-[3px] rounded-full border border-[rgba(59,139,255,0.15)]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="#3b8bff" strokeWidth="1" />
                  <path d="M5 3v2.5l1.5 1" stroke="#3b8bff" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {role.version}
              </span>
              <span className="bg-[rgba(5,150,105,0.08)] text-[#059669] text-[11px] font-['Inter:Medium',sans-serif] font-medium px-[8px] py-[3px] rounded-full">
                ✓ Approved
              </span>
              <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                Effective {role.effectiveDate}
              </span>
            </div>
            <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[22px] text-[#0a0b14] mb-[4px]">
              {role.title}
            </h2>
          </div>
          <button
            onClick={() => onSaveToggle(role.id)}
            className={`flex items-center gap-[6px] px-[14px] py-[8px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold transition-all shrink-0 ${
              role.isSaved
                ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff] border border-[rgba(59,139,255,0.2)]"
                : "bg-[#f1f3fa] text-[#64748b] border border-[#e8eaf0] hover:bg-[rgba(59,139,255,0.06)] hover:text-[#3b8bff]"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill={role.isSaved ? "#3b8bff" : "none"}
              stroke={role.isSaved ? "#3b8bff" : "currentColor"}
              strokeWidth="1.4"
            >
              <path d="M2 2h10v11l-5-3-5 3V2z" strokeLinejoin="round" />
            </svg>
            {role.isSaved ? "Saved" : "Save Role"}
          </button>
        </div>

        {/* Readiness Context */}
        <div className="mt-[20px] grid grid-cols-3 gap-[16px]">
          <div className="col-span-1 flex flex-col items-center justify-center bg-[#f8f9ff] rounded-[12px] p-[20px] border border-[#eef0f8]">
            <div className="relative mb-[8px]">
              <ReadinessGauge score={readiness ?? 0} size={80} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center mt-[4px]">
                  <span
                    data-testid="role-readiness"
                    className="font-['Inter:Bold',sans-serif] font-bold text-[18px]"
                    style={{ color: readiness == null ? "#94a3b8" : readinessColor(readiness) }}
                  >
                    {readiness == null ? "—" : readiness}
                  </span>
                  <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#94a3b8] block">
                    {readiness == null ? "" : "/ 100"}
                  </span>
                </div>
              </div>
            </div>
            <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[12px] text-[#0a0b14] text-center">
              Role Readiness
            </p>
            <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[#94a3b8] text-center mt-[2px]">
              {loading
                ? "Loading skill requirements…"
                : requirements.length === 0
                  ? "No requirements published for this role yet"
                  : "Your level against this role's required skills"}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-[12px]">
            <div className="bg-[#f8f9ff] rounded-[12px] p-[16px] border border-[#eef0f8]">
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[6px]">Skills Met</p>
              <p className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-[#0a0b14]">
                {skillsMet}
                <span className="text-[14px] text-[#64748b] font-['Inter:Regular',sans-serif] font-normal">
                  /{requirements.length}
                </span>
              </p>
            </div>
            <div className="bg-[#f8f9ff] rounded-[12px] p-[16px] border border-[#eef0f8]">
              <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[6px]">
                Critical Skills Met
              </p>
              <p
                className={`font-['Inter:Bold',sans-serif] font-bold text-[20px] ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#ef4444]"}`}
              >
                {criticalMet}
                <span
                  className={`text-[14px] font-['Inter:Regular',sans-serif] font-normal ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#64748b]"}`}
                >
                  /{criticalTotal}
                </span>
              </p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-[6px]">
                <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                  Overall progress toward role readiness
                </p>
                <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
                  {readiness == null ? "—" : `${readiness}%`}
                </p>
              </div>
              <div className="w-full bg-[#f1f3fa] rounded-full h-[8px]">
                <div
                  className="h-[8px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] transition-all"
                  style={{ width: `${readiness ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demand Indicator */}
      <div className="mb-[16px]">
        <DemandIndicator demand={role.demand} />
      </div>

      {/* Skill Requirements */}
      <div className="rounded-[16px] border border-[#e8eaf0] bg-white overflow-hidden mb-[16px]">
        <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#f1f3fa]">
          <div>
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14]">Skill Requirements</h3>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
              <span className="text-[#ef4444]">●</span> Critical skills must be met for role approval
            </p>
          </div>
          <div className="flex items-center gap-[8px] text-[11px] font-['Inter:Medium',sans-serif] text-[#94a3b8]">
            <span className="w-[80px]">Category</span>
            <span className="w-[120px] text-center">Gap / Required</span>
            <span className="w-[28px] text-right">Wt.</span>
          </div>
        </div>
        {requirements.length === 0 ? (
          <p data-testid="requirements-unavailable" className="px-[20px] py-[20px] text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b]">
            {loading
              ? "Loading skill requirements…"
              : "Skill requirements have not been published for this role yet."}
          </p>
        ) : (
          requirements
            .slice()
            .sort((a, b) => b.importanceWeight - a.importanceWeight)
            .map((skill) => (
              <SkillRequirementRow
                key={skill.skillId}
                skill={skill}
                expanded={expandedSkill === skill.skillId}
                onToggle={() => setExpandedSkill(expandedSkill === skill.skillId ? null : skill.skillId)}
              />
            ))
        )}
      </div>
    </div>
  );
}
// ── RoleCard ──────────────────────────────────────────────────────────────────
function RoleCard({ role, onSelect, onSaveToggle }) {
  const demand = demandOf(role);
  const c = demandColor(demand.demandLevel);
  const requirements = skillRequirementsOf(role);
  const criticalTotal = requirements.filter((s) => s.isCritical).length;
  const criticalMet = requirements.filter((s) => s.isCritical && s.currentLevel >= s.requiredLevel).length;
  return (
    <div className="bg-white border border-[#e8eaf0] rounded-[16px] p-[20px] flex flex-col gap-[16px] hover:border-[#c7d2e8] hover:shadow-[0_4px_20px_rgba(59,139,255,0.06)] transition-all group">
      <div className="flex items-start justify-between gap-[8px]">
        <div className="flex-1">
          <div className="flex items-center gap-[6px] mb-[8px] flex-wrap">
            <span
              className={`text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full ${categoryColor(role.category)}`}
            >
              {role.category}
            </span>
            {/* Version indicator */}
            <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full bg-[rgba(100,116,139,0.08)] text-[#64748b] flex items-center gap-[4px]">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#64748b" strokeWidth="1" />
                <path d="M5 3v2.5l1.5 1" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {role.version}
            </span>
          </div>
          <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#0a0b14] leading-[1.3]">
            {role.title}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(role.id);
          }}
          className={`w-[32px] h-[32px] rounded-[8px] flex items-center justify-center transition-all shrink-0 ${role.isSaved ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff]" : "bg-[#f1f3fa] text-[#94a3b8] hover:bg-[rgba(59,139,255,0.08)] hover:text-[#3b8bff]"}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill={role.isSaved ? "#3b8bff" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M2 2h10v11l-5-3-5 3V2z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Readiness bar */}
      <div>
        <div className="flex items-center justify-between mb-[6px]">
          <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Your Readiness</span>
          <span
            className="font-['Inter:Bold',sans-serif] font-bold text-[13px]"
            style={{ color: readinessColor(role.readinessScore) }}
          >
            {role.readinessScore}%
          </span>
        </div>
        <div className="w-full bg-[#f1f3fa] rounded-full h-[6px]">
          <div
            className="h-[6px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] transition-all"
            style={{ width: `${role.readinessScore}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-[12px] pt-[4px] border-t border-[#f1f3fa]">
        <div className="flex-1">
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Skills required</p>
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14]">
            {requirements.length}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Critical skills</p>
          <p
            className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] ${criticalMet === criticalTotal ? "text-[#059669]" : "text-[#ef4444]"}`}
          >
            {criticalMet}/{criticalTotal}
          </p>
        </div>
        <div className={`flex items-center gap-[4px] px-[8px] py-[3px] rounded-full ${c.bg}`}>
          <span className={`w-[5px] h-[5px] rounded-full ${c.dot}`} />
          <span className={`text-[10px] font-['Inter:Medium',sans-serif] font-medium ${c.text}`}>
            {hasDemand(demand) ? demand.demandLevel : "No demand data"}
          </span>
        </div>
      </div>

      <button
        onClick={onSelect}
        className="w-full py-[9px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]"
      >
        View Role Details →
      </button>
    </div>
  );
}
// ── BrowseRoles view ──────────────────────────────────────────────────────────
function BrowseRoles({
  roles, onSelect, onSaveToggle, filter, onFilterChange, search, onSearchChange,
  searching = false, searchError = "", searchActive = false, total = null, page = 1, pageSize = 15, onPageChange,
}) {
  const categories = ["All", ...Array.from(new Set(roles.map((r) => r.category)))];
  // The text term is NOT filtered here any more — the server already did it over
  // the whole catalog. Filtering again in memory was the original bug: it could
  // only ever see the rows that had been fetched.
  const filtered = roles.filter((r) => filter === "All" || r.category === filter);
  const pageCount = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  return (
    <div>
      {/* Search + Filter bar */}
      <div className="flex items-center gap-[12px] mb-[24px] flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#94a3b8]"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search career roles..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-[36px] pr-[14px] py-[9px] bg-white border border-[#e8eaf0] rounded-[10px] text-[13px] font-['Inter:Regular',sans-serif] text-[#0a0b14] placeholder:text-[#94a3b8] outline-none focus:border-[#3b8bff] transition-colors"
          />
        </div>
        <div className="flex items-center gap-[6px] flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              className={`px-[12px] py-[7px] rounded-[8px] text-[12px] font-['Inter:Medium',sans-serif] font-medium transition-all ${
                filter === cat
                  ? "bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white shadow-[0_2px_8px_rgba(59,139,255,0.3)]"
                  : "bg-white border border-[#e8eaf0] text-[#64748b] hover:border-[#c7d2e8]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result count / loading / error, tied to the real query */}
      {(searchActive || searching || searchError) && (
        <p data-testid="search-status" className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] mb-[12px]">
          {searchError
            ? searchError
            : searching
              ? "Searching all career roles…"
              : `${total ?? filtered.length} role${(total ?? filtered.length) === 1 ? "" : "s"} found`}
        </p>
      )}

      {/* Role Cards Grid */}
      {filtered.length === 0 ? (
        // Only reached when the BACKEND returned nothing for this term — the
        // list is no longer pre-filtered in memory, so an empty array really
        // means "no match anywhere in the catalog".
        <div data-testid="career-roles-no-results" className="flex flex-col items-center justify-center py-[56px] text-center">
          <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14] mb-[6px]">
            No career roles match your search
          </h3>
          <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] max-w-[360px]">
            {search.trim()
              ? `Nothing matched “${search.trim()}”. Try a shorter term or check the spelling.`
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-[16px] mb-[32px]">
          {filtered.map((role) => (
            <RoleCard key={role.id} role={role} onSelect={() => onSelect(role.id)} onSaveToggle={onSaveToggle} />
          ))}
        </div>
      )}

      {/* Pagination — server-side, because the list is only one page at a time */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-[8px] mb-[32px]">
          <button
            type="button"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || searching}
            className="px-[12px] py-[7px] rounded-[8px] text-[12px] font-['Inter:Medium',sans-serif] font-medium bg-white border border-[#e8eaf0] text-[#64748b] disabled:opacity-40"
          >
            Previous
          </button>
          <span data-testid="page-indicator" className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b]">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= pageCount || searching}
            className="px-[12px] py-[7px] rounded-[8px] text-[12px] font-['Inter:Medium',sans-serif] font-medium bg-white border border-[#e8eaf0] text-[#64748b] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Suggested Roles Section */}
      <SuggestedRolesSection roles={roles} onSelect={onSelect} onSaveToggle={onSaveToggle} />
    </div>
  );
}
// ── SuggestedRolesSection ─────────────────────────────────────────────────────
function SuggestedRolesSection({ roles, onSelect, onSaveToggle }) {
  const suggested = roles.filter((r) => r.isSuggested);
  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[16px]">
        <div className="flex items-center gap-[8px]">
          <div className="w-[28px] h-[28px] rounded-[8px] bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 5H13L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5H5.5L7 1Z" fill="white" />
            </svg>
          </div>
          <div>
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14]">Suggested for You</h3>
            <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
              Based on your skills, education & interests — you choose, we explain
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {suggested.map((role) => {
          const demand = demandOf(role);
          const c = demandColor(demand.demandLevel);
          return (
            <div
              key={role.id}
              className="bg-white border border-[#e8eaf0] rounded-[14px] p-[16px] flex items-center gap-[16px] hover:border-[rgba(59,139,255,0.3)] hover:bg-[rgba(59,139,255,0.01)] transition-all"
            >
              <div className="w-[40px] h-[40px] rounded-[10px] bg-gradient-to-br from-[#3b8bff] to-[#7c3aed] flex items-center justify-center shrink-0">
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] text-white">
                  {role.title.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[8px] mb-[2px]">
                  <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">
                    {role.title}
                  </span>
                  <span
                    className={`text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[6px] py-[2px] rounded-full ${c.bg} ${c.text}`}
                  >
                    {hasDemand(demand) ? `${demand.demandLevel} Demand` : "No demand data"}
                  </span>
                </div>
                <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#64748b] truncate">
                  {role.suggestionReason}
                </p>
              </div>
              <div className="flex items-center gap-[8px] shrink-0">
                <div className="text-center">
                  <span
                    className="font-['Inter:Bold',sans-serif] font-bold text-[15px]"
                    style={{ color: readinessColor(role.readinessScore) }}
                  >
                    {role.readinessScore}%
                  </span>
                  <p className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">Readiness</p>
                </div>
                <button
                  onClick={() => onSelect(role.id)}
                  className="px-[12px] py-[7px] rounded-[8px] text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]"
                >
                  Explore →
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-[12px] text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] italic">
        Suggestions are generated from your skill matrix, learning history, and interests. They are explanations, not
        decisions — you remain in control of your career path.
      </p>
    </div>
  );
}
// ── SavedRolesView ────────────────────────────────────────────────────────────
function SavedRolesView({ roles, onSelect, onSaveToggle, onCompare }) {
  const saved = roles.filter((r) => r.isSaved);
  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[64px] text-center">
        <div className="w-[56px] h-[56px] rounded-[14px] bg-[rgba(59,139,255,0.08)] flex items-center justify-center mb-[16px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 5h14v16l-7-4-7 4V5z" stroke="#3b8bff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#0a0b14] mb-[6px]">
          No saved roles yet
        </h3>
        <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] max-w-[320px]">
          Browse career roles and save the ones that interest you. Saved roles can be compared side-by-side.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-[20px]">
        <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b]">
          {saved.length} saved role{saved.length !== 1 ? "s" : ""}
        </p>
        {saved.length >= 2 && (
          <button
            onClick={onCompare}
            className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-[10px] bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold shadow-[0_2px_8px_rgba(59,139,255,0.3)] hover:shadow-[0_4px_14px_rgba(59,139,255,0.4)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="5" height="8" rx="1" stroke="white" strokeWidth="1.3" />
              <rect x="8" y="3" width="5" height="8" rx="1" stroke="white" strokeWidth="1.3" />
            </svg>
            Compare Readiness
          </button>
        )}
      </div>
      <div className="flex flex-col gap-[12px]">
        {saved.map((role) => {
          const demand = demandOf(role);
          const c = demandColor(demand.demandLevel);
          const skillsMet = skillRequirementsOf(role).filter((s) => s.currentLevel >= s.requiredLevel).length;
          return (
            <div
              key={role.id}
              className="bg-white border border-[#e8eaf0] rounded-[14px] p-[20px] hover:border-[rgba(59,139,255,0.2)] transition-all"
            >
              <div className="flex items-start gap-[16px]">
                <div className="flex-1">
                  <div className="flex items-center gap-[8px] mb-[6px]">
                    <span
                      className={`text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full ${categoryColor(role.category)}`}
                    >
                      {role.category}
                    </span>
                    <span className="flex items-center gap-[4px] bg-[rgba(59,139,255,0.06)] text-[#3b8bff] text-[10px] font-['Inter:Medium',sans-serif] font-medium px-[7px] py-[2px] rounded-full">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="4" stroke="#3b8bff" strokeWidth="1" />
                        <path d="M5 3v2.5l1.5 1" stroke="#3b8bff" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                      {role.version}
                    </span>
                  </div>
                  <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#0a0b14] mb-[12px]">
                    {role.title}
                  </h3>
                  <div className="flex items-center gap-[24px]">
                    <div>
                      <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[4px]">
                        Readiness Score
                      </p>
                      <div className="flex items-center gap-[8px]">
                        <div className="w-[100px] bg-[#f1f3fa] rounded-full h-[6px]">
                          <div
                            className="h-[6px] rounded-full bg-gradient-to-r from-[#3b8bff] to-[#7c3aed]"
                            style={{ width: `${role.readinessScore}%` }}
                          />
                        </div>
                        <span
                          className="font-['Inter:Bold',sans-serif] font-bold text-[14px]"
                          style={{ color: readinessColor(role.readinessScore) }}
                        >
                          {role.readinessScore}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[4px]">
                        Skills Met
                      </p>
                      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] text-[#0a0b14]">
                        {skillsMet}/{skillRequirementsOf(role).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mb-[4px]">
                        Market Demand
                      </p>
                      <div className={`flex items-center gap-[4px] px-[8px] py-[2px] rounded-full ${c.bg}`}>
                        <span className={`w-[5px] h-[5px] rounded-full ${c.dot}`} />
                        <span className={`text-[11px] font-['Inter:Medium',sans-serif] font-medium ${c.text}`}>
                          {hasDemand(demand) ? demand.demandLevel : "No data"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-[8px] shrink-0">
                  <button
                    onClick={() => onSelect(role.id)}
                    className="px-[14px] py-[8px] rounded-[10px] text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#3b8bff] bg-[rgba(59,139,255,0.06)] hover:bg-[rgba(59,139,255,0.12)] transition-colors border border-[rgba(59,139,255,0.15)]"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onSaveToggle(role.id)}
                    className="px-[14px] py-[8px] rounded-[10px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8] bg-[#f8f9fd] hover:bg-[rgba(239,68,68,0.06)] hover:text-[#ef4444] transition-colors border border-[#e8eaf0]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ── CompareView ────────────────────────────────────────────────────────────────
function CompareView({ roles, onSelect }) {
  const saved = roles.filter((r) => r.isSaved);
  const [selected, setSelected] = useState(saved.slice(0, 2).map((r) => r.id));
  const compareRoles = roles.filter((r) => selected.includes(r.id));
  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev));
  }
  const allSkillNames = Array.from(new Set(compareRoles.flatMap((r) => skillRequirementsOf(r).map((s) => s.skillName))));
  return (
    <div>
      {/* Role selector */}
      <div className="mb-[20px]">
        <p className="text-[12px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b] mb-[10px]">
          Select up to 3 saved roles to compare
        </p>
        <div className="flex gap-[8px] flex-wrap">
          {saved.map((role) => (
            <button
              key={role.id}
              onClick={() => toggleSelect(role.id)}
              className={`flex items-center gap-[6px] px-[12px] py-[7px] rounded-[8px] text-[12px] font-['Inter:Medium',sans-serif] font-medium transition-all border ${
                selected.includes(role.id)
                  ? "bg-gradient-to-r from-[#3b8bff] to-[#7c3aed] text-white border-transparent shadow-[0_2px_8px_rgba(59,139,255,0.3)]"
                  : "bg-white border-[#e8eaf0] text-[#64748b] hover:border-[#c7d2e8]"
              }`}
            >
              {selected.includes(role.id) && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {role.title}
            </button>
          ))}
        </div>
      </div>

      {compareRoles.length < 2 ? (
        <div className="flex items-center justify-center py-[48px] text-center bg-white border border-[#e8eaf0] rounded-[16px]">
          <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
            Select at least 2 roles above to compare readiness scores.
          </p>
        </div>
      ) : (
        <>
          {/* Readiness comparison header */}
          <div className="bg-white border border-[#e8eaf0] rounded-[16px] p-[24px] mb-[16px]">
            <div className="flex items-center gap-[6px] mb-[20px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#94a3b8]" />
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[15px] text-[#0a0b14]">
                Readiness Comparison
              </h3>
              <span className="text-[11px] font-['Inter:Regular',sans-serif] text-[#94a3b8] ml-[4px]">
                Same evidence snapshot —{" "}
                {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className={`grid gap-[16px]`} style={{ gridTemplateColumns: `repeat(${compareRoles.length}, 1fr)` }}>
              {compareRoles.map((role, i) => {
                const colors = [
                  "from-[#3b8bff] to-[#7c3aed]",
                  "from-[#059669] to-[#10b981]",
                  "from-[#f59e0b] to-[#ef4444]",
                ];
                const textColors = ["text-[#3b8bff]", "text-[#059669]", "text-[#f59e0b]"];
                return (
                  <div
                    key={role.id}
                    className="flex flex-col items-center p-[16px] bg-[#f8f9ff] rounded-[12px] border border-[#eef0f8]"
                  >
                    <div className="relative mb-[8px]">
                      <ReadinessGauge score={role.readinessScore} size={72} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className={`font-['Inter:Bold',sans-serif] font-bold text-[16px] mt-[6px] ${textColors[i]}`}
                        >
                          {role.readinessScore}%
                        </span>
                      </div>
                    </div>
                    <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] text-[#0a0b14] text-center mb-[4px]">
                      {role.title}
                    </p>
                    <div className="flex items-center gap-[6px]">
                      <span className="text-[10px] font-['Inter:Regular',sans-serif] text-[#94a3b8]">
                        {role.version}
                      </span>
                      <span className="w-[3px] h-[3px] rounded-full bg-[#d1d5db]" />
                      <span
                        className={`text-[10px] font-['Inter:Medium',sans-serif] font-medium ${categoryColor(role.category).split(" ")[1]}`}
                      >
                        {role.category}
                      </span>
                    </div>
                    <div className="mt-[12px] w-full">
                      <div
                        className={`w-full bg-gradient-to-r ${colors[i]} h-[4px] rounded-full`}
                        style={{ width: `${role.readinessScore}%` }}
                      />
                      <div className="w-full bg-[#e8eaf0] h-[4px] rounded-full mt-[2px]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill gap comparison table */}
          <div className="bg-white border border-[#e8eaf0] rounded-[16px] overflow-hidden">
            <div className="px-[20px] py-[16px] border-b border-[#f1f3fa]">
              <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[14px] text-[#0a0b14]">
                Skill Gap Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f1f3fa]">
                    <th className="text-left px-[20px] py-[12px] text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8]">
                      Skill
                    </th>
                    {compareRoles.map((role) => (
                      <th
                        key={role.id}
                        className="text-center px-[16px] py-[12px] text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#94a3b8]"
                      >
                        {role.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSkillNames.slice(0, 8).map((skillName) => (
                    <tr key={skillName} className="border-b border-[#f1f3fa] last:border-0 hover:bg-[#fafbff]">
                      <td className="px-[20px] py-[11px] text-[13px] font-['Inter:Medium',sans-serif] font-medium text-[#0a0b14]">
                        {skillName}
                      </td>
                      {compareRoles.map((role) => {
                        const skill = skillRequirementsOf(role).find((s) => s.skillName === skillName);
                        if (!skill)
                          return (
                            <td key={role.id} className="px-[16px] py-[11px] text-center text-[#d1d5db]">
                              <span className="text-[11px]">—</span>
                            </td>
                          );
                        const colors = skillGapColor(skill.currentLevel, skill.requiredLevel);
                        const met = skill.currentLevel >= skill.requiredLevel;
                        return (
                          <td key={role.id} className="px-[16px] py-[11px] text-center">
                            <div className="flex flex-col items-center gap-[4px]">
                              <span
                                className={`text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold ${colors.text}`}
                              >
                                {skill.currentLevel}/{skill.requiredLevel}
                              </span>
                              <div className="w-[48px] bg-[#f1f3fa] rounded-full h-[4px]">
                                <div
                                  className={`h-[4px] rounded-full ${colors.bar}`}
                                  style={{
                                    width: `${(skill.currentLevel / skill.requiredLevel) * 100}%`,
                                    maxWidth: "100%",
                                  }}
                                />
                              </div>
                              {skill.isCritical && (
                                <span className="text-[9px] font-['Inter:Medium',sans-serif] text-[#ef4444]">
                                  Critical
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default function CareerRolesView({ initialRoles = null, onRoleSave, onSearch, searchDebounceMs = 300, pageSize = 15 }) {
  // One mapping, used by the initial props and by every server result. It was
  // duplicated inline (two identical 700-character expressions) which is how the
  // two copies drifted apart.
  const normalizeRole = (role) => ({
    ...role,
    id: role.id ?? role.uuid,
    title: role.title ?? role.name ?? role.role_title ?? "Untitled role",
    category: role.category ?? role.industry ?? "Other",
    readinessScore: Number(role.readinessScore ?? role.readiness_score ?? 0),
    description: role.description ?? role.summary ?? "",
    skills: role.skills ?? role.required_skills ?? [],
    isSaved: Boolean(role.isSaved ?? role.is_saved),
    demand: role.demand ?? null,
    version: role.version ?? role.role_version ?? null,
  });

  const [roles, setRoles] = useState(() => (initialRoles ?? []).map(normalizeRole));
  useEffect(() => { setRoles((initialRoles ?? []).map(normalizeRole)); }, [initialRoles]);
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  // Which page the list currently shows, and how many results the last query
  // matched across the WHOLE catalog (not just the page on screen).
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedRoleSnapshot, setSelectedRoleSnapshot] = useState(null);
  // What the tabs render: server results once a search has run, otherwise the
  // list the workspace loaded on mount. Defined up here because selectRole
  // needs it to resolve the row that was clicked.
  const visibleRoles = searchResults ?? roles;
  const savedCount = roles.filter((r) => r.isSaved).length;
  function toggleSave(id) {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, isSaved: !r.isSaved } : r)));
    const next = roles.find((r) => r.id === id);
    if (onRoleSave && next) onRoleSave(id, !next.isSaved);
  }
  function selectRole(id) {
    setSelectedRoleId(id);
    // Keep what was clicked, so the panel survives a later search that no
    // longer contains this row.
    const found = visibleRoles.find((r) => r.id === id) ?? roles.find((r) => r.id === id) ?? null;
    setSelectedRoleSnapshot(found);
  }
  const tabs = [
    { key: "browse", label: "Browse Roles" },
    { key: "saved", label: "Saved Roles", count: savedCount },
    { key: "compare", label: "Compare Readiness" },
  ];

  /*
   * Search runs on the SERVER.
   *
   * It used to filter `roles` in memory, which only ever held the first page
   * (15 rows, `?page=1&per_page=15`), so a role on page 2 or 3 could not be
   * found no matter what was typed — and typing sent no request at all. The
   * filter now goes to the API, before pagination, so it covers every role.
   *
   * When `onSearch` is supplied the owner does the fetching instead (keeps one
   * source of truth); otherwise this component fetches for itself.
   */
  const fetchRoles = onSearch ?? (async (term, nextPage) => {
    const payload = await getCareerRoles({ page: nextPage, perPage: pageSize, search: term });
    return payload;
  });
  const firstRun = useRef(true);
  const requestSeq = useRef(0);

  useEffect(() => {
    const term = search.trim();
    // Nothing to do until the user actually searches: keep showing the list the
    // workspace already loaded instead of refetching the same page.
    if (firstRun.current && term === "") { firstRun.current = false; return; }
    firstRun.current = false;

    const seq = ++requestSeq.current;
    setSearching(true);
    setSearchError("");

    const timer = setTimeout(async () => {
      try {
        const payload = await fetchRoles(term, page);
        // A slower earlier response must not overwrite a newer one.
        if (seq !== requestSeq.current) return;
        const rows = unwrapApiData(payload);
        const list = Array.isArray(rows) ? rows : rows?.data ?? [];
        setSearchResults(list.map(normalizeRole));
        setTotal(Number(rows?.total ?? list.length));
      } catch {
        if (seq !== requestSeq.current) return;
        // Leave the previous results on screen; a failed search is not an empty result.
        setSearchError("Search could not be completed. Please try again.");
      } finally {
        if (seq === requestSeq.current) setSearching(false);
      }
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [search, page]);

  // Changing the term starts over at page 1 — otherwise page 3 of the old query
  // would silently apply to the new one.
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  // What the tabs below render: server results once a search has run, otherwise
  // the list the workspace loaded on mount.
  /*
   * Look the selection up in what is ON SCREEN, not just in the page the
   * workspace loaded on mount.
   *
   * This used to search `roles` (the first 15). A role found by SEARCH can live
   * on page 2 and therefore is not in `roles`, so clicking "View Role Details"
   * ran setSelectedRoleId, found nothing, and looked completely dead — no
   * panel, no URL change, no request, no error. That silent no-op is exactly
   * what was reported.
   *
   * `selectedRoleSnapshot` covers the last case: if a new search drops the
   * selected role from the results while its detail is open, the panel would
   * otherwise vanish mid-read.
   */
  const selectedRole =
    visibleRoles.find((r) => r.id === selectedRoleId) ??
    roles.find((r) => r.id === selectedRoleId) ??
    selectedRoleSnapshot;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="px-[32px] pt-[28px] pb-[20px] shrink-0">
        <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[28px] text-[#0a0b14] leading-[1.2]">
          Career Roles
        </h1>
        <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[#64748b] mt-[4px]">
          Explore roles, understand requirements, and track your readiness.
        </p>

        {/* Tabs */}
        {!selectedRole && (
          <div className="flex items-center gap-[4px] mt-[20px] bg-[#f1f3fa] p-[4px] rounded-[10px] w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-[6px] px-[14px] py-[7px] rounded-[8px] text-[13px] font-['Inter:Medium',sans-serif] font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-[#0a0b14] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    : "text-[#64748b] hover:text-[#0a0b14]"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-['Inter:Bold',sans-serif] font-bold px-[4px] ${activeTab === tab.key ? "bg-[rgba(59,139,255,0.1)] text-[#3b8bff]" : "bg-[#e2e5ef] text-[#64748b]"}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[32px] pb-[32px]">
        {roles.length === 0 ? (
          // Previously this rendered nothing at all: the header and tabs stayed
          // up over a blank panel. A missing roles list is a "nothing to show
          // yet" state, not an error — say so instead of leaving the page empty.
          <div data-testid="career-roles-empty" className="flex flex-col items-center justify-center py-[64px] text-center">
            <div className="w-[56px] h-[56px] rounded-[14px] bg-[rgba(59,139,255,0.08)] flex items-center justify-center mb-[16px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="2" stroke="#3b8bff" strokeWidth="1.5" />
                <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="#3b8bff" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[16px] text-[#0a0b14] mb-[6px]">
              No career roles to show yet
            </h3>
            <p className="text-[13px] font-['Inter:Regular',sans-serif] text-[#64748b] max-w-[360px]">
              Career roles will appear here once they are published. Your readiness and skill
              evidence are not affected.
            </p>
          </div>
        ) : selectedRole ? (
          <RoleDetailPanel role={selectedRole} onBack={() => setSelectedRoleId(null)} onSaveToggle={toggleSave} />
        ) : activeTab === "browse" ? (
          <BrowseRoles
            roles={visibleRoles}
            onSelect={selectRole}
            onSaveToggle={toggleSave}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={handleSearchChange}
            searching={searching}
            searchError={searchError}
            searchActive={searchResults !== null}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        ) : activeTab === "saved" ? (
          <SavedRolesView
            roles={roles}
            onSelect={(id) => {
              selectRole(id);
            }}
            onSaveToggle={toggleSave}
            onCompare={() => setActiveTab("compare")}
          />
        ) : (
          <CompareView roles={roles} onSelect={selectRole} />
        )}
      </div>
    </div>
  );
}
