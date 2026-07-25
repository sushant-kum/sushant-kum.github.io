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

type PostFX = typeof import('three/examples/jsm/postprocessing/EffectComposer.js') &
  typeof import('three/examples/jsm/postprocessing/RenderPass.js') &
  typeof import('three/examples/jsm/postprocessing/UnrealBloomPass.js') &
  typeof import('three/examples/jsm/postprocessing/OutputPass.js');

export type ThreeFX = {
  EffectComposer: PostFX['EffectComposer'];
  RenderPass: PostFX['RenderPass'];
  UnrealBloomPass: PostFX['UnrealBloomPass'];
  OutputPass: PostFX['OutputPass'];
};

let cachedFX: Promise<ThreeFX> | null = null;

/** Load Three.js post-processing addons on the client. Null during SSG. */
export const loadThreeFX = (): Promise<ThreeFX> | null => {
  if (typeof window === 'undefined') return null;
  cachedFX ??= Promise.all([
    import('three/examples/jsm/postprocessing/EffectComposer.js'),
    import('three/examples/jsm/postprocessing/RenderPass.js'),
    import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
    import('three/examples/jsm/postprocessing/OutputPass.js'),
  ])
    .then(([ec, rp, ub, op]) => ({
      EffectComposer: ec.EffectComposer,
      RenderPass: rp.RenderPass,
      UnrealBloomPass: ub.UnrealBloomPass,
      OutputPass: op.OutputPass,
    }))
    .catch((err) => {
      cachedFX = null;
      throw err;
    });
  return cachedFX;
};
