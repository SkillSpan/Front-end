/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Extracted from the Figma design
        navy: {
          DEFAULT: '#001856', // deep navy — page background top tone
          800: '#142A64',     // medium navy — cards, "Back" / "Google" buttons
          950: '#020720',     // near-black navy — page background base, sidebar, primary CTAs
        },
        ice: '#DEE7FC',       // pale lavender-white — body copy / soft text / input fill
        amber: {
          DEFAULT: '#F9AB1F', // orange/amber — eyebrow badge + accents + progress fill
          soft: '#FCDCA1',    // soft tan — info/notice bar background
        },
        cyan: '#21B0E0',      // cyan/blue — primary gradient, links, "Real Careers"
        violet: '#9E51FA',    // purple — secondary gradient, hover accents
        sky: '#0E7AC4',       // input border blue on the auth forms
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #21B0E0 0%, #9E51FA 100%)',
        'page-gradient': 'radial-gradient(120% 120% at 50% -10%, #0A2A6E 0%, #020720 55%)',
      },
    },
  },
  plugins: [],
}
