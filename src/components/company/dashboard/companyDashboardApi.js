import {
  getCompanyDashboard,
  getOrganizationProfile,
  getNotifications,
  getUnreadNotificationCount,
  patchNotificationRead,
  markAllNotificationsRead as postMarkAllNotificationsRead,
  unwrapApiData,
} from '../../../api';
import { apiKey, fetchQuery, invalidateAfterMutation } from '../../../cache/queryCache';
import { SAMPLE_DASHBOARD, SAMPLE_DASHBOARD_EMPTY, SAMPLE_NOTIFICATIONS } from './companyDashboardMock';
import { QUICK_LINKS, filterQuickLinks, resolveQuickLinkContext } from './quickLinks';

/*
 * The one place the Company Dashboard and the Notification History get their
 * data from. Requests go through the app's own client (src/api.js), so the
 * Bearer token, the 401 → SessionExpired handling and the error shape are the
 * same as everywhere else in the app.
 *
 * Endpoints (confirmed by the backend's US-COMP-03 frontend guide, 02-11-2026,
 * deployed at https://skillspan.alwaysdata.net):
 *
 *   GET   /api/v1/company/dashboard        → counts, permissions, tasks,
 *         projectStates (all 12 states, zeros included), recentProjects,
 *         funnel { total, stages, byProject } — all computed by the server
 *         (US-COMP-03 BR-03: the frontend sums nothing).
 *   GET   /api/v1/organization/profile     → organization card (Section 1):
 *         verification_status, verified_at, profile_completeness, profile_fields.
 *   GET   /api/v1/notifications?page=&per_page=&unread=1  (per_page max 50;
 *         meta.unread_count rides the list answer)            NOT-01 / NOT-04
 *   PATCH /api/v1/notifications/{id}/read  (200; 404 = not yours; idempotent)
 *   POST  /api/v1/notifications/read-all
 *   GET   /api/v1/notifications/unread-count → { data: { unread_count } }
 *   403s are told apart by `code` (§4): ORGANIZATION_PENDING → /company/pending;
 *   ORGANIZATION_NOT_APPROVED, COMPANY_ADMIN_ONLY, NOT_ORGANIZATION_ADMIN,
 *   NO_ORGANIZATION → Access denied.
 *
 * A real (logged-in) company only ever sees server data — never the sample
 * numbers. The sample data is only used by the design-preview routes.
 */

/* ------------------------------------------------------------------ */
/* Sample data (preview builds only)                                   */
/* ------------------------------------------------------------------ */

export function sampleDashboard(variant = 'full') {
  return variant === 'empty' ? SAMPLE_DASHBOARD_EMPTY : SAMPLE_DASHBOARD;
}

// AC-10 in the preview: read state survives a refresh.
export const PREVIEW_READ_KEY = 'skillspan.company.preview.readNotifications';

