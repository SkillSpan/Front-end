import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rememberAssessmentReturn, getAssessmentReturn, consumeAssessmentReturn, readAssessmentSpecialization } from '../assessmentAuthReturn';
describe('assessment authentication return', () => {
  beforeEach(() => { sessionStorage.clear(); vi.useRealTimers(); });
  it('remembers the assessment destination and selected specialization', () => {
    rememberAssessmentReturn(5);
    expect(getAssessmentReturn()).toMatchObject({ path: '/register/assessment', specializationId: '5' });
  });
  it('consumes the destination once', () => {
    rememberAssessmentReturn(5);
    expect(consumeAssessmentReturn()).toBe('/register/assessment');
    expect(consumeAssessmentReturn()).toBeNull();
    expect(readAssessmentSpecialization()).toBe('5');
    expect(readAssessmentSpecialization()).toBe('5');
  });
  it('rejects a destination outside the assessment route', () => {
    sessionStorage.setItem('skillspan_assessment_auth_return', JSON.stringify({ path: '//example.org', savedAt: Date.now() }));
    expect(consumeAssessmentReturn()).toBeNull();
  });
  it('expires an abandoned authentication flow', () => {
    vi.useFakeTimers();
    rememberAssessmentReturn(5);
    vi.advanceTimersByTime(60 * 60 * 1000 + 1);
    expect(getAssessmentReturn()).toBeNull();
    vi.useRealTimers();
  });
});
