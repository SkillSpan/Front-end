# SkillSpan front end vs the live API: endpoint audit

Prepared 27 Oct 2026 (UTC). Front end: `SkillSpan/Front-end`, local branch `tab-fixes` plus the API worktree `api-verify`. Backend: https://skillspan.alwaysdata.net.

**Sources of truth used**
- Live OpenAPI spec: `GET https://skillspan.alwaysdata.net/docs?api-docs.json` (the URL the Swagger UI at `/api/documentation` loads), saved as `openapi.json` next to this file (OpenAPI 3.0.0, 83 paths, server `/api`).
- Backend source: the live server matches branch **`feature/authentication` (3c89bd7, 22 Oct)**, not `main` (d4aaf73, 19 Oct). Live answers routes that exist only on that branch: `DELETE /api/v1/conversations/{id}` is in the spec and `/api/v1/profile/avatar` answers 401. Controller/FormRequest line references below are to that branch.
- Method: every claim about a request or response shape was checked against the controller / FormRequest / API Resource, not only against Swagger. Swagger is incomplete in places (listed below).

## 1. Live checks (read-only, 27 Oct ~10:00 UTC)

| Check | Result |
|---|---|
| `GET /up` | **200** (Laravel health page, text/html, ~0.8 s) |
| `GET /api/health` | 404 (no such route; `/up` is the health route; `wakeUpApi()` already uses `/up`) |
| `GET /api/v1/reference/universities` | **200**, `{success, message, data:[{id,name}]}`, 10,239 rows, 541 KB, 2.2 s |
| `GET /api/v1/reference/specializations` | **200**, 40 rows `{id,name}` |
| `GET /api/v1/reference/countries` | **200**, 250 rows `{id,name,name_ar,iso2,iso3}` (Jordan = 116, Palestine = 187) |
| `GET /api/v1/reference/countries/110/universities` | 200 list. `…/countries/JO/universities` gives **404** (`{country}` must be the numeric id) |
| Unauthenticated GET on all 24 authenticated GET routes the FE calls (profile, profile/avatar, support/requests, evidence, skills/*, career-roles, readiness/latest, intelligence/latest, projects, applications, recommendations, talent, talent/filters, mentor/*, conversations, notifications(+unread-count, preferences), organization/profile) | all **401 `{"message":"Unauthenticated."}`**, so every route exists. Control: `/api/v1/nonexistent-route` gives 404 |

No account was registered and nothing was POSTed/PUT/DELETEd. Authenticated response bodies could not be sampled live, so response shapes come from the backend source.

## 2. CORS

Backend config: `config/cors.php` reads `CORS_ALLOWED_ORIGINS` (comma list, exact match), `allowed_origins_patterns => []`, `supports_credentials => true`, `max_age => 0`, paths `api/*`.

| Origin | Preflight `OPTIONS` (Access-Control-Request-Headers: authorization,content-type) | Simple GET |
|---|---|---|
| `https://skillspan-iota.vercel.app` (production) | 204, `access-control-allow-origin: https://skillspan-iota.vercel.app`, `allow-credentials: true`, `allow-methods: GET` / `POST`, `allow-headers: authorization,content-type` | 200 with allow-origin echoed |
| `http://localhost:5173` | 204, allow-origin echoed, same headers | 200 with allow-origin echoed |
| `http://localhost:3000` | 204, allow-origin echoed | — |
| `https://skillspan-fe.vercel.app` (any other / preview `*.vercel.app`) | 204 **without** any `access-control-allow-origin`, so the **browser blocks it** | 200 without allow-origin, also blocked |
| `http://127.0.0.1:5173` | 204 **without** allow-origin, so blocked | — |

The production site and default local dev work. Vercel preview deployments, `127.0.0.1`, and Vite's fallback port 5174 (used when 5173 is busy) are blocked. That is a backend env change (`CORS_ALLOWED_ORIGINS`, or a pattern in `allowed_origins_patterns`); see BACKEND_QUESTIONS_AR.md.

## 3. Swagger vs real routes

- **In routes but missing from Swagger:** `POST/GET/DELETE /api/v1/profile/avatar`, `POST/GET /api/v1/support/requests`, `GET /api/v1/support/requests/{id}`, `POST /api/v1/support/requests/{id}/messages`, `GET /api/v1/support/avatar/{user}`, `POST /api/v1/auth/check-email`. The FE calls the first two groups.
- Shape drift seen: recommendations `reasons` is documented as `[string]`, but the backend sends one newline-joined string. Match `explanation` is documented as a string, but the backend sends an array. `/assistant/ask` 201 omits `handoff_available`, `answer_status`, `grounded`. Notifications list documents only `page`.
- **Spec operations the FE never calls** (may matter for screens still on static data):
  - learner-relevant: `GET /projects/{project}/recommendation` (per-project recommendation, which would let Project Details drop its list lookup), `POST /skill-match`, `GET /mentor/students/{student}` (mentor student summary, no api.js wrapper), `GET /projects/{project}/applications` (company: applicants of a project)
  - company/admin project management: `POST /projects`, `PATCH /projects/{project}`, `POST /projects/{project}/submit|open|approve|request-changes|reject`, all of `/admin/organizations*` and `/admin/projects*` (admin panel, not in this FE)
  - ops/internal: `/setup/create-admin`, `/setup/create-mentor`, `/internal/baseline-items`
- **api.js wrappers with no caller** (exist, unused): `getUniversities`, `addSkillToMatrix` (aliased as upsertSkillMatrix, which is used), `calculateReadiness` and `calculateReadinessScore` (duplicates of the same POST), `updateApplication`, `getTalentFilters`, `getTalentStudent`, `getMentorConnections`, `updateMentorConnection`, `getConversation`, `getChatbotMessages`, `sendChatbotMessage`, `markConversationRead`, `getConversationStatus`, `createConversation`, `getNotificationsPreferences`, `updateNotificationsPreferences`, `clearSessionAndRevoke`, `getToken` (exported only).

## 4. Top mismatches

**Fixed in the API layer (all cherry-picked onto `tab-fixes`):**
1. `GET /career-roles/{id}/skills` returns `data:{career_role, skills:[…], statistics, snapshot}`. `careerRolesApi.fetchCareerRoleSkills` unwrapped it as a list and returned `[]` for every role, so every role showed no skills and readiness "Not enough data".
2. Organization registration sent `organization_size / website / description / country / city / address / postal_code`. The contract is the `organization_` names, and the old ones only worked through a legacy alias. `organization_contact_phone` is now sent; `administrator_name` (unknown to the backend) is dropped.
3. Learner profile `expected_graduation` is an integer year (2024–2150) on the backend. The mapper now sends a number or null (it used to send a string, or "" when empty, and its doc said YYYY-MM-DD).
4. Evidence rows keep the link/file in `reference`. The mapper read `evidence_url/evidence_file`, so links were always empty (fixed in 0ebb6fa). The api.js docs about the evidence endpoints were wrong (verified-only, no ownership check) and are corrected.
5. `withdrawApplication` dropped the withdrawal reason the screen collects; it is now sent as `{reason}`.
6. New `src/utils/projectMapping.js` (tested, ready to wire): `applicationStatusLabel()` and `withRecommendations()` (projects + recommendations + learner levels → the `match_score / is_recommended / recommendation_reason / eligibility / skill_matches` ProjectsView reads).

**Needing component changes** (section 7 lists file + change). The most serious:
- Applying to a project crashes Project Details (status `submitted` is lowercase, StatusPill has no entry for it).
- `CompanyTalent.jsx` renders the `career_role` object as a React child, which crashes for any student with a role.
- The learner nav shows Talent and Mentor, which are company-only / mentor-only (403 / alert). TalentDiscoveryView also crashes on the real talent payload.
- Project list/details read many fields `ProjectResource` doesn't have (match, eligibility message, capacity `remaining`).
- Dashboard roadmap "Phase foundations of NaN" (phase is a string enum), plus hard-coded fallbacks (35%, Phase 2 of 4, fake skill gaps, three fake projects).

**Backend bugs found from source** (in the questions file): the recommendations eager-load uses a non-existent `organizations.title` column, so `GET /recommendations` should fail once a learner has a recommendation. `POST /evidence` hard-codes `source='certificate'`. `GET /evidence` mixes the baseline's `assessment_test` rows in with learner evidence. `additional_document` is ignored at org registration. `per_page` is ignored on several lists.

## 5. Endpoint-by-endpoint table

Envelope: the backend wraps everything as `{success, message, data, …}`. Paginated lists put the rows in `data.data` (Laravel paginator, e.g. career-roles, projects) or in `data` with `meta`. `unwrapApiData()` resolves all of these correctly; what breaks is field names inside the payload.

### A. Auth, profile, reference data (checked by me against the FormRequests in /tmp/be)

| FE function (src/api.js) | Method + path | Sent | Backend / spec says | UI reads | Backend returns | Verdict |
|---|---|---|---|---|---|---|
| registerUser (RegisterStep3) | POST /api/v1/auth/register | name, email, password, password_confirmation, academic_status, terms_accepted, privacy_accepted (buildRegisterPayload) | RegisterRequest: name*, email* (unique), password* (min 8, confirmed), terms_accepted* (accepted), privacy_accepted* (accepted), phone, locale en/ar, career_status, academic_status ∈ enrolled/graduated/on_leave/student/graduate/looking_for_job/employed, user_type=individual | nothing beyond success | data {user_id, email, status, requires_verification, terms_accepted_at, privacy_accepted_at, resend_available_at} | OK. academic_status values come from RegisterStep2. The UI ignores `resend_available_at`; OtpVerification uses a fixed 60 s fallback instead (component, optional) |
| registerOrganization (CompanyStep4) | POST /api/v1/auth/register/organization (multipart) | was: organization_size, website, description, country, city, address, postal_code, administrator_name, additional_document | RegisterOrganizationRequest: organization_company_size, organization_website (url), organization_description (≤1000), organization_country, organization_city, organization_address, organization_postal_code, organization_contact_phone; proof_file* jpg/jpeg/png/pdf ≤5 MB. Legacy unprefixed names are accepted only through a prepareForValidation alias fallback | success only | data {user_id, email, status, requires_verification} | **Fixed in API layer (8c4e67a)**: canonical names, organization_contact_phone added, administrator_name dropped. `additional_document` is still sent, and **the backend ignores it** (it is in no rule or service) → backend question |
| verifyOtp | POST /api/v1/auth/verify | email, otp | email*, otp* (string, size 6) | success | data {redirect_url} | OK |
| resendOtp | POST /api/v1/auth/resend-otp | email | email* | success | data {resend_available_at} | OK (resend_available_at unused in the UI) |
| loginUser | POST /api/v1/auth/login | email, password | email*, password* | data.user, data.token (Login.jsx:78) | data {user{…roles, student_profile}, token, token_type} | OK |
| loginWithGoogle | POST /api/v1/auth/login/google | credential, terms_accepted, privacy_accepted, …extra | credential*, terms_accepted, privacy_accepted (nullable boolean). Anything in `extra` is ignored | data.user, data.token | data {user, token, token_type, is_new_user} | OK |
| loginOrganization | POST /api/v1/auth/login/organization | email, password | email*, password* | data.user, data.organizations, data.token (CompanyLogin.jsx:42) | data {user, organizations[], token, token_type} | OK |
| forgotPassword / resendForgotPassword(Otp) | POST /api/v1/auth/forgot-password(/resend) | email | email* | data.resend_available_at (CompanyForgotPassword) | data {resend_available_at} | OK |
| verifyForgotPasswordOtp | POST /api/v1/auth/forgot-password/verify | email, otp | email*, otp* size 6 | success | {success, message} | OK |
| resetPassword | POST /api/v1/auth/reset-password | email, otp, password, password_confirmation | all required, password min 8 confirmed | success | data {redirect_url} | OK |
| logoutUser / logoutAllDevices | POST /api/v1/auth/logout(-all) | — (Bearer) | auth:sanctum | — | data {redirect_url} | OK |
| getProfile | GET /api/v1/profile | — | role:learner | ProfileView / LearnerWorkspace: profile fields, has_avatar | data {id, university_name, student_university_number, specialization, academic_level, expected_graduation (int), bio, career_status, interests[], availability, weekly_availability_hours, preferred_work_type, visibility, completeness_percent, has_avatar, …} | OK |
| createProfile (LearnerProfileSetup) | POST /api/v1/profile (upsert) | buildProfilePayload: university_name, student_university_number, specialization, academic_level, expected_graduation, bio, visibility | StoreProfileRequest: university_name*, student_university_number*, specialization*, academic_level*, expected_graduation = **integer 2024–2150** (nullable), visibility ∈ public/organization_only/private | — | 200/201 profile | **Fixed (8c4e67a)**: the mapper now sends the year as a number or null. It used to send a string, or "" when empty, and its doc comment said YYYY-MM-DD |
| updateProfile (ProfileView) | PUT /api/v1/profile | the 7 editable fields, expected_graduation as Number | UpdateProfileRequest (all optional). Also accepts primary_career_role_id, career_status, interests, availability, weekly_availability_hours, preferred_work_type, none of which the UI edits | row | profile | OK |
| uploadProfileAvatar / deleteProfileAvatar / fetchProfileAvatarUrl | POST/DELETE/GET /api/v1/profile/avatar | multipart `avatar` | UpdateAvatarRequest: avatar* image jpeg/jpg/png/webp/gif | blob | image / JSON | OK. Live route answers 401, so it exists, but it is **missing from the OpenAPI spec** |
| getSpecializations / getCountries | GET /api/v1/reference/specializations, /countries | — (public) | public | res.data[].name | {success, message, data:[{id,name}]}, countries add name_ar, iso2, iso3 | OK (live: 40 specializations, 250 countries) |
| getUniversitiesByCountry | GET /api/v1/reference/countries/{country}/universities | known.id ?? known.iso2 ?? name (LearnerProfileSetup.jsx:214) | `{country}` is cast to int (ReferenceController::countryUniversities) | res.data[].name | data:[{id,name}] | OK when the country came from the API (numeric id). With the static fallback list it sends ISO2/name, which gets **404** (`/countries/JO/universities` → 404 live). Only reachable when /countries failed |
| getUniversities | GET /api/v1/reference/universities | — | public | — | 10,239 rows, 541 KB | Unused wrapper (fine: the per-country route is the right one) |

### B. Baseline assessment, skills, evidence, career roles

| FE function | Method + path | Sent | Backend says | UI reads | Backend returns | Verdict |
|---|---|---|---|---|---|---|
| startBaselineAssessment (AssessmentWizard:148) | POST /api/v1/baseline-assessments | {career_role_id} | StartBaselineAssessmentRequest: career_role_id* (exists, approved), specialization_id optional | res.data.id, res.data.questions[]; 409 code ASSESSMENT_ALREADY_EXISTS + details.assessment_id/status | data {id, career_role_id, status, questions, …}; errors carry code + details | OK |
| getBaselineAssessment | GET /api/v1/baseline-assessments/{id} | — | owner | data.questions | same shape | OK |
| autosaveBaselineAssessment | PATCH /api/v1/baseline-assessments/{id} | {progress:{answered,total,percent}, responses} | SaveBaselineProgressRequest: progress (array), responses (array), both nullable | ignored | — | OK |
| submitBaselineAssessment | POST …/{id}/submit | {responses:[{question_id, answer}]} | responses* list min 1, question_id* string ≤100, answer* in the question's options | res.data (stored as the result), career_role_id | result | OK; 409 ASSESSMENT_ALREADY_COMPLETED is handled |
| calculateIntelligence (after submit) | POST /api/v1/intelligence/calculate | {career_role_id?} | career_role_id nullable int | — | see projects section | OK |
| getSkillsTaxonomy (SkillMatrix, evidence form) | GET /api/v1/skills/taxonomy | — | auth | data[] flat nodes with parent_skill_id | {success, message, data:[{id,name,slug,category,parent_skill_id,aliases,parent,children,careerRoles…}]} | OK. SkillMatrix.jsx:221 still has a `console.log` of the raw response (component cleanup) |
| getSkillsMatrix | GET /api/v1/skills/matrix | — | **scoped to the caller server-side** for non-admins (SkillsController@matrix). The old comments saying "returns the whole table" are stale | rows: learner_id, skill_id, level, id | data:[LearnerSkill + skill] | OK. careerRolesApi now compares learner ids by value (be97616). SkillMatrix.jsx:270 still uses `row.learner_id === learnerId` (strict; component) |
| upsertSkillMatrix (SkillMatrix:356) | POST /api/v1/skills/matrix | learner_id, skill_id, level, confidence_score, source_type | learner_id* (must be the caller), skill_id*, level* 0–5, confidence_score* 0–100 | `created?.id` | **{success, message, data: LearnerSkill}** | **Mismatch (component)**: SkillMatrix.jsx:363 reads `created.id`, but the id is at `created.data.id`. The row id is never stored, so the next save POSTs again (harmless upsert, but updateSkillMatrixEntry is never used for new rows) |
| updateSkillMatrixEntry | PUT /api/v1/skills/matrix/{id} | level, confidence_score | sometimes level/confidence/source_type | — | data row | OK |
| submitEvidence (via evidenceApi.sendEvidence) | POST /api/v1/evidence | skill_id, evidence_url or evidence_file, description, **source**, evidence_date | skill_id* (active skill), evidence_url (url, required without file), evidence_file (pdf/jpg/jpeg/png/webp ≤10 MB), description ≤500, evidence_date (date). **`source` is not validated or stored: the controller hard-codes source='certificate'** | mapped record | 201 data: SkillEvidence {…, source:'certificate', reference, verification_status:'pending'} | Backend gap (see questions). The `reference` read is fixed on tab-fixes (0ebb6fa) |
| getMyEvidence | GET /api/v1/evidence | (optional ?status) | ListEvidenceRequest: status ∈ STATUSES. Returns **all** statuses, including the `assessment_test` rows the baseline writes | list | data:[SkillEvidence + skill + reviewer] | OK. The UI filters `assessment_test` (isLearnerEvidence). Comment fixed (26598dd) |
| getEvidenceById | GET /api/v1/evidence/{id} | — | admin: any; learner: own only (404) | record | data row | Unused by screens directly (EvidenceContext has its own getEvidenceById over the loaded list) |
| reviewEvidence (EvidenceContext/ReviewerDashboard) | PUT /api/v1/evidence/{id}/review | verification_status (verified/rejected/revision), reviewer_notes | REVIEW_OUTCOMES = verified, rejected, revision; **admin only** (403 otherwise) | record | data row | OK for an admin token; a learner hitting the reviewer screen gets 403 |
| getCareerRoles (LearnerWorkspace:48, AssessmentWizard:86, careerRolesApi) | GET /api/v1/career-roles?page&per_page | page, per_page | ListCareerRolesRequest: specialization_id (optional filter), per_page ≤100 (default 15) | rows via unwrapApiData → data.data | data: **Laravel paginator** {current_page, data:[{id,title,slug,version,status,effective_date,description,skills_count}], total…} | OK for the shape. LearnerWorkspace asks perPage 15, so a catalog with more than 15 roles is truncated (component: ask 100 or page). No category, readiness, saved flag or demand on the row: CareerRolesView shows category "Other" and readiness 0 for every role (see static-data list) |
| getCareerRoleById | GET /api/v1/career-roles/{id} | — | approved only (422 CAREER_ROLE_NOT_APPROVED, 404 CAREER_ROLE_NOT_FOUND) | title, version, effective_date | data {id,title,version,effective_date,status} | OK |
| getCareerRoleSkills (careerRolesApi) | GET /api/v1/career-roles/{id}/skills | — | 422 CAREER_ROLE_NO_SKILLS when empty | rows | **data {career_role, skills:[{skill_id, skill_name, slug, required_level, importance_weight, is_critical, prerequisites[{skill_id,slug,name}]}], statistics, snapshot}** | **Fixed (be97616)**: it used to unwrap as a list and always returned []. Skill rows have no category, so the "General" fallback is expected |

### C. Workspace, projects, intelligence (per function)

#### getLatestReadiness
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getLatestReadiness (api.js:511) | GET | /api/v1/readiness/latest | nothing (BE also accepts optional `?career_role_id`) | ReadinessController::latest (L74-121): 404 `READINESS_NOT_FOUND` when none, 422 when no student profile | Dashboard.jsx:164 `score`, :167 `role_title`, :168 `career_role_id`, :194 `total_skills`, :197 `met_skills`; LearnerWorkspace.jsx:72 `career_role_id`, :109 `score`, :111 `role_title`; CareerJourneyView (CJV) normaliseReadiness :1215-1272 reads `*_component`, `band`, `critical_*`, `skill_results`, `calculated_at`, `algorithm_version`, `configuration_version`, `decision_id`, `career_role_version`, `explanation` | `{data:{id, student_profile_id, career_role_id, career_role_version, decision_id, score(0-100), 4×*_component, critical_cap_applied, is_provisional, critical_skill_readiness_cap, critical_skill_gap_count, critical_skill_names[], band, algorithm_version, configuration_version, calculated_at, total_skills, met_skills, skills_with_gap, skill_results[]}}` (ReadinessResultResource.php:203-234) | mostly OK. `role_title` and `explanation` don't exist (FE has fallbacks: role title is resolved via getCareerRoleById, explanation → ""). Band keys match config/readiness.php:57-62 → CJV READINESS_BAND :1201. | none needed. Optional: CJV:2203 `roleVersion` reads `role_version` (an intelligence field) before `career_role_version`. Use `readinessSource?.career_role_version ?? intelligence?.role_version`. |

Notes: a 404 for a new learner shows up as a "rejected" promise. LearnerWorkspace.jsx:87 then shows "Some workspace data could not be loaded…" to every new learner. Fix in the component: treat 404 `READINESS_NOT_FOUND` / `DECISION_NOT_FOUND` as empty, not as an error. The CJV component weights (:1191-1196, 0.65/0.20/0.10/0.05) match config/readiness.php:45-49.

#### calculateReadiness / calculateReadinessScore
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| calculateReadiness (api.js:508), calculateReadinessScore (api.js:565) | POST | /api/v1/readiness/calculate | `payload` (no callers) | CalculateReadinessRequest: `career_role_id` nullable int >0; throttled | — | same ReadinessResultResource, 200 | OK but **dead code**: two identical functions, zero callers outside tests | API layer: delete one (keep `calculateReadiness`). Not needed: the assessment flow uses calculateIntelligence, which also writes a ReadinessResult. |

#### calculateIntelligence
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| calculateIntelligence (api.js:562) | POST | /api/v1/intelligence/calculate | AssessmentWizard.jsx:198 `{career_role_id}` (or `{}`), timeout 45 s | CalculateIntelligenceRequest: `career_role_id` nullable int >0; throttled | nothing (result ignored; the screens re-read /latest) | 201 `{data: IntelligenceResultResource}` | OK | — |

Note: AssessmentWizard takes `career_role_id` from the baseline submit payload. The BE returns it there (BaselineAssessmentController.php:208), so this is OK.

#### getLatestIntelligence
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getLatestIntelligence (api.js:564) | GET | /api/v1/intelligence/latest | nothing | IntelligenceController::latest L82-137; 404 `DECISION_NOT_FOUND` | Dashboard :164 `readiness.score`, :168 `role_id`, :208-271 `roadmap.actions[].{id,status,type,phase,title,description,objective,completion_criteria,estimated_hours,target_skill_id}`, `roadmap.next_best_action_id`, :274-289 `skill_gaps[].{skill_name,current_level,required_level,match_score,is_critical}`; CJV :2194-2208 `roadmap`, `skill_gaps`, `readiness`, `role_version`, **`roadmap.milestones`** | `{data:{decision_id, request_id, status, role_id, role_version, algorithm_version, configuration_version, calculated_at, readiness{score, 4×component, critical_cap_applied, band}, skill_gaps[{skill_id, skill_name, current_level, required_level, gap, match_score(0-100), importance_weight, is_critical, confidence, status(met/gap), explanation}], roadmap{id, roadmap_version, status, …, next_best_action_id, estimated_total_hours, estimated_duration_weeks, limitations, actions[{id, phase(enum str), type(enum), title, objective, description, target_skill_id, prerequisite_skill_ids, priority_score, estimated_hours, estimated_duration_weeks, order_index, completion_criteria[], explanation[], blocking_prerequisite_skill_ids, status}]}}}` (IntelligenceResultResource.php:36-142) | **mismatch (Dashboard)**: `phase` is a string, see top finding 5 (Dashboard.jsx:245, :264-267). `roadmap.milestones` doesn't exist (CJV:2208 is always `[]`). CJV itself maps phase, type and status enums correctly (:1275-1300 = RoadmapAction.php + roadmap_actions migration L22). | component: Dashboard.jsx:245/264-267 should map phase with `{foundations:1, core_skills:2, applied_practice:3, career_readiness:4}`, and the max should be 4. Dashboard.jsx:232 should route by `type`, not by `target_skill_id`. The milestones panel has **no endpoint**. |

#### getApplications
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getApplications (api.js:517) | GET | /api/v1/applications | `page`, `per_page` (Dashboard 1/100, LearnerWorkspace 1/20). BE also takes `status` | per_page default 15, max 100 (ApplicationController.php:43-45, 337-346); status enum checked L125 | Dashboard.jsx:181-185 `is_active`, `status` | `{data:[ApplicationResource{id, project_id, status, is_active, project_role, project{ProjectResource+organization}, submitted_at, withdrawn_at, …}], meta{current_page,last_page,per_page,total}}` (L141-146; project loaded in ApplicationService.php:420) | OK in Dashboard. LearnerWorkspace.jsx:53 fetches it and **throws the result away** (`[…, , notifs]`). | component: use it in Projects / Details to find the learner's active application for `project_id` (this fixes withdraw, top finding 6) and to show an "Applied" state on cards. |

#### updateApplication
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| updateApplication (api.js:521) | PATCH | /api/v1/projects/{p}/applications/{a} | `payload` (no callers) | owner-only decision: `status*` ∈ shortlisted/accepted/rejected/waitlisted, `reason` ≤2000 (ApplicationController.php:235-300); 404 when the pair doesn't match | — | ApplicationResource | OK but unused. It is a project-owner action, so it has no place in the learner UI. | Keep for a future company/owner screen. |

#### withdrawApplication
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| withdrawApplication (api.js:523) | POST | /api/v1/applications/{id}/withdraw | no body | optional `reason` string (ApplicationController.php:202-203) | nothing (PDV:1030) | 200 ApplicationResource | **mismatch (minor)**: the reason the user types (PDV:1056) is never sent. The id source is missing after a reload (top finding 6). | API: `withdrawApplication(id, { reason } = {})` → `body: reason ? { reason } : undefined`. Component: PDV:1030 should pass `{ reason }`. Also take the id from the getApplications row whose `project_id` is this project. |

#### getProjects
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getProjects (api.js:525) | GET | /api/v1/projects | no params | filters search/type/domain/work_mode/role/difficulty(0-5)/organization_id/skill_ids[]/minimum_level/page/per_page (≤50, default 50) (ProjectController.php:285-345); learner role only; 422 without a student profile | ProjectsView.jsx:818-856 (see top finding 3); Dashboard.jsx:327-346 `title, organization.title, type, duration_days, schedule, match_score` | `{data:[ProjectResource{id, title, description, type(simulation/company_sponsored), domain, objectives(text), learning_outcomes[], difficulty(float 0-5), work_mode, career_role_id, career_role{…}, role, schedule, capacity, min_team_size, application_deadline, start_date, end_date, duration_days, status, confidentiality, version, organization{id,title←name}, required_skills[{skill_id, skill_name, minimum_level, minimum_required_level, is_critical_entry}], available_project_roles[], eligibility:null, capacity_state:null}], meta{…}}` | **mismatch**: the 11 fields listed in top finding 3 don't exist. `eligibility` is always null in the list (it is only computed on show). `difficulty` is a float: ProjectsView:828-831 maps 3.5→"Expert" and only exactly 4→"Advanced". Dashboard :340 fakes the match as `88 - i*14`. Only page 1 (50 items) is ever loaded. | API layer: new `lib/projectsApi.js` `toProjectCard(project, recByProjectId, appByProjectId)`: matchScore←rec.score; isRecommended←!!rec; recommendationReason/matchExplanation←rec.reasons (newline string); skillMatches←`required_skills` mapped to `{skillName: skill_name, requiredLevel: minimum_level, yourLevel: rec.skill_results[]? (unconfirmed shape), matched, gap, maxLevel:5, category: is_critical_entry?'Critical':''}`; learningValue←learning_outcomes; difficulty buckets `d<2 Beginner, <3.5 Intermediate, <4.5 Advanced, else Expert`. LearnerWorkspace.jsx:190 should pass `recommendations` (and applications) into ProjectsView. Dashboard.jsx:340 should use `0`/hide instead of `88 - i*14`. |

#### getProject
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getProject (api.js:526) | GET | /api/v1/projects/{id} | — | 403 PROJECT_UNAUTHORIZED / 404 PROJECT_NOT_FOUND (ProjectController.php:169-232) | PDV normalizeProject :4-44 | `{data: ProjectResource + eligibility{eligible, reasons[], skill_failures[]} + capacity_state{capacity, seats_taken, seats_remaining, full}}` | **mismatch**: `capacity_state.remaining` should be `seats_remaining` (PDV:39). `eligibility.message` doesn't exist (PDV:39). `required_skills[].current_level` doesn't exist, so "your level" is always 0 (PDV:11). `match_score`, `estimated_hours`, `roadmap_phase`, `tags`, `application_id` don't exist (PDV:26-43). `difficulty` is shown as a raw float. | component (PDV:39) `p.capacity_state?.seats_remaining`; (PDV:39) `p.eligibility?.reasons?.join(' · ')`; banner PDV:244-252 should check `p.eligibility?.eligible`, and when it is false route to the existing but never-used `IneligibleScreen` (PDV:1142). `capacity_state.full` / a past deadline should route to `ExpiredFullScreen` (PDV:1252, also never routed). Your level ← `eligibility.skill_failures` (unconfirmed shape, EligibilityService) or the skills matrix. Match ← `GET /projects/{id}/recommendation` (exists, `data.score`; FE has no function for it). |

#### applyToProject
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| applyToProject (api.js:527) | POST | /api/v1/projects/{id}/applications | PDV:664 `{application_data:{…answers}}`; ProjectsView:892 no body | StoreApplicationRequest: all optional: `project_role_id` int, `application_data` array, `recommendation_id` int, `idempotency_key` ≤191 | PDV:1375-1376 `id`, `status` | 201 `{data: ApplicationResource}` | request OK. **Response mismatch → crash** (top finding 1). Never sends `project_role_id` even though show returns `available_project_roles`; never sends `recommendation_id` (the application is not linked to its recommendation); no `idempotency_key`, so a double-click can double-submit (the BE blocks a second active application with an error). | component: status label map (PDV:1376, 76-87, 817-1015). API: accept and forward `idempotency_key` (e.g. `crypto.randomUUID()` per form). Component: role picker from `available_project_roles`, pass `recommendation_id`. |

#### matchProject
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| matchProject (api.js:529) | POST | /api/v1/projects/{id}/match | ProjectsView:893 no body | MatchProjectRequest.php:32-41 **merges the route `project` into the input in prepareForValidation**, so no body is needed. 503 when DS matching is disabled; 404 PROJECT_NOT_FOUND; throttled | **nothing**: the result is discarded (ProjectsView:893) | 200 `{data:{request_id, algorithm_version, configuration_version, project_id, project_version, eligibility_state, matching_state, score, factor_scores{}, weighted_contributions{}, explanation[] (array: ProjectMatchingService.php:164; the spec says string), limiting_factors[], skill_results[]}, success, message, request_id}`. It also persists a Recommendation row. | request OK. **UI mismatch**: the "Check match" button does nothing visible. | component: ProjectsView:893 should store `unwrapApiData(res)` per project and render `score`, `explanation` (array), `limiting_factors`, `eligibility_state`. Better: refetch recommendations after it, since the match is saved as one. |

#### getRecommendations
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getRecommendations (api.js:553) | GET | /api/v1/recommendations | page/per_page (Dashboard 1/6, LW 1/15, PDV 1/50) | per_page default 15, max 100 (RecommendationController.php:22-24) | Dashboard :302-321 `project`, `access_revoked`, `project.{id,title,organization.title,duration_days,schedule}`, `score`; PDV:1334 `project_id`, `id` | `{data:[{id, type, project_id, access_revoked, project(ProjectResource or null), score, eligibility_state, matching_state, reasons (string, newline-joined: ProjectMatchingRecommendationService.php:304; the spec says [string]), limiting_factors, factors, weighted_contributions, skill_results, algorithm_version, configuration_version, project_version, generated_at}], meta{…}}` | FE reads are OK. **BE bug** (top finding 4: `organization:id,title`). LearnerWorkspace stores it but never uses it. | backend: RecommendationController.php:65 → `organization:id,name`. FE: treat `reasons` as a string (split `\n`). |

#### submitRecommendationFeedback
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| submitRecommendationFeedback (api.js:557) | POST | /api/v1/recommendations/{id}/feedback | PDV:1344 `{event_type: save/hide/decline}` | `event_type*` ∈ save, hide, decline (RecommendationFeedbackService.php:40-44); `reason` optional | nothing | 201 `{data:{id, recommendation_id, event_type, reason, occurred_at}}` | OK | — (the recommendation id comes from getRecommendations, which hits the BE bug above) |

#### getSkillsMatrix (Dashboard only)
| fn | method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|---|
| getSkillsMatrix (api.js:433) | GET | /api/v1/skills/matrix | nothing | optional `career_role_id`; learner_id is forced to self for non-admins (SkillsController.php:57-89) | Dashboard :195 `.length` only | `{data:[LearnerSkill{id, learner_id, skill_id, level, confidence_score, source_type, …, skill{}}]}` (no pagination) | shape OK, **semantics off**: it counts every learner skill across all roles, while the denominator `total_skills` (:194) is for one role, so "Skills assessed X of Y" can show X > Y. | API: `getSkillsMatrix({ careerRoleId } = {})` → `?career_role_id=`. Dashboard should pass the readiness `career_role_id`, or use `readiness.met_skills` / `total_skills` alone. |


### D. Mentor, conversations, notifications, talent, assistant, support, organization (per function)

#### Mentor

##### getMentorStudents
| method | path | sent | backend says | UI reads | backend returns | verdict | fix |
|---|---|---|---|---|---|---|---|
| GET | /api/v1/mentor/students | — | `mentor` middleware (verified mentor ProfessionalProfile) | `row.name, email, track (track/career_role.title/role_title), readiness (readiness/readiness_score), avatar, unread, status, phase, lastActive, roadmapAction, skills[], projects[]` (MentorView.jsx:815, 106-137, 185-330) | `[id,name,email,university_name,specialization,career_status,visibility,completeness_percent]` (MentorStudentController.php:28-37), no pagination | **mismatch** | component |

Notes
- Caller: MentorView.jsx:811 only — and MentorView never renders (LearnerWorkspace.jsx:188 returns an alert for `mentor`; App.jsx:281 routes `/mentor` to WorkspacePage view="mentor"). No mentor-role routing exists in the FE.
- `track` → always "Not specified": read `row.specialization` (or `career_status`) instead.
- `readiness` → always 0: backend has no readiness on this endpoint (exists-but-missing-field `readiness`).
- **Crash**: StudentSummaryPanel reads `student.skills.filter(...)` (:245) and `student.skills.map` (:260) with no guard; `student.projects.map` (:317). Default `Array.isArray(...) ? ... : []` in the mapper (MentorView.jsx:815) or hide the sections. `phase`, `lastActive`, `roadmapAction`, `status`, `unread` also don't exist.
- Better source for the panel: `GET /mentor/students/{student}` (StudentSummaryResource: + interests, availability, preferred_work_type, enrollment_status) — **no api.js function exists for it**; still no skills/projects/readiness (exists-but-missing-field skills, projects, readiness).

##### getMentorConnections
| GET | /api/v1/mentor/connections | page, per_page | `mentor` mw; per_page ignored (MentorStudentService.php:438 `paginate(20)`) | — (no caller) | ConnectionResource list + meta; `mentor{}` always nulls (relation not eager-loaded), `student`, `student_profile`, `project` loaded | unused | — |

##### createMentorConnection
| POST | /api/v1/mentor/connections | MentorView.jsx:376 `{student_id, project_id}`; TalentDiscoveryView.jsx:772 `{student_id}` | StoreConnectionRequest: `student_id*` int exists:users, `project_id` nullable int, `initiated_by` mentor\|student\|admin; route needs verified mentor | nothing (success → scene) | 201 `{data: ConnectionResource}` | **mismatch** (×2) | component |

Notes
- MentorView: `setSelectedProject(p.title)` (:478) then `selectedProject.id` (:376) → undefined → field dropped by JSON.stringify → connection created with no project. Store the project object (or id) and send `project_id: Number(selectedProject.id)`. Also `student.projects` is never supplied by any endpoint, so the modal list is always empty (no endpoint returns per-student eligible projects for a mentor).
- `student_id` is sent as a string (`String(row.id)` in the mapper) — Laravel `integer` rule accepts numeric strings, OK.
- TalentDiscoveryView "Contact": wrong endpoint for a company/learner — 403 from `mentor` middleware. No backend endpoint for company contact requests → backend question.

##### updateMentorConnection
| PATCH | /api/v1/mentor/connections/{id} | — | `status*` active\|disconnected\|archived, `reason` ≤500 (MentorStudentController.php:123-126) | — | ConnectionResource | unused | — |

---

#### Conversations

##### getConversations
| GET | /api/v1/conversations | page=1, per_page=100 (MentorView.jsx:811) | per_page ignored → `config('communication.conversations_per_page',20)` (ConversationService.php:88) | `item.connection.student_id` / `connection.student.id`, `item.id` (MentorView.jsx:833-845) | ConversationResource with `connection{id,mentor_id,student_id,project_id,status,mentor{id,name},student{id,name}}` (eager-loaded, ConversationService.php:98) | OK shape; **mismatch** page size | component |

Notes: only 20 conversations come back regardless of `perPage: 100`; a mentor with >20 threads gets "no conversation" for older students. Either page through `meta.last_page` or ask BE to honour `per_page`.

##### getConversation
| GET | /api/v1/conversations/{id} | — | participant check | — | `{data: ConversationResource}` | unused | — |

##### getConversationMessages
| GET | /api/v1/conversations/{id}/messages | page=1, per_page=100 (MentorView.jsx:849) | per_page ignored (fixed 50); **ordered newest first** (ConversationService.php:348-352) | `message.id, sender_id, body, created_at` (:856-870) | MessageResource `[id,conversation_id,sender_id,sender_name?,body,message_type,metadata,read_at,read_by,created_at]` | **mismatch**: order | component (MentorView.jsx:856: `rows.slice().reverse()` or sort by `created_at` asc) |

Notes: `sender_name` is `whenLoaded('sender')` and `getMessages` doesn't eager-load `sender` → key absent (spec lists it). UI doesn't read it, fine. Only latest 50 messages ever shown.

##### sendConversationMessage
| POST | /api/v1/conversations/{id}/messages | `{message: text, body: text}` (MentorView.jsx:877) | StoreMessageRequest: `body*` ≤5000, `message_type` text\|chatbot, `metadata` array | `value.message ?? value` → `.id, .body, .created_at` | 201 `{data: MessageResource}` | OK (extra `message` key ignored) | optional cleanup: send `{ body: text }` only |

##### getChatbotMessages / sendChatbotMessage
| GET/POST | /api/v1/conversations/{id}/chatbot/messages | — | POST: `body*`, `metadata`, `source` ≤100 | — | MessageResource (list + meta / 201) | unused | — |

##### markConversationRead
| POST | /api/v1/conversations/{id}/read | — | — | — | `{data:{marked_read}}` | unused | component: call after loading messages in MentorView.handleSelectStudent, otherwise the student's messages stay unread and keep generating unread state |

##### hideConversation
| DELETE | /api/v1/conversations/{id} | — | hides for caller only | nothing | `{success,message}` | OK | — |

##### getConversationStatus
| GET | /api/v1/conversations/{id}/status | — | — | — | `{data:{conversation_id,status,unread_count,last_message_at,last_message_preview,retention_expires_at}}` | unused | could feed `s.unread` badge (MentorView.jsx:124) per conversation |

##### createConversation
| POST | /api/v1/connections/{connectionId}/conversations | — | create-or-return for a connection | — | 201 ConversationResource | unused | component: MentorView dead-ends at "empty-chat" when no conversation exists (:846) — it should create one via the student's connection id (from `getMentorConnections` → `row.id` where `row.student_id === student.id`) |

Learner side: there is **no student-facing conversation screen** at all (only MentorView uses these endpoints), although the routes allow students.

---

#### Notifications

##### getNotifications
| GET | /api/v1/notifications | page, per_page (LearnerWorkspace.jsx:49,123 per_page=10; Dashboard.jsx:135 per_page=6) | params: `category`, `unread_only`, `page`; per_page ignored (NotificationService.php:68 default 20) | `n.id, is_read, title, body, created_at, link` (AppLayout.jsx:87,258-267) | NotificationResource `[id,category,channel,title,body,link,event_key,is_read,read_at,created_at]` + `meta.unread_count` | OK | — |

Notes: AppLayout slices to 6 itself, so ignored per_page is harmless. **Link navigation mostly dead**: backend links are `/applications/{id}`, `/projects/{p}/applications/{a}`, `/conversations/{id}`, `/mentor/connections/{id}`, `/support/requests/{id}`, `/admin/support` (ApplicationService.php:553,570; ConversationService.php:221,313; MentorStudentService.php:238,422; SupportRequestService.php:144-274). AppLayout.go (AppLayout.jsx:98-102) maps only `support/requests/N`→support; everything else becomes an unknown key and `onNavigate` (App.jsx:79 `if (NAV_ROUTES[key])`) does nothing. Fix in AppLayout.go: `applications/*` and `projects/*/applications/*` → `projects`, `conversations/*` / `mentor/*` → `mentor`.

##### getUnreadNotificationCount
| GET | /api/v1/notifications/unread-count | — | `category` optional | `value.count ?? value.unread_count` (LearnerWorkspace.jsx:79,126; Dashboard.jsx:380) | `{data:{unread_count}}` | OK | — |

##### markAllNotificationsRead
| POST | /api/v1/notifications/read-all | no body | optional `category` | nothing | `{data:{marked_read}}` | OK | — |

##### markNotificationRead
| POST | /api/v1/notifications/{id}/read | — | 404 `NOTIFICATION_NOT_FOUND` if not owner | nothing | `{data: NotificationResource}` | OK | — |

##### getNotificationsPreferences / updateNotificationsPreferences
| GET/PUT | /api/v1/notifications/preferences | — | PUT body: `category*` ≤100, `channel*` in_app\|email, `enabled*` bool — **one preference per call** | — | GET `[{category,channel,enabled}]` (explicit rows only); PUT `{data:{category,channel,enabled}}` | unused | — |

Notes: SettingsView.jsx has no notification-preferences UI (only theme/account). If one is built, it must PUT one `{category,channel,enabled}` per toggle, not a bulk object. Category vocabulary is free text (unconfirmed list — ask BE which categories exist; GET returns only rows the user has explicitly set).

---

#### Talent (company)

##### getTalentDiscovery
| GET | /api/v1/talent | api.js sends `page, per_page, search, career_role, min_readiness, sort` — names match exactly | TalentDiscoveryController.php:75-82: `search` ≤255, `career_role` (slug or numeric id), `min_readiness` 0-100, `sort` ∈ {readiness, recent} (TalentDiscoveryService.php:65), `page`, `per_page` 1-100 (default 15) | see below | TalentCardResource `[id,name,career_role{id,title,slug}|null,specialization,university_name,career_status,enrollment_status,availability,preferred_work_type,completeness_percent,visibility(public\|organization_only),contactable,readiness{score,band},top_skills[{name,category,level,max_level,verified,evidence_count}]]` + meta + request_id | API OK; **screen mismatches** | component |

Callers & verdicts
- CompanyTalent.jsx:30 `{page, perPage:9, search}` — reads `payload.data`, `payload.meta` (OK), `student.name`, `university_name`, `readiness.score`, `top_skills[].name` (OK), **`student.career_role` rendered as a child (:97) → crash when non-null**. Fix: `student.career_role?.title`.
- CompanyDashboard.jsx:26 `{perPage:1}` → `meta.total` — OK.
- TalentDiscoveryView.jsx:729 `{page:1, perPage:50}` — **learner role → 403** (routes/api.php:349). The mapper (:733-753) is otherwise close (`readiness.score`, `top_skills`, `career_role.title` OK) but: sets `skills` while cards/panel read `topSkills` (:161,365-367) → crash; never sets `initials`, `phase`, `location`, `availableFrom`, `consent`, `hiddenFields`, `projects`, `evalSummary` (panel :269-513 → crashes on `.includes/.length/.authorized`); `visibility` values `locked/partial/visible` don't exist (BE sends `public`/`organization_only`, so lock logic is dead); `matchScore` falls back to readiness — BE dropped match ("'match' was dropped: no talent match score is stored", TalentDiscoveryService.php:64). Filters/sort/search are done client-side on ≤50 rows instead of sending `search/career_role/min_readiness/sort`.
- Team decision: TalentDiscoveryView is the learner-workspace copy of a company screen; either remove `talent` from the learner nav (AppLayout.jsx:41, also `mentor` :40) or keep it company-only. Company users already have CompanyTalent.

##### getTalentFilters
| GET | /api/v1/talent/filters | — | company_admin | — (no caller) | `{data:{career_roles:[{id,title,slug}], readiness_bands:[foundation_needed,developing,moderate_readiness,…]}}` | unused | component: use for the Career Track filter instead of deriving tracks from loaded rows (TalentDiscoveryView.jsx:860) and add a role filter to CompanyTalent (send `career_role: slug`) |

##### getTalentStudent
| GET | /api/v1/talent/{studentId} | — | numeric id; 404 (never 403) if not discoverable | — (no caller) | TalentProfileResource: card fields + `bio, interests[], academic_level, expected_graduation, graduation_status, skills[], projects[{id,title,type,role,state,sponsor_org,joined_at,left_at}], evaluation{authorized,overall_rating,criteria_scores[{key,score}],evaluations_count,reviewed_at}` | unused | component: this is exactly the data StudentProfilePanel needs — map `evaluation`→`evalSummary` (`overall_rating`→`overallRating`, `criteria_scores`→`criteriaScores`, `reviewed_at`→`reviewDate`); no `reviewedBy`/`notes` (withheld by design), no `location`, `availableFrom` (use `availability`), no `phase` |

---

#### Assistant

##### askAssistant
| POST | /api/v1/assistant/ask | `{intent, question}` (AssistantView.jsx:905, AssistantPanel.jsx:846) | `role:learner`; `intent*` ∈ explain_readiness, explain_skill_gap, explain_roadmap, explain_next_best_action, explain_project_recommendation, project_bounded_help; `question*` 3-2000; `recommendation_id`, `project_id` optional (AskAssistantRequest) | `payload.reply`, `payload.interaction_id ?? payload.id`, `payload.handoff_available` | 201 `{data: AssistantInteractionResource}` with `id, reply, provider_used, handoff_available, answer_status, grounded, …` | OK | — |

Notes: FE intents (suggestion chips AssistantView.jsx:11-14 + inferAssistantIntent) all in the allowed list. A question < 3 chars → 422 (UI shows generic "could not be mapped" text — misleading but harmless). Spec drift: spec omits `handoff_available`, `answer_status`, `grounded` from the 201 body. `explain_project_recommendation` / `project_bounded_help` would ground better with `recommendation_id` / `project_id`, which the UI never sends. Static: chip label "Explain my Python skill gap" (AssistantView.jsx:13) is hard-coded copy.

##### reportAssistantInteraction
| PUT | /api/v1/assistant/interactions/{id}/report | `{report_status: reason}` (AssistantView.jsx:947, AssistantPanel.jsx:877) | `report_status*` ∈ unsafe, irrelevant, unfair, incorrect; `report_reason` ≤1000 | nothing | AssistantInteractionResource | OK (UI keys match enum exactly, AssistantView.jsx:595-600, AssistantPanel.jsx:240-245) | — |

---

#### Support  (⚠ not in the OpenAPI spec; routes/api.php:255-280, `role:learner`, live answers 401 = route exists)

##### createSupportRequest
| POST | /api/v1/support/requests | SupportView.jsx:317 `{reason:'learner_requested', subject?}`; AssistantView.jsx:959 / AssistantPanel.jsx:895 `{reason:'insufficient_context', source_interaction_id, transcript[{role,body}]}` | RequestSupportHandoffRequest: `reason` ∈ insufficient_context\|learner_requested, `subject` ≤180, `transcript` ≤40 items, `transcript.*.role` learner\|assistant, `transcript.*.body` required_with:transcript ≤4000, `source_interaction_id` int | `created.id, status, assignee_name` | 201 `{data: SupportRequestResource}` (assignee loaded) | SupportView OK; **Assistant handoff mismatch** | component |

Notes: transcript bodies built from `String(m.text||'')` include empty-text assistant bubbles (error/unavailable messages AssistantView.jsx:926; AssistantPanel.jsx:179/197) → `""`→null → 422. Filter empties (AssistantView.jsx:956, AssistantPanel.jsx:891). SupportView creates the request and then posts the first message separately — works (2 throttled writes on `support-write`).

##### getSupportRequests
| GET | /api/v1/support/requests | page=1, per_page=50 (SupportView.jsx:187) | per_page clamped 1-100, default 15 (SupportRequestController.php:249-253) | `row.id, status, subject, last_message_at, created_at` | Laravel resource collection `{data:[…], links, meta}` | OK | — |

##### getSupportRequest
| GET | /api/v1/support/requests/{id} | — | owner only, 404 otherwise | `id, status, subject, assignee_name, last_message_at, messages[{id,sender_id,sender_name,body,message_type,created_at}]` | `{data: SupportRequestResource}` with messages.sender + assignee loaded | OK | — |

##### sendSupportMessage
| POST | /api/v1/support/requests/{id}/messages | `{body}` (SupportView.jsx:284,323) | `body*` 1-4000 | `created.id, created_at` | 201 `{data: SupportMessageResource}` | OK | — |

---

#### Organization

##### getOrganizationProfile
| GET | /api/v1/organization/profile | — | `organization.approved`; admin pivot required, else 403 | `name,type,verification_status,industry,company_size,contact_email,contact_phone,website,city,country` (CompanyProfile.jsx:37-51; CompanyDashboard.jsx:55-91) | exactly those + `id` (OrganizationController.php:44-59) | OK | — |

Notes: a pending/rejected org gets 403 here, so the status pill falls back to the cookie copy (`user.organizations[0]`) — fine. `description`, `address`, `postal_code` are in the model but not returned (CompanyProfile doesn't show them — exists-but-missing-field if the design wants them). i18n has `company.status.{verified,pending,rejected}` = DB enum.

---



#### Projects/intelligence: top findings (from the per-function read)


1. **Applying to a project crashes the page white.** `ProjectDetailsView.jsx:1376` runs `setAppStatus(application?.status ?? "Submitted")`. The BE sends a lowercase status (`submitted|shortlisted|accepted|rejected|waitlisted|withdrawn`, Models/Application.php:24-34). `StatusPill` (PDV:76-87) indexes `cfg["submitted"]`, gets `undefined`, and then reads `c.bg`, which throws a TypeError. AppStatusScreen (PDV:817-1015) also compares against `"Submitted" / "Under Review" / "Accepted"` only. Fix (component): map the API status to a label, e.g. `{submitted:'Submitted', shortlisted:'Under Review', waitlisted:'Under Review', accepted:'Accepted', rejected:'Rejected', withdrawn:'Withdrawn'}`, and give `StatusPill` a fallback.
2. **Project details: capacity is read from a key that doesn't exist.** PDV:33 reads `p.capacity_state?.remaining`. The BE sends `capacity_state.seats_remaining` (also `seats_taken` and `full`; ProjectController.php show() ~L215-220). So "spots left" shows `null`. Eligibility is read from `p.eligibility?.message` (PDV:39), but the BE sends `eligibility: {eligible, reasons[], skill_failures[]}`, so the banner always shows the fallback text. On top of that, the banner at PDV:244-252 says "You are eligible" unconditionally, even when `eligible:false`.
3. **The project list cannot show a match, a recommendation or skills from the API.** ProjectsView.jsx:845-856 reads `match_score, is_recommended, recommendation_reason, match_explanation, skill_matches, learning_value, estimated_hours, tags, roadmap_phase, aligns_with_nba, eligibility_reason`. None of these exist on ProjectResource (Resources/ProjectResource.php:41-100). So every card shows 0% match, "Not evaluated", no skills and "—" hours. The data exists elsewhere: `GET /recommendations` rows (`project_id, score, reasons, skill_results, eligibility_state`) and the project's own `required_skills` / `learning_outcomes`. LearnerWorkspace already fetches recommendations (LearnerWorkspace.jsx:49, :68) but never passes them down. Fix: an API-layer mapper (`lib/projectsApi.js`) that joins projects with recommendations by `project_id`.
4. **BE bug: `GET /recommendations` should 500 once any recommendation exists (from source; can't confirm live without an auth token).** RecommendationController.php:65 eager-loads `'organization:id,title'`, but `organizations` has no `title` column (only `name`; organizations migration line 13, and no later migration adds one). ProjectResource:77 then reads `organization->name`. The query only runs when the recommendation rows match accessible projects, so an empty list works and the first real recommendation breaks the endpoint. This affects Dashboard "Recommended Projects" and the recommendation id lookup in Project Details (save/hide/decline). → Backend question.
5. **Dashboard roadmap card shows "Phase foundations of NaN".** Roadmap `action.phase` is a string enum (`foundations|core_skills|applied_practice|career_readiness`, Models/RoadmapAction.php:34-39). Dashboard.jsx:264-267 treats it as a number: `Math.max(...actions.map(a => a.phase || 1), 4)` gives NaN, and the tag at :245 reads "Phase foundations". The next-action button (:232) is also wrong: it routes to "Start Assessment" whenever `target_skill_id` is set, which is almost every action. It should switch on `type` (`assessment|resource|practice|simulated_project|real_project`, RoadmapAction.php:18-24).
6. Withdrawal is impossible after a reload, and the reason is dropped. PDV:43 reads `p.application_id ?? p.application?.id`, which ProjectResource doesn't carry, so the id only exists right after applying in the same session. `withdrawApplication(applicationId)` (api.js:523) sends no body. The BE accepts an optional `reason` (ApplicationController.php:202), and the screen collects one (PDV:1018) but never sends it.
7. Dashboard: `skillsAssessedNote` is computed (:198) but never put into state (:383-398), so the pill renders empty (:538).


#### Social/company: top findings

1. **TalentDiscoveryView (learner workspace `/talent`) can never load**: `GET /api/v1/talent` is `role:company_admin` + `organization.approved` (routes/api.php:349) → a learner gets 403. And if rows ever came back, the card crashes: it reads `student.topSkills.length` (TalentDiscoveryView.jsx:161) but the mapper only sets `skills`; profile panel reads `student.hiddenFields.includes` (:377), `student.projects.length` (:384), `student.evalSummary.authorized` (:449) — none exist → TypeError/white screen.
2. **CompanyTalent.jsx:97 renders `student.career_role` directly** — backend sends an object `{id,title,slug}` (TalentDiscoveryService::identity, TalentCardResource) → React "Objects are not valid as a React child" crash for any student with a career role. Fix: `student.career_role?.title || student.specialization`.
3. **"Contact student" uses the mentor endpoint**: TalentDiscoveryView.jsx:772 → `POST /api/v1/mentor/connections`, which is behind the `mentor` middleware (verified mentor profile, routes/api.php:368) → a company admin/learner always gets 403. There is **no company→student contact endpoint** in the backend.
4. **MentorView is unreachable and broken against the real payload**: LearnerWorkspace.jsx:188 renders a "restricted" alert for `view==='mentor'`, so MentorView never mounts. If it did: selecting a student crashes on `student.skills.filter` (MentorView.jsx:245, `expanded` defaults to "skills") — `GET /mentor/students` returns only `id,name,email,university_name,specialization,career_status,visibility,completeness_percent` (MentorStudentController.php:28-37); messages arrive newest-first (ConversationService.php:348-352 `latest('created_at')`) and are rendered in that order; project picker stores `p.title` (:478) but sends `selectedProject.id` (:376) → `project_id` always undefined.
5. **Assistant → support handoff can 422**: AssistantView.jsx:957 / AssistantPanel.jsx:893 put every assistant bubble into `transcript`, including error/"unavailable" bubbles whose `text` is `""`; Laravel's default ConvertEmptyStringsToNull turns `""` into null and `transcript.*.body` is `required_with:transcript|string` (RequestSupportHandoffRequest.php:46) → "Each transferred message needs a body." Fix: `.filter(m => String(m.text||'').trim())` before mapping.

Also: support routes `/api/v1/support/*` exist (routes/api.php:259-280, live 401) but are **absent from the OpenAPI spec**; `per_page` is ignored by conversations/messages/notifications/mentor-connections (server config fixed 20/50/20/20); 9 of the 30 functions have no caller at all; there is no notification-preferences UI.

---


## 6. Static / hard-coded data named in the audit PDF (SkillSpan_UI_Backend_Static_Data_Audit_AR_v2)

The PDF was written against an older zip (`Front-end-main.zip`, 8 Oct). Several of its constants are gone from the live screens but still sit in **dead files that nothing imports**: `src/components/dashboard/CareerJourneyView.jsx`, `dashboard/CareerRolesView.jsx`, `dashboard/ProjectsView.jsx`, `dashboard/DashboardView.jsx`. The routed screens are the `learner/*` versions, rendered by LearnerWorkspace.jsx. `careerroles/CareerRoles.jsx` + `rolesData.js` are imported by App.jsx (`CareerRolesPage`), but no route renders them. Deleting those files removes every PDF hit from the codebase.

Line numbers are for `api-verify` at 902fd59 (= tab-fixes fee221f + 2).

| # | PDF item | Where it is now (file:line) | Endpoint that should feed it (spec) | Endpoint status |
|---|---|---|---|---|
| 1 | Dashboard `readinessScore: 67` | Removed. Initial state is 0 (Dashboard.jsx:89-104); live value from readiness `score` | GET /api/v1/readiness/latest → `score` | exists-OK (404 READINESS_NOT_FOUND for a new learner; treat as empty) |
| 2 | Dashboard `activeProjects: 2` | Removed (state 0, computed from applications) | GET /api/v1/applications → rows with status submitted/shortlisted/accepted | exists-OK |
| 3 | Dashboard `skillsAssessed: 18` | Removed; but `skillsAssessedTotal: 24` default (Dashboard.jsx:95) and `?? 24` fallback (:194) remain | readiness `total_skills`, `met_skills` | exists-OK |
| 4 | Dashboard `roadmapPhase: '35%'` | **Still hard-coded**: `'35%'` / `'Phase 2 of 4'` at Dashboard.jsx:259-260, fake `score*0.8`% at :268-270 | GET /api/v1/intelligence/latest → `roadmap.actions[].status`, `phase` (string enum foundations / core_skills / applied_practice / career_readiness) | exists-OK (phase is a string, not a number) |
| 5 | Dashboard `recordItems: 9` | Removed. Count of learner evidence (assessment rows filtered out) | GET /api/v1/evidence | exists-OK, but mixes `assessment_test` rows (backend question) |
| 5a | (not in the PDF, same screen) fallback skill gaps Python/React/SQL/Git | Dashboard.jsx:292-297 | intelligence `skill_gaps` | exists-OK |
| 5b | (same) 3 fake recommended projects ("Customer Analytics Dashboard" 88, …) | Dashboard.jsx:347-382; `r.score ?? 85` :320; `88 - i*14` :340 | GET /api/v1/recommendations → `score`, `project` | exists-OK, but **backend bug**: organization eager-load on a non-existent `title` column |
| 6 | CareerJourneyView `const GAPS` | Removed from learner/CareerJourneyView.jsx (normalisers read the API, :1135-1340). Dead copy dashboard/CareerJourneyView.jsx:24 | intelligence `skill_gaps` | exists-OK |
| 7 | CareerJourneyView `const MILESTONES` | Removed; dead copy dashboard/CareerJourneyView.jsx:32. learner view reads `roadmap.milestones` (:2208) | — | **no endpoint**: roadmap has phases/actions, no milestones |
| 8 | CareerJourneyView `const ACTIONS` | Removed; dead copy dashboard/CareerJourneyView.jsx:58 | intelligence `roadmap.actions[]` | exists-OK |
| 9 | CareerJourneyView `const PHASES_META` | Removed; dead copy dashboard/CareerJourneyView.jsx:518. Still: `// MOCK DATA` comment learner/CareerJourneyView.jsx:3, `demoState` fixed to "loaded" :2213 (loading/error/empty never show) | intelligence `roadmap.phases` | exists-OK |
| 10 | CareerRolesView `const MOCK_ROLES` + `initialRoles?.length ? initialRoles : MOCK_ROLES` | Removed from learner/CareerRolesView.jsx (fee221f loads the catalog). Dead copy dashboard/CareerRolesView.jsx:3, :719 | GET /api/v1/career-roles, /{id}, /{id}/skills | exists-but-missing-field: `category` (none on CareerRole), `demand` (no endpoint), saved roles (no endpoint). Readiness per role is a client estimate from /{id}/skills + /skills/matrix |
| 11 | ProjectsView `const PROJECTS` | Removed from learner/ProjectsView.jsx (`// MOCK DATA` comment at :4 remains). Dead copy dashboard/ProjectsView.jsx:6 | GET /api/v1/projects | exists-but-missing-field: `match_score, is_recommended, recommendation_reason, skill_matches, learning_value, estimated_hours, tags, roadmap_phase, aligns_with_nba, eligibility_reason` are not on ProjectResource → take from GET /recommendations (`score, reasons, eligibility_state, skill_results`) via `withRecommendations()` |
| 12 | ProjectsView/ProjectDetailsView `setTimeout(() => …)` fake loading | Removed from both learner files. `isLoaded = true` constant in ProjectsView (:891) | — | — |
| 13 | ProjectDetailsView static copy (not named in PDF but same class) | timeline dates `22 Sep 2026, 14:32` / `23 Sep` / `25 Sep` (PDV ~819-828), `Ref #APP-20260922` (~934), `Application #APP-20260915` (~1224), withdrawn `22 Sep 2026 at 15:04` (~1116), "You are eligible" always shown (~244-252) | GET /api/v1/applications (+ `submitted_at, decided_at, withdrawn_at, status, id`), GET /api/v1/projects/{id} `eligibility{eligible,reasons,skill_failures}`, `capacity_state{seats_remaining,seats_taken,full}` | exists-OK |
| 14 | MentorView `const STUDENTS` + `setTimeout` | Removed; `Mock data` comment MentorView.jsx:4. View is unreachable (LearnerWorkspace.jsx:195 shows a "restricted" alert) | GET /api/v1/mentor/students, /mentor/students/{id}, /mentor/connections | exists-but-missing-field: readiness, skills, projects, phase, last_active (list has id, name, email, university_name, specialization, career_status, visibility, completeness_percent) |
| 15 | Conversations (PDF p.5 list) | MentorView uses getConversations / getConversationMessages / sendConversationMessage / hideConversation. getConversation, getConversationStatus, markConversationRead, chatbot get/send are unused | GET /conversations, /{id}, /{id}/messages, /{id}/chatbot/messages, POST /{id}/read | exists-OK (`per_page` ignored; messages come newest-first) |
| 16 | TalentDiscoveryView `const STUDENTS` / `const TRACKS` | Removed (tracks derived from rows, ~:860). Left: `COMPANY = {name:"Talent Discovery", rep:"Live recommendations"}` :4, `matchScore` / "% match" sort (~:638, :750, :762) | GET /api/v1/talent, /talent/filters, /talent/{student}; org name from GET /organization/profile | exists-OK for rows/filters; **no endpoint** for match %; route is company_admin-only, so a learner gets 403 |
| 17 | EvidenceContext `setEvidence(SEED_EVIDENCE); setSource('preview')` | Seed data removed. On a failed load the list is now empty plus an error (EvidenceContext.jsx:61-65; the source flag is still called "preview") | GET /api/v1/evidence | exists-OK (filter `assessment_test`) |
| 18 | evidenceMeta.js | Only UI metadata (skill icons, type and status labels); no fake records | — | OK |
| 19 | PDF p.7 "functions defined but not used" | Now used: markAllNotificationsRead, markNotificationRead (AppLayout), getOrganizationProfile (CompanyDashboard/Profile), getConversationMessages, sendConversationMessage, getMentorStudents, createMentorConnection (MentorView/TalentDiscovery). Still unused: getNotificationsPreferences, updateNotificationsPreferences (no settings UI), getConversation, getChatbotMessages, sendChatbotMessage, markConversationRead, getConversationStatus, getMentorConnections, updateMentorConnection | the matching endpoints | all exist |
| 20 | LearnerWorkspace.jsx | Fetches recommendations and applications (:49-53) but passes neither to ProjectsView/ProjectDetailsView; career roles were fetched with perPage 15 (fee221f now loads the catalog) | — | wiring only |

### 6a. Static data found by the per-screen reads (beyond the PDF)
#### Workspace / projects screens

| file:line | what | should come from | status |
|---|---|---|---|
| Dashboard.jsx:95, :194 | `skillsAssessedTotal: 24` default and `?? 24` fallback | readiness `total_skills` | exists-OK (null only on legacy rows; show "—", not 24) |
| Dashboard.jsx:103, :223 | tag `'Score +8pts'` in the default next action | none | no endpoint (copy only; drop the number) |
| Dashboard.jsx:178 | role fallback `'Software Engineer'` | readiness/intelligence `career_role_id` → `GET /career-roles/{id}` | exists-OK (show an empty "No role selected" instead) |
| Dashboard.jsx:259-260, :268-270 | `'35%'` / `'Phase 2 of 4'`, and a fake `score*0.8`% progress | intelligence `roadmap.actions[].status` / `phase` | exists-OK (with no roadmap, show 0% / "No roadmap yet") |
| Dashboard.jsx:292-297 | fallback gaps Python 3/4, React, SQL, Git | intelligence `skill_gaps` | exists-OK (empty state when none) |
| Dashboard.jsx:320 | `r.score ?? 85` | recommendation `score` | exists-OK (null only when access is revoked, and those rows are filtered out) |
| Dashboard.jsx:340 | `match_score ?? (88 - i*14)` | not on ProjectResource; recommendation `score` | exists-but-missing-field `match_score` on /projects; join with /recommendations |
| Dashboard.jsx:347-382 | 3 fake projects (Customer Analytics Dashboard 88, E-commerce REST API 74, ML Sentiment Analysis 61) | /recommendations, then /projects | exists-OK (empty state) |
| Dashboard.jsx:319, :338 | duration fallback `'4 weeks'` | `duration_days` (null when no start/end date) | exists-OK |
| ProjectsView.jsx | no PROJECTS const or setTimeout left at this HEAD; data comes from the `initialProjects` prop. `isLoaded = true` constant (:891) | — | fields missing, see getProjects |
| ProjectsView.jsx:815-816 | filter lists `Practice Task, Assessment, Capstone, Conditionally Eligible, Completed` | BE project `type` is only simulation / company_sponsored; eligibility is only on show | no endpoint for those values; trim to `Simulation Project / Real Project` |
| ProjectDetailsView.jsx:819, :822, :828 | timeline dates `22 Sep 2026, 14:32`, `23 Sep 2026`, `25 Sep 2026` | application `submitted_at`, `decided_at` | exists-OK (ApplicationResource:39-40) |
| PDV:934, :1224, :1227 | `Ref #APP-20260922`, `Application #APP-20260915`, `Submitted 15 Sep 2026 · Under Review` | application `id`, `submitted_at`, `status` | exists-OK |
| PDV:1116 | `22 Sep 2026 at 15:04` (withdrawn) | application `withdrawn_at` | exists-OK |
| PDV:244-252 | "You are eligible for this project" always shown | show `eligibility.eligible` / `reasons` | exists-OK |
| PDV:1142, :1252 | IneligibleScreen / ExpiredFullScreen are never routed | `eligibility.eligible`, `capacity_state.full`, `application_deadline` | exists-OK |
| PDV:40-41 | `roadmap_phase`, `phase_name` on project | none (roadmap actions have no project link) | no endpoint |
| CareerJourneyView.jsx | no GAPS / MILESTONES / ACTIONS / PHASES_META consts left at this HEAD; normalisers read the API (:1135-1340). Leftovers: `demoState` is fixed at "loaded" (:2213), so loading/error/empty states never show; `"Historical · 9 Sep 2026"` (:2247) only in the unreachable historical state | /readiness/latest + /intelligence/latest | exists-OK; `roadmap.milestones` (:2208) is **no endpoint** |
| LearnerWorkspace.jsx:49-53, :68, :190 | fetches recommendations and applications but passes neither to ProjectsView / ProjectDetailsView; ProjectsView gets no `onApply` / `onMatch` | — | wiring only |

#### Mentor / talent / company screens

| Screen | file:line | what | should be fed by | status |
|---|---|---|---|---|
| MentorView | MentorView.jsx:4 | "Mock data" comment left; STUDENTS array & setTimeout already removed on this branch | — | cleanup comment |
| MentorView | :185-330 summary panel fields `phase, lastActive, roadmapAction, skills[].gap, projects[].eligible` | per-student summary | GET /mentor/students/{id} | exists-but-missing-field skills, projects, readiness, phase, last_active; **no api.js function** |
| MentorView | :124 `s.unread` badge | unread per student | GET /conversations/{id}/status `unread_count` | exists-OK (needs per-conversation call) |
| MentorView | ProjectConnectionModal :367 `student.projects[].eligible` | projects a mentor can attach | — | **no endpoint** (GET /projects is learner-scoped; ask BE) |
| TalentDiscoveryView | :4 `COMPANY = {name:"Talent Discovery", rep:"Live recommendations"}` | org name in header | GET /organization/profile `name` | exists-OK (company role only) |
| TalentDiscoveryView | STUDENTS / TRACKS arrays — already removed; tracks now derived from rows (:860) | track list | GET /talent/filters `career_roles` | exists-OK |
| TalentDiscoveryView | `matchScore` (:750), "% match" (:638), sort "match" (:762) | match % | — | **no endpoint** (BE dropped match; use readiness) |
| TalentDiscoveryView | panel `location, availableFrom, phase, consent, hiddenFields, evalSummary.reviewedBy/notes` (:269-513) | profile detail | GET /talent/{id} | exists-but-missing-field location, phase, reviewedBy, notes (withheld by design); `availability`/`contactable`/`evaluation` exist |
| CompanyTalent | none (fully API-driven) | — | — | — |
| CompanyDashboard | none; three stat cards from API (status, talent total, type) | — | — | — |
| CompanyProfile | none (read-only from API) | — | — | — |
| AppLayout | notifications from props only (EMPTY_NOTIFICATIONS default :6); NAV_ITEMS shows `mentor` + `talent` to every learner (:40-41) | — | — | nav items lead to 403/alert screens for learners |
| SettingsView | no notification-preferences UI | toggles | GET/PUT /notifications/preferences | endpoint exists-OK, UI missing |


## 7. Changes that belong in screen components

Status on `tab-fixes`: the StatusPill crash, project capacity/eligibility, withRecommendations wiring, Dashboard phase/type/fallbacks, CompanyTalent career_role, assistant handoff empties, notification links, READINESS/DECISION 404 empty state, Skill Matrix created id and the Career Roles catalog are done (see CHANGES_AR.md). The rest are listed for the team.

Ordered by impact. Each line names the file, what breaks, and the change. Line numbers are approximate after today's commits; search for the quoted code.

**Crashes / white screens**
1. `learner/ProjectDetailsView.jsx` ~1376: `setAppStatus(application?.status ?? "Submitted")`. The API status is lowercase (`submitted|shortlisted|waitlisted|accepted|rejected|withdrawn`), and `StatusPill` (~76-87) does `cfg[status].bg`, which throws a TypeError. Use `setAppStatus(applicationStatusLabel(application?.status))` from `utils/projectMapping.js` and give StatusPill a fallback entry. AppStatusScreen (~817-1015) compares against the labels, so it works once mapped.
2. `company/CompanyTalent.jsx:97`: renders `student.career_role` (an object `{id,title,slug}`), which crashes React for any student with a role. Use `student.career_role?.title || student.specialization`.
3. `learner/TalentDiscoveryView.jsx`: the route is company_admin-only (403 for a learner). Even with data, the mapper (~733-753) sets `skills` while cards read `topSkills` (:161, :365), and the panel reads `hiddenFields.includes`, `projects.length`, `evalSummary.authorized` (:377, :384, :449), which crashes. Recommended: drop `talent` (and `mentor`) from the learner nav `dashboard/AppLayout.jsx:40-41`; companies already have CompanyTalent. If it stays, map from `GET /talent/{id}` (`evaluation` → `evalSummary`) and default arrays.
4. `learner/MentorView.jsx` (only reachable once a mentor role is routed; LearnerWorkspace.jsx:195 shows an alert today): `student.skills.filter` / `.map` (:245, :260) and `student.projects.map` (:317) on data that has none. Default them to `[]` in the mapper (:815). Messages arrive newest-first (reverse them before rendering, ~:856-870). The project picker stores `p.title` (:478) but sends `selectedProject.id` (:376), so `project_id` is always undefined; store the project object.

**Wrong or empty data**
5. `learner/LearnerWorkspace.jsx`: pass `withRecommendations(projects, recommendations, levels)` (utils/projectMapping.js; levels from `careerRolesApi.fetchMySkillLevels()`) to ProjectsView instead of raw `projects`. Today every card shows 0% match / Not evaluated / no skills. Also treat 404 `READINESS_NOT_FOUND` / `DECISION_NOT_FOUND` from readiness/intelligence as "empty", not as "Some workspace data could not be loaded" (~:87), which every new learner sees.
6. `learner/ProjectDetailsView.jsx`: `p.capacity_state?.remaining` (:33) should be `p.capacity_state?.seats_remaining` (also `seats_taken`, `full`). `p.eligibility?.message` (:39) does not exist: build the note from `p.eligibility?.eligible` / `p.eligibility?.reasons`. The "You are eligible" banner (~244-252) must follow `eligibility.eligible`. `p.application_id ?? p.application?.id` (:43) is not on ProjectResource, so after a reload withdrawal has no id: look the application up in `getApplications()` by `project_id`. Pass the typed reason: `withdrawApplication(id, reason)` (api.js now sends it). Replace the static timeline dates / `Ref #APP-…` (~819-1227) with the application's `id`, `submitted_at`, `decided_at`, `withdrawn_at`.
7. `dashboard/Dashboard.jsx`: roadmap `phase` is a string enum (`foundations|core_skills|applied_practice|career_readiness`), so `Math.max(...actions.map(a => a.phase || 1), 4)` (:264-267) gives "Phase foundations of NaN". Use the index in `roadmap.phases` or `PHASE_LABEL`. Drop the `'35%'` / `'Phase 2 of 4'` / `score*0.8` fallbacks (:259-270), the fake gaps (:292-297), the fake projects (:347-382) and `?? 85` / `88 - i*14` (:320, :340) in favour of empty states. The next-action button (~:232) should switch on `type` (`assessment|resource|practice|simulated_project|real_project`), not on `target_skill_id`. `skillsAssessedNote` is computed (:198) but never stored (:383-398). Replace `skillsAssessedTotal: 24` (:95, :194) with `total_skills` or "—".
8. `learner/ProjectsView.jsx:815-816`: the filters offer `Practice Task, Assessment, Capstone, Conditionally Eligible, Completed`. The backend `type` is only `simulation | company_sponsored`. Remove the stale `// MOCK DATA` comment (:4) and the constant `isLoaded = true` (:891).
9. `learner/CareerJourneyView.jsx:2213`: `demoState` is fixed to "loaded", so loading/error/empty states never render; drive it from the readiness/intelligence requests. Remove `// MOCK DATA` (:3). `roadmap.milestones` (:2208) has no backend field (backend question).
10. `skillmatrix/SkillMatrix.jsx`: after `upsertSkillMatrix` it reads `created?.id` (:363), but the id is at `created.data.id`. Line :270 compares `row.learner_id === learnerId` strictly (use `String()` on both). Remove the `console.log` (:221) and the two `console.warn` calls (:99, :341).
11. Assistant → support handoff (`learner/AssistantView.jsx` ~957, `AssistantPanel.jsx` ~893): filter out bubbles with empty text before building `transcript`. An empty `body` gives 422 "Each transferred message needs a body".
12. `auth/OtpVerification.jsx` (optional): use `resend_available_at` from register/resend responses instead of the fixed 60 s / 600 s fallbacks.
13. `assessment/LearnerProfileSetup.jsx:214`: with the static fallback country list it sends ISO2/name to `/reference/countries/{country}/universities`, which only takes the numeric id (404). Only happens when `/countries` failed; acceptable, but you could skip the call when no numeric id is known.
14. Dead code to delete (all PDF hits live here): `dashboard/CareerJourneyView.jsx`, `dashboard/CareerRolesView.jsx`, `dashboard/ProjectsView.jsx`, `dashboard/DashboardView.jsx`, and, if CareerRolesPage stays unrouted, `careerroles/CareerRoles.jsx` + `rolesData.js` (+ CareerRoles.css). Note: `careerroles/careerRolesApi.js` is used by the workspace now; keep it.
15. Settings: there is no notification-preferences UI, although `GET/PUT /notifications/preferences` exist (`{category, channel: in_app|email, enabled}`).

## 8. Commits on `api-verify` (API layer only)

| Commit on tab-fixes (api-verify original) | Summary |
|---|---|
| 0e19be9 (8c4e67a) | fix(api): send organization fields under their contract names and the graduation year as a number |
| 83f35d5 (be97616) | fix(career-roles): read role skills from the decision snapshot (+ careerRolesApi.test.js) |
| b5addeb (26598dd) | docs(api): describe the evidence endpoints as the backend serves them |
| abcac16 (27d081c) | fix(api): send the withdrawal reason with an application withdrawal |
| 2ddb403 (902fd59) | feat(projects): map recommendations and application statuses for the project screens (+ projectMapping.test.js) |

All five are cherry-picked onto `tab-fixes`; `api-verify` now equals `tab-fixes`.

The URL switch (old Render host → `https://skillspan.alwaysdata.net` in `src/api.js` dev fallback, `.env.example`, MERGED_API_HANDOFF.md) is e3191e1. `vercel.json` has only the SPA rewrite (no proxy to Render), so it needs no change. On Vercel set `VITE_API_BASE_URL=https://skillspan.alwaysdata.net` for Production and Preview and redeploy (Vite reads it at build time). After these commits: `npx vitest run` 27 files / 139 tests pass, `npm run build` ok.

## 9. Unconfirmed / limits
- No authenticated live samples (no test account allowed), so response shapes come from the controllers/resources of `feature/authentication`.

- The `skill_results` item shape on recommendations / match is passed through from the Data Science service unchanged (ProjectMatchingService.php:166). Laravel only validates `status` ∈ not_required/met/manageable_gap/large_gap/missing_non_critical/missing_critical/critical_below_minimum and `is_critical_entry` (IntelligenceResponseValidator.php:1385-1400). Other keys are **unconfirmed** from source.
- The `eligibility.skill_failures` item shape is **unconfirmed** (ProjectEligibilityService, not opened).
- The recommendations 500 (top finding 4) is inferred from source (column `title` missing in the organizations migration). It can't be confirmed live without a learner token, which this task is not allowed to create.
- Spec vs backend drift: the spec says `reasons:[string]` (recommendations) and `explanation:string` (match). The backend sends a newline-joined string and an array respectively.
