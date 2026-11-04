/*
 * Frontend API cache — the one config file.
 *
 * Every number and every rule the cache uses lives here, so the team changes
 * caching behaviour in one place:
 *
 *   CACHE_DEFAULTS     fresh / max age when no rule below matches
 *   CACHE_RULES        per-endpoint TTLs + the "tags" an entry belongs to
 *   NEVER_CACHE        endpoints that must never be cached (auth, tokens …)
 *   INVALIDATION_MAP   which mutation (POST/PATCH/PUT/DELETE) clears which tags
 *   SEND_ACCEPT_LANGUAGE / PERSIST_TO_SESSION_STORAGE  switches, see below
 *
 * Words used:
 *   staleTime  how long an answer counts as fresh. A fresh answer is used as is,
 *              no request is made.
 *   maxAge     how long an answer may still be SHOWN while a fresh one loads in
 *              the background (stale-while-revalidate). Older than this, the
 *              answer is dropped and the screen shows its loading state.
 *   tags       names a mutation uses to clear related answers (see
 *              INVALIDATION_MAP).
 *   transport  true: plain api.js calls (pages that do not use the hook, e.g.
 *              learner screens) also reuse a FRESH answer and share in-flight
 *              requests. They never get a stale answer.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const CACHE_DEFAULTS = {
  staleTime: 30 * SECOND,
  maxAge: 5 * MINUTE,
};

// When the backend starts answering in the user's language, turn this on:
// api.js then sends Accept-Language (en / ar) and every cache key carries the
// language, so switching EN ⇄ AR never shows the other language's answer.
// Today api.js sends no Accept-Language, so answers cannot depend on it.
// TODO(api, to be confirmed): are any responses language-dependent?
export const SEND_ACCEPT_LANGUAGE = false;

// Default: memory only (gone on refresh, never written anywhere). When true,
// rules marked `persist: true` (public reference lists only — never anything
// tied to a user) are also kept in sessionStorage for this tab.
export const PERSIST_TO_SESSION_STORAGE = false;

/**
 * First matching rule wins. `match` is tested against the request path
 * (without the query string).
 */
