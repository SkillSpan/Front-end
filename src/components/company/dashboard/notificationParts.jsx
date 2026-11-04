import { Inbox, FilePenLine, UserCheck, Send, BadgeCheck, Bell, Clock, FileCheck2, FileUp } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { agoFrom, formatAgo, formatDate } from './format';

// Shared by the dashboard panel and the Notification History page.
const NOTIFICATION_ICONS = {
  application: Inbox,
  changes: FilePenLine,
  joined: UserCheck,
  open: Send,
  verified: BadgeCheck,
  approved: BadgeCheck,
  projectApproved: FileCheck2,
  submitted: FileUp,
  deadline: Clock,
};

export function NotificationIcon({ n, size = 17 }) {
  const Icon = NOTIFICATION_ICONS[n.type] || Bell;
  return <span className={`cw-tb sm ${n.tone || 'blue'}`}><Icon size={size} strokeWidth={1.8} aria-hidden="true" /></span>;
}

export function NotificationMessage({ n, orgName }) {
  const { t } = useCompanyI18n();
  // Live notifications (GET /api/v1/notifications, guide §6) carry their own
  // words: title + body, written by the server. Shown as sent.
  if (n.title || n.body) {
    return (
      <>
        <bdi>{n.title || n.body}</bdi>
        {n.title && n.body && <span className="cw-nbody" dir="auto">{n.body}</span>}
      </>
    );
  }
  const key = `company.ws.n.${n.type}`;
  const known = t(key, {}) !== key;
  if (!known) return n.text || t('company.ws.n.generic');
  if (!n.project) return t(key, { org: orgName });
  // Bold the project name inside the translated sentence.
  const [before, after] = t(key, { project: '\u0000' }).split('\u0000');
  return <>{before}<b>{n.project}</b>{after}</>;
}

export function NotificationTime({ n, year = false }) {
  const { t, lang } = useCompanyI18n();
  const ago = n.ago || agoFrom(n.createdAt);
  return <span>{ago ? formatAgo(ago, lang, t) : formatDate(n.date, lang, { year })}</span>;
}

// Read state as text + dot (BR-13: never colour alone).
export function ReadState({ unread }) {
  const { t } = useCompanyI18n();
  return unread
    ? <span className="cw-new">{t('company.ws.unreadLabel')}</span>
    : <span className="cw-read">{t('company.ws.readLabel')}</span>;
}
