import { describe, it, expect } from 'vitest';

import { experience } from './experience';
import { profile } from './profile';
import { projects } from './projects';
import { skills } from './skills';

describe('content data', () => {
  it('profile has core fields and contact links', () => {
    expect(profile.name).toBe('Sushant Kumar');
    expect(profile.role.length).toBeGreaterThan(0);
    expect(profile.bioParagraphs.length).toBeGreaterThanOrEqual(1);
    expect(profile.contact.github).toContain('github.com/sushant-kum');
    expect(profile.contact.email).toContain('@');
  });
  it('experience includes Workfabric AI and Soroco', () => {
    const companies = experience.map((e) => e.company);
    expect(companies).toContain('Workfabric AI');
    expect(companies).toContain('Soroco');
  });
  it('projects are curated (4-6) and carry NO external links', () => {
    expect(projects.length).toBeGreaterThanOrEqual(4);
    expect(projects.length).toBeLessThanOrEqual(6);
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(Array.isArray(p.tech)).toBe(true);
      expect(p).not.toHaveProperty('link');
      expect(p).not.toHaveProperty('url');
      expect(p).not.toHaveProperty('href');
    }
  });
  it('skills are grouped', () => {
    expect(skills.length).toBeGreaterThanOrEqual(3);
    expect(skills[0].items.length).toBeGreaterThan(0);
  });
});
