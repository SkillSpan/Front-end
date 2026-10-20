/** @type {import('tailwindcss').Config} */
// Tailwind is used ONLY by Rawan's evidence screens (src/components/evidence).
// - `content` is limited to that folder so no other page generates utilities.
// - `important: '.evidence-scope'` scopes every utility under that wrapper, so
//   nothing can leak into (or be overridden by) the rest of the app's CSS.
// - `preflight: false` keeps Tailwind's global reset OFF; the small scoped
//   reset lives in evidence.css instead.
export default {
  content: ['./src/components/evidence/**/*.{js,jsx}'],
  important: '.evidence-scope',
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
}
