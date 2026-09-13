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
  { value: 0, label: 'None', name: 'No Experience', desc: "Haven't used this yet" },
  { value: 1, label: 'Beg', name: 'Beginner', desc: 'Tutorials, basic awareness' },
  { value: 2, label: 'Dev', name: 'Developing', desc: 'Some hands-on practice' },
  { value: 3, label: 'Int', name: 'Intermediate', desc: 'Comfortable in real tasks' },
  { value: 4, label: 'Adv', name: 'Advanced', desc: 'Complex solutions, mentors others' },
  { value: 5, label: 'Exp', name: 'Expert', desc: 'Deep expertise, sets best practice' },
];

export function levelInfo(value) {
  return LEVELS[Math.max(0, Math.min(5, value))];
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
