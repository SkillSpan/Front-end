# SkillSpan Frontend Fixes and Backend Handoff

## Frontend changes

- Career-role labels in the learner workspace and dashboard now prefer the role resolved from `career_role_id` through `GET /api/v1/career-roles/{id}`. The fallback to the first role in the list has been removed.
- The learner Projects view no longer uses the constant `demoState`; its role label comes from the current career-role data and its empty state reflects the actual server response.
- Assistant sample conversations and sample context indicators are gated behind `VITE_DEMO_MODE=true`. Do not enable this flag in production.
- Evidence views no longer use the fixed `Ahmed Khalil`, `Software Engineer`, `Software Engineering Track`, or hardcoded readiness score as the authenticated user's details. They use available profile/evidence fields and neutral empty values when data is missing.
- Talent Discovery no longer calls the project/content Recommendations API to populate people. It calls a dedicated frontend API helper, `getTalentDiscovery`, using `/api/v1/talent-discovery` and the standard `page` / `per_page` query parameters.
- User-facing error and empty-state messages touched during this pass have been converted to English.

## Backend items that still require confirmation

The provided archive contains the frontend only. The following items cannot be confirmed or fixed without the backend source and its API contract:

1. **Talent Discovery endpoint:** confirm that `GET /api/v1/talent-discovery` exists and returns learner/talent profile records. If the backend uses a different route or response envelope, update `getTalentDiscovery` and its response normalization to match the actual contract.
2. **Mentor authorization:** enforce the Mentor role on `GET /api/v1/mentor/students` (and related Mentor routes) using backend authorization middleware. Frontend route visibility is not a security boundary.
3. **Evidence revision states:** confirm that the backend accepts and returns the intended revision status (`revision` and/or `revision_requested`) consistently with `reviewEvidence`.
4. **Project enums:** confirm exact accepted values for project type and difficulty in both request validation and response payloads. Normalize values only against the backend's real enum contract.
5. **Career Roles pagination:** confirm the endpoint honors `per_page`; otherwise adapt the UI to the pagination envelope actually returned by the server.

## Validation status

A production build could not be run in this environment because the installed dependencies are incomplete (`vite` is missing). Run `npm ci`, then `npm run build` and `npm test` in an environment with package-registry access. Complete end-to-end verification against the backend before deployment.
