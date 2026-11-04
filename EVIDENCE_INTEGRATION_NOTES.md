# SkillSpan — Evidence Integration

This build keeps `Front-end-main` as the source-of-truth application and integrates the Evidence submission screens from the SkillSpan project.

## Added routes

- `/evidence` — Evidence Status
- `/evidence/add` — Skill Evidence Submission
- `/evidence/add?resubmit=<id>` — Resubmit Evidence
- `/evidence/:id` — Evidence Review / Detail
- `/review` — Reviewer workspace

All routes require an authenticated learner session except the reviewer route's UI still uses the existing auth guard.

## API preservation

The existing `src/api.js` was retained as the authoritative API client. Its Evidence endpoints were not replaced or changed:

- `GET /api/v1/evidence`
- `POST /api/v1/evidence`
- `GET /api/v1/evidence/:id`
- `PUT /api/v1/evidence/:id/review`

The existing `VITE_API_BASE_URL` handling, Bearer token handling, session expiry handling, and all existing application endpoints remain intact.

## Integration dependencies

The Evidence UI uses:

- `lucide-react`
- Tailwind CSS with a scoped `.evidence-scope` configuration
- `postcss`
- `autoprefixer`

Tailwind is scoped to the Evidence component folder and does not enable global preflight, minimizing impact on the original application styles.

## File upload fix

The integrated submission flow correctly maps the selected browser `File` object to the existing `submitEvidence(..., true)` FormData path. URL evidence continues to use the JSON API path.

## Verification

Static import resolution passed for the integrated Evidence components. The local container could not complete Vite/Vitest execution because the uploaded dependency tree is missing Linux optional native Rollup/Rolldown bindings; the final archive intentionally excludes `node_modules` so a normal `npm install` on the target environment will install the correct platform dependencies.
