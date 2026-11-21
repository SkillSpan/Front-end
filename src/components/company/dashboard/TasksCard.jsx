import { Inbox, FilePenLine, CalendarClock, UserCheck, Mail, FileText, Building2, ArrowRight, Rocket, Plus, CheckCheck } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from './EmptyState';
import { formatDate, formatAgo } from './format';

// Section 2 — Current Tasks (US-COMP-03). Each task links straight to the
// screen where the action is done (BR-06). TODO(route): the target screens
// (applicants, project edit, team formation) are later Sprint 4 stories.
const TASK_UI = {
  review: { Icon: Inbox, route: '/company/applicants', pill: 'p-blue', primary: true },
  revise: { Icon: FilePenLine, route: '/company/projects', pill: 'p-amber' },
  deadline: { Icon: CalendarClock, route: '/company/projects', pill: 'p-red' },
  roles: { Icon: UserCheck, route: '/company/applicants', pill: 'p-violet' },
  invites: { Icon: Mail, route: '/company/applicants', pill: 'p-green' },
  draft: { Icon: FileText, route: '/company/projects', pill: 'p-gray' },
};

function ProjectList({ projects }) {
  return projects.map((p, i) => (
    <span key={p.name}>
      {i > 0 && ' · '}
      <b>{p.name}</b> {p.count}
    </span>
  ));
}

function TaskRow({ task, onNavigate }) {
  const { t, lang } = useCompanyI18n();
  const ui = TASK_UI[task.type];
  if (!ui) return null;
  const { Icon } = ui;

  let title;
  let meta;
  let pill;
  let action = t('company.ws.view');
  switch (task.type) {
    case 'review':
      title = t('company.ws.task.review', { n: task.count });
      meta = <ProjectList projects={task.projects} />;
      pill = t('company.ws.task.reviewPill');
      action = t('company.ws.task.reviewBtn');
      break;
    case 'revise':
      title = t('company.ws.task.revise', { project: task.project });
      meta = t('company.ws.task.reviseMeta');
      pill = t('company.ws.task.revisePill');
      action = t('company.ws.task.reviseBtn');
      break;
    case 'deadline':
      title = t('company.ws.task.deadline', { n: task.days });
      meta = <><b>{task.project}</b> · {t('company.ws.task.deadlineMeta', { date: formatDate(task.date, lang), n: task.applications })}</>;
      pill = t('company.ws.task.deadlinePill');
      break;
    case 'roles':
      title = t('company.ws.task.roles', { n: task.open });
      meta = <><b>{task.project}</b> · {t('company.ws.task.rolesMeta', { filled: task.filled, total: task.total })}</>;
      pill = t('company.ws.task.rolesPill');
      action = t('company.ws.task.rolesBtn');
      break;
    case 'invites':
      title = t('company.ws.task.invites', { n: task.count });
      meta = <><ProjectList projects={task.projects} /> · {t('company.ws.task.invitesMeta', { ago: formatAgo(task.sentAgo, lang, t) })}</>;
      pill = t('company.ws.task.invitesPill');
      break;
    case 'draft':
      title = t('company.ws.task.draft', { n: task.count });
      meta = <><b>{task.project}</b> · {t('company.ws.task.draftMeta', { date: formatDate(task.date, lang) })}</>;
      pill = t('company.ws.task.draftPill');
      action = t('company.ws.task.draftBtn');
      break;
    default:
      return null;
  }

  return (
    <div className="cw-task">
      <div className={`cw-tb ${task.tone}`}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></div>
      <div className="cw-x">
        <div className="cw-tt">{title}</div>
        <div className="cw-mm">{meta}</div>
      </div>
      <div className="cw-act">
        {/* Text label on every status — never colour alone (BR-13). */}
        <span className={`cw-pill ${ui.pill}`}>{pill}</span>
        <button type="button" className={`cw-abtn${ui.primary ? ' pri' : ''}`} onClick={() => onNavigate?.(ui.route)}>
          {action} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// New organization (Scenario 2): suggest the first project + completing the
// profile when it is below 100%.
function FirstProject({ onNavigate, canPublish = true }) {
  const { t } = useCompanyI18n();
  return (
    <div className="cw-feat">
      <div className="cw-feat-top">
        <div className="cw-fi"><Rocket size={24} strokeWidth={1.8} aria-hidden="true" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{t('company.ws.first.title')}</h3>
          <p>{t('company.ws.first.body')}</p>
        </div>
        {/* permissions.can_publish_projects (GET /api/v1/company/dashboard) gates publishing */}
        {canPublish && (
          <button type="button" className="cw-btn pri" onClick={() => onNavigate?.('/company/projects/new')}>
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {t('company.ws.publishProject')}
          </button>
        )}
      </div>
      <div className="cw-feat-bot">
        {[1, 2, 3].map((n) => (
          <div key={n} className="cw-bs">
            <span className="cw-n">{n}</span>
            <div>{t(`company.ws.first.s${n}`)}<small>{t(`company.ws.first.s${n}sub`)}</small></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompleteProfileTask({ profile, onNavigate }) {
  const { t } = useCompanyI18n();
  const missing = profile.fields.filter((f) => !f.done);
  return (
    <div className="cw-task" style={{ borderTop: 0, paddingTop: 16 }}>
      <div className="cw-tb amber"><Building2 size={19} strokeWidth={1.8} aria-hidden="true" /></div>
      <div className="cw-x">
        <div className="cw-tt">{t('company.ws.task.profile')}</div>
        <div className="cw-mm">
          {t('company.ws.task.profileMeta', { n: missing.length })}{' '}
          {missing.map((f, i) => (
            <span key={f.key}>{i > 0 && ', '}<b>{t(`company.ws.field.${f.key}`)}</b></span>
          ))}
        </div>
      </div>
      <div className="cw-act">
        <span className="cw-pill p-amber">{t('company.ws.task.profilePill', { n: profile.completeness })}</span>
        <button type="button" className="cw-abtn" onClick={() => onNavigate?.('/company/profile')}>
          {t('company.ws.task.profileBtn')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function TasksCard({ tasks, organization, isNew, onNavigate, canPublish = true }) {
  const { t } = useCompanyI18n();
  const profile = organization.profile;
  const showProfileTask = isNew && profile && profile.completeness < 100;
  const count = isNew ? 1 + (showProfileTask ? 1 : 0) : tasks.length;

  return (
    <section className="cw-card" aria-labelledby="cw-tasks-title">
      <div className="cw-ch">
        <div>
          <div className="cw-ch-title">
            <h2 id="cw-tasks-title">{t('company.ws.tasks')}</h2>
            <span className="cw-count">{count}</span>
          </div>
          <div className="cw-sub">
            {isNew ? t('company.ws.tasksSubNew', { org: organization.name }) : t('company.ws.tasksSub')}
          </div>
        </div>
      </div>
      {isNew ? (
        <>
          <FirstProject onNavigate={onNavigate} canPublish={canPublish} />
          {showProfileTask && <CompleteProfileTask profile={profile} onNavigate={onNavigate} />}
        </>
      ) : (
        tasks.length > 0
          ? tasks.map((task) => <TaskRow key={task.id} task={task} onNavigate={onNavigate} />)
          : <EmptyState mini icon={CheckCheck} title={t('company.ws.caughtUp')} />
      )}
    </section>
  );
}
