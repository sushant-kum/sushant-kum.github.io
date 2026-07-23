export type Project = { title: string; blurb: string; tech: string[] }

export const projects: Project[] = [
  { title: 'ngx-d3-graphs', blurb: 'An Angular library wrapping D3 to render configurable, reactive charts as drop-in components.', tech: ['Angular', 'D3', 'TypeScript'] },
  { title: 'Weather Radar', blurb: 'A responsive weather dashboard with live conditions, forecasts and a clean data-first layout.', tech: ['Angular', 'SCSS', 'REST'] },
  { title: 'React Chat App', blurb: 'A real-time chat interface exploring React state patterns and snappy, accessible messaging UI.', tech: ['React', 'SCSS', 'Realtime'] },
  { title: 'eslint-config-ngx', blurb: 'A shareable ESLint config codifying consistent linting standards for Angular projects.', tech: ['ESLint', 'JavaScript', 'Tooling'] },
]
