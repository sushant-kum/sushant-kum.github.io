// SSG-safe lazy loader for Three.js. The dynamic import keeps Three out of the
// initial bundle (code-split chunk) and out of the Node prerender path.
export type ThreeModule = typeof import('three');

let cached: Promise<ThreeModule> | null = null;

/** Load Three.js on the client. Returns null during SSG/prerender (no window). */
export const loadThree = (): Promise<ThreeModule> | null => {
  if (typeof window === 'undefined') return null;
  cached ??= import('three').catch((err) => {
    cached = null;
    throw err;
  });
  return cached;
};
