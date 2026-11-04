import { useEffect, useState } from 'react';
import { getOrganizationProfile, unwrapApiData } from '../../api';
import { useI18n } from '../../i18n/useI18n';

/**
 * Read-only view of the company's organization record. Editing lives in the
 * backend's organization endpoints (none of which are exposed here yet), so
 * this page intentionally has no form — it shows what the API returns and
 * says so, instead of presenting dead inputs.
 */
export default function CompanyProfile({ user }) {
  const { t } = useI18n();
  const [organization, setOrganization] = useState(() => user?.organizations?.[0] || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payload = await getOrganizationProfile();
        const row = unwrapApiData(payload);
        if (!cancelled && row) setOrganization((prev) => ({ ...(prev || {}), ...row }));
      } catch (err) {
        if (!cancelled) setError(err?.message || t('company.profile.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const status = organization?.verification_status || 'pending';

  const rows = [
    { key: 'name', label: t('company.profile.name'), value: organization?.name },
    { key: 'type', label: t('company.profile.type'), value: organization?.type },
    { key: 'industry', label: t('company.profile.industry'), value: organization?.industry },
    { key: 'size', label: t('company.profile.size'), value: organization?.company_size },
    { key: 'email', label: t('company.profile.email'), value: organization?.contact_email },
    { key: 'phone', label: t('company.profile.phone'), value: organization?.contact_phone },
    { key: 'website', label: t('company.profile.website'), value: organization?.website },
    {
      key: 'location',
      label: t('company.profile.location'),
      value: [organization?.city, organization?.country].filter(Boolean).join(', '),
    },
  ];

  return (
    <div className="company-page">
      <header className="company-page-head">
        <div>
          <p className="company-eyebrow">{t('company.profile.eyebrow')}</p>
          <h1>{t('company.profile.title')}</h1>
          <p className="company-sub">{t('company.profile.subtitle')}</p>
        </div>
        <span className={`company-status company-status--${status}`}>
          {t(`company.status.${status}`)}
        </span>
      </header>

      {error && <div className="company-alert">{error}</div>}

      <section className="company-detail-card" aria-busy={loading}>
        {rows.map((row) => (
          <div key={row.key} className="company-detail-row">
            <span>{row.label}</span>
            <strong>{loading && !row.value ? '—' : row.value || '—'}</strong>
          </div>
        ))}
      </section>

      <p className="company-note">{t('company.profile.readOnlyNote')}</p>
    </div>
  );
}