function readPreviewReadIds() {
  try {
    const raw = window.localStorage.getItem(PREVIEW_READ_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function writePreviewReadIds(ids) {
  try {
    window.localStorage.setItem(PREVIEW_READ_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode / storage full: the optimistic UI state still applies.
  }
}

function previewSource(variant) {
  if (variant === 'none') return [];
  return variant === 'empty' ? SAMPLE_DASHBOARD_EMPTY.notifications : SAMPLE_NOTIFICATIONS;
}

function previewItems(variant) {
  const read = readPreviewReadIds();
  return previewSource(variant).map((n) => ({ ...n, unread: n.unread && !read.has(n.id) }));
}

export const NOTIFICATIONS_PAGE_SIZE = 10; // BR-11: configurable page size
export const NOTIFICATIONS_MAX_PAGE_SIZE = 50; // BR-11: configurable maximum

export function clampPageSize(n) {
  const v = Number(n) || NOTIFICATIONS_PAGE_SIZE;
  return Math.min(Math.max(Math.round(v), 1), NOTIFICATIONS_MAX_PAGE_SIZE);
}

/** Same shape as listNotifications(), computed synchronously from the sample. */
export function previewNotificationPage({ page = 1, perPage = NOTIFICATIONS_PAGE_SIZE, unread = false } = {}, variant = 'full') {
  const all = previewItems(variant);
  const filtered = unread ? all.filter((n) => n.unread) : all;
  const size = clampPageSize(perPage);
  const lastPage = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(Math.max(1, Number(page) || 1), lastPage);
  return {
    items: filtered.slice((current - 1) * size, current * size),
    page: current,
    perPage: size,
    total: filtered.length,
    lastPage,
    unreadCount: all.filter((n) => n.unread).length,
  };
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

const TONES = {
  application: 'blue', changes: 'amber', joined: 'green', open: 'violet', verified: 'green',
  approved: 'green', projectApproved: 'green', submitted: 'gray', deadline: 'red',
};

// Where a notification opens when the backend sends no link (Scenario 4).
function fallbackLink(type, data = {}) {
  const projectId = data.project_id ?? data.project?.id;
  if (type === 'application') return projectId ? `/company/applicants?project=${projectId}` : '/company/applicants';
  if (type === 'verified' || type === 'approved') return '/company/profile';
  return projectId ? `/company/projects/${projectId}` : '/company/projects';
}

// Server `category` → the icon/tone family the UI already has. The guide's
// example uses "project"; other values fall back to the bell icon + blue.
// TODO(api): the full list of notification categories is not in the guide.
const CATEGORY_TYPES = {
  project: 'projectApproved',
  application: 'application',
  applications: 'application',
  verification: 'verified',
  organization: 'verified',
  deadline: 'deadline',
};

/*
 * GET /api/v1/notifications item (US-COMP-03 guide §6) → the item the UI reads:
 *   { id, category, title, body, link, read_at, created_at }
 * The server writes the words (title/body), so they are shown as sent; `type`
 * only picks the icon. Older Laravel-style rows ({ data: { type, message } })
 * still map, for the learner screens that share this endpoint.
 */
export function normalizeNotification(raw = {}) {
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const category = raw.category || data.category || null;
  const hasServerText = raw.title != null || raw.body != null;
  const type = hasServerText
    ? (CATEGORY_TYPES[category] || 'generic')
    : (data.type || raw.type || CATEGORY_TYPES[category] || 'generic');
  const created = raw.created_at || data.created_at || null;
  return {
    id: raw.id,
    type,
    category,
    tone: TONES[type] || 'blue',
    project: hasServerText ? undefined : (data.project_title ?? data.project?.title ?? data.project?.name ?? raw.project ?? undefined),
    title: raw.title ?? undefined,
    body: raw.body ?? undefined,
    text: raw.title || data.message || raw.message || undefined,
    unread: raw.unread ?? (raw.is_read != null ? !raw.is_read : raw.read_at == null),
    readAt: raw.read_at ?? null,
    createdAt: created,
    date: created ? String(created).slice(0, 10) : undefined,
    link: raw.link || data.link || data.url || fallbackLink(type, data),
  };
}

/** Laravel paginator (with or without `meta`) → { items, page, perPage, total, lastPage, unreadCount }. */
export function normalizeNotificationPage(payload, { page = 1, perPage = NOTIFICATIONS_PAGE_SIZE } = {}) {
  const body = payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data) ? payload.data : payload;
  const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
  const meta = body?.meta || body || {};
  const size = Number(meta.per_page) || perPage;
  const total = Number(meta.total ?? list.length) || 0;
  const items = list.map(normalizeNotification);
  return {
    items,
    page: Number(meta.current_page) || page,
    perPage: size,
    total,
    lastPage: Number(meta.last_page) || Math.max(1, Math.ceil(total / size)),
    // meta.unread_count rides the list answer (guide §6) — the bell needs no second request.
    unreadCount: meta.unread_count != null ? Number(meta.unread_count) : null,
  };
}

/**
 * GET /api/v1/notifications — `preview` is the sample variant
 * ('full' | 'empty' | 'none') in preview builds, otherwise falsy.
 */
export async function listNotifications({ page = 1, perPage = NOTIFICATIONS_PAGE_SIZE, unread = false } = {}, { preview } = {}) {
  if (preview) return previewNotificationPage({ page, perPage, unread }, preview);
  const size = clampPageSize(perPage);
  const res = await getNotifications({ page, perPage: size, unread });
  return normalizeNotificationPage(res, { page, perPage: size });
}

/** PATCH /api/v1/notifications/{id}/read (preview: saved in localStorage). */
export async function markNotificationRead(id, { preview } = {}) {
  if (preview) {
    const ids = readPreviewReadIds();
    ids.add(id);
    writePreviewReadIds(ids);
    // Same cache clean-up a real PATCH gets in api.js (cacheConfig.js INVALIDATION_MAP).
    invalidateAfterMutation('PATCH', `/api/v1/notifications/${id}/read`);
    return { id, unread: false };
  }
  return patchNotificationRead(id);
}

/** Mark every notification of this representative as read. */
export async function markAllNotificationsRead({ preview } = {}) {
  if (preview) {
    const ids = readPreviewReadIds();
    previewSource(preview).forEach((n) => ids.add(n.id));
    writePreviewReadIds(ids);
    invalidateAfterMutation('POST', '/api/v1/notifications/read-all');
    return { ok: true };
  }
  return postMarkAllNotificationsRead();
}

/** Unread total for the bell + sidebar badge. */
export async function fetchUnreadCount({ preview } = {}) {
  if (preview) return previewItems(preview).filter((n) => n.unread).length;
  const body = unwrapApiData(await getUnreadNotificationCount());
  // Guide §2 row 6: { data: { unread_count } }. Older shapes kept as fallbacks.
  const n = typeof body === 'number' ? body : (body?.unread_count ?? body?.count ?? body?.unread ?? 0);
  return Number(n) || 0;
}

/* ------------------------------------------------------------------ */
/* Dashboard sections                                                  */
/* ------------------------------------------------------------------ */

const EMPTY_SECTIONS = {
  counts: { projects: 0, applicationsPending: 0, unreadNotifications: 0 },
  tasks: [],
  notifications: [],
  projectStates: {},
  recentProjects: [],
  funnel: { total: 0, stages: {}, byProject: [] },
  permissions: undefined,
};

function initialsOf(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '—';
}

const isAuthError = (err) => err?.status === 401 || err?.status === 403;

function shapeOrganization(org = {}) {
  return {
    id: org.id,
    name: org.name || '',
    initials: initialsOf(org.name),
    industry: org.industry || org.type || '',
    verification_status: org.verification_status || 'pending',
    // ISO timestamp from the server ("2026-10-20T09:12:00+00:00") → the day the card formats.
    verified_at: org.verified_at ? String(org.verified_at).slice(0, 10) : null,
    verification_steps: org.verification_status === 'verified' ? ['registered', 'documents', 'approved'] : ['registered'],
    // GET /api/v1/organization/profile → profile_completeness (0–100) +
    // profile_fields [{ key, done }] (US-COMP-03 guide §5; keys = the
    // company.ws.field.* translations). null hides the bar.
    profile: org.profile_completeness != null
      ? { completeness: org.profile_completeness, fields: org.profile_fields || [] }
      : null,
  };
}

/** Section 1 data: the organization (GET organization profile, login data as fallback). */
export async function fetchOrganizationStatus(fallbackOrganization) {
  let org = fallbackOrganization || {};
  try {
    const row = unwrapApiData(await getOrganizationProfile());
    if (row) org = { ...org, ...row };
  } catch (err) {
    // 401/403 are handled by the page (session expired / access denied).
    // Anything else: keep what the login response told us, unless we know nothing.
    if (isAuthError(err) || !org.name) throw err;
  }
  return shapeOrganization(org);
}

const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

/**
 * Sections 2–4 (+ counts and Quick Link permissions) — GET /api/v1/company/dashboard
 * (US-COMP-03, guide §3 + §8). Fields are taken exactly as the server sends
 * them; nothing is added up here (BR-03). `permissions` stays undefined when
 * the server sends none, so quickLinks.js applies its representative defaults.
 */
export async function fetchDashboardSummary() {
  const body = unwrapApiData(await getCompanyDashboard()) || {};
  const funnel = asObject(body.funnel);
  return {
    counts: { ...EMPTY_SECTIONS.counts, ...(asObject(body.counts) || {}) },
    tasks: Array.isArray(body.tasks) ? body.tasks : [],
    notifications: [], // Section 5 has its own endpoint (GET /api/v1/notifications)
    projectStates: asObject(body.projectStates) || {},
    recentProjects: Array.isArray(body.recentProjects) ? body.recentProjects : [],
    funnel: funnel
      ? {
        total: Number(funnel.total) || 0,
        stages: asObject(funnel.stages) || {},
        byProject: Array.isArray(funnel.byProject) ? funnel.byProject : [],
      }
      : EMPTY_SECTIONS.funnel,
    permissions: asObject(body.permissions) || undefined,
  };
}

/** permissions.can_publish_projects — gates every "Publish / New project" action. */
export function canPublishProjects(permissions) {
  return permissions?.can_publish_projects !== false;
}

/** Kept for callers of the first version: everything in one object. */
export async function fetchCompanyDashboard(fallbackOrganization) {
  const [organization, summary] = await Promise.all([fetchOrganizationStatus(fallbackOrganization), fetchDashboardSummary()]);
  return { sample: false, ...summary, organization };
}

/**
 * Cache keys of the live dashboard (src/cache). Same endpoint + params → same
 * key, so the Notification History and the dashboard never mix up their pages.
 */
export const DASHBOARD_KEYS = {
  org: apiKey('/api/v1/organization/profile'),
  summary: apiKey('/api/v1/company/dashboard'),
  notifications: apiKey('/api/v1/notifications', { page: 1, per_page: 5 }, { variant: 'dashboard' }),
  unreadCount: apiKey('/api/v1/notifications/unread-count'),
  quickLinks: apiKey('/api/v1/company/dashboard', null, { variant: 'quick-links' }),
};

export const DASHBOARD_SECTIONS = ['org', 'tasks', 'projects', 'funnel', 'notifications', 'quickLinks'];

const totalProjects = (states) => Object.values(states || {}).reduce((a, b) => a + (b || 0), 0);

/** Quick Links section data: the permitted links + the draft count for the "Continue drafts" line. */
export function quickLinksFor(organization, permissions, projectStates) {
  const context = resolveQuickLinkContext({ organization, permissions, projectStates });
  return { links: filterQuickLinks(context, QUICK_LINKS), drafts: context.drafts };
}

function sliceSections(data, notifications) {
  const canPublish = canPublishProjects(data.permissions);
  return {
    org: data.organization,
    tasks: { tasks: data.tasks, isNew: totalProjects(data.projectStates) === 0, canPublish, counts: data.counts },
    projects: { projectStates: data.projectStates, recentProjects: data.recentProjects, canPublish },
    funnel: data.funnel,
    notifications,
    quickLinks: quickLinksFor(data.organization, data.permissions, data.projectStates),
  };
}

const PREVIEW_ERROR = { status: 500, preview: true, message: 'Preview: this section is shown in its error state.' };
const delay = (ms, value) => new Promise((resolve) => { setTimeout(() => resolve(value), ms); });

/**
 * One loader per dashboard section, so each section loads, fails and retries
 * on its own (Scenario 6 / BR-14). Each entry: { initial(), load({ fresh }) }.
 * `initial()` returns a ready state synchronously in preview builds.
 *
 *   demo:           'full' | 'empty' sample variant (preview builds), else falsy
 *   previewState:   'loading' | 'error' | null (preview builds)
 *   previewSection: with previewState 'error', fail only this section
 */
export function createDashboardSections({ demo, previewState, previewSection, organization } = {}) {
  if (demo) {
    const sample = sampleDashboard(demo);
    const ready = () => {
      const page = previewNotificationPage({ page: 1, perPage: 5 }, demo);
      return sliceSections(sample, { items: page.items, unreadCount: page.unreadCount });
    };
    const entry = (key) => {
      const failing = previewState === 'error' && (!previewSection || previewSection === key);
      if (previewState === 'loading') {
        return { initial: () => ({ status: 'loading' }), load: () => new Promise(() => {}) };
      }
      if (failing) {
        // Retry "works" in the preview so the recovered state can be checked too.
        return { initial: () => ({ status: 'error', error: PREVIEW_ERROR }), load: () => delay(700).then(() => ready()[key]) };
      }
      return { initial: () => ({ status: 'ready', data: ready()[key] }), load: async () => ready()[key] };
    };
    const out = Object.fromEntries(DASHBOARD_SECTIONS.map((k) => [k, entry(k)]));
    return out;
  }

  // Live: answers come from the API cache (src/cache). The org profile and
  // the summary are each requested once and shared by the sections that read
  // them; on a revisit every section shows its last answer at once and is
  // refreshed in the background. A section's Retry asks again (force).
  const getOrg = (force) => fetchQuery(DASHBOARD_KEYS.org, () => fetchOrganizationStatus(organization), { force });
  const getSummary = (force) => fetchQuery(DASHBOARD_KEYS.summary, () => fetchDashboardSummary(), { force });
  return {
    org: { key: DASHBOARD_KEYS.org, load: () => fetchOrganizationStatus(organization) },
    tasks: {
      key: DASHBOARD_KEYS.summary,
      load: () => fetchDashboardSummary(),
      select: (s) => ({
        tasks: s.tasks || [],
        isNew: totalProjects(s.projectStates) === 0,
        canPublish: canPublishProjects(s.permissions),
        counts: s.counts,
      }),
    },
    projects: {
      key: DASHBOARD_KEYS.summary,
      load: () => fetchDashboardSummary(),
      select: (s) => ({
        projectStates: s.projectStates || {},
        recentProjects: s.recentProjects || [],
        canPublish: canPublishProjects(s.permissions),
      }),
    },
    funnel: { key: DASHBOARD_KEYS.summary, load: () => fetchDashboardSummary(), select: (s) => s.funnel || EMPTY_SECTIONS.funnel },
    notifications: {
      key: DASHBOARD_KEYS.notifications,
      load: async ({ force } = {}) => {
        const [page, count] = await Promise.all([
          listNotifications({ page: 1, perPage: 5 }),
          fetchQuery(DASHBOARD_KEYS.unreadCount, () => fetchUnreadCount(), { force }).catch(() => null),
        ]);
        const unreadCount = page.unreadCount ?? count ?? page.items.filter((n) => n.unread).length;
        return { items: page.items, unreadCount };
      },
    },
    quickLinks: {
      key: DASHBOARD_KEYS.quickLinks,
      tags: ['dashboard', 'org', 'profile'],
      load: async ({ force } = {}) => {
        const [org, summary] = await Promise.all([
          getOrg(force).catch((err) => { if (isAuthError(err)) throw err; return organization || {}; }),
          getSummary(force),
        ]);
        return quickLinksFor(org, summary.permissions, summary.projectStates);
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* 401 / 403                                                           */
/* ------------------------------------------------------------------ */

const PENDING_STATUSES = ['pending', 'under_review', 'submitted'];

/**
 * What a failed company request means for the page:
 *   'expired' → 401: session gone (api.js clears it and shows SessionExpired)
 *   'pending' → 403 for an organization still under review → /company/pending
 *   'denied'  → any other 403 → "access denied" state, no company data shown
 *   null      → an ordinary error: the section shows its own error + Retry
 * 403 codes (US-COMP-03 guide §4 / US-COMP-04 guide, branch on `code`, never
 * on the message):
 *   ORGANIZATION_PENDING       → 'pending'  (/company/pending)
 *   ORGANIZATION_NOT_APPROVED  → 'denied'   (organization rejected)
 *   COMPANY_ADMIN_ONLY, NOT_ORGANIZATION_ADMIN, NO_ORGANIZATION → 'denied'
 */
export const DENIED_CODES = ['ORGANIZATION_NOT_APPROVED', 'COMPANY_ADMIN_ONLY', 'NOT_ORGANIZATION_ADMIN', 'NO_ORGANIZATION'];

export function classifyCompanyError(err, organization) {
  if (!err) return null;
  if (err.status === 401) return 'expired';
  if (err.status !== 403) return null;
  const code = String(err.code || '').toUpperCase();
  if (code === 'ORGANIZATION_PENDING') return 'pending';
  if (DENIED_CODES.includes(code)) return 'denied';
  // A 403 without a known code: fall back to what the login told us.
  if (PENDING_STATUSES.includes(organization?.verification_status)) return 'pending';
  return 'denied';
}
