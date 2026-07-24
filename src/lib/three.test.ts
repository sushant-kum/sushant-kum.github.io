import { describe, it, expect } from 'vitest';

import { loadThree } from './three';

describe('loadThree', () => {
  it('resolves the three module in a browser-like env', async () => {
    const three = await loadThree();
    expect(three).not.toBeNull();
    expect(three!.Scene).toBeDefined();
    expect(three!.WebGLRenderer).toBeDefined();
  });

  it('returns the same cached promise on repeat calls', () => {
    expect(loadThree()).toBe(loadThree());
  });
});
