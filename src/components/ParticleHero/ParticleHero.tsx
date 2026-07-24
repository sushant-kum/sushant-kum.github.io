import { useEffect, useRef } from 'react';

import styles from './ParticleHero.module.scss';
import { loadThree } from '../../lib/three';

const COUNT = 5000;
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const VIOLET: [number, number, number] = [0.655, 0.545, 0.98];

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// Load → assemble "SK" → hold → disperse to ambient field.
const cohesionAt = (e: number) => {
  if (e < 0.3) return 0;
  if (e < 2.2) return smooth((e - 0.3) / 1.9);
  if (e < 3.7) return 1;
  if (e < 5.0) return 1 - smooth((e - 3.7) / 1.3);
  return 0;
};

export const ParticleHero = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = container.current;
    if (!el) return;

    // Sample "SK" target positions from a 2D canvas. Bail if unavailable (jsdom).
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 256;
    sampleCanvas.height = 128;
    const sctx = sampleCanvas.getContext('2d');
    if (!sctx) return;
    sctx.fillStyle = '#fff';
    sctx.font = '900 96px monospace';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('SK', 128, 68);
    const pixels = sctx.getImageData(0, 0, 256, 128).data;
    const opaque: [number, number][] = [];
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 256; x += 2) {
        if (pixels[(y * 256 + x) * 4 + 3] > 128) opaque.push([x, y]);
      }
    }
    if (opaque.length === 0) return;

    let raf = 0;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const pending = loadThree();
    if (!pending) return;

    void pending.then((THREE) => {
      if (disposed) return;

      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(width, height);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.z = 26;

      const positions = new Float32Array(COUNT * 3);
      const targets = new Float32Array(COUNT * 3);
      const drift = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);

      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const r = 18 + Math.random() * 14;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dx = r * Math.sin(phi) * Math.cos(theta);
        const dy = r * Math.sin(phi) * Math.sin(theta) * 0.6;
        const dz = r * Math.cos(phi) * 0.6;
        drift[ix] = dx;
        drift[ix + 1] = dy;
        drift[ix + 2] = dz;
        positions[ix] = dx;
        positions[ix + 1] = dy;
        positions[ix + 2] = dz;

        const [px, py] = opaque[i % opaque.length];
        targets[ix] = (px - 128) / 6.2;
        targets[ix + 1] = -(py - 64) / 6.2;
        targets[ix + 2] = (Math.random() - 0.5) * 1.5;

        const c = Math.random() < 0.5 ? CYAN : VIOLET;
        colors[ix] = c[0];
        colors[ix + 1] = c[1];
        colors[ix + 2] = c[2];
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Round glow sprite.
      const sprite = document.createElement('canvas');
      sprite.width = 64;
      sprite.height = 64;
      const spctx = sprite.getContext('2d')!;
      const grd = spctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      spctx.fillStyle = grd;
      spctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(sprite);

      const material = new THREE.PointsMaterial({
        size: 0.38,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const pointer = { x: 0, y: 0, active: false };
      const onMove = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
        pointer.active = true;
      };
      window.addEventListener('pointermove', onMove);
      cleanups.push(() => window.removeEventListener('pointermove', onMove));

      const posAttr = geometry.getAttribute('position');
      const arr = posAttr.array as Float32Array;
      const start = performance.now();

      let visible = true;
      const frame = () => {
        raf = 0;
        const e = (performance.now() - start) / 1000;
        const coh = cohesionAt(e);
        const drf = 1 - coh;
        const mx = pointer.x * 18;
        const my = pointer.y * 12;
        for (let i = 0; i < COUNT; i++) {
          const ix = i * 3;
          const iy = ix + 1;
          const iz = ix + 2;
          const tx = targets[ix] * coh + (drift[ix] + Math.sin(e * 0.5 + i) * 1.4) * drf;
          const ty = targets[iy] * coh + (drift[iy] + Math.cos(e * 0.4 + i) * 1.4) * drf;
          const tz = targets[iz] * coh + drift[iz] * drf;
          arr[ix] += (tx - arr[ix]) * 0.06;
          arr[iy] += (ty - arr[iy]) * 0.06;
          arr[iz] += (tz - arr[iz]) * 0.06;
          if (pointer.active) {
            const ddx = arr[ix] - mx;
            const ddy = arr[iy] - my;
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 < 36) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / 6) * 0.6;
              arr[ix] += (ddx / d) * f;
              arr[iy] += (ddy / d) * f;
            }
          }
        }
        posAttr.needsUpdate = true;
        points.rotation.y = Math.sin(e * 0.1) * 0.15 + drf * e * 0.02;
        renderer.render(scene, camera);
        if (visible && !disposed) raf = requestAnimationFrame(frame);
      };
      const loop = () => {
        if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) loop();
          else if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0 },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());

      const onVis = () => {
        visible = !document.hidden;
        if (visible) loop();
      };
      document.addEventListener('visibilitychange', onVis);
      cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

      const onResize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
      cleanups.push(() => window.removeEventListener('resize', onResize));

      cleanups.push(() => {
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      });

      loop();
    });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div ref={container} className={styles.canvas} aria-hidden="true" />;
};
