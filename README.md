# SkillSpan — Website (React + Vite + Tailwind)

Navbar + Hero section coded from the Figma design.

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Structure

```
src/
  components/
    Navbar.jsx        # logo, nav links, Resources dropdown, log in / Get Started buttons
    Hero.jsx           # eyebrow badge, headline, copy, CTAs, illustration
    auth/
      AuthLayout.jsx    # shared shell: dark sidebar + white content panel
      AuthSidebar.jsx   # "SkillSpan / Start Your Career Journey" panel, reused on every auth screen
      ProgressSteps.jsx # "STEP X OF 3" + percentage + segmented bar
      StepHeader.jsx    # eyebrow / title / subtitle block used on each step
      OptionCard.jsx    # selectable card (Student / Graduate)
      FormInput.jsx     # labeled input used on Create Account
      StepNavButtons.jsx# Back / Next button row
      icons.jsx         # small inline icons (check, info, medal, Google "G", arrow)
  pages/
    LoginPage.jsx       # "Log in to your account" screen
    SignupFlow.jsx      # the 3-step wizard: Create Account → Academic Status → Terms & Privacy
  assets/
    hero-illustration.png   # the character + skill-path illustration, used in Hero
    icons/                  # icon assets from the Figma export (target, briefcase,
                             # graduation cap, certificate, career-growth mark, etc.)
  App.jsx    # routes: "/" Home, "/login" Login, "/signup" the signup wizard
  main.jsx
  index.css
tailwind.config.js   # brand colors pulled straight from the Figma palette
```

## Pages / routes

| Route      | Screen                                                             |
|------------|---------------------------------------------------------------------|
| `/`        | Navbar + Hero (home page)                                          |
| `/signup`  | 3-step wizard — Create Account → Academic Status → Terms & Privacy |
| `/login`   | Log in to your account                                              |

The wizard keeps its own step state (no separate URL per step) with working
Back / Next navigation, controlled form inputs, a selectable Student/Graduate
card, and checkboxes that disable "Next" until both agreements are checked —
matching the "Both agreements are required to continue" notice in the design.

## Brand tokens (from the Figma palette)

| Token         | Hex       | Used for                                              |
|---------------|-----------|--------------------------------------------------------|
| `navy`        | `#001856` | Hero background gradient (top)                         |
| `navy-800`    | `#142A64` | Cards, "Back" button, "Google" button, checkbox rows    |
| `navy-950`    | `#020720` | Page background base, auth sidebar, primary CTAs        |
| `ice`         | `#DEE7FC` | Body copy, muted nav text, input fill, unselected card  |
| `amber`       | `#F9AB1F` | Eyebrow badges, progress bar fill, links inside dark UI |
| `amber-soft`  | `#FCDCA1` | "Both agreements are required" notice background        |
| `cyan`        | `#21B0E0` | "Real Careers" highlight, primary gradient, focus ring  |
| `violet`      | `#9E51FA` | Secondary gradient, outlined button accent              |
| `sky`         | `#0E7AC4` | Input borders + links on the auth screens               |

## A couple of small copy fixes

The sidebar paragraph and a couple of labels had typos in the exported design
("opportunit-in clar, verified steps", "companiies", "pursing"). I corrected
those to "opportunity in clear, verified steps", "companies", and "pursuing"
in the code — flag if you'd rather keep the original wording verbatim.

## Notes

- Only the Navbar + Hero are built for now, matching the one screen shared.
  `App.jsx` has a comment marking where the next sections (About, Features,
  How it Works, Pricing...) can be added once their designs are ready.
- Fonts: "Plus Jakarta Sans" loaded from Google Fonts in `index.html` — swap it
  out in the `<link>` tag if the real Figma file uses a different family.
- The Resources dropdown and mobile menu are functional (React state), not just
  static markup.
