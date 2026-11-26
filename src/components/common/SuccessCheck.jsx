import './SuccessCheck.css';

/*
 * One success mark for every "it worked" state (email verified, assessment
 * complete...). A solid royal-blue disc settles in with a slight overshoot,
 * the white check draws itself, and a single soft ring ripples out once.
 * Pure CSS/SVG, plays once on mount, ~0.9 s; with prefers-reduced-motion the
 * final state is shown straight away. Pair it with `ss-fade-up` (and
 * `ss-fade-up-2` / `-3`) on the title, text and buttons that follow it.
 */
export default function SuccessCheck({ size = 88, className = '', label }) {
  return (
    <span
      className={`ss-check ${className}`.trim()}
      style={{ '--ss-size': `${size}px` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <span className="ss-check-ring" />
      <span className="ss-check-disc">
        <svg viewBox="0 0 52 52" className="ss-check-svg" focusable="false">
          <path className="ss-check-path" d="M15 27.5l7.5 7.5L37.5 18.5" />
        </svg>
      </span>
    </span>
  );
}
