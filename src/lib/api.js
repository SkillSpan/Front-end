const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://back-end-zdip.onrender.com";

function authHeaders(token, json = true) {
  return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const STATUS_MESSAGES = {
  401: "You need to sign in to continue.",
  403: "You don't have permission to do this.",
  404: "We couldn't find that evidence record.",
  422: "Please check the fields and try again.",
  500: "The server ran into a problem. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  let body = null;
  try {
    if (contentType.includes("application/json")) body = await response.json();
    else {
      const text = await response.text();
      body = text || null;
    }
  } catch {
    body = null;
  }

  if (!response.ok) {
    const apiMessage = body && typeof body === "object" ? body.message || body.error : (typeof body === "string" && body ? body : null);
    const message = STATUS_MESSAGES[response.status] || apiMessage || `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.fieldErrors = body && typeof body === "object" ? body.errors || null : null;
    throw error;
  }
  return body;
}

// --- Status mapping between the API's verification_status and the UI's status ---
const STATUS_FROM_API = { verified: "approved", approved: "approved", rejected: "rejected", revision: "revision", revision_requested: "revision", pending: "pending", pending_review: "pending" };
const STATUS_TO_API = { approved: "verified", rejected: "rejected", revision: "revision" };

// --- Mapper: converts a raw API evidence record into the shape the UI components expect ---
export function mapEvidenceRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const statusKey = raw.verification_status || raw.status || "pending";
  const evidenceUrl = raw.evidence_url ?? raw.url ?? null;
  const evidenceFile = raw.evidence_file ?? null;
  const isFile = !evidenceUrl && Boolean(evidenceFile);
  return {
    id: raw.id ?? raw._id ?? raw.evidence_id ?? null,
    skill: raw.skill?.name ?? raw.skill_name ?? (typeof raw.skill === "string" ? raw.skill : "") ?? "",
    skillId: raw.skill_id ?? raw.skill?.id ?? null,
    category: raw.category ?? raw.skill?.category ?? "",
    type: raw.type ?? raw.evidence_type ?? (isFile ? "document" : "github"),
    url: evidenceUrl ?? evidenceFile ?? "",
    fileName: evidenceFile ?? null,
    description: raw.description ?? "",
    status: STATUS_FROM_API[statusKey] ?? "pending",
    submittedAt: raw.submitted_at ?? raw.evidence_date ?? raw.created_at ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    reviewer: raw.reviewer?.name ?? raw.reviewer_name ?? null,
    reviewNote: raw.reviewer_notes ?? raw.reviewNote ?? null,
    level: raw.level ?? raw.skill_level ?? "",
    confidence: Number(raw.confidence_score ?? raw.confidence ?? 0),
  };
}

export function mapEvidenceList(raw) {
  const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.evidence ?? [];
  return list.map(mapEvidenceRecord).filter(Boolean);
}

export async function login(email, password) {
  return parseResponse(await fetch(`${API_BASE_URL}/api/v1/auth/login`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email, password }) }));
}

export async function checkApiConnection() {
  const response = await fetch(`${API_BASE_URL}/api/v1/skills`, { headers: authHeaders(null, false) });
  if (!response.ok) throw new Error(`API responded with ${response.status}`);
  return true;
}

export async function listEvidence(token) {
  const raw = await parseResponse(await fetch(`${API_BASE_URL}/api/v1/evidence`, { headers: authHeaders(token, false) }));
  return mapEvidenceList(raw);
}

export async function getEvidence(id, token) {
  const raw = await parseResponse(await fetch(`${API_BASE_URL}/api/v1/evidence/${id}`, { headers: authHeaders(token, false) }));
  return mapEvidenceRecord(raw?.data ?? raw);
}

export async function submitEvidence(payload, token) {
  const hasFile = payload.evidence_file instanceof File;
  let raw;
  if (hasFile) {
    const form = new FormData();
    form.append("skill_id", payload.skill_id);
    form.append("evidence_file", payload.evidence_file);
    if (payload.description) form.append("description", payload.description);
    form.append("evidence_date", payload.evidence_date || new Date().toISOString().slice(0, 10));
    // Don't set Content-Type manually — the browser must add the multipart boundary.
    raw = await parseResponse(await fetch(`${API_BASE_URL}/api/v1/evidence`, { method: "POST", headers: authHeaders(token, false), body: form }));
  } else {
    raw = await parseResponse(await fetch(`${API_BASE_URL}/api/v1/evidence`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        skill_id: payload.skill_id,
        evidence_url: payload.evidence_url,
        description: payload.description,
        evidence_date: payload.evidence_date || new Date().toISOString().slice(0, 10),
      }),
    }));
  }
  return mapEvidenceRecord(raw?.data ?? raw);
}

export async function reviewEvidence(id, { status, notes }, token) {
  const verification_status = STATUS_TO_API[status] || status;
  const raw = await parseResponse(await fetch(`${API_BASE_URL}/api/v1/evidence/${id}/review`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ verification_status, reviewer_notes: notes }),
  }));
  return mapEvidenceRecord(raw?.data ?? raw);
}
