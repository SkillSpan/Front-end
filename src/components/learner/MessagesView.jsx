import { useCallback, useEffect, useMemo, useState } from "react";
import { getLearnerMessages, unwrapApiData } from "../../api";
import { useUiText } from "../../i18n/useUiText";

// The learner's inbox: messages companies sent, newest first.
//
// READ-ONLY ON PURPOSE. There is no reply box, no accept and no decline,
// because the backend exposes none of those — a company message is something
// the learner reads, not a request that is waiting on them. Adding a composer
// here would create a screen that lies about what the API can do.

const PAGE_SIZE = 20;

function rows(payload) {
  const raw = unwrapApiData(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function meta(payload) {
  return payload?.meta && typeof payload.meta === "object" ? payload.meta : {};
}

function formatWhen(iso, L = (s, v) => (v ? Object.entries(v).reduce((a, [k, x]) => a.split(`{${k}}`).join(String(x)), s) : s), lang = "en") {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return L("just now");
  if (minutes < 60) return L("{n}m ago", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return L("{n}h ago", { n: hours });
  const days = Math.round(hours / 24);
  if (days < 7) return L("{n}d ago", { n: days });
  return date.toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

function MessageCard({ row }) {
  const { L, lang } = useUiText();
  const from = row?.from || {};
  const company = from.organization_name || L("A company");
  const sender = from.sender_name || "";

  return (
    <article
      data-testid="learner-message"
      className="rounded-[12px] border border-[#e4ebf5] bg-white px-[16px] py-[14px]"
    >
      <header className="flex items-start gap-[10px] mb-[8px]">
        <div
          className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold text-white"
          style={{ background: "#1667e0" }}
        >
          {initials(company)}
        </div>
        <div className="min-w-0 flex-1">
          <p
            data-testid="learner-message-company"
            className="font-semibold text-[13px] text-[#05103d] truncate"
          >
            {company}
          </p>
          <p className="text-[11px] font-normal text-[#98a1ba] mt-[1px]">
            {sender ? `${sender} · ` : ""}
            <span data-testid="learner-message-when"><bdi>{formatWhen(row?.created_at, L, lang)}</bdi></span>
          </p>
        </div>
      </header>
      <p
        data-testid="learner-message-body"
        className="text-[12.5px] leading-[1.65] text-[#334155] whitespace-pre-wrap break-words"
      >
        {row?.message}
      </p>
    </article>
  );
}

export default function MessagesView() {
  const { L } = useUiText();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (targetPage, { append } = {}) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const payload = await getLearnerMessages({ page: targetPage, perPage: PAGE_SIZE });
      const next = rows(payload);
      const m = meta(payload);

      setItems((prev) => (append ? [...prev, ...next] : next));
      setPage(Number(m.current_page) || targetPage);
      setLastPage(Number(m.last_page) || targetPage);
      setTotal(Number(m.total) || (append ? 0 : next.length));
    } catch (err) {
      setError(err);
      if (!append) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; load() resets loading/error before its request
    load(1);
  }, [load]);

  const hasMore = useMemo(() => page < lastPage, [page, lastPage]);

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-[#f0f6fc]">
      <div className="bg-white border-b border-[#e4ebf5] px-[24px] py-[13px] shrink-0 min-h-[70px] flex items-center">
        <div>
          <h1 className="font-bold text-[17px] text-[#05103d]">{L("Messages")}</h1>
          <p className="text-[12px] font-normal text-[#98a1ba] mt-[2px]">
            {L("Messages companies sent you. This inbox is read-only.")}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[24px] py-[18px]">
        <div className="max-w-[760px] flex flex-col gap-[10px]">
          {loading && (
            <p data-testid="learner-messages-loading" className="text-[12px] text-[#98a1ba]">
              {L("Loading your messages…")}
            </p>
          )}

          {!loading && error && (
            <div
              data-testid="learner-messages-error"
              className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-[14px] py-[12px] text-[12px] text-[#991b1b]"
            >
              <p>{L("We could not load your messages.")}</p>
              <button
                type="button"
                onClick={() => load(1)}
                className="mt-[8px] rounded-[7px] border border-[#fecaca] bg-white px-[10px] py-[4px] text-[11px] font-medium text-[#991b1b]"
              >
                {L("Try again")}
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div
              data-testid="learner-messages-empty"
              className="rounded-[12px] border border-dashed border-[#d8dce6] bg-white px-[18px] py-[26px] text-center"
            >
              <p className="font-semibold text-[13px] text-[#05103d]">
                {L("No messages yet")}
              </p>
              <p className="mt-[4px] text-[12px] text-[#98a1ba]">
                {L("When a company writes to you, their message will appear here.")}
              </p>
            </div>
          )}

          {!loading &&
            items.map((row) => <MessageCard key={row.id} row={row} />)}

          {hasMore && !loading && !error && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load(page + 1, { append: true })}
              className="self-center rounded-[8px] border border-[#e4ebf5] bg-white px-[14px] py-[6px] text-[11.5px] font-medium text-[#3b4565] disabled:opacity-60"
            >
              {loadingMore ? L("Loading…") : L("Load older messages")}
            </button>
          )}

          {!loading && !error && items.length > 0 && total > items.length && (
            <p className="self-center text-[11px] text-[#b6bdcc]">
              {L("Showing {a} of {b}", { a: items.length, b: total })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
