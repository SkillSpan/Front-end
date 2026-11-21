// Shared empty state. `mini` is the compact grey version used inside side
// cards (notifications, funnel); the default is the blue one for main cards.
export default function EmptyState({ icon: Icon, title, body, action, mini = false }) {
  return (
    <div className={mini ? 'cw-emptymini' : 'cw-empty'}>
      {Icon && (
        <div className="cw-ill">
          <Icon size={mini ? 22 : 28} strokeWidth={1.7} aria-hidden="true" />
        </div>
      )}
      <h4>{title}</h4>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}
