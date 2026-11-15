import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, Stats } from '@react-three/drei';
import { useState } from 'react';
import { MoonDiorama } from './scene/MoonDiorama';

type RendererMetrics = {
  triangles: number;
  calls: number;
};

function RendererProbe() {
  const { gl } = useThree();

  useFrame(() => {
    if (import.meta.env.DEV) {
      window.setTimeout(() => {
        (
          window as Window & { __MISSION_RENDERER_INFO__?: RendererMetrics }
        ).__MISSION_RENDERER_INFO__ = {
          triangles: gl.info.render.triangles,
          calls: gl.info.render.calls,
        };
      }, 0);
    }
  });

  return null;
}

export function App() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <main className="app-shell">
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, dpr]}
        camera={{ position: [8, 8, 8], zoom: 52, near: 0.1, far: 100 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <RendererProbe />
        <MoonDiorama />
        {import.meta.env.DEV && <Stats />}
      </Canvas>
      <section className="title-card" aria-label="Mission title">
        <p className="eyebrow">JUNIOR MISSION COMMANDER</p>
        <h1>Beyond Earth: First Light</h1>
        <p>Moon base training begins soon.</p>
        <button type="button" onClick={() => window.dispatchEvent(new Event('mission:recenter'))}>
          Recenter diorama
        </button>
      </section>
    </main>
  );
}
