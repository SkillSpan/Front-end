/** @type {import('tailwindcss').Config} */
// Tailwind utility classes are used across the learner and company workspaces.
// Compile them locally instead of relying on the runtime CDN. Preflight stays
// disabled so Tailwind does not reset the application's established CSS.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
}
