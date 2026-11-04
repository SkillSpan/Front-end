// Shared, dependency-free inline SVG icons used across the SkillSpan
// company auth screens (register wizard, login, forgot password).
// Keeping them in one place avoids duplicating markup across the
// CompanyStep1-5 / CompanyLogin / CompanyForgotPassword components.

export const ShieldCheckIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2.4l7.2 2.9v5.4c0 4.9-3.1 9.3-7.2 10.5-4.1-1.2-7.2-5.6-7.2-10.5V5.3L12 2.4z"
      fill="#22c55e"
    />
    <path d="M8.4 12.3l2.3 2.3 4.6-4.9" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10.5" width="14" height="10" rx="2" fill="#ffffff" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const EyeOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M10.6 5.2C11.06 5.07 11.53 5 12 5c7 0 10.5 7 10.5 7-.66 1.32-1.66 2.8-3 4.06M6.5 6.9C4.2 8.5 1.5 12 1.5 12S5 19 12 19c1.4 0 2.66-.27 3.77-.72"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FileDocIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 20V4a1.5 1.5 0 0 1 1.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 2.5V7h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 12.5h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const InfoIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="7.6" r="1.05" fill="currentColor" />
  </svg>
);

export const MailCheckIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="5" width="19" height="14" rx="2" fill="#0f172a" />
    <path d="M3.5 6.5l8 6.2 8-6.2" stroke="#e2e8f0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="18" cy="17" r="5.2" fill="#22c55e" stroke="#f4f6fb" strokeWidth="1.5" />
    <path d="M15.7 17.1l1.5 1.5 2.7-3" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MailOpenIcon = ({ size = 46 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 8.2L12 2.5l9.5 5.7v10.3a1.5 1.5 0 0 1-1.5 1.5h-16a1.5 1.5 0 0 1-1.5-1.5V8.2z" fill="#0f172a" />
    <path d="M2.7 8.4L12 13.6l9.3-5.2" stroke="#e2e8f0" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LockKeyIcon = ({ size = 46 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4.5" y="10.5" width="12" height="10" rx="2.2" fill="#0f172a" />
    <path d="M7.5 10.5V7.7a3.5 3.5 0 0 1 7 0v2.8" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="17.2" cy="14.4" r="3.3" fill="#0f172a" stroke="#f4f6fb" strokeWidth="0" />
    <circle cx="17.4" cy="13.6" r="1.5" fill="none" stroke="#0f172a" />
    <path d="M13.5 16.5c1-2 2.4-3.1 4-3.1a3 3 0 1 1 0 6c-1.6 0-3-1.1-4-2.9z" fill="#0f172a" />
    <circle cx="18.4" cy="16.5" r="1.35" fill="#f4f6fb" />
    <rect x="17.9" y="17.5" width="1" height="1.7" fill="#f4f6fb" />
  </svg>
);

export const CheckCircleBigIcon = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#22c55e" />
    <path d="M7 12.3l3.3 3.3 6.7-7.1" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
