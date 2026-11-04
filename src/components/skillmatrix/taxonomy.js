// Proficiency levels used by the Skill Matrix. The skill list itself comes
// only from GET /skills/taxonomy; there is no local fallback list.
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
