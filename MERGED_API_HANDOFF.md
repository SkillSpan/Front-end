# SkillSpan — merged frontend/API handoff

This build keeps the original authentication, assessment, profile, skill-matrix and routing code, and merges the Learner workspace UI.

## API

Production Laravel API: `https://back-end-zdip.onrender.com`
All API paths use `/api/v1/...` and authenticated calls send `Authorization: Bearer <token>`.

The frontend reads both common response forms documented by the handoff: `{ success, data }`, direct `{ data }`, and the paginated career-role shape where the list is `data.data`.

Google login for individual learners uses `/api/v1/auth/login/google`. Organization login uses `/api/v1/auth/login/organization`; this backend branch does not register `/api/v1/auth/login/organization/google`, so do not call that route.

## Merged routes

- `/dashboard` — merged Learner workspace
- `/career-journey`
- `/career-roles`
- `/projects`
- `/assistant`
- `/mentor`
- `/talent`
- `/skill-matrix` — preserved original implementation
- Existing login/register/company/forgot-password routes are preserved.

## Run

1. `npm install`
2. Copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` if needed.
3. `npm run dev` or `npm run build`.

The merged Learner UI uses Tailwind utility classes through the Tailwind browser runtime so the original visual design can be preserved without changing the existing dependency graph.
