import { useState } from "react";
import { useUiText } from "../../i18n/useUiText";
// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════
const BAND = {
  "Not Started": {
    text: "text-[#98a1ba]",
    bg: "bg-[rgba(148,163,184,0.08)]",
    border: "border-[rgba(148,163,184,0.2)]",
    stop0: "#98a1ba",
    stop1: "#6b7593",
  },
  Developing: {
    text: "text-[#d13b3b]",
    bg: "bg-[rgba(209,59,59,0.08)]",
    border: "border-[rgba(209,59,59,0.2)]",
    stop0: "#d13b3b",
    stop1: "#f97316",
  },
  Progressing: {
    text: "text-[#f59e0b]",
    bg: "bg-[rgba(245,158,11,0.08)]",
    border: "border-[rgba(245,158,11,0.2)]",
    stop0: "#f59e0b",
    stop1: "#fbbf24",
  },
  Advanced: {
    text: "text-[#1667e0]",
    bg: "bg-[rgba(22,103,224,0.08)]",
    border: "border-[rgba(22,103,224,0.2)]",
    stop0: "#1667e0",
    stop1: "#5b5bd6",
  },
  Ready: {
    text: "text-[#15925a]",
    bg: "bg-[rgba(21,146,90,0.08)]",
    border: "border-[rgba(21,146,90,0.2)]",
    stop0: "#15925a",
    stop1: "#10b981",
  },
};
const ST = {
  "Not Started": { bg: "bg-[rgba(100,116,139,0.08)]", text: "text-[#6b7593]", dot: "bg-[#98a1ba]" },
  "In Progress": { bg: "bg-[rgba(22,103,224,0.10)]", text: "text-[#1667e0]", dot: "bg-[#1667e0]" },
  Blocked: { bg: "bg-[rgba(209,59,59,0.10)]", text: "text-[#d13b3b]", dot: "bg-[#d13b3b]" },
  Completed: { bg: "bg-[rgba(21,146,90,0.10)]", text: "text-[#15925a]", dot: "bg-[#15925a]" },
  Skipped: { bg: "bg-[rgba(100,116,139,0.06)]", text: "text-[#98a1ba]", dot: "bg-[#d1d5db]" },
};
const MS = {
  Achieved: {
    bg: "bg-[rgba(21,146,90,0.06)]",
    border: "border-[rgba(21,146,90,0.25)]",
    text: "text-[#15925a]",
    ring: "#15925a",
    badgeBg: "rgba(21,146,90,0.12)",
  },
  "In Progress": {
    bg: "bg-[rgba(22,103,224,0.06)]",
    border: "border-[rgba(22,103,224,0.25)]",
    text: "text-[#1667e0]",
    ring: "#1667e0",
    badgeBg: "rgba(22,103,224,0.12)",
  },
  Locked: {
    bg: "bg-[rgba(148,163,184,0.04)]",
    border: "border-[rgba(148,163,184,0.18)]",
    text: "text-[#98a1ba]",
    ring: "#98a1ba",
    badgeBg: "rgba(148,163,184,0.08)",
  },
};
const PT = {
  1: {
    accent: "#6b7593",
    bg: "rgba(100,116,139,0.06)",
    border: "rgba(100,116,139,0.2)",
    text: "text-[#6b7593]",
    track: "#e2e5ef",
  },
  2: {
    accent: "#1667e0",
    bg: "rgba(22,103,224,0.06)",
    border: "rgba(22,103,224,0.18)",
    text: "text-[#1667e0]",
    track: "#dbeafe",
  },
  3: {
    accent: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    text: "text-[#f59e0b]",
    track: "#fef3c7",
  },
  4: {
    accent: "#15925a",
    bg: "rgba(21,146,90,0.06)",
    border: "rgba(21,146,90,0.18)",
    text: "text-[#15925a]",
    track: "#d1fae5",
  },
};
const TM = {
  Assessment: { emoji: "📝", label: "Assessment" },
  "Learning Resource": { emoji: "📚", label: "Learning Resource" },
  "Practice Task": { emoji: "🔧", label: "Practice Task" },
  "Simulation Project": { emoji: "🧪", label: "Simulation" },
  "Real Project": { emoji: "🚀", label: "Real Project" },
};
const CT = {
  High: { text: "text-[#15925a]", dot: "bg-[#15925a]", bar: "#15925a" },
  Medium: { text: "text-[#f59e0b]", dot: "bg-[#f59e0b]", bar: "#f59e0b" },
  Low: { text: "text-[#d13b3b]", dot: "bg-[#d13b3b]", bar: "#d13b3b" },
  "Self-Assessment Only": { text: "text-[#98a1ba]", dot: "bg-[#d1d5db]", bar: "#d1d5db" },
};
// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Sk({ w = "100%", h = 14, r = 8, className = "" }) {
  return <div className={`shimmer ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}
function Bar({ pct, color, h = 5 }) {
  return (
    <div className="w-full rounded-full bg-[#f0f6fc] overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  );
}
function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#1667e0" strokeWidth="1.2" />
      <path d="M6.5 5.5v3.5" stroke="#1667e0" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6.5" cy="4" r=".6" fill="#1667e0" />
    </svg>
  );
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
  return (
    <svg width={size} height={size} viewBox="0 0 180 180">
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke="#eef0f8"
        strokeWidth="12"
        strokeDasharray={`${arc} ${C - arc}`}
        strokeLinecap="round"
        transform="rotate(135 90 90)"
      />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={bt.stop1}
        strokeWidth="12"
        strokeDasharray={`${filled} ${C - filled}`}
        strokeLinecap="round"
        transform="rotate(135 90 90)"
      />
      <defs>
        <linearGradient id={id} x1="30" y1="90" x2="150" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor={bt.stop0} />
          <stop offset="1" stopColor={bt.stop1} />
        </linearGradient>
      </defs>
      <text
        x="90"
        y="82"
        textAnchor="middle"
        fontFamily="Inter,sans-serif"
        fontWeight="700"
        fontSize="38"
        fill="#05103d"
      >
        {score}
      </text>
      <text
        x="90"
        y="102"
        textAnchor="middle"
        fontFamily="Inter,sans-serif"
        fontWeight="400"
        fontSize="13"
        fill="#98a1ba"
      >
        / 100
      </text>
    </svg>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// NBA BANNER
// ═══════════════════════════════════════════════════════════════════════════════
function NBABanner({ action }) {
  const { L } = useUiText();
  // `phase_name` is what normaliseRoadmapActions() produces; `phaseName` was the
  // mock-model spelling this banner was originally written against. Accept both
  // so the banner cannot render "Phase 1 · undefined" against a real payload.
  const phaseName = action.phase_name ?? action.phaseName ?? `Phase ${action.phase}`;
  const typeMeta = TM[action.type] ?? { label: action.type ?? "Action" };
  return (
    <div
      className="relative overflow-hidden rounded-[16px] mb-[20px]"
      style={{ background: "#060d2e" }}
    >
      <div
        className="absolute -top-12 -right-8 w-56 h-56 rounded-full pointer-events-none opacity-15"
        style={{ background: "transparent" }}
      />
      <div
        className="absolute -bottom-8 left-16 w-40 h-40 rounded-full pointer-events-none opacity-10"
        style={{ background: "transparent" }}
      />
      <div className="relative px-[26px] py-[22px]">
        {/* Header */}
        <div className="flex items-center gap-[8px] mb-[10px]">
          <div className="flex items-center gap-[5px] bg-[rgba(22,103,224,0.2)] border border-[rgba(22,103,224,0.3)] px-[10px] py-[4px] rounded-full">
            <span className="text-[11px] font-semibold text-[#7ca8ff]">
              {L("Next Best Action")}
            </span>
          </div>
          <span className="text-[11px] font-normal text-[rgba(255,255,255,0.35)]">
            {L("Phase {n}", { n: action.phase })} · {L(phaseName)} · {L(typeMeta.label)}
          </span>
          {action.isCritical && (
            <span className="text-[11px] font-medium text-[#d13b3b] bg-[rgba(209,59,59,0.2)] px-[8px] py-[2px] rounded-full">
              {L("Critical Skill")}
            </span>
          )}
        </div>
        <div className="grid gap-[20px]" style={{ gridTemplateColumns: "1fr 172px" }}>
          <div>
            <h3 className="font-bold text-[20px] text-white mb-[6px] leading-tight">
              {action.objective}
            </h3>
            <p className="text-[13px] font-normal text-[rgba(255,255,255,0.5)] leading-[1.65] max-w-[520px] mb-[16px]">
              {action.explanation}
            </p>
            <div className="flex gap-[10px] flex-wrap">
              <div className="flex-1 min-w-[180px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-[14px] py-[10px]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-[5px]">
                  {L("Why this is next")}
                </p>
                <p className="text-[12px] font-normal text-[rgba(255,255,255,0.65)]">
                  {[
                    action.priorityScore != null
                      ? L("Priority {n}", { n: Number(action.priorityScore).toFixed(1) })
                      : null,
                    (action.prerequisites ?? []).length > 0
                      ? L(action.prerequisites.length > 1 ? "{n} prerequisites" : "{n} prerequisite", { n: action.prerequisites.length })
                      : L("No prerequisites"),
                    L(action.status),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {action.unlocksWhat ? (
                <div className="flex-1 min-w-[180px] bg-[rgba(22,103,224,0.1)] border border-[rgba(22,103,224,0.2)] rounded-[10px] px-[14px] py-[10px]">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[rgba(124,168,255,0.5)] mb-[5px]">
                    {L("Completing this unlocks")}
                  </p>
                  <p className="text-[12px] font-normal text-[#7ca8ff]">{action.unlocksWhat}</p>
                </div>
              ) : null}
            </div>
          </div>
          {/* CTA */}
          <div className="flex flex-col gap-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-[16px] items-center text-center shrink-0">
            <div
              className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[20px]"
              style={{ background: "rgba(22,103,224,0.15)" }}
            >
              {typeMeta.emoji}
            </div>
            <div>
              <p className="text-[11px] font-normal text-[rgba(255,255,255,0.3)] mb-[2px]">
                {L("Effort")}
              </p>
              <p className="font-semibold text-[12px] text-white">
                {action.estimatedEffort}
              </p>
            </div>
            <div className="w-full h-px bg-[rgba(255,255,255,0.06)]" />
            <div>
              <p className="text-[11px] font-normal text-[rgba(255,255,255,0.3)] mb-[2px]">
                {L("Timeline")}
              </p>
              <p className="font-semibold text-[12px] text-white">
                {action.estimatedDuration}
              </p>
            </div>
            <button
              className="w-full mt-[2px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white transition-all"
              style={{ background: "#1667e0" }}
            >
              {L("Start Now")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// READINESS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ReadinessTab({ data }) {
  const { L } = useUiText();
  const [showHow, setShowHow] = useState(false);
  const bt = BAND[data.band];
  const BANDS = ["Not Started", "Developing", "Progressing", "Advanced", "Ready"];
  const bandIdx = BANDS.indexOf(data.band);
  return (
    <div className="flex flex-col gap-[16px]">
      {/* ── Critical warning ── */}
      {data.warning && (
        <div className="flex gap-[14px] items-start bg-[#fff5f5] border border-[rgba(209,59,59,0.3)] rounded-[12px] px-[18px] py-[14px]">
          <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(209,59,59,0.12)] flex items-center justify-center shrink-0">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 2L15.5 14H1.5L8.5 2Z" stroke="#d13b3b" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8.5 7.5V10" stroke="#d13b3b" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8.5" cy="12" r=".7" fill="#d13b3b" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
              <span className="font-semibold text-[13px] text-[#d13b3b]">
                {L("Critical Skill Deficiency")}, {data.warning.skillName}
              </span>
              <span className="bg-[rgba(209,59,59,0.1)] text-[#d13b3b] text-[11px] font-bold px-[8px] py-[2px] rounded-full border border-[rgba(209,59,59,0.2)]">
                {L("Readiness cap:")} <bdi dir="ltr">{data.warning.capApplied}</bdi>
              </span>
            </div>
            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.6]">
              {L(data.warning.explanation)}
            </p>
            {data.warning.currentLevel != null && data.warning.requiredLevel != null ? (
              <div className="flex gap-[14px] mt-[8px] text-[11px] font-normal text-[#98a1ba]">
                <span>
                  {L("Current:")}{" "}
                  <strong className="text-[#d13b3b] font-semibold">
                    <bdi dir="ltr">L{data.warning.currentLevel}</bdi>
                  </strong>
                </span>
                <span>
                  {L("Required:")}{" "}
                  <strong className="text-[#05103d] font-semibold">
                    <bdi dir="ltr">L{data.warning.requiredLevel}</bdi>
                  </strong>
                </span>
                <span>
                  {L("Gap:")}{" "}
                  <strong className="text-[#d13b3b] font-semibold">
                    <bdi dir="ltr">−{Number(data.warning.requiredLevel) - Number(data.warning.currentLevel)}</bdi>
                  </strong>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Score hero ── */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "230px 1fr" }}>
          {/* Gauge side */}
          <div
            className="flex flex-col items-center justify-center gap-[10px] border-e border-[#f0f6fc] px-[22px] py-[26px]"
            style={{ backgroundImage: `transparent` }}
          >
            <Gauge score={data.score} band={data.band} size={162} />
            <div className={`flex items-center gap-[6px] px-[14px] py-[5px] rounded-full border ${bt.bg} ${bt.border}`}>
              <span className="w-[7px] h-[7px] rounded-full" style={{ background: bt.stop0 }} />
              <span className={`font-semibold text-[12px] ${bt.text}`}>
                {L(data.band)}
              </span>
            </div>
          </div>

          {/* Detail side */}
          <div className="flex flex-col px-[24px] py-[22px] gap-[18px]">
            {/* Role + explanation */}
            <div>
              <div className="flex items-center gap-[8px] mb-[6px]">
                <span className="font-bold text-[16px] text-[#05103d]">
                  {data.roleTitle}
                </span>
                <span className="text-[11px] font-medium text-[#98a1ba] bg-[#f0f6fc] px-[8px] py-[2px] rounded-full">
                  {data.roleVersion}
                </span>
              </div>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.65]">
                {data.explanation}
              </p>
            </div>

            {/* Band scale */}
            <div>
              <p className="text-[11px] font-medium text-[#98a1ba] uppercase tracking-wide mb-[8px]">
                {L("Your position in the readiness scale")}
              </p>
              <div className="flex items-center gap-[4px]">
                {BANDS.map((b, i) => {
                  const bt2 = BAND[b];
                  const isActive = b === data.band;
                  const isPast = i < bandIdx;
                  return (
                    <div key={b} className="flex-1 flex flex-col gap-[4px]">
                      <div
                        className="h-[4px] rounded-full"
                        style={{ background: isActive || isPast ? bt2.stop0 : "#f0f6fc" }}
                      />
                      <span
                        className={`text-[11px] font-medium text-center truncate ${isActive ? bt2.text : "text-[#d1d5db]"}`}
                      >
                        {L(b) !== b ? L(b) : b.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score composition */}
            <div>
              <div className="flex items-center justify-between mb-[6px]">
                <p className="text-[11px] font-medium text-[#98a1ba] uppercase tracking-wide">
                  {L("Score composition")}
                </p>
                <span className="text-[12px] font-bold text-[#05103d]">
                  {L("{n} pts total", { n: data.score })}
                </span>
              </div>
              <div className="flex h-[9px] rounded-full overflow-hidden gap-[2px]">
                {data.components.map((c) => (
                  <div
                    key={c.key}
                    title={`${L(c.label)}: +${c.contribution.toFixed(1)} ${L("pts")}`}
                    className="h-full rounded-full"
                    style={{ width: `${(c.contribution / data.score) * 100}%`, background: c.color }}
                  />
                ))}
              </div>
              <div className="flex gap-[12px] mt-[6px] flex-wrap">
                {data.components.map((c) => (
                  <div key={c.key} className="flex items-center gap-[4px]">
                    <span className="w-[6px] h-[6px] rounded-full" style={{ background: c.color }} />
                    <span className="text-[11px] font-normal text-[#98a1ba]">
                      {c.abbr} +{c.contribution.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Component breakdown cards ── */}
      <div className="grid grid-cols-2 gap-[12px]">
        {data.components.map((c) => (
          <div
            key={c.key}
            className="bg-white border border-[#e4ebf5] rounded-[16px] p-[18px] flex flex-col gap-[10px] hover:border-[#c7d2e8] transition-colors"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-[8px]">
              <div className="flex items-center gap-[8px]">
                <div>
                  <p className="font-semibold text-[13px] text-[#05103d] leading-tight">
                    {L(c.label)}
                  </p>
                  <p className="text-[11px] font-normal text-[#98a1ba]">
                    {L("Weight:")} <bdi dir="ltr">{Math.round(c.weight * 100)}%</bdi> {L("of score")}
                  </p>
                </div>
              </div>
              <div className="text-end shrink-0">
                <span
                  className="font-bold text-[24px] leading-none"
                  style={{ color: c.color }}
                >
                  {c.score}
                </span>
                <span className="text-[11px] font-normal text-[#98a1ba]">%</span>
              </div>
            </div>
            {/* Score bar */}
            <Bar pct={c.score} color={c.color} h={7} />
            {/* Contribution */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-normal text-[#98a1ba]">
                {L("Contribution to final score")}
              </span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: c.color }}
              >
                <bdi dir="ltr">+{c.contribution.toFixed(1)}</bdi> {L("pts")}
              </span>
            </div>
            {/* Divider + explanation */}
            <div className="border-t border-[#f7fafe] pt-[8px]">
              <p className="text-[11px] font-normal text-[#6b7593] leading-[1.55]">
                {c.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Meta + explainer toggle ── */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="flex items-center gap-[8px] flex-wrap text-[11px] font-normal text-[#98a1ba]">
          <span>
            {L("Calculated")}{" "}
            <bdi dir="ltr">{new Date(data.calculatedAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</bdi>
          </span>
          <span className="opacity-40">·</span>
          <span>{L("Algo")} <bdi dir="ltr">{data.algorithmVersion}</bdi></span>
          <span className="opacity-40">·</span>
          <span>{L("Config")} <bdi dir="ltr">{data.configVersion}</bdi></span>
          <span className="opacity-40">·</span>
          <span>{data.decisionVersion}</span>
        </div>
        <button
          onClick={() => setShowHow(!showHow)}
          className="ms-auto text-[11px] font-medium text-[#1667e0] hover:underline whitespace-nowrap"
        >
          {showHow ? "Hide explanation" : "How is this calculated?"}
        </button>
      </div>

      {showHow && (
        <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] p-[18px]">
          <p className="font-semibold text-[13px] text-[#05103d] mb-[10px]">
            {L("Readiness formula")}
          </p>
          <p className="text-[12px] font-normal text-[#6b7593] leading-[1.7] mb-[12px]">
            <strong className="font-semibold text-[#05103d]">{L("Score = ")}</strong>
            {L("(Skill Match × 65%) + (Practical Experience × 20%) + (Assessment Reliability × 10%) + (Profile Completeness × 5%)")}
          </p>
          <div className="grid grid-cols-2 gap-[8px]">
            {data.components.map((c) => (
              <div
                key={c.key}
                className="flex items-center gap-[8px] bg-white border border-[#e4ebf5] rounded-[8px] px-[10px] py-[8px]"
              >
                <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-[11px] font-normal text-[#6b7593] flex-1">{L(c.label)}</span>
                <span className="text-[11px] font-normal text-[#6b7593]">
                  {c.score}% × {Math.round(c.weight * 100)}% ={" "}
                  <strong className="font-semibold" style={{ color: c.color }}>
                    +{c.contribution.toFixed(1)}
                  </strong>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-normal text-[#98a1ba] mt-[10px] italic leading-[1.6]">
            {L("Critical skill deficiencies apply a configured cap. Weights and thresholds are versioned, every result is reproducible and auditable.")}
          </p>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// SKILL GAP TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SkillGapTab({ gaps }) {
  const { L, skillLabel } = useUiText();
  const [expanded, setExpanded] = useState(null);
  // Weights can all be zero on a role whose skills carry no importance yet —
  // dividing by that total would render "NaN%".
  const weightTotal = gaps.reduce((a, g) => a + g.importance, 0);
  const wtMatch = weightTotal > 0
    ? gaps.reduce((a, g) => a + g.match * g.importance, 0) / weightTotal
    : gaps.reduce((a, g) => a + g.match, 0) / Math.max(gaps.length, 1);
  const buckets = [
    {
      key: "priority-gap",
      label: "Priority Gaps",
      dot: "bg-[#d13b3b]",
      col: "text-[#d13b3b]",
      bg: "bg-[rgba(209,59,59,0.04)]",
      border: "border-[rgba(209,59,59,0.12)]",
      items: gaps.filter((g) => g.bucket === "priority-gap"),
    },
    {
      key: "developing",
      label: "Developing",
      dot: "bg-[#f59e0b]",
      col: "text-[#f59e0b]",
      bg: "bg-[rgba(245,158,11,0.04)]",
      border: "border-[rgba(245,158,11,0.12)]",
      items: gaps.filter((g) => g.bucket === "developing"),
    },
    {
      key: "strength",
      label: "Strengths",
      dot: "bg-[#15925a]",
      col: "text-[#15925a]",
      bg: "bg-[rgba(21,146,90,0.04)]",
      border: "border-[rgba(21,146,90,0.12)]",
      items: gaps.filter((g) => g.bucket === "strength"),
    },
  ];
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Stat tiles */}
      <div className="cj-gap-stats grid grid-cols-4 gap-[12px]">
        {[
          { l: L("Weighted Match"), v: `${Math.round(wtMatch)}%`, s: L("across required skills"), c: "text-[#1667e0]" },
          { l: L("Priority Gaps"), v: `${buckets[0].items.length}`, s: L("need immediate action"), c: "text-[#d13b3b]" },
          {
            l: L("Critical Unmet"),
            v: `${gaps.filter((g) => g.isCritical && g.gap > 0).length}`,
            s: L("of {n} critical skills", { n: gaps.filter((g) => g.isCritical).length }),
            c: gaps.some((g) => g.isCritical && g.gap > 0) ? "text-[#d13b3b]" : "text-[#15925a]",
          },
          { l: L("Strengths"), v: `${buckets[2].items.length}`, s: L("requirements met"), c: "text-[#15925a]" },
        ].map((s) => (
          <div key={s.l} className="bg-white border border-[#e4ebf5] rounded-[12px] p-[16px]">
            <p className="text-[11px] font-normal text-[#98a1ba] mb-[4px]">{s.l}</p>
            <p className={`font-bold text-[28px] leading-none ${s.c}`}>{s.v}</p>
            <p className="text-[11px] font-normal text-[#98a1ba] mt-[3px]">{s.s}</p>
          </div>
        ))}
      </div>

      {/* Evidence/confidence callout */}
      <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] px-[16px] py-[12px] flex items-start gap-[10px]">
        <InfoIcon />
        <p className="text-[12px] font-normal text-[#6b7593] leading-[1.6]">
          <strong className="font-semibold text-[#05103d]">
            {L("Confidence reflects evidence quality.")}
          </strong>{" "}
          {L("High = multiple verified sources · Medium = one verified or pending verification · Low = self-assessment only. Low-confidence levels are flagged, submitting an assessment or project raises accuracy and roadmap reliability. Missing optional evidence does not count as zero; available evidence is re-weighted.")}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          {/* Column headers */}
          <div
            className="cj-gap-head grid items-center px-[20px] py-[10px] border-b border-[#f0f6fc] bg-[#f7fafe] min-w-[980px]"
            style={{ gridTemplateColumns: "18px minmax(150px,1.6fr) 82px 82px 58px 78px 78px 90px 96px 20px" }}
          >
          {["", "Skill", "Current", "Required", "Gap", "Match %", "Importance", "Criticality", "Confidence", ""].map(
            (h, i) => (
              <span
                key={i}
                className="text-[9.5px] font-semibold text-[#98a1ba] uppercase tracking-wide"
              >
                {L(h)}
              </span>
            ),
          )}
        </div>

        {buckets.map(
          (bk) =>
            bk.items.length > 0 && (
              <div key={bk.key}>
                {/* Bucket section header */}
                <div className={`flex items-center gap-[8px] px-[20px] py-[7px] border-b ${bk.border} ${bk.bg}`}>
                  <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${bk.dot}`} />
                  <span className={`text-[11px] font-semibold ${bk.col}`}>
                    {L(bk.label)}
                  </span>
                  <span className="text-[11px] font-normal text-[#98a1ba]">
                    ({bk.items.length})
                  </span>
                </div>

                {bk.items.map((gap) => {
                  const isExp = expanded === gap.skillId;
                  const mc = gap.match >= 100 ? "#15925a" : gap.match >= 70 ? "#f59e0b" : "#d13b3b";
                  const ct = CT[gap.confidenceLabel];
                  return (
                    <div
                      key={gap.skillId}
                      className={`border-b border-[#f0f6fc] last:border-0 ${isExp ? "bg-[#f7fafe]" : ""}`}
                    >
                      <button
                        onClick={() => setExpanded(isExp ? null : gap.skillId)}
                        className="w-full text-start hover:bg-[#f7fafe] transition-colors"
                      >
                        <div
                          className="cj-gap-row grid items-center gap-[8px] px-[20px] py-[12px] min-w-[980px]"
                          style={{ gridTemplateColumns: "18px minmax(150px,1.6fr) 82px 82px 58px 78px 78px 90px 96px 20px" }}
                        >
                          {/* Critical dot */}
                          <div className="cj-gap-dot flex items-center justify-center">
                            {gap.isCritical ? (
                              <span className="w-[6px] h-[6px] rounded-full bg-[#d13b3b]" title={L("Critical skill")} />
                            ) : (
                              <span />
                            )}
                          </div>

                          {/* Skill */}
                          <div className="cj-gap-skill">
                            <p className="font-semibold text-[13px] text-[#05103d] leading-tight">
                              {skillLabel(gap.skillName, gap)}
                            </p>
                            <p className="text-[11px] font-normal text-[#98a1ba]">
                              {L(gap.category)}
                            </p>
                          </div>

                          {/* Current */}
                          <div data-label={L("Current")}>
                            <p className="font-bold text-[13px] text-[#05103d]">
                              {gap.currentLevel}
                              <span className="text-[11px] text-[#98a1ba] font-normal">/{gap.maxLevel}</span>
                            </p>
                            <Bar pct={(gap.currentLevel / gap.maxLevel) * 100} color="#1667e0" />
                          </div>

                          {/* Required */}
                          <div data-label={L("Required")}>
                            <p className="font-normal text-[12px] text-[#6b7593]">
                              {gap.requiredLevel}
                              <span className="text-[11px] text-[#98a1ba]">/{gap.maxLevel}</span>
                            </p>
                            <Bar pct={(gap.requiredLevel / gap.maxLevel) * 100} color="#e2e5ef" />
                          </div>

                          {/* Gap */}
                          <p
                            data-label={L("Gap")}
                            className={`font-bold text-[13px] ${gap.gap > 0 ? "text-[#d13b3b]" : "text-[#15925a]"}`}
                          >
                            {gap.gap === 0 ? "✓ 0" : `−${gap.gap}`}
                          </p>

                          {/* Match */}
                          <div data-label={L("Match %")}>
                            <p className="font-bold text-[12px]" style={{ color: mc }}>
                              {gap.match}%
                            </p>
                            <Bar pct={gap.match} color={mc} />
                          </div>

                          {/* Importance */}
                          <div data-label={L("Importance")}>
                            <p className="text-[12px] font-medium text-[#6b7593]">
                              {Math.round(gap.importance * 100)}%
                            </p>
                            <Bar pct={gap.importance * 100} color="#5b5bd6" />
                          </div>

                          {/* Criticality */}
                          <p
                            data-label={L("Criticality")}
                            className={`text-[11px] font-semibold ${gap.isCritical ? "text-[#d13b3b]" : "text-[#98a1ba]"}`}
                          >
                            {gap.isCritical ? `⚑ ${L("Critical")}` : L("Standard")}
                          </p>

                          {/* Confidence */}
                          <div className="cj-gap-conf flex items-center gap-[5px]" data-label={L("Confidence")}>
                            <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${ct.dot}`} />
                            <div>
                              <p
                                className={`text-[11px] font-semibold leading-tight ${ct.text}`}
                              >
                                {L(gap.confidenceLabel)}
                              </p>
                              <p className="text-[11px] font-normal text-[#d1d5db]">
                                {Math.round(gap.confidence * 100)}%
                              </p>
                            </div>
                          </div>

                          {/* Chevron */}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            className={`cj-gap-chev transition-transform ${isExp ? "rotate-180" : ""}`}
                          >
                            <path
                              d="M2 4l4 4 4-4"
                              stroke="#98a1ba"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExp && (
                        <div
                          className="cj-gap-detail px-[26px] pb-[16px] pt-[10px] border-t border-[#f0f6fc] grid gap-[16px]"
                          style={{ gridTemplateColumns: "1fr 260px" }}
                        >
                          <div>
                            <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[5px]">
                              {L("Why this matters")}
                            </p>
                            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.65]">
                              {gap.explanation}
                            </p>
                            {gap.isCritical && (
                              <div className="flex items-start gap-[6px] mt-[8px] bg-[rgba(209,59,59,0.05)] border border-[rgba(209,59,59,0.15)] rounded-[8px] px-[10px] py-[8px]">
                                <span className="text-[11px] text-[#d13b3b]">⚑</span>
                                <p className="text-[11px] font-normal text-[#d13b3b]">
                                  {L("Critical skill, a severe deficiency can cap the overall readiness score. The applied cap, when there is one, is shown on the Readiness tab.")}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="bg-[#f8f9ff] border border-[#eef0f8] rounded-[10px] p-[12px]">
                            <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[6px]">
                              {L("Evidence & Confidence")}
                            </p>
                            <p className="text-[11px] font-normal text-[#6b7593] mb-[8px] leading-[1.5]">
                              {gap.evidenceSummary}
                            </p>
                            <div className="flex items-center gap-[5px] mb-[6px]">
                              <span className={`w-[6px] h-[6px] rounded-full ${ct.dot}`} />
                              <p className={`text-[11px] font-semibold ${ct.text}`}>
                                {L(gap.confidenceLabel)} ({Math.round(gap.confidence * 100)}%)
                              </p>
                            </div>
                            <Bar pct={gap.confidence * 100} color={ct.bar} h={4} />
                            {gap.confidence < 0.65 && (
                              <p className="text-[11px] font-normal text-[#98a1ba] mt-[6px] italic leading-[1.5]">
                                {L("Submit an assessment or project to raise confidence and improve roadmap accuracy.")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ),
        )}
          </div>
        </div>
      </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// ROADMAP TAB — phases + milestones + actions
// ═══════════════════════════════════════════════════════════════════════════════
// ── Milestone card ────────────────────────────────────────────────────────────
function MilestoneCard({ m }) {
  const { L } = useUiText();
  const ms = MS[m.status] ?? MS["Not Started"];
  return (
    <div
      className={`rounded-[12px] border-2 ${ms.border} p-[18px] flex gap-[14px]`}
      style={{ background: ms.bg.replace("bg-", "") || undefined }}
    >
      {/* Badge */}
      <div
        className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center text-[20px] shrink-0 border"
        style={{ background: ms.badgeBg, borderColor: ms.ring + "40" }}
      >
        {m.status === "Achieved" ? "✓" : m.status === "In Progress" ? m.badge : ""}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[8px] mb-[4px] flex-wrap">
          <p className="font-bold text-[14px] text-[#05103d]">
            {L("Phase {n} Milestone", { n: m.phase })}
          </p>
          <span
            className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${ms.text}`}
            style={{ background: `${ms.ring}12`, border: `1px solid ${ms.ring}30` }}
          >
            {L(m.status)}
          </span>
          {m.achievedDate && (
            <span className="text-[11px] font-normal text-[#98a1ba]">
              {L("Achieved")} <bdi dir="ltr">{m.achievedDate}</bdi>
            </span>
          )}
          {m.unlocksPhase && m.status !== "Achieved" && (
            <span className="text-[11px] font-normal text-[#98a1ba]">
              {L("Unlocks Phase {n}", { n: m.unlocksPhase })}
            </span>
          )}
          {m.unlocksPhase && m.status === "Achieved" && (
            <span className="text-[11px] font-medium text-[#15925a]">
              {L("✓ Phase {n} unlocked", { n: m.unlocksPhase })}
            </span>
          )}
        </div>
        <p className="font-semibold text-[13px]" style={{ color: ms.ring }}>
          {m.title}
        </p>
        <p className="text-[12px] font-normal text-[#6b7593] mt-[3px] mb-[8px]">
          {m.description}
        </p>
        {/* Criteria checklist */}
        <div className="flex flex-col gap-[4px]">
          {m.criteria.map((cr) => (
            <div key={cr} className="flex items-start gap-[6px] text-[11px] font-normal">
              <span
                className={`mt-[1px] shrink-0 ${m.status === "Achieved" ? "text-[#15925a]" : m.status === "In Progress" ? "text-[#98a1ba]" : "text-[#d1d5db]"}`}
              >
                {m.status === "Achieved" ? "✓" : "○"}
              </span>
              <span
                className={
                  m.status === "Achieved"
                    ? "text-[#15925a] line-through"
                    : m.status === "Locked"
                      ? "text-[#98a1ba]"
                      : "text-[#6b7593]"
                }
              >
                {cr}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ── Action card ────────────────────────────────────────────────────────────────
function ActionCard({ action }) {
  const { L } = useUiText();
  const [open, setOpen] = useState(action.isNBA ?? false);
  const st = ST[action.status] ?? ST["Not Started"];
  const tm = TM[action.type] ?? { emoji: "📌", label: "Action" };
  const isBlocked = action.status === "Blocked";
  const isDone = action.status === "Completed";
  return (
    <div
      className={`border rounded-[12px] overflow-hidden bg-white transition-all
      ${
        action.isNBA
          ? "border-[rgba(22,103,224,0.35)] shadow-[0_0_0_3px_rgba(22,103,224,0.06)]"
          : isDone
            ? "border-[rgba(21,146,90,0.2)]"
            : isBlocked
              ? "border-[rgba(209,59,59,0.18)]"
              : "border-[#e4ebf5]"
      }`}
    >
      {action.isNBA && (
        <div className="h-[3px] w-full" style={{ background: "#1667e0" }} />
      )}

      <button onClick={() => setOpen(!open)} className="w-full text-start">
        <div className="flex items-start gap-[12px] px-[18px] py-[13px]">
          {/* Icon */}
          <div
            className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center text-[16px] shrink-0 mt-[1px]
            ${isDone ? "bg-[rgba(21,146,90,0.1)]" : isBlocked ? "bg-[rgba(209,59,59,0.07)]" : action.isNBA ? "bg-[rgba(22,103,224,0.1)]" : "bg-[#f7fafe]"}`}
          >
            {isDone ? "✓" : ""}
          </div>
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-[5px] mb-[4px] flex-wrap">
              <span
                className={`text-[11px] font-medium px-[7px] py-[2px] rounded-full flex items-center gap-[3px] ${st.bg} ${st.text}`}
              >
                <span className={`w-[4px] h-[4px] rounded-full ${st.dot}`} />
                {L(action.status)}
              </span>
              <span className="text-[11px] font-normal text-[#98a1ba]">{L(tm.label)}</span>
              {action.isCritical && (
                <span className="text-[11px] text-[#d13b3b] bg-[rgba(209,59,59,0.08)] px-[6px] py-[1px] rounded-full font-medium">
                  {L("Critical")}
                </span>
              )}
              {action.isNBA && (
                <span className="text-[11px] font-semibold text-[#1667e0] bg-[rgba(22,103,224,0.1)] px-[7px] py-[1px] rounded-full">
                  {L("Next Best Action")}
                </span>
              )}
              {isBlocked && (
                <span className="text-[11px] text-[#d13b3b] font-normal">
                  {L("Blocked, awaiting prerequisite")}
                </span>
              )}
            </div>
            <p className="font-semibold text-[13px] text-[#05103d] leading-tight mb-[2px]">
              {action.objective}
            </p>
            <div className="flex items-center gap-[12px] text-[11px] font-normal text-[#98a1ba] flex-wrap">
              <span>
                {L("Skill:")}{" "}
                <span className="text-[#6b7593] font-medium">
                  {action.targetSkill}
                </span>
              </span>
              {action.gap > 0 && (
                <span>
                  {L("Gap:")}{" "}
                  <bdi dir="ltr" className="text-[#d13b3b] font-medium">−{action.gap}</bdi>
                </span>
              )}
              {action.gap === 0 && <span className="text-[#15925a]">{L("Requirement met")}</span>}
              <span className="ms-auto">{action.estimatedEffort}</span>
              <span className="text-[#05103d] font-medium">
                {action.estimatedDuration}
              </span>
            </div>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`shrink-0 mt-[4px] transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M2 4l4 4 4-4" stroke="#98a1ba" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-[18px] pb-[16px] pt-[4px] border-t border-[#f7fafe] flex flex-col gap-[12px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <div className="bg-[#f7fafe] rounded-[10px] p-[12px]">
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[4px]">
                {L("Completion criteria")}
              </p>
              <p className="text-[12px] font-normal text-[#6b7593] leading-[1.55]">
                {action.completionCriteria}
              </p>
            </div>
            <div className="bg-[#f7fafe] rounded-[10px] p-[12px]">
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[4px]">
                {L("Effort / Duration")}
              </p>
              <p className="text-[12px] font-normal text-[#6b7593]">{action.estimatedEffort}</p>
              <p className="text-[12px] font-medium text-[#05103d]">
                {action.estimatedDuration}
              </p>
            </div>
          </div>
          {action.prerequisites.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[5px]">
                {L("Prerequisites")}
              </p>
              <div className="flex flex-col gap-[4px]">
                {action.prerequisites.map((p) => (
                  <div
                    key={p}
                    className={`flex items-center gap-[6px] text-[11px] font-normal ${isBlocked ? "text-[#d13b3b]" : "text-[#6b7593]"}`}
                  >
                    {!isBlocked && <span>✓</span>} {p}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[4px]">
              {L("Why this action")}
            </p>
            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.6]">
              {action.explanation}
            </p>
          </div>
          {action.unlocksWhat && (
            <div className="bg-[rgba(22,103,224,0.05)] border border-[rgba(22,103,224,0.15)] rounded-[10px] px-[14px] py-[10px]">
              <p className="text-[11px] font-semibold text-[rgba(22,103,224,0.6)] uppercase tracking-wide mb-[3px]">
                {L("Completing this unlocks")}
              </p>
              <p className="text-[12px] font-normal text-[#1667e0]">{action.unlocksWhat}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ── Roadmap v1 → this tab's model ─────────────────────────────────────────────
// The API speaks enums: `phase` is `foundations | core_skills |
// applied_practice | career_readiness`, `type` is `assessment | resource |
// practice | simulated_project | real_project`, `status` is `not_started |
// in_progress | blocked | completed | skipped`, and effort arrives as
// `estimated_hours` / `estimated_duration_weeks`.
//
// This tab was written against a mock model instead: phases 1-4, Title Case
// types and statuses, `priority`, `targetSkill`, and a `milestones` array that
// the API never sends. With real data `PT[phase]` and `TM[type]` were
// `undefined`, so the tab could not render at all — and the caller's
// `Array.isArray(roadmapMilestones)` gate showed "No saved roadmap" even when
// the backend had one. Normalise once here and leave the presentation alone.
// ── Skill gaps → this tab's model ─────────────────────────────────────────────
// Same class of mismatch as the roadmap: the API sends `current_level`,
// `required_level`, `match_score` (0-100), `importance_weight`, `is_critical`,
// `confidence` (0-100) and `status` (`met | partial | gap`). The tab reads
// camelCase plus a `bucket` and a `confidenceLabel` that no endpoint produces,
// so the weighted match rendered "NaN%", all three buckets were empty, and
// expanding a critical gap threw on an undefined `data` reference.
const MAX_SKILL_LEVEL = 5;
const GAP_STATUS_LABEL = {
  met: "Requirement met",
  partial: "Partially met",
  gap: "Below requirement",
};

function normaliseSkillGaps(skillGaps) {
  return (Array.isArray(skillGaps) ? skillGaps : []).map((gap) => {
    const currentLevel = Number(gap.current_level) || 0;
    const requiredLevel = Number(gap.required_level) || 0;
    const gapValue = gap.gap != null ? Number(gap.gap) : Math.max(0, requiredLevel - currentLevel);
    const match =
      gap.match_score != null
        ? Math.round(Number(gap.match_score))
        : Math.round(requiredLevel > 0 ? Math.min(1, currentLevel / requiredLevel) * 100 : 100);
    const confidence =
      gap.confidence == null ? null : Math.min(100, Math.max(0, Number(gap.confidence)));
    const status = String(gap.status || "").toLowerCase();
    const isCritical = Boolean(gap.is_critical);

    return {
      skillId: gap.skill_id,
      skillName: gap.skill_name || `Skill #${gap.skill_id}`,
      skillNameAr: gap.skill_name_ar ?? gap.name_ar ?? null,
      category: GAP_STATUS_LABEL[status] ?? "",
      currentLevel,
      requiredLevel,
      maxLevel: MAX_SKILL_LEVEL,
      gap: gapValue,
      match,
      importance: Number(gap.importance_weight) || 0,
      isCritical,
      confidence: confidence == null ? 0 : confidence / 100,
      confidenceLabel:
        confidence == null
          ? "Self-Assessment Only"
          : confidence >= 80
            ? "High"
            : confidence >= 50
              ? "Medium"
              : "Low",
      // met ⇒ strength; a critical shortfall ⇒ priority; anything else ⇒ developing.
      bucket: status === "met" || gapValue <= 0 ? "strength" : isCritical ? "priority-gap" : "developing",
      explanation: gap.explanation || "",
    };
  });
}

// ── Readiness result → this tab's model ───────────────────────────────────────
// The endpoint returns four FLAT component scores (0-100) plus band/version
// metadata. The tab wants a `components` array with a weight, a point
// contribution, a label and a colour, plus a `warning` object for the
// critical-skill cap — none of which the API sends. The weights below are the
// documented ones (the tab prints the same formula), and they are renormalised
// over the components that actually returned a score, exactly as
// ReadinessService does, so the contribution column adds up to the headline.
const READINESS_COMPONENTS = [
  { key: "skill_match", field: "skill_match_component", label: "Skill Match", abbr: "SM", color: "#1667e0", icon: "🎯", weight: 0.65 },
  { key: "practical_experience", field: "practical_experience_component", label: "Practical Experience", abbr: "PE", color: "#5b5bd6", icon: "🛠", weight: 0.2 },
  { key: "assessment_reliability", field: "assessment_reliability_component", label: "Assessment Reliability", abbr: "AR", color: "#f59e0b", icon: "📋", weight: 0.1 },
  { key: "profile_completeness", field: "profile_completeness_component", label: "Profile Completeness", abbr: "PC", color: "#15925a", icon: "👤", weight: 0.05 },
];

// The backend emits its band as a config key (`config/readiness.php › bands`),
// not as a display label. With a raw key `BAND[data.band]` was `undefined` and
// the tab threw on `bt.text` before it could paint anything.
const READINESS_BAND = {
  foundation_needed: "Not Started",
  developing: "Developing",
  moderate_readiness: "Progressing",
  near_ready: "Advanced",
  highly_ready: "Ready",
};

function normaliseBand(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "Not Started";
  if (BAND[value]) return value;
  return READINESS_BAND[value.toLowerCase()] ?? "Not Started";
}

function normaliseReadiness(readiness, roleTitle = "") {
  if (!readiness) return null;

  const available = READINESS_COMPONENTS.map((component) => ({
    ...component,
    score: readiness[component.field],
  }))
    .filter((component) => component.score != null)
    .map((component) => ({ ...component, score: Number(component.score) || 0 }));

  const weightTotal = available.reduce((sum, component) => sum + component.weight, 0);

  const components = available.map((component) => {
    const effectiveWeight = weightTotal > 0 ? component.weight / weightTotal : 0;
    return {
      key: component.key,
      label: component.label,
      abbr: component.abbr,
      color: component.color,
      icon: component.icon,
      score: Math.round(component.score),
      weight: effectiveWeight,
      contribution: component.score * effectiveWeight,
      explanation: "",
    };
  });

  const criticalNames = Array.isArray(readiness.critical_skill_names) ? readiness.critical_skill_names : [];
  const worstCritical = (Array.isArray(readiness.skill_results) ? readiness.skill_results : [])
    .filter((skill) => skill.is_critical)
    .sort((a, b) => Number(b.gap) - Number(a.gap))[0];
  // `critical_skill_readiness_cap` is the resource's field name; the cap value
  // lives inside the snapshot's `critical_skill_rule.cap`.
  const cap = readiness.critical_skill_readiness_cap ?? readiness.critical_skill_cap;

  return {
    score: Math.round(Number(readiness.score) || 0),
    band: normaliseBand(readiness.band),
    roleTitle: roleTitle || readiness.role_title || "",
    roleVersion: readiness.career_role_version ?? "",
    explanation: readiness.explanation || "",
    components,
    warning: readiness.critical_cap_applied
      ? {
          skillName: criticalNames.join(", ") || "A critical skill",
          capApplied: cap != null ? `${Math.round(Number(cap))} pts` : "applied",
          explanation:
            "A critical skill is below the minimum match, so the overall score was capped.",
          currentLevel: worstCritical?.current_level ?? null,
          requiredLevel: worstCritical?.required_level ?? null,
        }
      : null,
    calculatedAt: readiness.calculated_at || null,
    algorithmVersion: readiness.algorithm_version || "",
    configVersion: readiness.configuration_version || "",
    decisionVersion: readiness.decision_id || "",
  };
}

const PHASE_ORDER = {
  foundations: 1,
  core_skills: 2,
  applied_practice: 3,
  career_readiness: 4,
};
const PHASE_LABEL = {
  foundations: "Foundations",
  core_skills: "Core Skills",
  applied_practice: "Applied Practice",
  career_readiness: "Career Readiness",
};
const ACTION_TYPE_LABEL = {
  assessment: "Assessment",
  resource: "Learning Resource",
  practice: "Practice Task",
  simulated_project: "Simulation Project",
  real_project: "Real Project",
};
const ACTION_STATUS_LABEL = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
  skipped: "Skipped",
};

function normaliseRoadmapActions(roadmap, skillGaps) {
  const actions = Array.isArray(roadmap?.actions) ? roadmap.actions : [];
  const gapBySkillId = new Map(
    (Array.isArray(skillGaps) ? skillGaps : []).map((gap) => [String(gap.skill_id), gap]),
  );

  const rows = actions.map((action) => {
    const gap = gapBySkillId.get(String(action.target_skill_id));
    const phaseOrder = PHASE_ORDER[action.phase] ?? 1;
    // The action card dereferences `prerequisites.length`, and the API only
    // sends ids — resolve them to names (or a placeholder) so the card cannot
    // throw on a real payload.
    const prerequisiteIds = action.blocking_prerequisite_skill_ids ?? action.prerequisite_skill_ids ?? [];

    return {
      id: action.id,
      phase: phaseOrder,
      phase_name: PHASE_LABEL[action.phase] ?? `Phase ${phaseOrder}`,
      type: ACTION_TYPE_LABEL[action.type] ?? "Learning Resource",
      status: ACTION_STATUS_LABEL[action.status] ?? "Not Started",
      objective: action.title || action.objective || action.description || "Roadmap action",
      description: action.description || action.objective || "",
      // The roadmap only carries `target_skill_id`; the name and the gap come
      // from the skill-gap block of the same decision, when it is present.
      targetSkill: gap?.skill_name || (action.target_skill_id ? `Skill #${action.target_skill_id}` : "General"),
      gap: gap ? Number(gap.gap) || 0 : undefined,
      isCritical: Boolean(gap?.is_critical),
      isNBA:
        roadmap?.next_best_action_id != null &&
        String(action.id) === String(roadmap.next_best_action_id),
      estimatedEffort:
        action.estimated_hours != null ? `${Number(action.estimated_hours)} h` : "",
      estimatedDuration:
        action.estimated_duration_weeks != null ? `${Number(action.estimated_duration_weeks)} wk` : "",
      priority: action.order_index ?? 0,
      priorityScore: action.priority_score ?? null,
      prerequisites: (Array.isArray(prerequisiteIds) ? prerequisiteIds : []).map(
        (id) => gapBySkillId.get(String(id))?.skill_name || `Skill #${id}`,
      ),
      completionCriteria: action.completion_criteria,
      explanation: action.explanation,
    };
  });

  // "Completing this unlocks" is the next action in the learner's order; the
  // API does not model unlocks explicitly.
  const ordered = rows.slice().sort((a, b) => a.priority - b.priority);
  return ordered.map((row, index) => ({
    ...row,
    unlocksWhat: ordered[index + 1]?.objective ?? "",
  }));
}

function RoadmapTab({ actions, milestones = [], roadmap = null }) {
  const { L } = useUiText();
  const [filterPhase, setFilterPhase] = useState("all");
  const [showMilestones, setShowMilestones] = useState(true);
  const phases = [...new Set([...actions.map((a) => a.phase), ...milestones.map((m) => m.phase)].filter((phase) => phase !== null && phase !== undefined))]
    .sort((a, b) => Number(a) - Number(b))
    .map((id) => ({ id, name: actions.find((a) => a.phase === id)?.phase_name ?? milestones.find((m) => m.phase === id)?.phase_name ?? `Phase ${id}` }));
  const done = actions.filter((a) => a.status === "Completed").length;
  const curPhase = actions.find((a) => a.status !== "Completed")?.phase ?? 4;
  const displayActions = (filterPhase === "all" ? actions : actions.filter((a) => a.phase === filterPhase))
    .slice()
    .sort((a, b) => a.priority - b.priority);
  const filteredMilestones = filterPhase === "all" ? milestones : milestones.filter((m) => m.phase === filterPhase);
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Journey overview card */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] p-[20px]">
        <div className="flex items-center justify-between mb-[14px]">
          <div>
            <h3 className="font-bold text-[15px] text-[#05103d]">
              {L("Career Roadmap")}
            </h3>
            <p className="text-[11px] font-normal text-[#98a1ba] mt-[2px]">
              {L("Phase {n}", { n: curPhase })}: {phases.find((p) => String(p.id) === String(curPhase))?.name} · {L("{done}/{total} actions complete", { done, total: actions.length })}
            </p>
          </div>
          <div className="text-end">
            <p className="font-bold text-[24px] text-[#05103d] leading-none">
              {Math.round((done / Math.max(actions.length, 1)) * 100)}%
            </p>
            <p className="text-[11px] font-normal text-[#98a1ba]">{L("overall progress")}</p>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="w-full bg-[#f0f6fc] rounded-full h-[8px] mb-[16px]">
          <div
            className="h-[8px] rounded-full transition-all"
            style={{ width: `${(done / Math.max(actions.length, 1)) * 100}%`, background: "#1667e0" }}
          />
        </div>

        {/* 4 phase cards */}
        <div className="grid grid-cols-4 gap-[10px]">
          {phases.map((p) => {
            const pt2 = PT[p.id];
            const pa = actions.filter((a) => a.phase === p.id);
            const pd = pa.filter((a) => a.status === "Completed").length;
            const m = milestones.find((m) => m.phase === p.id);
            const ms2 = m ? MS[m.status] : null;
            const isCur = p.id === curPhase;
            return (
              <button
                key={p.id}
                onClick={() => setFilterPhase(filterPhase === p.id ? "all" : p.id)}
                className={`rounded-[12px] p-[12px] border transition-all text-start
                  ${
                    filterPhase === p.id
                      ? `border-[${pt2.accent}] shadow-[0_0_0_2px_${pt2.accent}20]`
                      : isCur
                        ? "border-transparent"
                        : "border-[#eef0f8]"
                  }`}
                style={{
                  background: isCur || filterPhase === p.id ? pt2.bg : "#f7fafe",
                  borderColor: filterPhase === p.id ? pt2.accent : isCur ? pt2.accent + "40" : "#eef0f8",
                }}
              >
                <div className="flex items-center justify-between mb-[4px]">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: isCur || filterPhase === p.id ? pt2.accent : "#98a1ba" }}
                  >
                    P{p.id}
                  </span>
                  <span className="text-[11px] font-normal text-[#98a1ba]">
                    {pd}/{pa.length}
                  </span>
                </div>
                <p
                  className="font-semibold text-[12px] mb-[6px] leading-tight"
                  style={{ color: isCur || filterPhase === p.id ? pt2.accent : "#6b7593" }}
                >
                  {L(p.name)}
                </p>
                <div className="w-full h-[3px] rounded-full mb-[6px]" style={{ background: pt2.track }}>
                  <div
                    className="h-[3px] rounded-full"
                    style={{ width: pa.length ? `${(pd / pa.length) * 100}%` : "0%", background: pt2.accent }}
                  />
                </div>
                {m && ms2 && (
                  <div className="flex items-center gap-[4px]">
                    <span className="text-[11px]">
                      {m.status === "Achieved" ? "✓" : m.status === "In Progress" ? "◑" : "🔒"}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: ms2.ring }}
                    >
                      {L(m.status)}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + milestone toggle */}
      <div className="flex items-center gap-[8px] flex-wrap justify-between">
        <div className="flex items-center gap-[6px] flex-wrap">
          {["all", ...phases.map((p) => p.id)].map((f) => {
            const active = filterPhase === f;
            const pt2 = f !== "all" ? PT[f] : null;
            return (
              <button
                key={f}
                onClick={() => setFilterPhase(f)}
                className={`px-[12px] py-[5px] rounded-[8px] text-[12px] font-medium transition-all border whitespace-nowrap
                  ${
                    active && pt2
                      ? `text-white border-transparent`
                      : active
                        ? "text-white border-transparent"
                        : "bg-white border-[#e4ebf5] text-[#6b7593] hover:border-[#c7d2e8]"
                  }`}
                style={
                  active
                    ? {
                        background: pt2 ? pt2.accent : "#1667e0",
                        borderColor: "transparent",
                      }
                    : undefined
                }
              >
                {f === "all" ? L("All actions") : `${L("Phase {n}", { n: f })}, ${L(phases.find((p) => String(p.id) === String(f))?.name ?? "")}`}
              </button>
            );
          })}
        </div>
        {milestones.length > 0 && (
          <button
            onClick={() => setShowMilestones(!showMilestones)}
            className="text-[11px] font-medium text-[#1667e0] hover:underline whitespace-nowrap"
          >
            {showMilestones ? "Hide milestones" : "Show milestones"}
          </button>
        )}
      </div>

      {/* Milestones section — the API sends no milestones, so this only renders
          when one was supplied. */}
      {showMilestones && milestones.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[10px]">
            {L("Phase milestones, completion gates")}
          </p>
          <div className="flex flex-col gap-[10px]">
            {filteredMilestones.map((m) => (
              <MilestoneCard key={m.phase} m={m} />
            ))}
          </div>
        </div>
      )}

      {/* Action list */}
      <div>
        <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[10px]">
          {L("Development actions")}
        </p>
        <div className="flex flex-col gap-[10px]">
          {displayActions.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      </div>

      {/* Footer — the version, effort and date come from the roadmap row. The
          previous text was hard-coded ("rm-2026090914 · 10 h/week"). */}
      <p className="text-[11px] font-normal text-[#98a1ba] italic px-[2px] leading-[1.6]">
        {roadmap?.roadmap_version ? (
          <>
            {L("Roadmap version")}{" "}
            <span className="font-medium not-italic">
              {roadmap.roadmap_version}
            </span>
            {" · "}
          </>
        ) : null}
        {roadmap?.estimated_total_hours != null
          ? L("{n} h of work", { n: Number(roadmap.estimated_total_hours) })
          : L("Effort not estimated")}
        {roadmap?.estimated_duration_weeks != null
          ? ` ${L("over {n} weeks", { n: Number(roadmap.estimated_duration_weeks) })}`
          : ""}
        {roadmap?.generated_at
          ? ` · ${L("Generated")} ${new Date(roadmap.generated_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}`
          : ""}
      </p>
      {Array.isArray(roadmap?.limitations) && roadmap.limitations.length > 0 && (
        <p className="text-[11px] font-normal text-[#98a1ba] px-[2px] leading-[1.6]">
          {roadmap.limitations.join(" · ")}
        </p>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// STATE SCREENS — loading / error / incomplete / historical
// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOADING ──────────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-col gap-[16px]">
      {/* NBA ghost */}
      <div
        className="rounded-[16px] overflow-hidden px-[26px] py-[22px] flex flex-col gap-[12px]"
        style={{ background: "#060d2e" }}
      >
        <div className="flex gap-[8px]">
          <Sk w={100} h={22} r={11} />
          <Sk w={160} h={14} r={6} />
        </div>
        <Sk w="58%" h={26} r={7} />
        <Sk w="82%" h={14} r={5} />
        <div className="flex gap-[10px] mt-[4px]">
          <Sk w="52%" h={68} r={10} />
          <Sk w={164} h={68} r={10} />
        </div>
      </div>
      {/* Score hero */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "230px 1fr" }}>
          <div className="flex flex-col items-center justify-center gap-[14px] border-e border-[#f0f6fc] px-[22px] py-[28px]">
            <Sk w={162} h={162} r={81} />
            <Sk w={100} h={26} r={13} />
          </div>
          <div className="flex flex-col px-[24px] py-[22px] gap-[16px]">
            <div className="flex flex-col gap-[8px]">
              <Sk w="52%" h={18} r={6} />
              <Sk w="90%" h={12} r={5} />
              <Sk w="76%" h={12} r={5} />
            </div>
            <div className="flex flex-col gap-[6px]">
              <Sk w={110} h={10} r={4} />
              <Sk w="100%" h={4} r={2} />
            </div>
            <div className="flex flex-col gap-[6px]">
              <Sk w={130} h={10} r={4} />
              <Sk w="100%" h={9} r={5} />
            </div>
          </div>
        </div>
      </div>
      {/* 4 component skeletons */}
      <div className="grid grid-cols-2 gap-[12px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#e4ebf5] rounded-[16px] p-[18px] flex flex-col gap-[10px]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-[8px]">
                <Sk w={34} h={34} r={9} />
                <div className="flex flex-col gap-[5px]">
                  <Sk w={100} h={13} r={4} />
                  <Sk w={78} h={9} r={4} />
                </div>
              </div>
              <Sk w={38} h={26} r={5} />
            </div>
            <Sk w="100%" h={7} r={4} />
            <Sk w="55%" h={10} r={4} />
            <div className="border-t border-[#f7fafe] pt-[8px] flex flex-col gap-[4px]">
              <Sk w="92%" h={10} r={4} />
              <Sk w="76%" h={10} r={4} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-[10px] py-[4px]">
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="#e2e8f0" strokeWidth="2" />
          <path d="M7 1.5C10.59 1.5 13.5 4.41 13.5 7" stroke="url(#lspin)" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="lspin" x1="7" y1="1.5" x2="13.5" y2="7" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1667e0" />
              <stop offset="1" stopColor="#5b5bd6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-[12px] font-normal text-[#98a1ba]">
          Analysing your skills against{" "}
          <strong className="text-[#6b7593] font-semibold">Software Engineer v2.3</strong>…
        </span>
      </div>
    </div>
  );
}
// 2. ERROR / FALLBACK ─────────────────────────────────────────────────────────
function ErrorState({ variant }) {
  const CFG = {
    error: {
      title: "Calculation failed",
      body: "Something went wrong during readiness analysis. No fabricated score has been saved.",
      icon: "✕",
      col: "#d13b3b",
      canRetry: true,
      note: "Your previous results are intact and have not been modified.",
    },
    timeout: {
      title: "Request timed out",
      body: "The analysis took too long to complete. No score has been generated from this attempt.",
      icon: "⏱",
      col: "#f59e0b",
      canRetry: true,
      note: "This does not affect your previous results. Try again or contact support if it persists.",
    },
    unavailable: {
      title: "Intelligence service unavailable",
      body: "The readiness engine is temporarily offline. No score has been fabricated. Your last known result is preserved.",
      icon: "○",
      col: "#d13b3b",
      canRetry: true,
      note: "Please try again shortly. If the issue persists, contact support.",
    },
    "invalid-config": {
      title: "Role configuration error",
      body: "The selected career role has an invalid configuration and cannot be used for a production readiness calculation.",
      icon: "⚠",
      col: "#f59e0b",
      canRetry: false,
      note: "This is not your error, our team has been notified. No result can be generated until the configuration is corrected.",
    },
  };
  const c = CFG[variant];
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Ghost NBA */}
      <div
        className="rounded-[16px] border-2 border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center py-[26px] gap-[10px]"
        style={{ background: "#060d2e" }}
      >
        <div
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center"
          style={{ background: `${c.col}18`, border: `1px solid ${c.col}30` }}
        >
          <span style={{ color: c.col, fontSize: 14 }}>{c.icon}</span>
        </div>
        <span className="text-[13px] font-normal text-[rgba(255,255,255,0.35)]">
          Next Best Action unavailable
        </span>
      </div>

      {/* Error card */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="h-[4px]" style={{ background: c.col }} />
        <div className="flex flex-col items-center text-center px-[48px] py-[40px] gap-[20px]">
          <div
            className="w-[70px] h-[70px] rounded-[16px] flex items-center justify-center text-[26px] font-bold"
            style={{ background: `${c.col}10`, border: `2px solid ${c.col}25`, color: c.col }}
          >
            {c.icon}
          </div>
          <div>
            <h3 className="font-bold text-[20px] mb-[6px]" style={{ color: c.col }}>
              {c.title}
            </h3>
            <p className="text-[14px] font-normal text-[#6b7593] max-w-[420px] leading-[1.65]">
              {c.body}
            </p>
          </div>
          <div className="flex items-start gap-[8px] bg-[#f8f9ff] border border-[#eef0f8] rounded-[12px] px-[16px] py-[12px] text-start max-w-[460px]">
            <InfoIcon />
            <p className="text-[12px] font-normal text-[#6b7593] leading-[1.6]">{c.note}</p>
          </div>
          <div className="flex items-center gap-[10px]">
            {c.canRetry && (
              <button
                className="flex items-center gap-[6px] px-[20px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white transition-all"
                style={{ background: "#1667e0" }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M9 5.5A3.5 3.5 0 1 1 5.5 2c.96 0 1.84.39 2.47 1.03L9 2v3.5H5.5"
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Try Again
              </button>
            )}
            <button className="px-[20px] py-[10px] rounded-[10px] text-[13px] font-medium text-[#6b7593] bg-[#f0f6fc] hover:bg-[#e4ebf5] transition-all">
              Contact Support
            </button>
          </div>
        </div>
        {/* Preserved last result ghost */}
        <div className="border-t border-[#f0f6fc] px-[28px] py-[18px] bg-[#f7fafe]">
          <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[12px]">
            Last successful result, preserved
          </p>
          <div
            className="grid gap-[16px] items-center opacity-35 pointer-events-none"
            style={{ gridTemplateColumns: "130px 1fr" }}
          >
            <Sk w={120} h={120} r={60} className="mx-auto" />
            <div className="flex flex-col gap-[8px]">
              <Sk w="52%" h={16} r={5} />
              <Sk w="88%" h={12} r={4} />
              <Sk w="70%" h={12} r={4} />
              <Sk w="100%" h={6} r={3} className="mt-[4px]" />
            </div>
          </div>
          <p className="text-[11px] font-normal text-[#98a1ba] italic mt-[10px]">
            Last calculated 09 Sep 2026, 17:32 · Result preserved
          </p>
        </div>
      </div>
    </div>
  );
}
// 3. INCOMPLETE / EMPTY / NO-EVIDENCE ─────────────────────────────────────────
function IncompleteState({ variant }) {
  const STEPS = {
    empty: [
      {
        n: 1,
        label: "Select a career goal",
        sub: "Choose an approved career role target, e.g. Software Engineer, Data Analyst.",
        done: false,
        cta: "Browse Career Roles",
        accent: "#1667e0",
      },
      {
        n: 2,
        label: "Record your skills",
        sub: "Set your current skill levels so the system can calculate your gaps.",
        done: false,
        accent: "#98a1ba",
      },
      {
        n: 3,
        label: "Submit verified evidence",
        sub: "Complete assessments or add project evidence to verify your levels.",
        done: false,
        accent: "#98a1ba",
      },
      {
        n: 4,
        label: "Get your Readiness Score",
        sub: "See your personalised score, skill gaps, and career roadmap.",
        done: false,
        accent: "#98a1ba",
      },
    ],
    incomplete: [
      {
        n: 1,
        label: "Career goal selected",
        sub: "Software Engineer v2.3 is your active target.",
        done: true,
        accent: "#15925a",
      },
      {
        n: 2,
        label: "Complete your profile",
        sub: "Add education and work experience, required for the Profile Completeness component.",
        done: false,
        cta: "Complete Profile",
        accent: "#f59e0b",
      },
      {
        n: 3,
        label: "Submit evidence",
        sub: "At least one verified evidence item is needed for a reliable readiness score.",
        done: false,
        cta: "Add Evidence",
        accent: "#f59e0b",
      },
      {
        n: 4,
        label: "Get your Readiness Score",
        sub: "Calculation runs automatically once required data is available.",
        done: false,
        accent: "#98a1ba",
      },
    ],
    "no-evidence": [
      {
        n: 1,
        label: "Career goal selected",
        sub: "Software Engineer v2.3 is your active target.",
        done: true,
        accent: "#15925a",
      },
      { n: 2, label: "Profile complete", sub: "Your profile information is filled in.", done: true, accent: "#15925a" },
      {
        n: 3,
        label: "Add verified evidence",
        sub: "No verified evidence found. Self-assessment only produces low-confidence provisional results.",
        done: false,
        cta: "Add Evidence",
        accent: "#d13b3b",
      },
      {
        n: 4,
        label: "Get your Readiness Score",
        sub: "Calculation runs once validated evidence is submitted.",
        done: false,
        accent: "#98a1ba",
      },
    ],
  };
  const TITLES = {
    empty: "No career role selected",
    incomplete: "Profile not complete",
    "no-evidence": "No verified evidence",
  };
  const SUBS = {
    empty: "Follow the steps below to unlock your personalised Career Journey.",
    incomplete: "A few more steps needed before we can calculate a reliable readiness score.",
    "no-evidence": "Submit at least one verified evidence item to generate an accurate result.",
  };
  const ICONS = { empty: "🗺", incomplete: "📋", "no-evidence": "🔍" };
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Ghost NBA */}
      <div
        className="rounded-[16px] border-2 border-dashed border-[rgba(22,103,224,0.12)] flex flex-col items-center justify-center py-[22px] gap-[7px]"
        style={{ background: "#060d2e" }}
      >
        <div className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[17px] opacity-50 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
          🎯
        </div>
        <span className="text-[12px] font-normal text-[rgba(255,255,255,0.3)]">
          Next Best Action will appear once your readiness is calculated
        </span>
      </div>

      {/* Progress card */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="px-[32px] pt-[28px] pb-[24px]">
          <div className="flex items-start gap-[16px] mb-[28px]">
            <div className="w-[52px] h-[52px] rounded-[12px] flex items-center justify-center text-[22px] shrink-0 bg-[rgba(22,103,224,0.08)] border border-[rgba(22,103,224,0.15)]">
              {ICONS[variant]}
            </div>
            <div>
              <h3 className="font-bold text-[18px] text-[#05103d] mb-[4px]">
                {TITLES[variant]}
              </h3>
              <p className="text-[13px] font-normal text-[#6b7593] leading-[1.6] max-w-[520px]">
                {SUBS[variant]}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-0">
            {STEPS[variant].map((s, i, arr) => (
              <div key={s.n} className="flex gap-[16px]">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 border-2 transition-all
                    ${s.done ? "bg-[#15925a] border-[#15925a] text-white" : s.cta ? "border-current bg-white text-current" : "border-[#e2e5ef] bg-white text-[#98a1ba]"}`}
                    style={s.cta && !s.done ? { borderColor: s.accent, color: s.accent } : undefined}
                  >
                    {s.done ? "✓" : s.n}
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="w-[2px] my-[4px]"
                      style={{ flex: 1, background: s.done ? "#d1fae5" : "#f0f6fc", minHeight: 20 }}
                    />
                  )}
                </div>
                <div className={`min-w-0 ${i < arr.length - 1 ? "pb-[20px]" : ""}`}>
                  <div className="flex items-center gap-[8px] mb-[3px] flex-wrap">
                    <p
                      className={`font-semibold text-[14px] leading-tight ${s.done ? "text-[#15925a]" : s.cta ? "text-[#05103d]" : "text-[#98a1ba]"}`}
                    >
                      {s.label}
                    </p>
                    {s.done && (
                      <span className="text-[11px] font-medium text-[#15925a] bg-[rgba(21,146,90,0.08)] px-[7px] py-[2px] rounded-full">
                        Done
                      </span>
                    )}
                    {!s.done && s.cta && (
                      <span
                        className="text-[11px] font-medium px-[7px] py-[2px] rounded-full border"
                        style={{ color: s.accent, background: `${s.accent}10`, borderColor: `${s.accent}30` }}
                      >
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-normal text-[#98a1ba] leading-[1.55] mb-[7px]">
                    {s.sub}
                  </p>
                  {s.cta && (
                    <button
                      className="text-[12px] font-semibold px-[14px] py-[6px] rounded-[8px] border transition-all"
                      style={{ color: s.accent, borderColor: `${s.accent}40`, background: `${s.accent}08` }}
                    >
                      {s.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Preview ghost */}
        <div className="border-t border-[#f0f6fc] px-[32px] py-[18px] bg-[#f7fafe]">
          <p className="text-[11px] font-semibold text-[#98a1ba] uppercase tracking-wide mb-[10px]">
            What you will see once ready
          </p>
          <div className="grid grid-cols-4 gap-[10px] opacity-30 pointer-events-none">
            {["Readiness Score", "Skill Gaps", "Career Roadmap", "Next Best Action"].map((l) => (
              <div key={l} className="bg-white border border-[#e4ebf5] rounded-[12px] p-[12px] flex flex-col gap-[6px]">
                <Sk w="70%" h={10} r={4} />
                <Sk w="100%" h={22} r={6} />
                <Sk w="55%" h={10} r={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// 4. HISTORICAL VERSION STATE ─────────────────────────────────────────────────
function HistoricalState({ readiness = null, onViewLatest }) {
  const { L } = useUiText();
  const HIST = [
    { v: "v2.3", date: "9 Sep 2026", score: 67, band: "Progressing", algo: "v1.4.2", cfg: "v2.1", isViewing: true },
    { v: "v2.2", date: "2 Aug 2026", score: 58, band: "Developing", algo: "v1.3.1", cfg: "v2.0", isViewing: false },
    { v: "v2.1", date: "15 Jul 2026", score: 44, band: "Developing", algo: "v1.3.0", cfg: "v1.9", isViewing: false },
  ];
  return (
    <div className="flex flex-col gap-[16px]">
      {/* Viewing banner */}
      <div className="flex items-center gap-[14px] bg-[rgba(100,116,139,0.07)] border border-[rgba(100,116,139,0.2)] rounded-[12px] px-[18px] py-[13px]">
        <div className="w-[36px] h-[36px] rounded-[10px] bg-[rgba(100,116,139,0.12)] flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#6b7593" strokeWidth="1.3" />
            <path d="M8 4.5V8.5L10.5 10" stroke="#6b7593" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[13px] text-[#05103d]">
            Viewing historical result, 9 Sep 2026
          </p>
          <p className="text-[11px] font-normal text-[#6b7593]">
            Role v2.3 · Algorithm v1.4.2 · Config v2.1 · This snapshot is read-only. Your skills may have changed since
            this calculation.
          </p>
        </div>
        <button
          onClick={onViewLatest}
          className="shrink-0 px-[14px] py-[7px] rounded-[8px] text-[12px] font-semibold text-white whitespace-nowrap transition-all"
          style={{ background: "#1667e0" }}
        >
          View Current
        </button>
      </div>

      {/* Version timeline */}
      <div className="bg-white border border-[#e4ebf5] rounded-[16px] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[#f0f6fc] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[15px] text-[#05103d]">
              Readiness history, Software Engineer
            </h3>
            <p className="text-[11px] font-normal text-[#98a1ba] mt-[2px]">
              All snapshots are immutable · Scores cannot be retroactively modified
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#98a1ba] bg-[#f0f6fc] px-[10px] py-[4px] rounded-full">
            {HIST.length} snapshots
          </span>
        </div>
        <div className="px-[24px] py-[20px] flex flex-col gap-0">
          {HIST.map((h, i) => {
            const bt2 = BAND[h.band];
            const prev = HIST[i + 1];
            const delta = prev ? h.score - prev.score : null;
            const r2 = 20;
            const C2 = 2 * Math.PI * r2;
            const arc2 = C2 * 0.75;
            return (
              <div key={h.v} className="flex gap-[16px]">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                    ${h.isViewing ? "border-[#1667e0] bg-[rgba(22,103,224,0.1)]" : "border-[#e2e5ef] bg-white"}`}
                  >
                    {h.isViewing ? (
                      <span className="w-[10px] h-[10px] rounded-full bg-[#1667e0]" />
                    ) : (
                      <span className="w-[8px] h-[8px] rounded-full bg-[#d1d5db]" />
                    )}
                  </div>
                  {i < HIST.length - 1 && (
                    <div className="w-[2px] my-[4px]" style={{ background: "#f0f6fc", minHeight: 20, flex: 1 }} />
                  )}
                </div>
                <div className={`flex-1 ${i < HIST.length - 1 ? "mb-[20px]" : ""}`}>
                  <div
                    className={`rounded-[12px] border p-[16px] transition-all ${h.isViewing ? "border-[rgba(22,103,224,0.3)] bg-[rgba(22,103,224,0.03)]" : "border-[#f0f6fc] bg-[#f7fafe]"}`}
                  >
                    <div className="flex items-center justify-between gap-[12px] flex-wrap">
                      <div className="flex items-center gap-[12px]">
                        {/* Mini gauge */}
                        <div className="relative w-[52px] h-[52px] shrink-0">
                          <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle
                              cx="26"
                              cy="26"
                              r={r2}
                              fill="none"
                              stroke="#eef0f8"
                              strokeWidth="5"
                              strokeDasharray={`${arc2} ${C2 - arc2}`}
                              strokeLinecap="round"
                              transform="rotate(135 26 26)"
                            />
                            <circle
                              cx="26"
                              cy="26"
                              r={r2}
                              fill="none"
                              stroke={bt2.stop0}
                              strokeWidth="5"
                              strokeDasharray={`${(arc2 * h.score) / 100} ${C2 - (arc2 * h.score) / 100}`}
                              strokeLinecap="round"
                              transform="rotate(135 26 26)"
                            />
                            <text
                              x="26"
                              y="30"
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="700"
                              fill="#05103d"
                              fontFamily="Inter,sans-serif"
                            >
                              {h.score}
                            </text>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                            <span className="font-bold text-[16px] text-[#05103d]">
                              {h.score}/100
                            </span>
                            <span
                              className={`text-[11px] font-medium px-[7px] py-[2px] rounded-full ${bt2.bg} ${bt2.border} ${bt2.text}`}
                            >
                              {h.band}
                            </span>
                            {h.isViewing && (
                              <span className="text-[11px] font-semibold text-[#1667e0] bg-[rgba(22,103,224,0.1)] px-[7px] py-[2px] rounded-full">
                                Viewing
                              </span>
                            )}
                            {delta !== null && (
                              <span
                                className={`text-[11px] font-medium ${delta > 0 ? "text-[#15925a]" : "text-[#d13b3b]"}`}
                              >
                                {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-normal text-[#98a1ba]">
                            {h.date} · Role {h.v} · Algo {h.algo} · Config {h.cfg}
                          </p>
                        </div>
                      </div>
                      {/* Mini component bars */}
                      <div className="flex gap-[6px] items-end shrink-0">
                        {[
                          ["SM", 74],
                          ["PE", 52],
                          ["AR", 68],
                          ["PC", 80],
                        ].map(([l, v]) => (
                          <div key={l} className="flex flex-col items-center gap-[3px]">
                            <div className="w-[6px] bg-[#f0f6fc] rounded-full relative" style={{ height: 28 }}>
                              <div
                                className="absolute bottom-0 w-full rounded-full"
                                style={{ height: `${(v * 28) / 100}px`, background: bt2.stop0 }}
                              />
                            </div>
                            <span className="text-[11px] font-normal text-[#98a1ba]">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {delta !== null && (
                      <div className="mt-[10px] pt-[10px] border-t border-[#f0f6fc] text-[11px] font-normal text-[#6b7593]">
                        Progress since previous snapshot:{" "}
                        <span
                          className={`font-semibold ${delta > 0 ? "text-[#15925a]" : "text-[#d13b3b]"}`}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta} pts ({HIST[i + 1].score} → {h.score})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#f0f6fc] px-[24px] py-[12px] bg-[#f7fafe] flex items-center gap-[7px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#98a1ba" strokeWidth="1" />
            <path d="M6 4v3l2 1" stroke="#98a1ba" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <p className="text-[11px] font-normal text-[#98a1ba]">
            Historical snapshots are immutable, scores cannot be retroactively changed. Each snapshot references the
            exact role version, algorithm, and configuration used at calculation time.
          </p>
        </div>
      </div>

      {/* Historical readiness content — read-only */}
      <div className="opacity-65 pointer-events-none select-none">
        {readiness ? <ReadinessTab data={readiness} /> : <div role="status" className="m-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{L("No saved readiness result is available for this account yet. Complete the assessment and try again to load a real result from the server.")}</div>}
      </div>
    </div>
  );
}

export default function CareerJourneyView({ readiness = null, intelligence = null, roleTitle = null }) {
  const { L, isRtl } = useUiText();
  const roadmap = intelligence?.roadmap ?? intelligence?.data?.roadmap ?? null;
  const skillGaps = intelligence?.skill_gaps ?? intelligence?.skillGaps ?? intelligence?.data?.skill_gaps ?? null;
  // `/readiness` and `/intelligence` both carry a readiness block; prefer the
  // dedicated endpoint and fall back to the intelligence payload.
  const readinessSource =
    readiness ?? intelligence?.readiness ?? intelligence?.data?.readiness ?? null;
  // Everything below is normalised once: the tabs render lookups that only
  // resolve for the mock model, while the API sends flat readiness fields and
  // snake_case enums.
  const roleVersion =
    readinessSource?.role_version ?? readinessSource?.roleVersion ?? intelligence?.role_version ?? "";
  const readinessData = normaliseReadiness(readinessSource, roleTitle || readinessSource?.role_title || "");
  const skillGapRows = normaliseSkillGaps(skillGaps);
  const roadmapActions = normaliseRoadmapActions(roadmap, skillGaps);
  const roadmapMilestones = Array.isArray(roadmap?.milestones) ? roadmap.milestones : [];
  // The roadmap only carries `next_best_action_id`, never a nested object, so the
  // banner is driven by the action flagged during normalisation.
  const nextBestAction = roadmapActions.find((action) => action.isNBA) ?? roadmapActions[0] ?? null;
  const [tab, setTab] = useState("readiness");
  const [demoState, setDemoState] = useState("loaded");
  const isLoaded = demoState === "loaded";
  const TABS = [
    { key: "readiness", label: "Readiness Score" },
    { key: "skill-gap", label: "Skill Gaps" },
    { key: "roadmap", label: "Career Roadmap" },
  ];
  const isError =
    demoState === "error" || demoState === "timeout" || demoState === "unavailable" || demoState === "invalid-config";
  const isIncomplete = demoState === "empty" || demoState === "incomplete" || demoState === "no-evidence";
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f0f6fc]">
      {/* Page header */}
      <div className="bg-[#f0f6fc] px-[16px] md:px-[32px] pt-[24px] pb-[14px] shrink-0 border-b border-[#e4ebf5]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-[26px] text-[#05103d] leading-tight">
              {L("Career Journey")}
            </h1>
            <p className="font-normal text-[13px] text-[#6b7593] mt-[3px]">
              {readinessData?.roleTitle ? (
                <>
                  {L("Readiness · Skill Gaps · Roadmap for")}{" "}
                  <span className="font-semibold text-[#05103d]">{readinessData.roleTitle}</span>{" "}
                </>
              ) : (
                isRtl ? (
                  <>
                    {L("Readiness · Skill Gaps · Roadmap")}
                    {" · "}
                    <span className="font-semibold text-[#05103d]">{L("No career role selected")}</span>
                  </>
                ) : (
                  <>
                    Readiness · Skill Gaps · Roadmap for{" "}
                    <span className="font-semibold text-[#05103d]">No career role selected</span>{" "}
                  </>
                )
              )}
              {roleVersion ? <span className="text-[#98a1ba]">v{roleVersion}</span> : null}
            </p>
          </div>
          {demoState === "historical" && (
            <div className="flex items-center gap-[6px] bg-[rgba(100,116,139,0.08)] border border-[rgba(100,116,139,0.18)] px-[12px] py-[7px] rounded-[10px]">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="#98a1ba" strokeWidth="1" />
                <path d="M6 3.5V6.5l1.5 1" stroke="#98a1ba" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-[12px] font-medium text-[#6b7593]">
                {L("Historical · 9 Sep 2026")}
              </span>
            </div>
          )}
        </div>
        {/* Tabs — always visible, dimmed when not loaded */}
        <div
          className={`flex items-center gap-[4px] mt-[14px] bg-[rgba(0,0,0,0.04)] p-[3px] rounded-[10px] w-fit max-w-full overflow-x-auto transition-opacity ${isLoaded ? "opacity-100" : "opacity-35 pointer-events-none"}`}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-[8px] md:px-[14px] py-[7px] rounded-[8px] text-[12px] md:text-[13px] font-medium transition-all whitespace-nowrap shrink-0
                ${tab === t.key ? "bg-white text-[#05103d] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#6b7593] hover:text-[#05103d]"}`}
            >
              {L(t.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[16px] md:px-[32px] py-[20px]">
        {demoState === "loading" && <LoadingState />}
        {isError && <ErrorState variant={demoState} />}
        {isIncomplete && <IncompleteState variant={demoState} />}
        {demoState === "historical" && <HistoricalState readiness={readinessData} onViewLatest={() => setDemoState("loaded")} />}
        {isLoaded && (
          <>
            {tab === "readiness" && (
              <>
                {nextBestAction ? <NBABanner action={nextBestAction} /> : null}
                {readinessData ? <ReadinessTab data={readinessData} /> : <div role="status" className="m-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{L("No saved readiness result is available for this account yet. Complete the assessment and try again to load a real result from the server.")}</div>}
              </>
            )}
            {tab === "skill-gap" && (skillGapRows.length > 0 ? <SkillGapTab gaps={skillGapRows} /> : <div role="status" className="m-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{L("Skill gap data is not available from the server yet.")}</div>)}
            {tab === "roadmap" && (roadmapActions.length > 0 ? <RoadmapTab actions={roadmapActions} milestones={roadmapMilestones} roadmap={roadmap} /> : <div role="status" className="m-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{L("No saved roadmap is available from the server yet.")}</div>)}
          </>
        )}
      </div>

   </div>
  );
}