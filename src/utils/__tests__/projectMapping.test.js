import { describe, it, expect } from 'vitest';

import { applicationStatusLabel, withRecommendations } from '../projectMapping';

const project = {
  id: 9,
  title: 'Checkout redesign',
  required_skills: [
    { skill_id: 11, skill_name: 'React', minimum_level: 3, is_critical_entry: true },
    { skill_id: 12, skill_name: 'CSS', minimum_level: 2, is_critical_entry: false },
  ],
};

const recommendation = {
  id: 77,
  type: 'project',
  project_id: 9,
  access_revoked: false,
  score: 72.5,
  eligibility_state: 'eligible',
  reasons: 'Strong React match\nFits your roadmap phase',
};

describe('applicationStatusLabel', () => {
  it('maps every API status to a label the status pill knows', () => {
    expect(applicationStatusLabel('submitted')).toBe('Submitted');
    expect(applicationStatusLabel('shortlisted')).toBe('Under Review');
    expect(applicationStatusLabel('waitlisted')).toBe('Under Review');
    expect(applicationStatusLabel('accepted')).toBe('Accepted');
    expect(applicationStatusLabel('rejected')).toBe('Rejected');
    expect(applicationStatusLabel('withdrawn')).toBe('Withdrawn');
  });

  it('falls back to Submitted for anything unknown', () => {
    expect(applicationStatusLabel(undefined)).toBe('Submitted');
    expect(applicationStatusLabel('something_new')).toBe('Submitted');
  });
});

describe('withRecommendations', () => {
  it('adds the recommendation score, reason and eligibility to its project', () => {
    const [card] = withRecommendations([project], [recommendation]);
    expect(card).toMatchObject({
      id: 9,
      recommendation_id: 77,
      is_recommended: true,
      match_score: 73,
      recommendation_reason: 'Strong React match Fits your roadmap phase',
      eligibility: 'Eligible',
    });
    expect(card.skill_matches).toBeUndefined();
  });

  it('leaves projects without a recommendation untouched', () => {
    const [card] = withRecommendations([project], [{ ...recommendation, project_id: 10 }]);
    expect(card).toEqual(project);
  });

  it('ignores recommendations whose project access was revoked', () => {
    const [card] = withRecommendations([project], [{ ...recommendation, access_revoked: true, score: null }]);
    expect(card.is_recommended).toBeUndefined();
  });

  it('builds skill matches from the required skills and the learner levels', () => {
    const [card] = withRecommendations([project], [], { 11: 2, 12: 4 });
    expect(card.skill_matches).toEqual([
      { skillId: 11, skillName: 'React', category: '', requiredLevel: 3, yourLevel: 2, matched: false, isGrowthTarget: true },
      { skillId: 12, skillName: 'CSS', category: '', requiredLevel: 2, yourLevel: 4, matched: true, isGrowthTarget: false },
    ]);
  });
});
