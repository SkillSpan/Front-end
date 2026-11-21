import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './workspace/companyWorkspace.css';
import './profile/companyProfile.css';
import { useCompanyI18n } from './useCompanyI18n';
import { expireSession } from '../../api';
import { classifyCompanyError } from './dashboard/companyDashboardApi';
import { SectionError } from './dashboard/SectionState';
import CompanyAccessDenied from './CompanyAccessDenied';
import { getProfile, profileQueryKey, resetPreviewProfile } from './profile/companyProfileApi';
import { invalidateAfterMutation, setQueryData } from '../../cache/queryCache';
import { useCachedQuery } from '../../cache/useCachedQuery';
import ProfileView from './profile/ProfileView';
import ProfileEditForm from './profile/ProfileEditForm';
import ProfileSkeleton from './profile/ProfileSkeleton';

/**
 * Organization Profile (Sprint 4, US-COMP-04).
 *   /company/profile        → view (company info, location, contact, documents,
 *                             verification status, completeness + missing fields)
 *   /company/profile/edit   → edit form (?focus=<field> opens on that field)
 *
 * Data: profile/companyProfileApi.js (GET/PATCH /api/v1/profile/me,
 * POST /api/v1/company/profile/documents). 401 → the app's SessionExpired
 * screen; 403 → /company/pending for a pending org, otherwise Access denied —
 * nothing of the profile is shown (Scenario 6).
 *
 * `demo` (preview builds): Nova Tech sample data kept in localStorage.
 * `previewState` (preview builds, ?state=): loading | error | denied |
 *   pending | incomplete | rejected | reverification | saved | upload-error |
 *   uploading (view) · errors | reverify | upload-error (edit).
 */
const VARIANTS = ['pending', 'incomplete', 'rejected', 'reverification'];

export default function CompanyProfile({ user, onNavigate, demo, previewState, mode = 'view', onOrganization }) {
  const { t } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const preview = Boolean(demo);
  const variant = VARIANTS.includes(previewState) ? previewState : null;
  const [previewError, setPreviewError] = useState(previewState === 'error');
  const [flash, setFlash] = useState(() => location.state?.profileFlash || (previewState === 'saved' ? { saved: true } : null));
  const go = onNavigate || navigate;

  // The "saved" flash rides the navigation state once; drop it so a refresh
  // doesn't show it again.
  useEffect(() => {
    if (location.state?.profileFlash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cached (src/cache): view ⇄ edit and dashboard → profile → dashboard show
  // the last answer at once and refresh it in the background. A save or an
  // upload writes its answer into the cache (and clears the dashboard's org
  // answers, cacheConfig.js INVALIDATION_MAP).
  const key = profileQueryKey({ preview, variant });
  const query = useCachedQuery(key, () => getProfile({ preview, variant }), {
    enabled: previewState !== 'loading' && !previewError,
  });
  const { refetch } = query;
  const [changeError, setChangeError] = useState(null);
  const state = previewError || changeError
    ? { status: 'error', error: changeError || { status: 500, preview: true } }
    : { status: query.status, profile: query.data, error: query.error };

  const profile = state.status === 'ready' ? state.profile : null;
  useEffect(() => {
    if (profile) onOrganization?.({ name: profile.values.companyName, verification_status: profile.verificationStatus });
  }, [profile, onOrganization]);

  const failure = state.status === 'error'
    ? classifyCompanyError(state.error, user?.organizations?.[0])
    : (previewState === 'denied' ? 'denied' : null);
  useEffect(() => {
    if (failure === 'expired') expireSession();
    if (failure === 'pending') navigate('/company/pending', { replace: true });
  }, [failure, navigate]);

  // A document upload / save answered with the new profile → into the cache
  // (a server answer, so it counts as fresh). An error here (e.g. 401/403 from
  // an upload) is handled like a load error.
  const onProfileChange = useCallback((next, err) => {
    if (next) { setChangeError(null); setQueryData(key, next, { touch: true }); } else if (err) setChangeError(err);
  }, [key]);
  const retry = () => {
    setChangeError(null);
    if (previewError) { setPreviewError(false); return; }
    refetch().catch(() => {});
  };

  const pick = (key) => go(`/company/profile/edit?focus=${encodeURIComponent(key)}`);

  if (failure === 'denied') return <CompanyAccessDenied onNavigate={go} />;
  if (state.status === 'loading' || failure === 'expired' || failure === 'pending') return <ProfileSkeleton mode={mode} />;
  if (state.status === 'error') {
    return (
      <div className="cw-pf" style={{ display: 'contents' }}>
        <div className="cw-ph"><div><h1>{t(mode === 'edit' ? 'company.pf.editTitle' : 'company.pf.title')}</h1><p>{t('company.pf.sub')}</p></div></div>
        <SectionError
          title={t('company.pf.title')}
          variant="list"
          error={state.error}
          onRetry={retry}
          className="cw-pf-error"
        />
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <ProfileEditForm
        key={previewState || 'edit'}
        profile={profile}
        preview={preview}
        previewState={previewState}
        onNavigate={go}
        onProfileChange={onProfileChange}
        onCancel={() => go('/company/profile')}
        onSaved={(next, { reverification }) => {
          setQueryData(key, next, { touch: true });
          navigate('/company/profile', { state: { profileFlash: { saved: true, reverification } } });
        }}
      />
    );
  }

  return (
    <ProfileView
      profile={profile}
      preview={preview}
      previewState={previewState}
      flash={flash}
      onDismissFlash={() => setFlash(null)}
      onEdit={() => go('/company/profile/edit')}
      onPick={pick}
      onNavigate={go}
      onProfileChange={onProfileChange}
      onReset={() => {
        resetPreviewProfile();
        // Same clean-up a real profile change gets; this screen refetches.
        invalidateAfterMutation('PATCH', '/api/v1/profile/me');
      }}
    />
  );
}
