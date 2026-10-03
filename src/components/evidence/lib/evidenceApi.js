import { getMyEvidence, submitEvidence, reviewEvidence } from '../../../api';

const STATUS_FROM_API = {
    verified: 'approved',
    approved: 'approved',
    rejected: 'rejected',
    revision: 'revision',
    revision_requested: 'revision',
    pending: 'pending',
    pending_review: 'pending',
};
const STATUS_TO_API = { approved: 'verified', rejected: 'rejected', revision: 'revision' };

// First value that is not null/undefined.
function nn() {
    for (let i = 0; i < arguments.length; i += 1) {
        if (arguments[i] !== null && arguments[i] !== undefined) return arguments[i];
    }
    return null;
}

export function mapEvidenceRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const statusKey = raw.verification_status || raw.status || 'pending';
    const evidenceUrl = nn(raw.evidence_url, raw.url);
    const evidenceFile = nn(raw.evidence_file);
    const isFile = !evidenceUrl && Boolean(evidenceFile);
    return {
        id: nn(raw.id, raw._id, raw.evidence_id),
        skill: nn(raw.skill && raw.skill.name, raw.skill_name, typeof raw.skill === 'string' ? raw.skill : ''),
        skillId: nn(raw.skill_id, raw.skill && raw.skill.id),
        category: nn(raw.category, raw.skill && raw.skill.category, ''),
        type: nn(raw.type, raw.evidence_type, isFile ? 'document' : 'github'),
        url: nn(evidenceUrl, evidenceFile, ''),
        description: nn(raw.description, ''),
        status: STATUS_FROM_API[statusKey] || 'pending',
        submittedAt: nn(raw.submitted_at, raw.evidence_date, raw.created_at),
        reviewedAt: nn(raw.reviewed_at),
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
    if (raw.description) fieldErrors.description = pick(raw.description);
    error.fieldErrors = Object.keys(fieldErrors).length ? fieldErrors : null;
    return error;
}

export async function fetchEvidence() {
    return mapEvidenceList(await getMyEvidence());
}

export async function sendEvidence({ skillId, url, file, description }) {
    if (!skillId) throw new Error('No skill is linked to this evidence yet.');
    const evidenceDate = new Date().toISOString().slice(0, 10);
    let raw;
    if (file instanceof File) {
        const form = new FormData();
        form.append('skill_id', skillId);
        form.append('evidence_file', file);
        if (description) form.append('description', description);
        form.append('evidence_date', evidenceDate);
        raw = await submitEvidence(form, true);
    } else {
        raw = await submitEvidence({ skill_id: skillId, evidence_url: url, description, evidence_date: evidenceDate });
    }
    return mapEvidenceRecord(nn(raw && raw.data, raw));
}

export async function sendReview(id, status, notes) {
    const raw = await reviewEvidence(id, STATUS_TO_API[status] || status, notes);
    return mapEvidenceRecord(nn(raw && raw.data, raw));
}