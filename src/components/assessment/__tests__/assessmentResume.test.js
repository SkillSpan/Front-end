import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveAssessmentId, saveQuestionBankRaw, saveSubmissionResult, saveAssessmentOwner,
  markAssessmentExited, clearAssessmentExited, hasAssessmentInProgress,
} from '../assessmentStorage';

describe('resume an unfinished assessment after leaving the site', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  const start = (owner = 7) => {
    saveAssessmentId(55);
    saveQuestionBankRaw({ id: 55, questions: [{ id: 1 }] });
    saveAssessmentOwner(owner);
  };

  it('survives a closed tab (kept in localStorage)', () => {
    start();
    sessionStorage.clear(); // a new visit
    expect(hasAssessmentInProgress(7)).toBe(true);
  });

  it('is not offered to a different account on the same device', () => {
    start(7);
    expect(hasAssessmentInProgress(8)).toBe(false);
  });

  it('is done once the result exists', () => {
    start();
    saveSubmissionResult({ score: 1 });
    expect(hasAssessmentInProgress(7)).toBe(false);
  });

  it('respects Save & Exit inside the same visit, resumes on the next one', () => {
    start();
    markAssessmentExited();
    expect(hasAssessmentInProgress(7)).toBe(false);
    clearAssessmentExited();
    expect(hasAssessmentInProgress(7)).toBe(true);
  });
});
