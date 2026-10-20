import { describe, it, expect, beforeEach } from 'vitest';
import { saveQuestionBankRaw, saveSubmissionResult, saveAnswers } from '../assessmentStorage';
import { getQuestionBank, computeProgress, toResponses, buildQuestionBank } from '../assessmentQuestions';
import { getAssessmentResult } from '../assessmentResult';

const backendAssessment = (role, items) => ({
  id: 7,
  career_role_id: role.id,
  career_role: role,
  skill_coverage: { skills: items.map((i) => ({ skill_id: i.skill_id, skill_name: i.skill_name })) },
  questions: items.map((i) => ({
    item_id: i.id, item_type: 'single_choice', question_text: i.q,
    options: ['A1', 'B1'], skill_id: i.skill_id, skill_slug: i.slug, is_critical: false,
  })),
});

const backendRole = { id: 1, title: 'Backend Developer' };
const dataRole = { id: 2, title: 'Data Analyst' };

describe('role-specific assessment', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows different questions for different roles', () => {
    saveQuestionBankRaw(backendAssessment(backendRole, [
      { id: 'rest-apis-001', q: 'GET vs POST?', skill_id: 1, skill_name: 'REST APIs', slug: 'rest-apis' },
    ]));
    expect(getQuestionBank().questions.map((q) => q.prompt)).toEqual(['GET vs POST?']);

    saveQuestionBankRaw(backendAssessment(dataRole, [
      { id: 'sql-001', q: 'What does GROUP BY do?', skill_id: 2, skill_name: 'SQL', slug: 'sql' },
      { id: 'stats-001', q: 'Mean vs median?', skill_id: 3, skill_name: 'Statistics', slug: 'stats' },
    ]));
    const bank = getQuestionBank();
    expect(bank.total).toBe(2);
    expect(bank.sections.map((s) => s.label)).toEqual(['SQL', 'Statistics']);
    expect(bank.careerRoleTitle).toBe('Data Analyst');
  });

  it('computes one consistent progress % from the answers', () => {
    const bank = buildQuestionBank(backendAssessment(dataRole, [
      { id: 'a', q: 'q1', skill_id: 1, skill_name: 'S1', slug: 's1' },
      { id: 'b', q: 'q2', skill_id: 1, skill_name: 'S1', slug: 's1' },
      { id: 'c', q: 'q3', skill_id: 2, skill_name: 'S2', slug: 's2' },
      { id: 'd', q: 'q4', skill_id: 2, skill_name: 'S2', slug: 's2' },
    ]));
    expect(computeProgress({}, bank.questions).percent).toBe(0);
    expect(computeProgress({ a: 'A1', c: 'B1', zzz: 'ignored' }, bank.questions)).toMatchObject({ answered: 2, total: 4, percent: 50 });
    expect(toResponses({ a: 'A1', b: '' , c: ' B1 ' }, bank.questions)).toEqual([
      { question_id: 'a', answer: 'A1' },
      { question_id: 'c', answer: 'B1' },
    ]);
  });

  it('reads the server score, falls back to skill average', () => {
    saveAnswers({});
    saveSubmissionResult({ data: { id: 7, result: { overall_score: 72 }, normalized_skills: [
      { skill_id: 1, name: 'SQL', level: 4, confidence: 80 },
      { skill_id: 2, name: 'REST APIs', level: 2.5, confidence: 60 },
    ], career_role: backendRole } });
    const r = getAssessmentResult();
    expect(r.score).toBe(72);
    expect(r.skills.map((s) => s.percent)).toEqual([80, 50]);

    saveSubmissionResult({ id: 7, result: {}, normalized_skills: [
      { skill_id: 1, name: 'SQL', level: 4 }, { skill_id: 2, name: 'X', level: 2 },
    ] });
    expect(getAssessmentResult().score).toBe(60);
  });
});
