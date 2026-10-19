// assessmentQuestions.js
// The Baseline Skill Assessment's question model.
//
// The questions are NOT hardcoded any more: they depend on the career role
// the learner picks on the intro screen. POST /api/v1/baseline-assessments
// returns the role-specific question set (career role -> required skills ->
// questions mapped to those skills); AssessmentWizard caches that payload in
// sessionStorage (assessmentStorage.js) and every screen reads it back
// through getQuestionBank() below, so the quiz, the Resume screen, the
// Completion screen and the Results screen can never drift apart.
//
// Question shapes (UI side):
//  - "choice": pick one of `options` (server item_type single_choice/scale)
//  - "rating": 0-4 proficiency scale (only when a scale item has no options)
//  - "text":   free-text answer
//
// The answer sent back to the API is the option text itself (that is what
// the backend validates against), keyed by the question's `item_id`.

import { loadQuestionBankRaw } from './assessmentStorage';

export const RATING_LEVELS = [
  { value: 0, label: 'No Experience', desc: "Haven't worked with this yet" },
  { value: 1, label: 'Beginner', desc: 'Tutorials, basic awareness' },
  { value: 2, label: 'Developing', desc: 'Small projects with guidance' },
  { value: 3, label: 'Intermediate', desc: 'Build independently, comfortable' },
  { value: 4, label: 'Advanced', desc: 'Complex solutions, can mentor' },
];

export const LEVEL_ACCENT = ['#64748b', '#f59e0b', '#fb923c', '#3b82f6', '#8b5cf6'];

// Backend skill levels run 0..5 (see BaselineAssessmentService::normalizedSkills).
export const MAX_SKILL_LEVEL = 5;

const prettifySlug = (slug) =>
  String(slug || 'General')
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const toUiType = (question) => {
  if (question.item_type === 'text') return 'text';
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) return question.item_type === 'scale' ? 'rating' : 'text';
  return 'choice';
};

/**
 * Turns the raw assessment payload from the API into the structures the
 * screens use. Pure function - safe to unit test.
 */
export const buildQuestionBank = (assessment) => {
  const rawQuestions = Array.isArray(assessment?.questions) ? assessment.questions : [];
  const coverageSkills = Array.isArray(assessment?.skill_coverage?.skills) ? assessment.skill_coverage.skills : [];
  const skillNameById = new Map(coverageSkills.map((s) => [Number(s.skill_id), s.skill_name]));

  const sectionMap = new Map();
  const questions = [];

  rawQuestions.forEach((raw) => {
    const skillName =
      skillNameById.get(Number(raw.skill_id)) || prettifySlug(raw.skill_slug) || 'General';
    const sectionKey = String(raw.skill_id ?? raw.skill_slug ?? skillName);
    const question = {
      id: String(raw.item_id),
      skill: skillName,
      skillId: raw.skill_id,
      type: toUiType(raw),
      prompt: raw.question_text || `Tell us about your ${skillName} experience.`,
      options: Array.isArray(raw.options) ? raw.options.map(String) : [],
      placeholder: 'Type your answer here...',
      isCritical: !!raw.is_critical,
      sectionKey,
      sectionLabel: skillName,
    };
    if (!sectionMap.has(sectionKey)) sectionMap.set(sectionKey, { key: sectionKey, label: skillName, questions: [] });
    sectionMap.get(sectionKey).questions.push(question);
  });

  // Keep questions of the same skill together (the API sorts by item id).
  const sections = Array.from(sectionMap.values());
  sections.forEach((s) => s.questions.forEach((q) => questions.push(q)));

  return {
    assessmentId: assessment?.id ?? null,
    careerRoleId: assessment?.career_role_id ?? assessment?.career_role?.id ?? null,
    careerRoleTitle: assessment?.career_role?.title ?? assessment?.snapshot_metadata?.career_role_title ?? '',
    sections,
    questions,
    total: questions.length,
  };
};

const EMPTY_BANK = buildQuestionBank(null);
let cachedRaw;
let cachedBank = EMPTY_BANK;

/** The question set for the learner's chosen career role (empty until started). */
export const getQuestionBank = () => {
  const raw = loadQuestionBankRaw();
  const key = raw ? JSON.stringify(raw) : '';
  if (key !== cachedRaw) {
    cachedRaw = key;
    cachedBank = raw ? buildQuestionBank(raw) : EMPTY_BANK;
  }
  return cachedBank;
};

export const isAnswered = (answers, id) => {
  const v = answers?.[id];
  return v !== undefined && v !== null && String(v).trim() !== '';
};

// Resuming mid-assessment (e.g. after "Save & Exit") should land the
// learner on the first question they haven't answered yet, not back at Q1.
export const firstUnansweredIndex = (answers, questions = getQuestionBank().questions) => {
  const idx = questions.findIndex((q) => !isAnswered(answers, q.id));
  return idx === -1 ? Math.max(questions.length - 1, 0) : idx;
};

export const countAnsweredInSection = (section, answers) =>
  section.questions.filter((q) => isAnswered(answers, q.id)).length;

/**
 * ONE definition of "how far along are you", used by every screen (quiz top
 * bar, sidebar, Resume, Completion) so the percentage always matches what the
 * learner actually answered - only questions that belong to the current role
 * are counted.
 */
export const computeProgress = (answers, questions = getQuestionBank().questions) => {
  const total = questions.length;
  const answered = questions.filter((q) => isAnswered(answers, q.id)).length;
  return { answered, total, remaining: total - answered, percent: total ? Math.round((answered / total) * 100) : 0 };
};

/** Shape the backend expects for PATCH/submit: [{ question_id, answer }]. */
export const toResponses = (answers, questions = getQuestionBank().questions) =>
  questions
    .filter((q) => isAnswered(answers, q.id))
    .map((q) => ({ question_id: q.id, answer: typeof answers[q.id] === 'string' ? answers[q.id].trim() : answers[q.id] }));