export const CACHE_RULES = [
  // Company workspace (Sprint 4)
  { match: /^\/api\/v1\/profile\/me$/, tags: ['profile'], staleTime: 60 * SECOND, maxAge: 10 * MINUTE },
  { match: /^\/api\/v1\/organization\/profile$/, tags: ['org', 'profile'], staleTime: 60 * SECOND, maxAge: 10 * MINUTE },
  { match: /^\/api\/v1\/company\/dashboard/, tags: ['dashboard'], staleTime: 30 * SECOND, maxAge: 5 * MINUTE },
  { match: /^\/api\/v1\/notifications\/unread-count$/, tags: ['notifications', 'unread-count'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/notifications\/preferences$/, tags: ['notification-preferences'], staleTime: 60 * SECOND, maxAge: 10 * MINUTE },
  { match: /^\/api\/v1\/notifications$/, tags: ['notifications'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },

  // Company projects, applications and teams (Sprint 4: US-PRJ-01/02, US-MATCH-03/04).
  // Not `transport`: these screens read through useCachedQuery (stale-while-revalidate).
  { match: /^\/api\/v1\/company\/projects$/, tags: ['projects', 'company-projects'], staleTime: 20 * SECOND, maxAge: 5 * MINUTE },
  { match: /^\/api\/v1\/company\/projects\/[^/]+$/, tags: ['projects', 'company-projects'], staleTime: 20 * SECOND, maxAge: 5 * MINUTE },
  { match: /^\/api\/v1\/projects\/[^/]+\/applications$/, tags: ['applications'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/applications\/[^/]+$/, tags: ['applications'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/projects\/[^/]+\/team$/, tags: ['team'], staleTime: 10 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/team-invitations\/[^/]+$/, tags: ['team'], staleTime: 10 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/rubrics/, tags: ['reference'], staleTime: 10 * MINUTE, maxAge: 60 * MINUTE },

  // Talent (US-COMP-05/06/07). Consent can change at any time (BR-PORT-06), so short stale times.
  { match: /^\/api\/v1\/talent\/lists(\/|$)/, tags: ['talent-lists'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/talent\/candidates\/[^/]+\/notes$/, tags: ['talent-notes'], staleTime: 15 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/talent\/funnel$/, tags: ['talent-funnel', 'dashboard'], staleTime: 30 * SECOND, maxAge: 5 * MINUTE },
  { match: /^\/api\/v1\/talent$/, tags: ['talent'], staleTime: 20 * SECOND, maxAge: 2 * MINUTE },
  { match: /^\/api\/v1\/talent\/(?!filters$)[^/]+$/, tags: ['talent'], staleTime: 20 * SECOND, maxAge: 2 * MINUTE },

  // Learner workspace — lists that change only when the user acts.
  { match: /^\/api\/v1\/projects$/, tags: ['projects'], staleTime: 30 * SECOND, maxAge: 5 * MINUTE, transport: true },
  { match: /^\/api\/v1\/projects\/[^/]+$/, tags: ['projects'], staleTime: 30 * SECOND, maxAge: 5 * MINUTE, transport: true },
  { match: /^\/api\/v1\/applications$/, tags: ['applications'], staleTime: 30 * SECOND, maxAge: 5 * MINUTE, transport: true },
  { match: /^\/api\/v1\/recommendations$/, tags: ['recommendations'], staleTime: 60 * SECOND, maxAge: 10 * MINUTE, transport: true },
  { match: /^\/api\/v1\/talent\/filters$/, tags: ['talent'], staleTime: 5 * MINUTE, maxAge: 30 * MINUTE, transport: true },

  // Public reference lists (dropdowns). Same for everyone, change rarely.
  { match: /^\/api\/v1\/reference\//, tags: ['reference'], staleTime: 10 * MINUTE, maxAge: 60 * MINUTE, transport: true, persist: true },
  { match: /^\/api\/v1\/career-roles(\/|$)/, tags: ['reference'], staleTime: 10 * MINUTE, maxAge: 60 * MINUTE, transport: true },
  { match: /^\/api\/v1\/skills\/taxonomy/, tags: ['reference'], staleTime: 10 * MINUTE, maxAge: 60 * MINUTE, transport: true },
];

/**
 * Never cached, never deduplicated, never persisted — whatever a rule above
 * says. Anything about signing in, tokens, codes or passwords, plus live
 * flows where every answer must come from the server.
 */
export const NEVER_CACHE = [
  /^\/api\/v1\/auth(\/|$)/,
  /otp|password|token|verify|logout/i,
  /^\/api\/v1\/(intelligence|readiness|baseline-assessments|assistant|conversations|support|mentor)(\/|$)/,
];

/**
 * Mutation → tags to clear. Every successful POST/PATCH/PUT/DELETE that goes
 * through api.js is checked against this list (all matching rows apply).
 *
 * What "clear" does to an answer with that tag:
 *  - nobody on screen uses it → it is dropped; the next visit loads it fresh.
 *  - a screen shows it right now → it stays on screen and a fresh copy is
 *    fetched in the background (unless `refetchActive: false`: the screen
 *    already shows the change optimistically; it refetches on the next visit).
 */
export const INVALIDATION_MAP = [
  // Organization Profile (US-COMP-04): profile update / document upload.
  { match: /^\/api\/v1\/profile\/me$/, invalidate: ['profile', 'org', 'dashboard'] },
  { match: /^\/api\/v1\/company\/profile\/documents/, invalidate: ['profile', 'org', 'dashboard'] },
  { match: /^\/api\/v1\/organization(\/|$)/, invalidate: ['org', 'profile', 'dashboard'] },
  { match: /^\/api\/v1\/company(\/|$)/, invalidate: ['dashboard'] },

  // Notifications: read one / read all → lists + unread count.
  { match: /^\/api\/v1\/notifications\/[^/]+\/read$/, invalidate: ['notifications', 'unread-count'], refetchActive: false },
  { match: /^\/api\/v1\/notifications\/read-all$/, invalidate: ['notifications', 'unread-count'], refetchActive: false },
  { match: /^\/api\/v1\/notifications\/preferences$/, invalidate: ['notification-preferences'] },

  // Sprint 4 company actions. All matching rows apply, so these add to the rows below.
  { match: /^\/api\/v1\/projects\/[^/]+\/(submit|transitions|clone)$/, invalidate: ['projects', 'dashboard', 'notifications'] },
  { match: /^\/api\/v1\/applications\/[^/]+\/decision$/, invalidate: ['applications', 'team', 'projects', 'dashboard'] },
  { match: /^\/api\/v1\/projects\/[^/]+\/(team|start)/, invalidate: ['team', 'projects', 'applications', 'dashboard'] },
  { match: /^\/api\/v1\/team-invitations\//, invalidate: ['team', 'notifications'] },
  { match: /^\/api\/v1\/talent\/lists/, invalidate: ['talent-lists', 'talent-funnel'] },
  { match: /^\/api\/v1\/talent\/candidates\/[^/]+\/notes$/, invalidate: ['talent-notes'] },
  { match: /^\/api\/v1\/talent\/candidates\/[^/]+\/contact$/, invalidate: ['talent-funnel'] },

  // Learner: applying / withdrawing / updating applications.
  { match: /^\/api\/v1\/projects\/[^/]+\/applications/, invalidate: ['applications', 'projects', 'recommendations', 'dashboard'] },
  { match: /^\/api\/v1\/applications\//, invalidate: ['applications', 'projects', 'dashboard'] },
  { match: /^\/api\/v1\/projects(\/|$)/, invalidate: ['projects', 'dashboard'] },
  { match: /^\/api\/v1\/recommendations\//, invalidate: ['recommendations'] },
  { match: /^\/api\/v1\/(evidence|skills|intelligence|readiness|baseline-assessments)(\/|$)/, invalidate: ['recommendations', 'projects'] },
  { match: /^\/api\/v1\/profile(\/|$)/, invalidate: ['profile', 'recommendations'] },
];

const stripQuery = (path = '') => String(path).split('?')[0].split('#')[0];

export function isNeverCached(path) {
  const p = stripQuery(path);
  return NEVER_CACHE.some((re) => re.test(p));
}

/** The rule for a request path, or null (unknown endpoints get CACHE_DEFAULTS in the hook, no transport caching). */
export function cacheRuleFor(path) {
  const p = stripQuery(path);
  if (isNeverCached(p)) return null;
  return CACHE_RULES.find((r) => r.match.test(p)) || null;
}

/** All rows of INVALIDATION_MAP a mutation hits: { tags, refetchActive }. */
export function invalidationFor(method, path) {
  const m = String(method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return null;
  const p = stripQuery(path);
  const rows = INVALIDATION_MAP.filter((r) => r.match.test(p) && (!r.methods || r.methods.includes(m)));
  if (!rows.length) return null;
  const tags = [...new Set(rows.flatMap((r) => r.invalidate))];
  // Any row asking for an immediate refetch wins.
  const refetchActive = rows.some((r) => r.refetchActive !== false);
  return { tags, refetchActive };
}
