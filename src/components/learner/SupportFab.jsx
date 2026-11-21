/**
 * A standing "talk to a person" button.
 *
 * Until now the only route to support was to open the assistant, ask something
 * it cannot answer, and accept the handoff it offers. That is a lot of steps for
 * a learner who already knows they want a human, so this sits in the corner of
 * every learner screen and goes straight to the support thread.
 */
export default function SupportFab({ onClick, waiting = false }) {
  return (
    <button
      type="button"
      className={`ss-support-fab${waiting ? " is-waiting" : ""}`}
      onClick={onClick}
      aria-label="Contact the support team"
      title="Contact the support team"
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 13a9 9 0 0 1 18 0" />
        <path d="M3 13v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H4" />
        <path d="M21 13v3a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h2" />
        <path d="M17 19a4 4 0 0 1-4 3h-1" />
      </svg>
      <span className="ss-support-fab-label">Need help?</span>
      {waiting && <span className="ss-support-fab-dot" aria-hidden="true" />}
    </button>
  );
}
