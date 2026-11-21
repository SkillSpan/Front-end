import { useState } from "react";
import { fmt, truncate } from "./lib/evidenceMeta";
import { StatusBadge, TypeBadge } from "./Shared";
import { useUiText } from "../../i18n/useUiText";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "revision", label: "Revision" },
];

const BTN = "inline-flex h-9 items-center rounded-[8px] bg-[#1667E0] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0f52ba] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1667e0]/40";

export default function EvidenceStatus({ evidence = [], onAdd = () => {}, onOpen = () => {} }) {
  const { L, lang } = useUiText();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const records = Array.isArray(evidence) ? evidence : [];
  const counts = TABS.reduce((acc, tab) => ({ ...acc, [tab.key]: tab.key === "all" ? records.length : records.filter((item) => item.status === tab.key).length }), {});
  const shown = records.filter((item) => (filter === "all" || item.status === filter) && `${item.skill} ${item.type || ""} ${item.description} ${item.url}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="text-[#0B1B3F]">
    <div className="mx-auto max-w-[1180px] pb-12">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-semibold tracking-[-.02em] text-[#0B1B3F]">{L("Evidence Status")}</h1>
          <p className="m-0 mt-1 text-[13px] text-[#64748B]">{L("Track review progress for all submitted evidence")}</p>
        </div>
        <button type="button" onClick={() => onAdd()} className={BTN}>{L("Add Evidence")}</button>
      </header>
      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-[#E4EBF5] pb-3" role="tablist" aria-label={L("Evidence status filters")}>
        {TABS.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={filter === tab.key} onClick={() => setFilter(tab.key)} className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1667e0]/30 ${filter === tab.key ? "border border-[#E4EBF5] bg-white font-semibold text-[#0B1B3F]" : "text-[#64748B] hover:bg-white hover:text-[#0B1B3F]"}`}>{L(tab.label)}<bdi dir="ltr" className={`min-w-4 rounded-[4px] px-1 text-center text-[11px] ${filter === tab.key ? "bg-[#EEF3FB] text-[#334155]" : "text-[#94A3B8]"}`}>{counts[tab.key]}</bdi></button>)}
        <label className="ms-auto flex h-8 w-[180px] items-center rounded-[8px] border border-[#E4EBF5] bg-white px-3 focus-within:border-[#1667e0] sm:w-[220px]">
          <input aria-label={L("Search evidence")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={L("Search evidence")} className="w-full bg-transparent text-[12px] text-[#0B1B3F] outline-none placeholder:text-[#94A3B8]" />
        </label>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p className="m-0 text-[13px] font-semibold text-[#334155]">{L("Submitted evidence")} <span className="font-normal text-[#94A3B8]">(<bdi dir="ltr">{shown.length}</bdi>)</span></p>
      </div>
      <div className="space-y-3">{records.length === 0
        ? <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[#E4EBF5] bg-white px-5 py-16 text-center"><p className="m-0 text-[13px] text-[#64748B]">{L("No evidence submitted yet.")}</p><button type="button" onClick={() => onAdd()} className={BTN}>{L("Add Evidence")}</button></div>
        : shown.length === 0
          ? <div className="rounded-[16px] border border-[#E4EBF5] bg-white px-5 py-16 text-center text-[13px] text-[#64748B]">{L("No evidence in this category yet.")}</div>
          : shown.map((record) => {
            const submitted = fmt(record.submittedAt, lang);
            const reviewed = fmt(record.reviewedAt, lang);
            return <article key={record.id} role="button" tabIndex={0} onClick={() => onOpen(record.id)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onOpen(record.id)} className="group relative rounded-[16px] border border-[#E4EBF5] bg-white px-5 py-4 transition hover:border-[#C9D7EE] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1667e0]/35">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-[14px] font-semibold text-[#0B1B3F]" dir="auto">{record.skill}</h2><TypeBadge type={record.type} source={record.source} /></div>
                  {record.description && <p className="m-0 mt-1 line-clamp-2 text-[12px] leading-5 text-[#64748B]" dir="auto">{record.description}</p>}
                  {record.url && <a href={record.url} target="_blank" rel="noreferrer" dir="ltr" onClick={(event) => event.stopPropagation()} className="mt-0.5 block truncate text-[12px] text-[#64748B] hover:text-[#1667e0] hover:underline rtl:text-right">{record.url}</a>}
                  {record.reviewNote && <div className="mt-2 rounded-[8px] border border-[#E4EBF5] bg-[#F5F8FD] px-3 py-2 text-[12px] leading-5 text-[#334155]"><span className="font-semibold">{L("Reviewer note:")} </span><span dir="auto">{truncate(record.reviewNote, 155)}</span></div>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 text-end">
                  <StatusBadge status={record.status} size="sm" />
                  {submitted && <p className="m-0 text-[12px] text-[#94A3B8]">{L("Submitted {date}", { date: submitted })}</p>}
                  {reviewed && <p className="m-0 text-[12px] text-[#94A3B8]">{record.reviewer ? L("Reviewed {date} by {name}", { date: reviewed, name: record.reviewer }) : L("Reviewed {date}", { date: reviewed })}</p>}
                  {(record.status === "rejected" || record.status === "revision") && <button type="button" onClick={(event) => { event.stopPropagation(); onAdd(record.id); }} className="mt-1 inline-flex items-center rounded-[8px] bg-[#1667E0] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#0f52ba]">{L("Resubmit Evidence")}</button>}
                </div>
              </div>
            </article>;
          })}</div>
    </div>
  </div>;
}
