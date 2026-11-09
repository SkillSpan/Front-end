import { getMyEvidence, getSkillsTaxonomy, submitEvidence, reviewEvidence } from '../../../api';

const STATUS_FROM_API = {
    verified: 'approved',
    approved: 'approved',
    rejected: 'rejected',
    revision: 'revision',
    revision_requested: 'revision',
    pending: 'pending',
    pending_review: 'pending',
    expired: 'expired',
};
const STATUS_TO_API = { approved: 'verified', rejected: 'rejected', revision: 'revision' };

// The four Add Evidence cards and the evidence_type the API expects for each
// (Evidence API handoff, Nov 2026). document is the only file upload.
const TYPE_TO_API = {
    github: 'github_repository',
    live: 'live_deployment',
    design: 'design_file',
    document: 'document',
};
const TYPE_FROM_API = {
    github_repository: 'github',
    live_deployment: 'live',
    design_file: 'design',
    document: 'document',
};

// evidence_type for a link. Uses the card the learner picked; if the caller
// did not pass it, it is worked out from the link itself.
function apiTypeForUrl(type, url) {
    if (type && TYPE_TO_API[type] && type !== 'document') return TYPE_TO_API[type];
    if (type && Object.prototype.hasOwnProperty.call(TYPE_FROM_API, type) && type !== 'document') return type;
    let host;
    try {
        host = new URL(String(url || '')).hostname.toLowerCase();
    } catch {
        host = '';
    }
    if (host === 'github.com' || host === 'www.github.com') return 'github_repository';
    if (/(^|\.)(figma|canva|adobe|sketch|xd\.adobe)\.com$/.test(host)) return 'design_file';
    return 'live_deployment';
}

// "2026-11-01T00:00:00.000000Z" -> "2026-11-01" (the date helpers expect a day).
function toDay(value) {
    return value ? String(value).slice(0, 10) : value;
}

// First value that is not null/undefined.
function nn() {
    for (let i = 0; i < arguments.length; i += 1) {
        if (arguments[i] !== null && arguments[i] !== undefined) return arguments[i];
    }
    return null;
}

// Evidence rows the platform writes on the learner's behalf. The baseline
// assessment stores one verified `assessment_test` row per scored skill, so a
// learner who never added anything still got a full evidence list back from
// GET /api/v1/evidence. Only what the learner submitted themselves (a
// certificate, an experience or a project) belongs on the evidence screens.
const SYSTEM_SOURCES = new Set(['assessment_test', 'baseline_assessment', 'self_assessment']);

export function isLearnerEvidence(record) {
    return Boolean(record) && !SYSTEM_SOURCES.has(String(record.source || '').toLowerCase());
}

export function mapEvidenceRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const statusKey = raw.verification_status || raw.status || 'pending';
    // The API stores both kinds in `reference`: the submitted URL, or the
    // server-side path of an uploaded file (e.g. "evidence/AbC123.jpg").
    const reference = nn(raw.reference);
    const referenceIsUrl = typeof reference === 'string' && /^https?:\/\//i.test(reference);
    const evidenceUrl = nn(raw.evidence_url, raw.url, referenceIsUrl ? reference : null);
    const evidenceFile = nn(raw.evidence_file, !referenceIsUrl ? reference : null);
    const isFile = !evidenceUrl && Boolean(evidenceFile);
    return {
        id: nn(raw.id, raw._id, raw.evidence_id),
        skill: nn(raw.skill && raw.skill.name, raw.skill_name, typeof raw.skill === 'string' ? raw.skill : ''),
        skillId: nn(raw.skill_id, raw.skill && raw.skill.id),
        source: nn(raw.source, ''),
        category: nn(raw.category, raw.skill && raw.skill.category, ''),
        type: nn(TYPE_FROM_API[raw.evidence_type], raw.type, raw.evidence_type, isFile ? 'document' : 'github'),
        url: nn(evidenceUrl, evidenceFile, ''),
        description: nn(raw.description, ''),
        status: STATUS_FROM_API[statusKey] || 'pending',
        submittedAt: toDay(nn(raw.submitted_at, raw.evidence_date, raw.created_at)),
        reviewedAt: toDay(nn(raw.reviewed_at)),
        reviewer: nn(raw.reviewer && raw.reviewer.name, raw.reviewer_name),
        reviewNote: nn(raw.reviewer_notes, raw.reviewNote),
        level: nn(raw.level, raw.skill_level, ''),
        confidence: Number(nn(raw.confidence_score, raw.confidence, 0)),
    };
}

export function mapEvidenceList(raw) {
    const list = Array.isArray(raw) ? raw : nn(raw && raw.data, raw && raw.evidence, []);
    return list.map(mapEvidenceRecord).filter(Boolean);
}

export function toUiError(err) {
    const error = new Error((err && err.message) || 'Something went wrong. Please try again.');
    error.status = err && err.status;
    const raw = err && err.errors && typeof err.errors === 'object' ? err.errors : {};
    const pick = (v) => (Array.isArray(v) ? v[0] : v);
    const fieldErrors = {};
    if (raw.evidence_url) fieldErrors.url = pick(raw.evidence_url);
    if (raw.evidence_file) fieldErrors.file = pick(raw.evidence_file);
    if (raw.evidence_type && !fieldErrors.url && !fieldErrors.file) fieldErrors.url = pick(raw.evidence_type);
    if (raw.description) fieldErrors.description = pick(raw.description);
    error.fieldErrors = Object.keys(fieldErrors).length ? fieldErrors : null;
    return error;
}

export async function fetchEvidence() {
    return mapEvidenceList(await getMyEvidence()).filter(isLearnerEvidence);
}

// Active skills a learner can attach evidence to, from the seeded taxonomy.
export async function fetchSkillOptions() {
    const raw = await getSkillsTaxonomy();
    const list = Array.isArray(raw) ? raw : nn(raw && raw.data, []);
    const seen = new Set();
    return list
        .map((skill) => ({
            id: nn(skill && skill.id),
            name: String(nn(skill && skill.name, '')).trim(),
            category: nn(skill && skill.category && skill.category.name, skill && skill.category, skill && skill.domain, ''),
        }))
        .filter((skill) => skill.id !== null && skill.name && !seen.has(skill.name) && seen.add(skill.name))
        .sort((a, b) => a.name.localeCompare(b.name));
}

// `source` says what the evidence came from (certificate / experience /
// project). The API currently records every submission as a certificate;
// sending the field keeps the learner's choice once the backend stores it.
export async function sendEvidence({ skillId, type, url, file, description, source }) {
    if (!skillId) throw new Error('Choose the skill this evidence proves.');
    const evidenceDate = new Date().toISOString().slice(0, 10);
    let raw;
    if (file instanceof File) {
        const form = new FormData();
        form.append('skill_id', skillId);
        // A file is always "document" (multipart) - the API refuses
        // evidence_file for the three link types.
        form.append('evidence_type', 'document');
        form.append('evidence_file', file);
        if (description) form.append('description', description);
        if (source) form.append('source', source);
        form.append('evidence_date', evidenceDate);
        raw = await submitEvidence(form, true);
    } else {
        raw = await submitEvidence({
            skill_id: skillId,
            evidence_type: apiTypeForUrl(type, url),
            evidence_url: url,
            description,
            source: source || undefined,
            evidence_date: evidenceDate,
        });
    }
    return mapEvidenceRecord(nn(raw && raw.data, raw));
}

export async function sendReview(id, status, notes) {
    const raw = await reviewEvidence(id, STATUS_TO_API[status] || status, notes);
    return mapEvidenceRecord(nn(raw && raw.data, raw));
}