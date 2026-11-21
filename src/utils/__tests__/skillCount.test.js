import { describe, expect, it } from 'vitest';
import { countAssessedSkills } from '../skillCount';

describe('countAssessedSkills', () => {
  it('never reads above the required total', () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ skill_id: i + 1 }));
    expect(countAssessedSkills(rows, 10)).toBe(10);
  });

  it('counts a re-assessed skill once', () => {
    const rows = [{ skill_id: 1 }, { skill_id: 1 }, { skill_id: 2 }, { skill: { id: 3 } }];
    expect(countAssessedSkills(rows, 10)).toBe(3);
  });

  it('keeps the distinct count when the total is unknown', () => {
    expect(countAssessedSkills([{ skill_id: 1 }, { skill_id: 2 }], null)).toBe(2);
    expect(countAssessedSkills(null, 5)).toBe(0);
  });
});
