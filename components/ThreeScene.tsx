
'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';

// Augment the global JSX namespace to include React Three Fiber intrinsic elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Allow any custom elements for React Three Fiber
      [elemName: string]: any;
    }
  }
}

interface ThreeSceneProps {
  geometryType: 'cube' | 'sphere' | 'torus' | 'icosahedron';
  modelUrl?: string;
}

const GeometryMesh: React.FC<{ type: string }> = ({ type }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += delta * 0.05;
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  let geometry;
  switch (type) {
    case 'sphere': geometry = <sphereGeometry args={[1.4, 32, 32]} />; break;
    case 'torus': geometry = <torusGeometry args={[1.1, 0.35, 16, 50]} />; break;
    case 'icosahedron': geometry = <icosahedronGeometry args={[1.6, 0]} />; break;
    case 'cube':
    default: geometry = <boxGeometry args={[1.8, 1.8, 1.8]} />; break;
  }

  return (
    <group ref={groupRef}>
      <mesh>
        {geometry}
        <meshBasicMaterial color="#F766AE" wireframe transparent opacity={0.5} />
      </mesh>
      <mesh scale={[0.98, 0.98, 0.98]}>
         {geometry}
         <meshStandardMaterial color="#F766AE" roughness={0.0} metalness={0.0} />
      </mesh>
    </group>
  );
};

const ModelLoader: React.FC<{ url: string }> = ({ url }) => {
    const { scene } = useGLTF(url);
    // Removed manual scale so Bounds can handle sizing
    return <primitive object={scene} />;
};

export const ThreeScene: React.FC<ThreeSceneProps> = ({ geometryType, modelUrl }) => {
  return (
    <div 
      className="absolute inset-0 bg-[#FAFAF7] overflow-hidden"
      style={{ margin: 0, padding: 0 }}
      onPointerDown={(e) => {
          if (e.button !== 1 && e.button !== 2) {
             e.stopPropagation();
          }
      }} 
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#FAFAF7] via-transparent to-transparent z-10 opacity-20" />
      
      <Canvas 
        style={{ 
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          display: 'block'
        }}
        gl={{ alpha: true, antialias: true }} 
        resize={{ debounce: 0 }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        {/* makeDefault ensures OrbitControls works with Bounds */}
        <OrbitControls makeDefault enableZoom={true} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI * 0.75} />
        
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#e0e0e0" />
        
        <Bounds fit clip observe margin={1.5}>
          {modelUrl ? (
              <React.Suspense fallback={<GeometryMesh type={geometryType} />}>
                  <ModelLoader url={modelUrl} />
              </React.Suspense>
          ) : (
              <GeometryMesh type={geometryType} />
          )}
        </Bounds>
        
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};
