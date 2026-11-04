import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { expireSession } from '../../../api';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import { classifyCompanyError, DASHBOARD_KEYS, fetchDashboardSummary } from '../dashboard/companyDashboardApi';
import { SAMPLE_PERMISSIONS } from '../dashboard/companyDashboardMock';
import { DEFAULT_REPRESENTATIVE_PERMISSIONS } from '../dashboard/quickLinks';

/*
 * Hooks shared by the Sprint 4 company screens (US-PRJ-01, US-PRJ-02,
 * US-MATCH-03, US-MATCH-04, talent): page data with the company failure
 * rules, and the representative's permissions (AUTH-04).
 */

const PREVIEW_ERROR = { status: 500, preview: true, message: 'Preview: shown in its error state.' };

/**
 * useCachedQuery + the company failure rules (US-COMP-03 Scenario 5, guide §3):
 *   401 → session expired screen · 403 ORGANIZATION_PENDING → /company/pending ·
 *   other 403 → Access denied · 404 → "not found / not yours" (AC-14 of PRJ-02,
 *   AC-13 of MATCH-03 — another organization's record looks the same as none).
 * previewState 'loading' | 'error' | 'denied' | 'notfound' forces that state in previews.
 */
export function usePageData(key, fetcher, { previewState, user, enabled = true } = {}) {
  const navigate = useNavigate();
  const [previewError, setPreviewError] = useState(previewState === 'error');
  const query = useCachedQuery(key, fetcher, { enabled: enabled && previewState !== 'loading' && !previewError });
  let status = query.status;
  let error = query.error;
  if (previewError) { status = 'error'; error = PREVIEW_ERROR; }
  if (previewState === 'loading') status = 'loading';
  let failure = status === 'error' ? classifyCompanyError(error, user?.organizations?.[0]) : null;
  if (status === 'error' && error?.status === 404) failure = 'notfound';
  if (previewState === 'denied') failure = 'denied';
  if (previewState === 'notfound') failure = 'notfound';
  useEffect(() => {
    if (failure === 'expired') expireSession();
    if (failure === 'pending') navigate('/company/pending', { replace: true });
  }, [failure, navigate]);
  const retry = () => {
    if (previewError) { setPreviewError(false); return; }
    query.refetch().catch(() => {});
  };
  return { ...query, status, error, failure, retry };
}


/**
 * The representative's permissions object (GET /api/v1/company/dashboard →
 * data.permissions, US-COMP-03 guide §3): can_publish_projects,
 * can_view_projects, can_review_applications, can_manage_profile.
 * Read from the dashboard's cached answer; while it loads (or when the
 * server sends none) the representative defaults apply, as on the dashboard.
 * previewState 'readonly' shows the gated variant (no publish / no review).
 */
export function useCompanyPermissions({ demo, previewState } = {}) {
  const live = !demo;
  const { data } = useCachedQuery(live ? DASHBOARD_KEYS.summary : null, () => fetchDashboardSummary(), { enabled: live });
  if (demo) {
    if (previewState === 'readonly') return { ...SAMPLE_PERMISSIONS, can_publish_projects: false, can_review_applications: false, can_search_talent: false, loaded: true };
    return { can_search_talent: true, ...SAMPLE_PERMISSIONS, loaded: true };
  }
  const p = data?.permissions || DEFAULT_REPRESENTATIVE_PERMISSIONS;
  return {
    can_publish_projects: p.can_publish_projects !== false,
    can_view_projects: p.can_view_projects !== false,
    can_review_applications: p.can_review_applications !== false,
    can_manage_profile: p.can_manage_profile !== false,
    can_search_talent: p.can_search_talent !== false, // TODO(api): assumed permission name (US-COMP-05 BR-01)
    loaded: Boolean(data),
  };
}
