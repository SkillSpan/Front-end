import { getCareerRoles, getCareerRoleById, getCareerRoleSkills, getSkillsMatrix, getStoredUser, resolveLearnerId } from '../../api';

const has = (v) => v !== undefined && v !== null;
const pick = (...vals) => vals.find(has);
const get = (obj, key) => (obj ? obj[key] : undefined);

function unwrapList(data) {
    if (Array.isArray(data)) return data;
    const d = get(data, 'data');
    if (Array.isArray(d)) return d;
    if (Array.isArray(get(d, 'data'))) return d.data;
    return [];
}

function unwrapRoleSkills(data) {
    const s = pick(get(data, 'data'), data);
    return Array.isArray(get(s, 'skills')) ? s.skills : unwrapList(data);
}

function slugify(text) {
    const slug = String(text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || 'general';
}

function normalizeRoleSummary(raw) {
    const cat = raw.category;
    const label = get(cat, 'name') || get(cat, 'label') || cat || raw.domain || 'General';
    const v = raw.version ? String(raw.version) : null;
    return {
        id: pick(raw.id, raw.role_id, raw.slug),
        title: raw.title || raw.name || 'Untitled role',
        version: v ? (v.startsWith('v') ? v : 'v' + v) : null,
        status: raw.status || raw.approval_status || null,
        effectiveDate: raw.effective_date || raw.effective_at || raw.effectiveDate || null,
        categoryKey: slugify(get(cat, 'slug') || label),
        categoryLabel: label,
    };
}

function normalizeSkillRow(raw) {
    const sk = raw.skill;
    const pre = Array.isArray(raw.prerequisites) ? raw.prerequisites : [];
    return {
        skillId: pick(raw.skill_id, get(sk, 'id'), raw.id),
        name: raw.skill_name || get(sk, 'name') || raw.name || 'Unnamed skill',
        category: raw.category || get(sk, 'category') || raw.skill_category || 'General',
        required: Number(pick(raw.required_level, raw.required, raw.level, 0)),
        weight: Math.round(Number(pick(raw.weight, raw.importance, raw.importance_weight, 0)) * 100),
        critical: Boolean(pick(raw.is_critical, raw.critical, false)),
        prerequisites: pre.map((p) => (typeof p === 'string' ? p : p.name || p.skill_name || String(pick(p.skill_id, p.id, '')))),
    };
}

export async function fetchMySkillLevels() {
    const learnerId = resolveLearnerId(getStoredUser());
    if (learnerId == null) return {};
    const levels = {};
    unwrapList(await getSkillsMatrix())
        .filter((r) => r.learner_id == null || String(r.learner_id) === String(learnerId))
        .forEach((r) => { levels[r.skill_id] = Number(r.level) || 0; });
    return levels;
}

export async function fetchCareerRoleList() {
    const data = await getCareerRoles({ perPage: 50 });
    return unwrapList(data).map(normalizeRoleSummary).filter((r) => r.id != null);
}

export async function fetchCareerRoleDetail(roleId) {
    const data = await getCareerRoleById(roleId);
    return normalizeRoleSummary(get(data, 'data') || data);
}

export async function fetchCareerRoleSkills(roleId) {
    return unwrapRoleSkills(await getCareerRoleSkills(roleId)).map(normalizeSkillRow);
}

export function attachCurrentLevels(skills, levels) {
    return skills.map((s) => ({...s, current: pick(levels[s.skillId], 0) }));
}

export function estimateReadiness(skills) {
    const scored = skills.filter((s) => s.required > 0 && s.weight > 0);
    const total = scored.reduce((sum, s) => sum + s.weight, 0);
    if (!total) return null;
    const w = scored.reduce((sum, s) => sum + Math.min(s.current / s.required, 1) * s.weight, 0);
    return Math.round((w / total) * 100);
}

export async function loadCareerRolesCatalog() {
    const [roles, levels] = await Promise.all([fetchCareerRoleList(), fetchMySkillLevels().catch(() => ({}))]);
    const out = new Array(roles.length);
    let next = 0;
    const worker = async() => {
        while (next < roles.length) {
            const i = next;
            next += 1;
            out[i] = {...roles[i], skills: [], readiness: null };
            for (let t = 0; t < 2; t += 1) {
                try {
                    const skills = attachCurrentLevels(await fetchCareerRoleSkills(roles[i].id), levels);
                    out[i] = {...roles[i], skills, readiness: estimateReadiness(skills) };
                    break;
                } catch {
                    await new Promise((r) => setTimeout(r, 800));
                }
            }
        }
    };
    await Promise.all([1, 2, 3, 4].map(worker));
    return { roles: out, levelsBySkillId: levels };
}

export async function loadCareerRoleDetail(roleId, levels = {}) {
    const [detail, raw] = await Promise.all([fetchCareerRoleDetail(roleId), fetchCareerRoleSkills(roleId)]);
    const skills = attachCurrentLevels(raw, levels);
    return {...detail, skills, readiness: estimateReadiness(skills) };
}