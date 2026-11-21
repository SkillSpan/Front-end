// Skill taxonomy shown in the left rail + used to validate/describe any
// skill the user adds. There is no backend endpoint for this yet (see
// api.js) - this mirrors the categories/skills visible in the design and
// should be replaced by a GET /skills-taxonomy style call once one exists.
export const TAXONOMY = [
  {
    key: 'Programming',
    label: 'Programming & Languages',
    skills: [
      { id: 'python', name: 'Python', description: 'General-purpose scripting & automation' },
      { id: 'javascript', name: 'JavaScript', description: 'Dynamic language for web development' },
      { id: 'typescript', name: 'TypeScript', description: 'Typed superset of JavaScript' },
      { id: 'java', name: 'Java', description: 'Object-oriented, enterprise-grade language' },
      { id: 'sql', name: 'SQL', description: 'Structured Query Language for databases' },
      { id: 'cpp', name: 'C++', description: 'High-performance systems programming' },
      { id: 'rust', name: 'Rust', description: 'Memory-safe systems language' },
    ],
  },
  {
    key: 'Web',
    label: 'Web Development',
    skills: [
      { id: 'react', name: 'React', description: 'Component-based UI library' },
      { id: 'nodejs', name: 'Node.js', description: 'JavaScript runtime for backend services' },
      { id: 'restapis', name: 'REST APIs', description: 'Designing and consuming REST services' },
      { id: 'graphql', name: 'GraphQL', description: 'Query language for APIs' },
      { id: 'csstailwind', name: 'CSS / Tailwind', description: 'Styling and utility-first CSS' },
      { id: 'nextjs', name: 'Next.js', description: 'React framework for production' },
    ],
  },
  {
    key: 'Data',
    label: 'Data & Analytics',
    skills: [
      { id: 'pandas', name: 'Pandas', description: 'Python data analysis library' },
      { id: 'numpy', name: 'NumPy', description: 'Numerical computing with Python' },
      { id: 'tableau', name: 'Tableau', description: 'Data visualization platform' },
      { id: 'powerbi', name: 'Power BI', description: 'Business analytics and reporting' },
      { id: 'ml', name: 'Machine Learning', description: 'Predictive modeling and ML algorithms' },
      { id: 'sparks', name: 'Apache Spark', description: 'Distributed data processing' },
    ],
  },
  {
    key: 'Cloud',
    label: 'Cloud & DevOps',
    skills: [
      { id: 'aws', name: 'AWS', description: 'Amazon Web Services cloud platform' },
      { id: 'docker', name: 'Docker', description: 'Container platform for applications' },
      { id: 'kubernetes', name: 'Kubernetes', description: 'Container orchestration' },
      { id: 'cicd', name: 'CI/CD', description: 'Continuous integration & delivery pipelines' },
      { id: 'git', name: 'Git', description: 'Version control system' },
    ],
  },
  {
    key: 'Soft',
    label: 'Soft Skills',
    skills: [
      { id: 'communication', name: 'Communication', description: 'Written and verbal clarity' },
      { id: 'teamwork', name: 'Teamwork', description: 'Collaborating effectively with others' },
      { id: 'problemsolving', name: 'Problem Solving', description: 'Analytical and critical thinking' },
      { id: 'timemanagement', name: 'Time Management', description: 'Prioritizing and meeting deadlines' },
      { id: 'leadership', name: 'Leadership', description: 'Guiding teams and initiatives' },
    ],
  },
];

export const LEVELS = [
  { value: 0, label: '0/5', name: 'Recorded level 0/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
  { value: 1, label: '1/5', name: 'Recorded level 1/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
  { value: 2, label: '2/5', name: 'Recorded level 2/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
  { value: 3, label: '3/5', name: 'Recorded level 3/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
  { value: 4, label: '4/5', name: 'Recorded level 4/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
  { value: 5, label: '5/5', name: 'Recorded level 5/5', desc: 'A recorded score on the 0–5 scale; interpret it using the source of this entry.' },
];

// Levels arrive from the backend as the string form of a DECIMAL, e.g.
// "3.50" or "2.50" (the column is `level` on a 0.00-5.00 scale). This used to
// index the array with that raw number: LEVELS[3.5] is undefined, so the page
// crashed on `.name` and rendered completely blank. Round to the nearest whole
// band first, and never return undefined for a non-numeric value.
export function levelInfo(value) {
  const n = Number(value);
  const index = Number.isFinite(n) ? Math.round(Math.max(0, Math.min(5, n))) : 0;
  const recorded = Number.isFinite(n) ? Math.max(0, Math.min(5, n)) : 0;
  return { ...(LEVELS[index] ?? LEVELS[0]), name: `Recorded level ${recorded}/5` };
}

export function findSkillById(id) {
  for (const cat of TAXONOMY) {
    const found = cat.skills.find((s) => s.id === id);
    if (found) return { ...found, category: cat.key, categoryLabel: cat.label };
  }
  return null;
}

export function totalSkillCount() {
  return TAXONOMY.reduce((sum, c) => sum + c.skills.length, 0);
}
