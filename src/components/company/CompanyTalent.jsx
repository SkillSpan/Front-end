import { useEffect, useState } from 'react';
import { getTalentDiscovery } from '../../api';
import { useI18n } from '../../i18n/useI18n';

const PAGE_SIZE = 9;

/**
 * Talent Discovery — the company-facing list of discoverable students.
 * Backed by GET /api/v1/talent, which is gated on `role:company_admin` AND
 * `organization.approved`, so a pending company gets the API's own refusal
 * message here rather than an empty list that looks like "no students".
 */
export default function CompanyTalent() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await getTalentDiscovery({
          page,
          perPage: PAGE_SIZE,
          search: appliedSearch || undefined,
        });
        if (cancelled) return;
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setMeta(payload?.meta || { current_page: page, last_page: 1, total: 0 });
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setError(err?.message || t('company.talent.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch, t]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const canPrev = !loading && meta.current_page > 1;
  const canNext = !loading && meta.current_page < meta.last_page;

  return (
    <div className="company-page">
      <header className="company-page-head">
        <div>
          <p className="company-eyebrow">{t('company.talent.eyebrow')}</p>
          <h1>{t('company.talent.title')}</h1>
          <p className="company-sub">{t('company.talent.subtitle')}</p>
        </div>
      </header>

      <form className="company-search" onSubmit={submitSearch} role="search">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('company.talent.searchPlaceholder')}
          aria-label={t('company.talent.searchPlaceholder')}
        />
        <button type="submit" className="company-btn company-btn--primary">
          {t('company.talent.search')}
        </button>
      </form>

      {error && <div className="company-alert">{error}</div>}

      {loading ? (
        <p className="company-empty">{t('company.talent.loading')}</p>
      ) : rows.length === 0 && !error ? (
        <p className="company-empty">{t('company.talent.empty')}</p>
      ) : (
        <div className="company-talent-grid">
          {rows.map((student) => (
            <article key={student.id} className="company-talent-card">
              <header>
                <strong>{student.name || t('company.talent.unnamed')}</strong>
                <span className="company-talent-role">
                  {student.career_role || student.specialization || t('company.talent.noRole')}
                </span>
              </header>

              <dl className="company-talent-facts">
                <div>
                  <dt>{t('company.talent.university')}</dt>
                  <dd>{student.university_name || '—'}</dd>
                </div>
                <div>
                  <dt>{t('company.talent.readiness')}</dt>
                  <dd>
                    {student.readiness?.score != null
                      ? `${student.readiness.score}/100`
                      : t('company.talent.notRated')}
                  </dd>
                </div>
              </dl>

              {Array.isArray(student.top_skills) && student.top_skills.length > 0 && (
                <ul className="company-talent-skills">
                  {student.top_skills.slice(0, 4).map((skill) => (
                    <li key={typeof skill === 'string' ? skill : skill?.name || JSON.stringify(skill)}>
                      {typeof skill === 'string' ? skill : skill?.name || '—'}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      <footer className="company-pager">
        <button
          type="button"
          className="company-btn"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!canPrev}
        >
          {t('company.talent.prev')}
        </button>
        <span>
          {t('company.talent.pageOf', {
            page: meta.current_page || 1,
            pages: meta.last_page || 1,
            total: meta.total || 0,
          })}
        </span>
        <button
          type="button"
          className="company-btn"
          onClick={() => setPage((current) => current + 1)}
          disabled={!canNext}
        >
          {t('company.talent.next')}
        </button>
      </footer>
    </div>
  );
}
