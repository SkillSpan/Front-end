/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SEED_EVIDENCE } from "./lib/evidenceMeta";
import { fetchEvidence, sendEvidence, sendReview, toUiError } from "./lib/evidenceApi";

const EvidenceContext = createContext(null);

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Drop null/undefined/empty values so API records don't wipe out local fields.
function definedOnly(obj) {
  const out = {};
  Object.keys(obj || {}).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined && value !== "") out[key] = value;
  });
  return out;
}

function buildLocalItem(data) {
  const file = data.file;
  return {
    id: `ev-${Date.now()}`,
    skill: "",
    category: "",
    type: "github",
    description: "",
    level: "Lv 1/5",
    confidence: 0,
    ...data,
    url: data.url || (file && file.name) || "",
    status: "pending",
    submittedAt: today(),
    reviewedAt: null,
    reviewer: null,
    reviewNote: null,
  };
}

export function EvidenceProvider({ children }) {
  const [evidence, setEvidence] = useState([]);
  // 'loading' | 'preview' | 'api'
  const [source, setSource] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const alive = useRef(true);

  // Fetches data. Does not set state synchronously, so it is safe to call from an effect.
  const load = useCallback(async () => {
    try {
      const list = await fetchEvidence();
      if (!alive.current) return;
      if (list.length) {
        setEvidence(list);
        setSource("api");
      } else {
        setEvidence(SEED_EVIDENCE);
        setSource("preview");
      }
    } catch (err) {
      if (!alive.current) return;
      setEvidence(SEED_EVIDENCE);
      setLoadError((err && err.message) || "Network error");
      setSource("preview");
    }
  }, []);

  // Used by the Retry button.
  const reload = useCallback(() => {
    setLoadError("");
    setSource("loading");
    return load();
  }, [load]);

  useEffect(() => {
    alive.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const getEvidenceById = useCallback(
    (id) => evidence.find((item) => String(item.id) === String(id)) || null,
    [evidence]
  );

  const addEvidence = useCallback(
    async (data) => {
      const local = buildLocalItem(data);
      let item = local;
      if (source === "api") {
        try {
          const created = await sendEvidence({
            skillId: data.skillId,
            url: data.url,
            file: data.file || data.evidence_file,
            description: data.description,
          });
          item = { ...local, ...definedOnly(created), status: (created && created.status) || "pending" };
        } catch (err) {
          throw toUiError(err);
        }
      }
      setEvidence((prev) => [item, ...prev]);
      return item;
    },
    [source]
  );

  const updateEvidence = useCallback((id, changes) => {
    setEvidence((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, ...changes } : item))
    );
  }, []);

  const reviewEvidence = useCallback(
    async (id, status, reviewNote = "", reviewer = "Reviewer") => {
      let changes = { status, reviewNote, reviewer, reviewedAt: today() };
      if (source === "api") {
        try {
          const updated = await sendReview(id, status, reviewNote);
          changes = { ...changes, ...definedOnly(updated), status };
        } catch (err) {
          throw toUiError(err);
        }
      }
      updateEvidence(id, changes);
      return changes;
    },
    [source, updateEvidence]
  );

  const resubmitEvidence = useCallback(
    (id, changes = {}) => {
      updateEvidence(id, {
        ...changes,
        status: "pending",
        submittedAt: today(),
        reviewedAt: null,
        reviewer: null,
        reviewNote: null,
      });
    },
    [updateEvidence]
  );

  const removeEvidence = useCallback((id) => {
    setEvidence((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }, []);

  // Used by AddEvidencePage: onSubmit -> saveEvidence(payload).
  // If the payload points at an existing record (resubmit), that record is
  // replaced and goes back to "pending"; otherwise a new record is created.
  const saveEvidence = useCallback(
    async (payload) => {
      const data = payload || {};
      const resubmitId =
        data.resubmitId || data.resubmit || (data.resubmitRecord && data.resubmitRecord.id) || null;
      const item = await addEvidence(data);
      if (resubmitId) {
        setEvidence((prev) =>
          prev.filter((r) => String(r.id) !== String(resubmitId) || String(r.id) === String(item.id))
        );
      }
      return item;
    },
    [addEvidence]
  );

  // Used by ReviewerPage: onDecide. Accepts (id, status, note) or ({ id, status, note }).
  const decideEvidence = useCallback(
    (a, b, c) => {
      if (a && typeof a === "object") {
        const note = a.note || a.notes || a.reviewNote || a.reviewer_notes || "";
        return reviewEvidence(a.id, a.status || a.decision, note);
      }
      return reviewEvidence(a, b, c || "");
    },
    [reviewEvidence]
  );

  const value = useMemo(
    () => ({
      evidence,
      items: evidence,
      source,
      loadError,
      reload,
      getEvidenceById,
      addEvidence,
      updateEvidence,
      reviewEvidence,
      resubmitEvidence,
      removeEvidence,
      saveEvidence,
      decideEvidence,
    }),
    [evidence, source, loadError, reload, getEvidenceById, addEvidence, updateEvidence, reviewEvidence, resubmitEvidence, removeEvidence, saveEvidence, decideEvidence]
  );

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

export function useEvidence() {
  const context = useContext(EvidenceContext);
  if (!context) {
    throw new Error("useEvidence must be used inside <EvidenceProvider>");
  }
  return context;
}

export default EvidenceProvider;