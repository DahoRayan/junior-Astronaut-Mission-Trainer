import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

function CameraRig() {
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const recenter = () => controls.current?.reset();
    window.addEventListener('mission:recenter', recenter);
    return () => window.removeEventListener('mission:recenter', recenter);
  }, []);

  return (
    <OrbitControls
      ref={controls}
      enablePan
      enableRotate={false}
      minZoom={38}
      maxZoom={72}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 3}
      makeDefault
    />
  );
}

function MoonSlab() {
  return (
    <mesh position={[0, -0.5, 0]} receiveShadow>
      <boxGeometry args={[9, 0.7, 7]} />
      <meshStandardMaterial color="#B9B4D6" flatShading />
    </mesh>
  );
}

function Craters() {
  const craters = Array.from({ length: 30 }, (_, index) => {
    const x = ((index * 37) % 80) / 10 - 4;
    const z = ((index * 53) % 60) / 10 - 3;
    const scale = 0.08 + ((index * 17) % 12) / 100;
    return [x, -0.12, z, scale] as const;
  });

  return (
    <group>
      {craters.map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
          <torusGeometry args={[1, 0.25, 6, 8]} />
          <meshStandardMaterial color="#8A84B3" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function TestBuilding() {
  return (
    <mesh position={[0, 0.45, 0]} castShadow>
      <cylinderGeometry args={[0.8, 1, 1.4, 8]} />
      <meshStandardMaterial color="#FFB86B" flatShading />
    </mesh>
  );
}

export function MoonDiorama() {
  return (
    <>
      <color attach="background" args={['#1B1646']} />
      <hemisphereLight args={['#D8D3F0', '#2A2358', 1.5]} />
      <directionalLight position={[5, 8, 4]} intensity={2} />
      <CameraRig />
      <MoonSlab />
      <Craters />
      <TestBuilding />
    </>
  );
}
