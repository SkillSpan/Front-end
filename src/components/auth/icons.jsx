// Small inline icons that aren't part of the exported Figma assets
// (kept as SVG so they inherit currentColor and stay crisp at any size).

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InfoIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="6.5" r="1" fill="currentColor" />
      <path d="M10 9.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function MedalIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M8.5 13.5L6 21l6-3 6 3-2.5-7.5" fill="currentColor" opacity="0.35" />
      <circle cx="12" cy="9" r="6.5" fill="currentColor" />
      <path d="M9.3 9.2l1.7 1.7 3.2-3.4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 010-4.58v-3.1H1.27a12 12 0 000 10.78l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.27 6.61l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path d="M2 8h11.5M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
