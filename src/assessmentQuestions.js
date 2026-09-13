// assessmentQuestions.js
// The Baseline Skill Assessment's question bank + rating scale - shared by
// every screen that needs to know what was asked (the quiz itself, the
// Resume screen's "next question" preview, and the Completion/Results
// screens' stats), so they can never drift out of sync with each other.
//
// 12 questions across 4 skill areas, matching the count promised on the
// intro screen (SkillAssessmentIntro.jsx). Three question shapes are used:
//  - "rating": the 0-4 proficiency scale (No Experience -> Advanced)
//  - "choice": a short list of plain-language options, for things that
//    don't map cleanly onto a proficiency number (REST API exposure,
//    teamwork, communication, timeline)
//  - "text": a single free-text answer (target role)

export const RATING_LEVELS = [
  { value: 0, label: 'No Experience', desc: "Haven't worked with this yet" },
  { value: 1, label: 'Beginner', desc: 'Tutorials, basic awareness' },
  { value: 2, label: 'Developing', desc: 'Small projects with guidance' },
  { value: 3, label: 'Intermediate', desc: 'Build independently, comfortable' },
  { value: 4, label: 'Advanced', desc: 'Complex solutions, can mentor' },
];

export const LEVEL_ACCENT = ['#64748b', '#f59e0b', '#fb923c', '#3b82f6', '#8b5cf6'];

export const SECTIONS = [
  {
    key: 'programming',
    label: 'Programming',
    questions: [
      {
        id: 'python',
        skill: 'Python',
        type: 'rating',
        prompt: 'How would you rate your Python programming proficiency?',
      },
      {
        id: 'javascript',
        skill: 'JavaScript',
        type: 'rating',
        prompt: 'How would you rate your JavaScript proficiency?',
      },
      {
        id: 'sql',
        skill: 'SQL',
        type: 'rating',
        prompt: 'How would you rate your SQL and database querying skills?',
      },
      {
        id: 'typescript',
        skill: 'TypeScript',
        type: 'rating',
        prompt: 'How would you rate your TypeScript proficiency?',
      },
    ],
  },
  {
    key: 'web',
    label: 'Web Development',
    questions: [
      {
        id: 'react',
        skill: 'React',
        type: 'rating',
        prompt: 'How would you rate your experience with React or similar frontend frameworks?',
      },
      {
        id: 'restApis',
        skill: 'REST APIs',
        type: 'choice',
        prompt: 'Which best describes your REST API experience?',
        options: [
          "Haven't worked with REST APIs yet",
          'Followed tutorials to consume APIs',
          'Built REST APIs in personal projects',
          'Built REST APIs in team or real-world projects',
        ],
      },
    ],
  },
  {
    key: 'data',
    label: 'Data & Analytics',
    questions: [
      {
        id: 'pythonData',
        skill: 'Python Data',
        type: 'rating',
        prompt: 'How would you rate your experience with data tools like Pandas and NumPy?',
      },
      {
        id: 'visualization',
        skill: 'Visualization',
        type: 'rating',
        prompt: 'How would you rate your ability to build charts and data visualizations?',
      },
    ],
  },
  {
    key: 'background',
    label: 'Background',
    questions: [
      {
        id: 'collaboration',
        skill: 'Collaboration',
        type: 'choice',
        prompt: 'How would you describe your experience working in a team?',
        options: [
          'Mostly worked solo so far',
          'Some group work in coursework',
          'Regular collaboration on team projects',
          'Led or coordinated a team before',
        ],
      },
      {
        id: 'communication',
        skill: 'Communication',
        type: 'choice',
        prompt: 'How comfortable are you presenting or explaining technical work?',
        options: [
          'Prefer not to present',
          'Can present with preparation',
          'Comfortable presenting to peers',
          'Confident presenting to any audience',
        ],
      },
    ],
  },
  {
    key: 'career',
    label: 'Career Goals',
    questions: [
      {
        id: 'targetRole',
        skill: 'Target Role',
        type: 'text',
        prompt: "What's your target role after graduation?",
        placeholder: 'e.g. Frontend Developer, Data Analyst, QA Engineer...',
      },
      {
        id: 'timeline',
        skill: 'Timeline',
        type: 'choice',
        prompt: 'How soon are you aiming to land this role?',
        options: ['Within 3 months', '3–6 months', '6–12 months', 'More than a year'],
      },
    ],
  },
];

export const ALL_QUESTIONS = SECTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, sectionKey: section.key, sectionLabel: section.label }))
);
export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

// Only "rating" questions produce a 0-4 proficiency level for the Skill
// Matrix / Results screen - "choice" and "text" answers feed the roadmap
// and profile instead, so they're excluded from the "skills mapped" count.
export const RATED_QUESTIONS = ALL_QUESTIONS.filter((q) => q.type === 'rating');

// Resuming mid-assessment (e.g. after "Save & Exit") should land the
// learner on the first question they haven't answered yet, not back at
// Q1 - used by SkillAssessment.jsx on mount and by
// SkillAssessmentResume.jsx's "Continue Assessment" preview.
export const firstUnansweredIndex = (answers) => {
  const idx = ALL_QUESTIONS.findIndex((q) => answers[q.id] === undefined || answers[q.id] === '');
  return idx === -1 ? TOTAL_QUESTIONS - 1 : idx;
};

export const countAnsweredInSection = (section, answers) =>
  section.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;
