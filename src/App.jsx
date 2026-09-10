import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AddEvidence from "./components/AddEvidence";
import ErrorState from "./components/ErrorState";
import EvidenceDetail from "./components/EvidenceDetail";
import EvidenceStatus from "./components/EvidenceStatus";
import ReviewerDashboard from "./components/ReviewerDashboard";
import { SEED_EVIDENCE } from "./lib/evidenceMeta";
import { listEvidence, reviewEvidence, submitEvidence } from "./lib/api";

function SkillSpanRoutes() {
  const navigate = useNavigate();
  const [evidence, setEvidence] = useState(() => SEED_EVIDENCE.map((item) => ({ ...item })));
  const [resubmitId, setResubmitId] = useState(null);
  const [apiState, setApiState] = useState({ status: "local", message: "Local preview data — no API token configured" });
  const apiToken = import.meta.env.VITE_API_TOKEN;

  const loadEvidence = useCallback(() => {
    if (!apiToken) { setApiState({ status: "local", message: "Local preview data — no API token configured" }); return; }
    setApiState({ status: "loading", message: "Connecting to SkillSpan API…" });
    listEvidence(apiToken)
      .then((records) => {
        setEvidence(records.length ? records : SEED_EVIDENCE.map((item) => ({ ...item })));
        setApiState({ status: "connected", message: "Connected to SkillSpan API" });
      })
      .catch((error) => {
        // Keep whatever data we already had (seed or last-known list) — never crash to a blank screen.
        setApiState({ status: "error", message: error.message || "API connection failed" });
      });
  }, [apiToken]);

  useEffect(() => { loadEvidence(); }, [loadEvidence]);

  function openAddEvidence(id = null) { setResubmitId(id); navigate("/add"); }

  async function saveEvidence(payload) {
    if (apiToken) {
      // Real API path: send to the backend and use whatever it returns as the source of truth.
      const saved = await submitEvidence({
        skill_id: payload.skillId,
        evidence_url: payload.evidence_file ? undefined : payload.url,
        evidence_file: payload.evidence_file,
        description: payload.description,
        evidence_date: new Date().toISOString().slice(0, 10),
      }, apiToken);
      setEvidence((current) => {
        const fallback = { ...saved, skill: saved.skill || payload.skill, category: saved.category || payload.category, level: saved.level || payload.level, confidence: saved.confidence || payload.confidence };
        if (payload.id) return current.map((item) => (item.id === payload.id ? { ...item, ...fallback } : item));
        return [{ ...fallback, id: fallback.id || `ev-${Date.now()}` }, ...current];
      });
      setResubmitId(null);
      navigate("/");
      return;
    }
    // No token configured — keep the learner moving in preview mode instead of blocking them.
    const submittedAt = new Date().toISOString().slice(0, 10);
    setEvidence((current) => payload.id
      ? current.map((item) => item.id === payload.id ? { ...item, ...payload, status: "pending", submittedAt, reviewedAt: null, reviewer: null, reviewNote: null } : item)
      : [...current, { ...payload, id: `ev-${Date.now()}`, status: "pending", submittedAt, reviewedAt: null, reviewer: null, reviewNote: null }]);
    setResubmitId(null);
    navigate("/");
  }

  async function decideEvidence(id, status, notes) {
    if (apiToken) {
      const updated = await reviewEvidence(id, { status, notes }, apiToken);
      setEvidence((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      return;
    }
    setEvidence((current) => current.map((item) => item.id === id ? { ...item, status, reviewedAt: new Date().toISOString().slice(0, 10), reviewer: "Sarah Chen", reviewNote: notes || (status === "approved" ? "Evidence verified and approved." : "Please review the decision and submit an updated evidence record."), confidence: status === "approved" ? Math.min(item.confidence + 15, 100) : item.confidence } : item));
  }

  return <Routes>
    <Route path="/" element={<EvidenceStatus evidence={evidence} apiState={apiState} onRetry={loadEvidence} onAdd={() => openAddEvidence()} onOpen={(id) => navigate(`/evidence/${id}`)} />} />
    <Route path="/add" element={<AddEvidence skill={evidence[0]} resubmitRecord={evidence.find((item) => item.id === resubmitId) || null} onCancel={() => navigate("/")} onSubmit={saveEvidence} />} />
    <Route path="/evidence/:id" element={<EvidenceDetailRoute evidence={evidence} onBack={() => navigate("/")} onResubmit={openAddEvidence} />} />
    <Route path="/review" element={<ReviewerDashboard evidence={evidence} onDecide={decideEvidence} />} />
    <Route path="/error" element={<ErrorState onRetry={() => { loadEvidence(); navigate("/"); }} onContactSupport={() => window.alert("Please contact SkillSpan support.")} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

function EvidenceDetailRoute({ evidence, onBack, onResubmit }) {
  const navigate = useNavigate();
  const id = window.location.pathname.split("/").pop();
  const record = evidence.find((item) => item.id === id) || evidence[0];
  return <EvidenceDetail record={record} onBack={onBack} onResubmit={(recordId) => { onResubmit(recordId); navigate("/add"); }} />;
}
export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SkillSpanRoutes />
    </Router>
  );
}
