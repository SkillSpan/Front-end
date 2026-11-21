import { Bell, ArrowRight } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from './EmptyState';
import { NotificationIcon, NotificationMessage, NotificationTime, ReadState } from './notificationParts';

// Section 5 — Notifications (US-COMP-03, NOT-01/NOT-04): latest items with
// read/unread state + link to the full history (/company/notifications).
// Selecting an item opens what it is about and marks it read (Scenario 4).
// Data + mark-as-read: companyDashboardApi.js (listNotifications,
// markNotificationRead, markAllNotificationsRead — endpoints to be confirmed).
export default function NotificationsCard({
  notifications, unreadCount, orgName, onNavigate, onOpen, onMarkAllRead, error,
}) {
  const { t } = useCompanyI18n();
  const unread = unreadCount ?? notifications.filter((n) => n.unread).length;
  const fewItems = notifications.length < 3;

  return (
    <section className="cw-card flex" aria-labelledby="cw-notifs-title">
      <div className="cw-ch">
        <h2 id="cw-notifs-title">{t('company.ws.notifs')}</h2>
        {unread > 0 && <span className="cw-pill p-blue">{t('company.ws.unread', { n: unread })}</span>}
        <div className="cw-sp" />
        {unread > 1 && (
          <button type="button" className="cw-link" style={{ fontWeight: 500 }} onClick={onMarkAllRead}>
            {t('company.ws.markAllRead')}
          </button>
        )}
      </div>

      {error && <div className="cw-inline-err" role="alert">{error}</div>}

      {notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          className={`cw-nt${n.unread ? ' unread' : ''}`}
          onClick={() => (onOpen ? onOpen(n) : onNavigate?.(n.link || '/company/notifications'))}
        >
          <NotificationIcon n={n} />
          <span className="cw-nx">
            <span className="cw-nh" style={{ display: 'block' }}><NotificationMessage n={n} orgName={orgName} /></span>
            <span className="cw-nm">
              <NotificationTime n={n} />·
              <ReadState unread={n.unread} />
            </span>
          </span>
        </button>
      ))}

      {fewItems && (
        <EmptyState
          mini
          icon={Bell}
          title={t('company.ws.caughtUp')}
          body={t('company.ws.caughtUpBody')}
        />
      )}
      <div className="cw-spacer" />
      <div className="cw-cf">
        <button type="button" className="cw-link" onClick={() => onNavigate?.('/company/notifications')}>
          {t('company.ws.viewAllNotifs')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
