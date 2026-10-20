import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import CareerJourneyView from '../CareerJourneyView';

// ─────────────────────────────────────────────────────────────────────────────
// Payload copied from the REAL backend contract, not from the mock model:
//   GET /intelligence/... → IntelligenceResultResource
//   GET /readiness/...    → ReadinessResultResource
// The tab was originally written against camelCase mocks (numeric phases,
// "Completed" statuses, `milestones`, `components[]`), so this fixture is the
// regression pin for the normalisation layer in the view.
// ─────────────────────────────────────────────────────────────────────────────
const READINESS = {
  id: 12,
  career_role_id: 3,
  career_role_version: 7,
  decision_id: 'a3f1c0de-0000-4000-8000-000000000091',
  score: 62.4,
  skill_match_component: 55,
  practical_experience_component: 70,
  assessment_reliability_component: 80,
  profile_completeness_component: 90,
  critical_cap_applied: false,
  is_provisional: false,
  critical_skill_readiness_cap: null,
  critical_skill_gap_count: 0,
  critical_skill_names: [],
  // The backend sends the config key, not a display label.
  band: 'moderate_readiness',
  algorithm_version: '1.4.0',
  configuration_version: '2026.10',
  calculated_at: '2026-10-17T09:00:00+00:00',
  skill_results: [],
};

const INTELLIGENCE = {
  decision_id: 91,
  status: 'completed',
  role_id: 3,
  role_version: 7,
  readiness: READINESS,
  skill_gaps: [
    {
      skill_id: 11,
      skill_name: 'SQL',
      current_level: 2,
      required_level: 4,
      gap: 2,
      match_score: 50,
      importance_weight: 0.3,
      is_critical: true,
      confidence: 85,
      status: 'gap',
      explanation: 'Core querying skill.',
    },
    {
      skill_id: 12,
      skill_name: 'Python',
      current_level: 4,
      required_level: 3,
      gap: 0,
      match_score: 100,
      importance_weight: 0.2,
      is_critical: false,
      confidence: 60,
      status: 'met',
      explanation: '',
    },
  ],
  roadmap: {
    id: 7,
    roadmap_version: 'rm-20261017',
    status: 'active',
    algorithm_version: '1.4.0',
    configuration_version: '2026.10',
    next_best_action_id: 501,
    generated_at: '2026-10-17T09:00:00+00:00',
    explanation: 'Gap-driven plan.',
    estimated_total_hours: 42,
    estimated_duration_weeks: 6,
    limitations: ['Assumes 10 h/week of study time.'],
    actions: [
      {
        id: 501,
        phase: 'foundations',
        type: 'assessment',
        title: 'Re-assess SQL fundamentals',
        objective: 'Confirm your current SQL level.',
        description: 'A short adaptive assessment.',
        target_skill_id: 11,
        prerequisite_skill_ids: [],
        priority_score: 9.5,
        estimated_hours: 4,
        estimated_duration_weeks: 1,
        order_index: 1,
        completion_criteria: 'Score 70% or higher.',
        explanation: 'SQL is critical and blocking every later step.',
        blocking_prerequisite_skill_ids: [],
        status: 'not_started',
      },
      {
        id: 502,
        phase: 'core_skills',
        type: 'practice',
        title: 'Build a SQL reporting drill',
        objective: 'Practise joins and window functions.',
        description: 'Hands-on practice.',
        target_skill_id: 11,
        prerequisite_skill_ids: [11],
        priority_score: 8,
        estimated_hours: 12,
        estimated_duration_weeks: 2,
        order_index: 2,
        completion_criteria: 'Ship the drill.',
        explanation: 'Practice converts the assessment into evidence.',
        blocking_prerequisite_skill_ids: [11],
        status: 'in_progress',
      },
    ],
  },
};

function openTab(name) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('CareerJourneyView with a real backend payload', () => {
  it('renders the readiness score from the flat readiness resource', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} roleTitle="Data Analyst" />);

    // The four flat component fields become the composition rows.
    expect(screen.getByText('Skill Match')).toBeTruthy();
    expect(screen.getByText('Practical Experience')).toBeTruthy();
    expect(screen.getByText('Assessment Reliability')).toBeTruthy();
    expect(screen.getByText('Profile Completeness')).toBeTruthy();
    // 0.65 of 55 pts = +35.8, and the column still adds up to the headline.
    expect(screen.getByText('62 pts total')).toBeTruthy();
    expect(screen.getAllByText('Data Analyst').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('maps the backend band key onto the scale instead of throwing', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} />);

    // `moderate_readiness` is a config key; BAND has no such entry.
    expect(screen.getAllByText('Progressing').length).toBeGreaterThan(0);
    expect(screen.queryByText('moderate_readiness')).toBeNull();
  });

  it('renders the roadmap instead of the "no saved roadmap" notice', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} />);
    openTab('Career Roadmap');

    expect(screen.queryByText(/No saved roadmap is available/)).toBeNull();
    expect(screen.getAllByText('Re-assess SQL fundamentals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Build a SQL reporting drill').length).toBeGreaterThan(0);
    // Phase enums must resolve to their labels.
    expect(screen.getAllByText(/Foundations/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Core Skills/).length).toBeGreaterThan(0);
    // Footer metadata comes from the roadmap row, not a hard-coded mock string.
    expect(screen.getByText(/rm-20261017/)).toBeTruthy();
    expect(screen.queryByText(/rm-2026090914/)).toBeNull();
  });

  it('does not crash when an action has blocking prerequisites', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} />);
    openTab('Career Roadmap');

    // The second action carries `blocking_prerequisite_skill_ids: [11]`; the
    // card dereferences `prerequisites.length` and `.map`.
    expect(screen.getAllByText('Build a SQL reporting drill').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SQL/).length).toBeGreaterThan(0);
  });

  it('banners the action flagged by next_best_action_id', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} />);

    expect(screen.getByText('Next Best Action')).toBeTruthy();
    // Only the banner is mounted on the readiness tab.
    expect(screen.getByText('Re-assess SQL fundamentals')).toBeTruthy();
    expect(screen.getByText(/Priority 9\.5/)).toBeTruthy();
    // "Completing this unlocks" is the next action, not a mock string.
    expect(screen.getByText('Build a SQL reporting drill')).toBeTruthy();
  });

  it('renders skill gaps without NaN and buckets them from the API status', () => {
    render(<CareerJourneyView readiness={READINESS} intelligence={INTELLIGENCE} />);
    openTab('Skill Gaps');

    expect(screen.queryByText(/Skill gap data is not available/)).toBeNull();
    expect(screen.getAllByText('SQL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).toBeNull();
    // SQL is critical + below requirement ⇒ priority gap; Python is met ⇒ strength.
    expect(screen.getAllByText('Priority Gaps').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Strengths').length).toBeGreaterThan(0);
  });
});
