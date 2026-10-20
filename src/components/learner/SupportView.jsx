import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createSupportRequest,
  getSupportRequest,
  getSupportRequests,
  sendSupportMessage,
  unwrapApiData,
} from "../../api";
import { useAuth } from "../auth/AuthContext";
import { SUPPORT_CREATED_EVENT } from "./SupportWaitingToast";

// The support thread is the only place a learner can read what the support
// team wrote back. Replies arrive out of band (the assistant hands off, an
// administrator answers from the panel), so the view polls instead of relying
// on the learner to reload the page.
const POLL_MS = 30000;
const MAX_BODY = 4000;

const STATUS_META = {
  pending: { label: "Waiting for support", color: "#b45309", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" },
  assigned: { label: "Support is on it", color: "#3b8bff", bg: "rgba(59,139,255,0.10)", border: "rgba(59,139,255,0.22)" },
  resolved: { label: "Resolved", color: "#059669", bg: "rgba(5,150,105,0.10)", border: "rgba(5,150,105,0.20)" },
  closed: { label: "Closed", color: "#64748b", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.20)" },
};

const OPEN_STATUSES = ["pending", "assigned"];

function collection(payload) {
  const raw = unwrapApiData(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function formatWhen(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatClock(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full px-[8px] py-[2px] text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold shrink-0"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function initials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "?";
  return clean.split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function MessageRow({ message, mine }) {
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-[10px]">
        <p className="max-w-[80%] rounded-full bg-[#f1f3fa] border border-[#e8eaf0] px-[12px] py-[6px] text-center text-[10.5px] leading-[1.5] text-[#64748b]">
          {message.body}
        </p>
      </div>
    );
  }

  const sender = message.sender_name || (mine ? "You" : "Support team");

  return (
    <div className={`flex gap-[8px] mb-[10px] ${mine ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
        style={{ background: mine ? "linear-gradient(135deg,#3b8bff,#7c3aed)" : "#0f172a" }}
      >
        {initials(sender)}
      </div>
      <div className={`max-w-[76%] min-w-0 ${mine ? "items-end" : "items-start"} flex flex-col`}>
        <div className="flex items-center gap-[6px] mb-[3px]">
          <span className="text-[10px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b]">{sender}</span>
          <span className="text-[9.5px] text-[#b6bdcc]">{formatClock(message.created_at)}</span>
        </div>
        <div
          className={`rounded-[12px] px-[12px] py-[8px] text-[12px] leading-[1.6] whitespace-pre-wrap break-words ${
            mine ? "text-white" : "text-[#0a0b14] bg-white border border-[#e8eaf0]"
          }`}
          style={mine ? { background: "linear-gradient(135deg,#3b8bff,#5b6bf0)" } : undefined}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

function TranscriptBlock({ transcript }) {
  const turns = Array.isArray(transcript) ? transcript.filter((turn) => turn && turn.body) : [];
  if (!turns.length) return null;

  return (
    <details className="mb-[12px] rounded-[10px] border border-[#e8eaf0] bg-white px-[12px] py-[9px]">
      <summary className="cursor-pointer text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#64748b]">
        Assistant conversation that was handed over ({turns.length} {turns.length === 1 ? "message" : "messages"})
      </summary>
      <div className="mt-[9px] flex flex-col gap-[6px] max-h-[220px] overflow-y-auto">
        {turns.map((turn, index) => (
          <div key={index} className="text-[11px] leading-[1.55] text-[#475569]">
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14]">
              {turn.role === "assistant" ? "Assistant" : "You"}:
            </span>{" "}
            {turn.body}
          </div>
        ))}
      </div>
    </details>
  );
}

export default function SupportView({ initialRequestId = null }) {
  const { authUser } = useAuth();
  const myId = authUser?.id != null ? String(authUser.id) : "";

  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState(initialRequestId ? Number(initialRequestId) : null);
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [composerError, setComposerError] = useState("");
  const [composerBusy, setComposerBusy] = useState(false);

  const [unread, setUnread] = useState({});

  // `id -> last_message_at the learner has already looked at`. Seeded on the
  // first list load so a thread is never flagged unread before it was ever
  // opened, and bumped whenever the thread is opened or replied to.
  const seenRef = useRef({});
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const markSeen = useCallback((id, stamp) => {
    if (id == null) return;
    seenRef.current[id] = stamp || "";
    setUnread((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const loadList = useCallback(async ({ silent = false } = {}) => {
    try {
      const payload = await getSupportRequests({ page: 1, perPage: 50 });
      if (!aliveRef.current) return;
      const rows = collection(payload);
      setRequests(rows);
      setListError("");

      const flagged = {};
      rows.forEach((row) => {
        const stamp = row.last_message_at || row.created_at || "";
        const known = seenRef.current[row.id];
        if (known === undefined) {
          seenRef.current[row.id] = stamp;
          return;
        }
        if (stamp && stamp !== known) flagged[row.id] = true;
      });
      setUnread((prev) => ({ ...prev, ...flagged }));

      // Fall back to the newest thread so the pane is never blank while a
      // request exists.
      setSelectedId((prev) => (prev == null && rows.length ? rows[0].id : prev));
    } catch (err) {
      if (!aliveRef.current) return;
      if (!silent) setListError(err?.message || "Your support requests could not be loaded.");
    } finally {
      if (aliveRef.current) setListLoading(false);
    }
  }, []);

  const loadThread = useCallback(
    async (id) => {
      if (id == null) return;
      try {
        const payload = await getSupportRequest(id);
        if (!aliveRef.current) return;
        const row = unwrapApiData(payload) || null;
        setThread(row);
        setThreadError("");
        if (row) markSeen(row.id, row.last_message_at || row.created_at);
      } catch (err) {
        if (!aliveRef.current) return;
        setThreadError(err?.message || "This support request could not be loaded.");
      }
    },
    [markSeen],
  );

  // Both loaders `await` before they touch state, so neither can cascade a
  // synchronous render — the rule cannot see past the await and over-reports.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
  }, [loadList]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId != null) loadThread(selectedId);
  }, [selectedId, loadThread]);

  // Keep the open thread current: an administrator's reply lands here without
  // the learner having to reload anything.
  useEffect(() => {
    const timer = setInterval(() => {
      loadList({ silent: true });
      if (selectedId != null) loadThread(selectedId);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadList, loadThread, selectedId]);

  // A thread belongs to the selection that fetched it; while a different one is
  // in flight the pane shows the loading state instead of the old conversation.
  const activeThread = thread && String(thread.id) === String(selectedId) ? thread : null;
  const threadLoading = selectedId != null && !activeThread && !threadError;

  const selectedRequest = useMemo(
    () => requests.find((row) => String(row.id) === String(selectedId)) || null,
    [requests, selectedId],
  );

  const activeStatus = activeThread?.status || selectedRequest?.status || "pending";
  const threadOpen = OPEN_STATUSES.includes(activeStatus);
  const openRequestExists = requests.some((row) => OPEN_STATUSES.includes(row.status));
  const messages = Array.isArray(activeThread?.messages) ? activeThread.messages : [];

  const selectRequest = (id) => {
    setSendError("");
    setThreadError("");
    setSelectedId(id);
  };

  const handleSend = async (event) => {
    event?.preventDefault?.();
    const body = draft.trim();
    if (!body || selectedId == null || sending) return;
    setSending(true);
    setSendError("");
    try {
      const payload = await sendSupportMessage(selectedId, body);
      const created = unwrapApiData(payload);
      if (!aliveRef.current) return;
      setDraft("");
      setThread((prev) => {
        if (!prev || String(prev.id) !== String(selectedId)) return prev;
        const list = Array.isArray(prev.messages) ? prev.messages : [];
        if (created?.id && list.some((message) => message.id === created.id)) return prev;
        return {
          ...prev,
          messages: [
            ...list,
            created || { id: `local-${Date.now()}`, body, sender_id: authUser?.id, created_at: new Date().toISOString() },
          ],
          last_message_at: created?.created_at || new Date().toISOString(),
        };
      });
      markSeen(selectedId, created?.created_at || new Date().toISOString());
      loadList({ silent: true });
    } catch (err) {
      if (aliveRef.current) setSendError(err?.message || "The message could not be sent. Please try again.");
    } finally {
      if (aliveRef.current) setSending(false);
    }
  };

  const handleCreate = async (event) => {
    event?.preventDefault?.();
    const body = composerBody.trim();
    if (!body || composerBusy) return;
    setComposerBusy(true);
    setComposerError("");
    try {
      const payload = await createSupportRequest({
        reason: "learner_requested",
        subject: composerSubject.trim() || undefined,
      });
      const created = unwrapApiData(payload) || {};
      if (created?.id == null) throw new Error("The support request could not be created.");
      await sendSupportMessage(created.id, body);
      if (!aliveRef.current) return;
      // The handoff assigns the learner's connected mentor when there is one,
      // so `assignee_name` is already known here — that is the name the banner
      // greets the learner with.
      window.dispatchEvent(
        new CustomEvent(SUPPORT_CREATED_EVENT, {
          detail: { id: created.id, name: created.assignee_name || "", status: created.status },
        }),
      );
      setComposerSubject("");
      setComposerBody("");
      setComposerOpen(false);
      selectRequest(Number(created.id));
      await loadList({ silent: true });
      await loadThread(Number(created.id));
    } catch (err) {
      if (aliveRef.current) setComposerError(err?.message || "The request could not be created. Please try again.");
    } finally {
      if (aliveRef.current) setComposerBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-[#f1f3fa]">
      <div className="bg-white border-b border-[#e8eaf0] px-[24px] py-[13px] flex items-center justify-between shrink-0 min-h-[70px]">
        <div>
          <h1 className="font-['Inter:Bold',sans-serif] font-bold text-[17px] text-[#0a0b14]">Support</h1>
          <p className="text-[12px] font-['Inter:Regular',sans-serif] text-[#94a3b8] mt-[2px]">
            Replies from the SkillSpan support team stay in this thread.
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => {
              setListLoading(true);
              loadList();
            }}
            className="h-[30px] px-[11px] rounded-[8px] border border-[#e8eaf0] bg-white text-[11px] font-['Inter:Medium',sans-serif] font-medium text-[#475569] hover:border-[rgba(59,139,255,0.35)] hover:text-[#3b8bff] transition-colors"
          >
            Refresh
          </button>
          {!openRequestExists && (
            <button
              type="button"
              onClick={() => {
                setComposerOpen((value) => !value);
                setComposerError("");
              }}
              className="h-[30px] px-[12px] rounded-[8px] text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3b8bff,#5b6bf0)" }}
            >
              {composerOpen ? "Cancel" : "New request"}
            </button>
          )}
        </div>
      </div>

      {composerOpen && (
        <form onSubmit={handleCreate} className="shrink-0 bg-white border-b border-[#e8eaf0] px-[24px] py-[14px]">
          <p className="text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#94a3b8] uppercase tracking-wide mb-[8px]">
            Ask the support team
          </p>
          <input
            value={composerSubject}
            onChange={(event) => setComposerSubject(event.target.value)}
            maxLength={180}
            placeholder="Subject (optional)"
            className="w-full h-[32px] rounded-[8px] border border-[#e8eaf0] bg-[#f8f9fd] px-[10px] text-[12px] text-[#0a0b14] placeholder-[#94a3b8] outline-none focus:border-[rgba(59,139,255,0.4)] mb-[8px]"
          />
          <textarea
            value={composerBody}
            onChange={(event) => setComposerBody(event.target.value)}
            maxLength={MAX_BODY}
            rows={3}
            placeholder="Describe what you need help with…"
            className="w-full rounded-[8px] border border-[#e8eaf0] bg-[#f8f9fd] px-[10px] py-[8px] text-[12px] leading-[1.55] text-[#0a0b14] placeholder-[#94a3b8] outline-none resize-none focus:border-[rgba(59,139,255,0.4)]"
          />
          {composerError && <p className="mt-[6px] text-[11px] text-red-600">{composerError}</p>}
          <div className="mt-[8px] flex items-center justify-end">
            <button
              type="submit"
              disabled={!composerBody.trim() || composerBusy}
              className="h-[30px] px-[14px] rounded-[8px] text-[11px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#3b8bff,#5b6bf0)" }}
            >
              {composerBusy ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      )}

      {listError && (
        <div role="alert" className="mx-[20px] mt-[12px] rounded-[10px] border border-red-200 bg-red-50 px-[12px] py-[9px] text-[11.5px] text-red-700">
          {listError}
        </div>
      )}

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Requests list */}
        <div className="w-[290px] shrink-0 bg-white border-r border-[#e8eaf0] flex flex-col min-h-0">
          <div className="px-[14px] py-[10px] border-b border-[#e8eaf0] shrink-0">
            <p className="text-[10.5px] font-['Inter:Semi_Bold',sans-serif] font-semibold uppercase tracking-wide text-[#94a3b8]">
              My requests {requests.length ? `(${requests.length})` : ""}
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {listLoading && <p className="px-[14px] py-[12px] text-[11.5px] text-[#94a3b8]">Loading…</p>}
            {!listLoading && !requests.length && (
              <div className="px-[14px] py-[16px]">
                <p className="text-[11.5px] leading-[1.6] text-[#64748b]">
                  No support requests yet. Ask the AI assistant for help — when it cannot answer, it offers to
                  transfer you to a person and the thread appears here.
                </p>
              </div>
            )}
            {requests.map((row) => {
              const isActive = String(row.id) === String(selectedId);
              const hasUnread = Boolean(unread[row.id]);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => selectRequest(row.id)}
                  className={`w-full text-left px-[14px] py-[11px] border-b border-[#f1f3fa] transition-colors ${
                    isActive ? "bg-[rgba(59,139,255,0.07)] border-l-2 border-l-[#3b8bff]" : "hover:bg-[#f8f9fd] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-[6px]">
                    <span className="text-[12px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] truncate">
                      {row.subject || `Support request #${row.id}`}
                    </span>
                    {hasUnread && <span className="mt-[4px] w-[6px] h-[6px] rounded-full bg-[#3b8bff] shrink-0" />}
                  </div>
                  <div className="mt-[5px] flex items-center gap-[6px]">
                    <StatusChip status={row.status} />
                    {/* A mentor is attached to this thread, so somebody is
                        actually on the other end waiting for an answer. */}
                    {row.status === "assigned" && (
                      <span className="ss-waiting-pill">
                        <span className="ss-waiting-dot" />
                        Waiting for you
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-[#b6bdcc] shrink-0">
                      {formatWhen(row.last_message_at || row.created_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#f8f9fd]">
          {threadLoading && <p className="px-[20px] py-[16px] text-[12px] text-[#94a3b8]">Loading the conversation…</p>}

          {threadError && (
            <div role="alert" className="m-[20px] rounded-[10px] border border-red-200 bg-red-50 px-[12px] py-[9px] text-[11.5px] text-red-700">
              {threadError}
            </div>
          )}

          {!threadLoading && !threadError && !activeThread && (
            <div className="flex-1 flex items-center justify-center px-[24px]">
              <p className="max-w-[380px] text-center text-[12px] leading-[1.7] text-[#94a3b8]">
                Select a request to read the conversation with the support team.
              </p>
            </div>
          )}

          {activeThread && (
            <>
              <div className="shrink-0 bg-white border-b border-[#e8eaf0] px-[20px] py-[11px] flex items-center justify-between gap-[10px]">
                <div className="min-w-0">
                  <h2 className="text-[13px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#0a0b14] truncate">
                    {activeThread.subject || `Support request #${activeThread.id}`}
                  </h2>
                  <p className="text-[10.5px] text-[#94a3b8] mt-[1px]">
                    Opened {formatWhen(activeThread.created_at)}
                    {activeThread.assignee_name ? ` · ${activeThread.assignee_name} is helping you` : ""}
                  </p>
                </div>
                <StatusChip status={activeThread.status} />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-[20px] py-[14px]">
                <TranscriptBlock transcript={activeThread.transcript} />
                {messages.length === 0 && (
                  <p className="text-[11.5px] text-[#94a3b8]">No messages in this thread yet.</p>
                )}
                {messages.map((message) => (
                  <MessageRow key={message.id} message={message} mine={String(message.sender_id) === myId} />
                ))}
              </div>

              <div className="shrink-0 bg-white border-t border-[#e8eaf0] px-[16px] py-[12px]">
                {threadOpen ? (
                  <form onSubmit={handleSend} className="flex items-end gap-[8px]">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      maxLength={MAX_BODY}
                      placeholder="Write a reply to the support team…"
                      className="flex-1 min-h-[34px] max-h-[110px] rounded-[10px] border border-[#e8eaf0] bg-[#f8f9fd] px-[11px] py-[8px] text-[12px] leading-[1.5] text-[#0a0b14] placeholder-[#94a3b8] outline-none resize-none focus:border-[rgba(59,139,255,0.4)]"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="h-[34px] px-[14px] rounded-[10px] text-[11.5px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-white shrink-0 disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg,#3b8bff,#5b6bf0)" }}
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </form>
                ) : (
                  <p className="text-[11.5px] text-[#64748b]">
                    This request is {activeStatus}. Open a new request if you still need help.
                  </p>
                )}
                {sendError && <p className="mt-[6px] text-[11px] text-red-600">{sendError}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
