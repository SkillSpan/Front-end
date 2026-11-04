import { Plus, FolderKanban, Inbox, Building2, FilePenLine, UserSearch } from 'lucide-react';

/*
 * Quick Links (US-COMP-03 Section 6, BR-07 / AC-12): one config, each link
 * names what it needs; the card renders only the links whose requirements
 * all hold for the signed-in representative. Talent Search joins in Sprint 5
 * (US-COMP-05) — add it here with its own permission.
 *
 * ─── Data shape (TODO(api, to be confirmed): field names) ─────────────────
 * The facts a link can require come from three places:
 *
 *   organization.verification_status   'verified' → org_approved
 *       (Sprint 1 field, already returned by login / GET /api/v1/organization/profile)
 *
 *   permissions                         expected on GET /api/v1/company/dashboard:
 *       {
 *         can_publish_projects:    boolean,  // create + submit projects (US-PRJ-01)
 *         can_view_projects:       boolean,  // My Projects (US-PRJ-02)
 *         can_review_applications: boolean,  // Applications (US-MATCH-03)
 *         can_manage_profile:      boolean,  // Organization Profile (US-COMP-04)
 *       }
 *       Until the backend sends it, an approved organization's representative
 *       gets DEFAULT_REPRESENTATIVE_PERMISSIONS below (Sprint 4 has a single
 *       representative role).
 *
 *   projectStates.draft > 0             → has_draft_projects (dashboard summary counts)
 *
 * A pending / rejected organization gets no quick links at all (BR-01).
 * ──────────────────────────────────────────────────────────────────────────
 */

// TODO(route): /company/projects/new, /company/projects, /company/applicants
// are the planned Sprint 4 screens (US-PRJ-01/02, US-MATCH-03).
export const QUICK_LINKS = [
  { key: 'create', route: '/company/projects/new', Icon: Plus, highlight: true, requires: ['org_approved', 'can_publish_projects'] },
  { key: 'drafts', route: '/company/projects?state=draft', Icon: FilePenLine, requires: ['org_approved', 'can_publish_projects', 'has_draft_projects'] },
  { key: 'projects', route: '/company/projects', Icon: FolderKanban, requires: ['org_approved', 'can_view_projects'] },
  { key: 'applications', route: '/company/applicants', Icon: Inbox, requires: ['org_approved', 'can_review_applications'] },
  { key: 'profile', route: '/company/profile', Icon: Building2, requires: ['org_approved', 'can_manage_profile'] },
  // US-COMP-05 AC-12. TODO(api): permission name for talent discovery (UC-12 precondition) is assumed.
  { key: 'talent', route: '/company/talent', Icon: UserSearch, requires: ['org_approved', 'can_search_talent'] },
];

// TODO(api, to be confirmed): remove once `permissions` is part of the dashboard summary.
export const DEFAULT_REPRESENTATIVE_PERMISSIONS = {
  can_publish_projects: true,
  can_view_projects: true,
  can_review_applications: true,
  can_manage_profile: true,
  can_search_talent: true,
};

const APPROVED_STATUSES = ['verified', 'approved'];

/** The facts (strings) that hold for this representative right now. */
export function resolveQuickLinkContext({ organization, permissions, projectStates } = {}) {
  const facts = new Set();
  const approved = APPROVED_STATUSES.includes(organization?.verification_status);
  if (!approved) return { facts, drafts: 0 };
  facts.add('org_approved');
  const perms = permissions ?? DEFAULT_REPRESENTATIVE_PERMISSIONS;
  Object.entries(perms).forEach(([name, allowed]) => { if (allowed === true) facts.add(name); });
  const drafts = Number(projectStates?.draft) || 0;
  if (drafts > 0) facts.add('has_draft_projects');
  return { facts, drafts };
}

/** Links whose every requirement holds. Pure — easy to test and reuse in navigation. */
export function filterQuickLinks(context, links = QUICK_LINKS) {
  const facts = context?.facts instanceof Set ? context.facts : new Set(context?.facts || []);
  return links.filter((link) => (link.requires || []).every((need) => facts.has(need)));
}
