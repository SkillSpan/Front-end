# SkillSpan unified authenticated shell

- All authenticated learner pages now use the same `AppLayout` sidebar/topbar.
- Sidebar navigation is centralized in `src/components/dashboard/AppLayout.jsx`.
- Learner workspace pages no longer render a second, conflicting sidebar.
- Skill Matrix is mounted inside the same shell while retaining its own internal matrix controls.
- AI Assistant now calls `POST /api/v1/assistant/ask` through `askAssistant()` and reports interactions through the documented report endpoint when an interaction id is returned.
- API requests use the Bearer token and omit cross-origin cookies.
- Responsive breakpoints collapse the sidebar to icon mode on tablets and a fixed compact rail on phones.

Validation performed in this environment:
- TypeScript parser successfully transpiled all JS/JSX source files with 0 diagnostics.
- Full npm/Vite build could not be executed because dependencies were not available in the environment and registry installation timed out.
