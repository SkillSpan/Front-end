import { useState } from "react";
import { SKILL_META, STATUS_META, TYPE_META } from "./lib/evidenceMeta";
import { useUiText } from "../../i18n/useUiText";

const ICONS = {
  Python: "/figma-icons/Python.png",
  React: "/figma-icons/React.png",
  JavaScript: "/figma-icons/JavaScript.png",
  TypeScript: "/figma-icons/TypeScript.png",
  SQL: "/figma-icons/SQL.png",
};
const TYPE_ICONS = {
  github: "/figma-icons/GitHub Repository.png",
  live: "/figma-icons/Live Deployment.png",
  design: "/figma-icons/Design File.png",
  document: "/figma-icons/Document.png",
};

export function BrandLogo({ compact = false, dark = false }) {
  return <span className={`inline-flex items-center gap-3 ${dark ? "text-white" : "text-[#101828]"}`}>
    <img src="/figma-icons/SkillSpan.png" alt="SkillSpan" className={`${compact ? "h-11 w-11" : "h-14 w-14"} rounded-[8px] object-contain`} />
    {!compact && <span className="text-xl font-bold tracking-[-.02em]">SkillSpan</span>}
  </span>;
}

// Renders a PNG icon and — if it fails to load — swaps to the Lucide fallback
// instead of leaving blank space, so an icon is always visibly present.
function AssetIcon({ src, size, label, FallbackIcon, fallbackProps = {} }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) {
    if (!FallbackIcon) return null;
    return <FallbackIcon size={size} aria-hidden={!label} {...fallbackProps} />;
  }
  return <img src={src} width={size} height={size} alt={label || ""} aria-hidden={!label} className="object-contain" onError={() => setBroken(true)} />;
}

export function SkillIcon({ skill, size = 30 }) {
  const meta = SKILL_META[skill] || SKILL_META.default;
  const src = ICONS[skill];
  return <span className="inline-flex shrink-0 items-center justify-center rounded-[5px] border border-[#d8dbe2] bg-white text-[#111827]" style={{ width: size, height: size }} aria-label={`${skill} icon`}>
    <AssetIcon src={src} size={Math.round(size * 0.72)} label={`${skill} icon`} FallbackIcon={meta.Icon} fallbackProps={{ strokeWidth: 2.15, size: Math.round(size * 0.58) }} />
  </span>;
}

export function TypeIcon({ type, size = 16 }) {
  const meta = TYPE_META[type] || TYPE_META.document;
  const src = TYPE_ICONS[type];
  return <AssetIcon src={src} size={size} label={meta.label} FallbackIcon={meta.Icon} fallbackProps={{ size, strokeWidth: 2 }} />;
}

const SOURCE_LABELS = { assessment_test: "Baseline assessment", assessment: "Assessment", project: "Project" };

export function TypeBadge({ type, source = "", className = "" }) {
  const { L } = useUiText();
  const meta = TYPE_META[type];
  const label = meta ? meta.label : (SOURCE_LABELS[source] || (source ? "Assessment" : ""));
  if (!label) return null;
  return <span className={`inline-flex items-center rounded-[6px] border border-[#E4EBF5] bg-[#F5F8FD] px-2 py-0.5 text-[11px] font-medium text-[#334155] ${className}`}>
    {L(label)}
  </span>;
}

export function StatusBadge({ status, size = "md" }) {
  const { L } = useUiText();
  const meta = STATUS_META[status] || STATUS_META.pending;
  const colors = { pending: "#b77900", approved: "#07834f", rejected: "#c52828", revision: "#6941c6" };
  const color = colors[status] || colors.pending;
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${size === "sm" ? "text-[11px]" : "text-[12px]"}`} style={{ color, borderColor: `${color}35`, backgroundColor: `${color}0d` }}>
    {L(meta.label)}
  </span>;
}

export function SectionLabel({ children }) { return <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-[var(--soft)]">{children}</p>; }
export function Avatar({ name, tone = "blue", size = 32 }) { const tones = { blue: "bg-[var(--blue)]", violet: "bg-[#7f56d9]" }; return <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${tones[tone] || tones.blue}`} style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }} aria-hidden="true">{name?.slice(0, 1)?.toUpperCase() || "?"}</span>; }

// Category icon (e.g. "Programming & Languages"). On dark backgrounds it gets
// a light chip behind it and an inverted filter — the source PNG is a dark
// glyph that otherwise disappears against the navy sidebar.
export function CategoryIcon({ size = 14, dark = false }) {
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-[4px] ${dark ? "bg-white/12" : "bg-[#f2f4f7]"}`} style={{ width: size + 8, height: size + 8 }}>
    <img
      src="/figma-icons/Programming &languages.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="object-contain"
      style={dark ? { filter: "invert(1) brightness(1.6)" } : undefined}
      onError={(event) => { event.currentTarget.style.display = "none"; }}
    />
  </span>;
}

export default BrandLogo;

export function AppHeader({ action }) {
  return <header className="border-b border-[#1c2748] bg-[var(--navy)] text-white"><div className="mx-auto flex min-h-[76px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8"><BrandLogo dark /><div className="flex items-center gap-3">{action}</div></div></header>;
}
