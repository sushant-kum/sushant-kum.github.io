export type SkillGroup = { label: string; items: string[] };

export const skills: SkillGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript', 'HTML', 'CSS/SCSS'] },
  { label: 'Frontend', items: ['Angular', 'React', 'Redux', 'Responsive Design'] },
  { label: 'Backend', items: ['Node.js', 'Express'] },
  { label: 'Tooling', items: ['Git', 'Vite', 'ESLint', 'D3'] },
];
