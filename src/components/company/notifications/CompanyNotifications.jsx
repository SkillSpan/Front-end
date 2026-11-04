import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Bell, Check, CheckCheck, MailOpen } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { expireSession } from '../../../api';
import EmptyState from '../dashboard/EmptyState';
import { SectionError } from '../dashboard/SectionState';
import { NotificationIcon, NotificationMessage, NotificationTime, ReadState } from '../dashboard/notificationParts';
import {
  NOTIFICATIONS_PAGE_SIZE,
  clampPageSize,
  classifyCompanyError,
  fetchUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../dashboard/companyDashboardApi';
import { unreadStore } from '../dashboard/unreadStore';
import { apiKey } from '../../../cache/queryCache';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import CompanyAccessDenied from '../CompanyAccessDenied';
import Pagination from './Pagination';

/**
 * Notification History (US-COMP-03 — AC-09, AC-10, AC-11; NOT-01/NOT-04).
 *  - read/unread shown as text + dot (BR-13)
 *  - All / Unread filter, pagination with a configurable page size (BR-11)
 *  - mark one / mark all as read: optimistic, rolled back with an inline
 *    error if the request fails
 *  - each item opens the screen it is about and is marked read (Scenario 4)
 * Page, filter and page size live in the URL (?page=2&filter=unread&perPage=20)
 * so every state has its own link.
 *
 * `demo` (preview builds): sample data, read state kept in localStorage.
 * `previewState`: 'loading' | 'error' | 'empty' | 'denied' (preview builds).
 */
export default function CompanyNotifications({ user, onNavigate, demo, previewState, pageSize }) {
  const { t } = useCompanyI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') === 'unread' ? 'unread' : 'all';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const perPage = clampPageSize(pageSize ?? params.get('perPage') ?? NOTIFICATIONS_PAGE_SIZE);
  const preview = demo ? (previewState === 'empty' ? 'none' : demo) : null;
  const orgName = demo ? 'Nova Tech' : (user?.organizations?.[0]?.name || '');

  const [previewError, setPreviewError] = useState(previewState === 'error');
  const [itemErrors, setItemErrors] = useState({});
  const [pageError, setPageError] = useState('');

  // Cached (src/cache): coming back to a page/filter shows it at once and
  // refreshes it in the background. Preview ?state=loading / ?state=error
  // (until Retry) make no request.
  const queryKey = apiKey('/api/v1/notifications', { page, per_page: perPage, unread: filter === 'unread' ? 1 : null }, { variant: preview ? `preview:${preview}` : null });
  const query = useCachedQuery(
    queryKey,
    async () => {
      const result = await listNotifications({ page, perPage, unread: filter === 'unread' }, { preview });
      if (result.unreadCount == null) result.unreadCount = await fetchUnreadCount({ preview }).catch(() => null);
      return result;
    },
    { enabled: previewState !== 'loading' && !previewError },
  );
  const state = previewError
    ? { status: 'error', error: { status: 500, preview: true } }
    : { status: query.status, data: query.data, error: query.error };

  // The bell + sidebar badge follow every answer from the server.
  const serverUnread = query.updatedAt ? query.data?.unreadCount : null;
  useEffect(() => {
    if (serverUnread != null) unreadStore.set(serverUnread);
    // updatedAt: re-sync after each fetch, not after local optimistic edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.updatedAt]);

  const retry = () => {
    if (previewError) { setPreviewError(false); return; }
    query.refetch().catch(() => {});
  };

  const failure = state.status === 'error' ? classifyCompanyError(state.error) : (previewState === 'denied' ? 'denied' : null);
  useEffect(() => {
    if (failure === 'expired') expireSession();
    if (failure === 'pending') navigate('/company/pending', { replace: true });
  }, [failure, navigate]);

  const setQuery = (next) => {
    const q = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => { if (v == null || v === '' || (k === 'page' && v === 1) || (k === 'filter' && v === 'all')) q.delete(k); else q.set(k, String(v)); });
    setParams(q);
    setItemErrors({});
    // Back to the top of the list on a page change (skipped in the test DOM, which has no scrolling).
    if (typeof window !== 'undefined' && !/jsdom/i.test(window.navigator?.userAgent || '')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const { setData } = query;
  const patchItems = useCallback((fn) => {
    setData((d) => (d === undefined ? d : fn(d)));
  }, [setData]);

  const markRead = async (n) => {
    if (!n.unread) return;
    setItemErrors((e) => ({ ...e, [n.id]: '' }));
    patchItems((d) => ({ ...d, unreadCount: Math.max(0, (d.unreadCount || 0) - 1), items: d.items.map((x) => (x.id === n.id ? { ...x, unread: false } : x)) }));
    unreadStore.adjust(-1);
    try {
      await markNotificationRead(n.id, { preview });
    } catch (err) {
      if (classifyCompanyError(err) === 'expired') return;
      // Roll back: it is still unread on the server.
      patchItems((d) => ({ ...d, unreadCount: (d.unreadCount || 0) + 1, items: d.items.map((x) => (x.id === n.id ? { ...x, unread: true } : x)) }));
      unreadStore.adjust(1);
      setItemErrors((e) => ({ ...e, [n.id]: t('company.notif.markError') }));
    }
  };

  const markAll = async () => {
    if (state.status !== 'ready') return;
    const before = state.data;
    const beforeCount = unreadStore.get();
    setPageError('');
    patchItems((d) => ({ ...d, unreadCount: 0, items: d.items.map((x) => ({ ...x, unread: false })) }));
    unreadStore.set(0);
    try {
      await markAllNotificationsRead({ preview });
    } catch (err) {
      if (classifyCompanyError(err) === 'expired') return;
      patchItems(() => before);
      unreadStore.set(beforeCount ?? before.unreadCount);
      setPageError(t('company.notif.markAllError'));
    }
  };

  const open = (n) => {
    markRead(n);
    if (n.link) onNavigate?.(n.link);
  };

  if (failure === 'denied') return <CompanyAccessDenied onNavigate={onNavigate} />;

  const data = state.status === 'ready' ? state.data : null;
  const unread = data?.unreadCount ?? 0;
  const from = data && data.total ? (data.page - 1) * data.perPage + 1 : 0;
  const to = data ? Math.min(data.total, from + data.items.length - 1) : 0;

  return (
    <div className="cw-dash" style={{ display: 'contents' }}>
      <div className="cw-ph">
        <div>
          <h1>{t('company.notif.title')}</h1>
          <p>{t('company.notif.sub')}</p>
        </div>
        <div className="cw-ph-actions">
          <button type="button" className="cw-btn sec" disabled={!data || unread === 0} onClick={markAll}>
            <CheckCheck size={16} strokeWidth={1.9} aria-hidden="true" /> {t('company.notif.markAll')}
          </button>
        </div>
      </div>

      {pageError && (
        <div className="cw-error" role="alert">
          <span>{pageError}</span>
          <button type="button" className="cw-btn sm sec" onClick={markAll}>{t('company.ws.retry')}</button>
        </div>
      )}

      {state.status === 'error' ? (
        <SectionError
          title={t('company.notif.listTitle')}
          error={state.error}
          className="cw-nh-card"
          onRetry={retry}
        />
      ) : (
        <section className="cw-card cw-nh-card" aria-labelledby="cw-nh-title" aria-busy={state.status === 'loading'}>
          <h2 id="cw-nh-title" className="cw-vh">{t('company.notif.listTitle')}</h2>
          <div className="cw-nh-bar">
            <div className="cw-seg" role="group" aria-label={t('company.notif.filter')}>
              <button type="button" aria-pressed={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setQuery({ filter: 'all', page: 1 })}>
                {t('company.notif.all')}
              </button>
              <button type="button" aria-pressed={filter === 'unread'} className={filter === 'unread' ? 'on' : ''} onClick={() => setQuery({ filter: 'unread', page: 1 })}>
                {t('company.notif.unread')}
                {data && unread > 0 && <span className="cw-seg-n">{unread}</span>}
              </button>
            </div>
            <div className="cw-sp" />
            {data && data.total > 0 && (
              <span className="cw-nh-count" aria-live="polite">{t('company.notif.showing', { from, to, total: data.total })}</span>
            )}
          </div>

          {state.status === 'loading' && (
            <ul className="cw-nh-list" aria-label={t('company.ws.loading')}>
              {Array.from({ length: 6 }, (_, i) => (
                <li className="cw-nh-item is-skel" key={i}>
                  <span className="cw-sk" style={{ width: 38, height: 38, borderRadius: 11, flex: 'none' }} />
                  <div className="cw-sk-col" style={{ flex: 1 }}>
                    <span className="cw-sk" style={{ width: `${66 - (i % 3) * 14}%`, height: 12, borderRadius: 6 }} />
                    <span className="cw-sk" style={{ width: `${26 + (i % 2) * 8}%`, height: 9, borderRadius: 6 }} />
                  </div>
                  <span className="cw-sk cw-sk-act" style={{ width: 96, height: 30, borderRadius: 9 }} />
                </li>
              ))}
            </ul>
          )}

          {data && data.items.length === 0 && (filter === 'unread' ? (
            <EmptyState
              icon={MailOpen}
              title={t('company.notif.noUnread')}
              body={t('company.notif.noUnreadBody')}
              action={<button type="button" className="cw-btn ghost" onClick={() => setQuery({ filter: 'all', page: 1 })}>{t('company.notif.showAll')}</button>}
            />
          ) : (
            <EmptyState icon={Bell} title={t('company.notif.empty')} body={t('company.notif.emptyBody')} />
          ))}

          {data && data.items.length > 0 && (
            <ul className="cw-nh-list">
              {data.items.map((n) => (
                <li key={n.id} className={`cw-nh-item${n.unread ? ' unread' : ''}`}>
                  <NotificationIcon n={n} size={18} />
                  <div className="cw-nh-body">
                    <a
                      className="cw-nh-msg"
                      href={n.link || '#'}
                      onClick={(e) => { e.preventDefault(); open(n); }}
                    >
                      <NotificationMessage n={n} orgName={orgName} />
                    </a>
                    <div className="cw-nm">
                      <NotificationTime n={n} year />·<ReadState unread={n.unread} />
                    </div>
                    {itemErrors[n.id] && (
                      <div className="cw-inline-err" role="alert">
                        <span>{itemErrors[n.id]}</span>
                        <button type="button" className="cw-link" onClick={() => markRead(n)}>{t('company.ws.retry')}</button>
                      </div>
                    )}
                  </div>
                  <div className="cw-nh-acts">
                    {n.unread && (
                      <button type="button" className="cw-btn sec sm" onClick={() => markRead(n)}>
                        <Check size={14} strokeWidth={2.2} aria-hidden="true" /> {t('company.notif.markRead')}
                      </button>
                    )}
                    <a className="cw-link" href={n.link || '#'} onClick={(e) => { e.preventDefault(); open(n); }}>
                      {t('company.notif.open')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data && (
            <div className="cw-nh-foot">
              <Pagination page={data.page} lastPage={data.lastPage} onChange={(p) => setQuery({ page: p })} />
            </div>
          )}
        </section>
      )}

      {demo && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
    </div>
  );
}
