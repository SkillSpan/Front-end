import { describe, it, expect } from 'vitest';
import { formatEnum } from '../formatEnum';

describe('formatEnum', () => {
  it('formats snake_case API values for display', () => {
    expect(formatEnum('fourth_year')).toBe('Fourth year');
    expect(formatEnum('year_4')).toBe('Year 4');
    expect(formatEnum('core_skills')).toBe('Core skills');
  });

  it('leaves other values unchanged', () => {
    expect(formatEnum('Third year')).toBe('Third year');
    expect(formatEnum('React')).toBe('React');
    expect(formatEnum(2027)).toBe(2027);
    expect(formatEnum(null)).toBeNull();
  });
});
