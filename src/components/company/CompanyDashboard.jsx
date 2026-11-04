import { useEffect, useState } from 'react';
import { getOrganizationProfile, getTalentDiscovery, unwrapApiData } from '../../api';
import { useI18n } from '../../i18n/useI18n';

/**
 * Company home. Two read-only calls on mount: the organization profile (who
 * am I, and am I verified?) and a 1-per-page talent probe purely to read
 * `meta.total` — the company needs to know how many discoverable students
 * exist before it opens the full list.
 */
export default function CompanyDashboard({ user, onNavigate }) {
  const { t } = useI18n();
  const [organization, setOrganization] = useState(
    () => user?.organizations?.[0] || null,
  );
  const [talentTotal, setTalentTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled([
        getOrganizationProfile(),
        getTalentDiscovery({ perPage: 1 }),
      ]);
      if (cancelled) return;

      const [profileResult, talentResult] = results;

      if (profileResult.status === 'fulfilled') {
        const row = unwrapApiData(profileResult.value) || null;
        if (row) setOrganization((prev) => ({ ...(prev || {}), ...row }));
      }

      if (talentResult.status === 'fulfilled') {
        const total = talentResult.value?.meta?.total;
        if (typeof total === 'number') setTalentTotal(total);
      } else {
        // A pending/rejected organization is refused by `organization.approved`
        // on both endpoints; surface the API's own wording instead of a generic
        // failure so the company knows it is a verification issue, not a bug.
        setNotice(talentResult.reason?.message || t('company.dashboard.loadError'));
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const orgName = organization?.name || user?.name || t('company.dashboard.fallbackOrg');
  const status = organization?.verification_status || 'pending';

  return (
    <div className="company-page">
      <header className="company-page-head">
        <div>
          <p className="company-eyebrow">{t('company.dashboard.eyebrow')}</p>
          <h1>{t('company.dashboard.welcome', { name: orgName })}</h1>
          <p className="company-sub">{t('company.dashboard.subtitle')}</p>
        </div>
        <button type="button" className="company-btn company-btn--primary" onClick={() => onNavigate?.('/company/talent')}>
          {t('company.dashboard.browseTalent')}
        </button>
      </header>

      {notice && <div className="company-alert">{notice}</div>}

      <section className="company-stats" aria-busy={loading}>
        <article className="company-stat">
          <span className="company-stat-label">{t('company.dashboard.statStatus')}</span>
          <strong className={`company-status company-status--${status}`}>
            {t(`company.status.${status}`)}
          </strong>
          <span className="company-stat-hint">{t('company.dashboard.statStatusHint')}</span>
        </article>

        <article className="company-stat">
          <span className="company-stat-label">{t('company.dashboard.statTalent')}</span>
          <strong>{loading ? '—' : talentTotal ?? '—'}</strong>
          <span className="company-stat-hint">{t('company.dashboard.statTalentHint')}</span>
        </article>

        <article className="company-stat">
          <span className="company-stat-label">{t('company.dashboard.statAccount')}</span>
          <strong>{organization?.type || t('company.dashboard.fallbackType')}</strong>
          <span className="company-stat-hint">{organization?.contact_email || user?.email || '—'}</span>
        </article>
      </section>

      <section className="company-cards">
        <button type="button" className="company-card" onClick={() => onNavigate?.('/company/talent')}>
          <span className="company-card-icon" aria-hidden="true">👥</span>
          <strong>{t('company.card.talentTitle')}</strong>
          <span>{t('company.card.talentBody')}</span>
        </button>

        <button type="button" className="company-card" onClick={() => onNavigate?.('/company/profile')}>
          <span className="company-card-icon" aria-hidden="true">🏢</span>
          <strong>{t('company.card.profileTitle')}</strong>
          <span>{t('company.card.profileBody')}</span>
        </button>
      </section>
    </div>
  );
}
