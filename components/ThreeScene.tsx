
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { MousePointer2, Move, ZoomIn, Hand } from 'lucide-react';

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

// Error fallback mesh shown when model fails to load
const ErrorFallback: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff4444" wireframe />
    </mesh>
  );
};

// Process GLB scene: remove non-mesh objects and center at origin
function processScene(scene: THREE.Group): THREE.Group {
  // Clone scene to avoid mutating cached version
  const clonedScene = scene.clone(true);

  // Remove non-mesh objects (cameras, lights, helpers)
  const toRemove: THREE.Object3D[] = [];
  clonedScene.traverse((child) => {
    const type = child.type;
    if (type.includes('Camera') || type.includes('Light') || type.includes('Helper')) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(obj => obj.parent?.remove(obj));

  // Force update all matrices
  clonedScene.updateMatrixWorld(true);

  // Compute bounding box for all geometries
  clonedScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }
    }
  });

  // Calculate bounding box and center at origin
  const box = new THREE.Box3().setFromObject(clonedScene);
  const center = box.getCenter(new THREE.Vector3());
  clonedScene.position.set(-center.x, -center.y, -center.z);

  return clonedScene;
}

const ModelLoader: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);

  // Process scene only once per URL
  const processedScene = React.useMemo(() => {
    const processed = processScene(scene);

    // Log for debugging (only once)
    const box = new THREE.Box3().setFromObject(processed);
    const size = box.getSize(new THREE.Vector3());
    console.log('Model processed:', {
      url: url.split('/').pop(),
      size: size.toArray(),
      maxDim: Math.max(size.x, size.y, size.z)
    });

    return processed;
  }, [scene, url]);

  // Clear cache on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  return <primitive object={processedScene} />;
};

// Custom OrbitControls component that handles trackpad rotation
const CustomOrbitControls: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      // ALWAYS prevent default
      e.preventDefault();
      e.stopPropagation();

      if (!controlsRef.current) return;

      // Detect if this is mouse wheel or trackpad
      // Mouse wheel: only deltaY, no deltaX, larger values
      // Trackpad: both deltaX and deltaY, smaller continuous values
      const isMouseWheel = Math.abs(e.deltaX) < 1 && Math.abs(e.deltaY) > 0;
      const hasModifier = e.altKey || e.metaKey || e.ctrlKey;

      // Zoom function
      const doZoom = () => {
        const zoomSpeed = 0.002;
        const delta = e.deltaY;
        const distance = controlsRef.current.object.position.distanceTo(controlsRef.current.target);
        const newDistance = distance + delta * zoomSpeed * distance;

        // Apply zoom by moving camera
        const direction = new THREE.Vector3()
          .subVectors(controlsRef.current.object.position, controlsRef.current.target)
          .normalize()
          .multiplyScalar(newDistance);

        controlsRef.current.object.position.copy(
          new THREE.Vector3().addVectors(controlsRef.current.target, direction)
        );
        controlsRef.current.update();
      };

      // Rotate function
      const doRotate = () => {
        const rotateSpeed = 0.003;

        // Rotate horizontally (azimuth)
        controlsRef.current.azimuthalAngle -= e.deltaX * rotateSpeed;

        // Rotate vertically (polar)
        const polarAngle = controlsRef.current.polarAngle - e.deltaY * rotateSpeed;
        controlsRef.current.polarAngle = Math.max(
          Math.PI / 4,
          Math.min(Math.PI * 0.75, polarAngle)
        );

        controlsRef.current.update();
      };

      // Decision logic:
      // 1. Mouse wheel → always zoom
      // 2. Trackpad + modifier → zoom
      // 3. Trackpad (no modifier) → rotate
      if (isMouseWheel) {
        doZoom();
      } else if (hasModifier) {
        doZoom();
      } else {
        doRotate();
      }
    };

    const domElement = gl.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      domElement.removeEventListener('wheel', handleWheel);
    };
  }, [gl]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false}  // Disable built-in zoom
      enablePan={true}
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.5}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 0.75}
      mouseButtons={{
        LEFT: null,                // Disable left click
        MIDDLE: THREE.MOUSE.PAN,   // Middle click = pan
        RIGHT: THREE.MOUSE.ROTATE  // Right click = orbit
      }}
    />
  );
};

export const ThreeScene: React.FC<ThreeSceneProps> = ({ geometryType, modelUrl }) => {
  const [isMac, setIsMac] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    // Auto-focus container so wheel events work immediately
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handle wheel events at container level for trackpad support
  const handleContainerWheel = (e: React.WheelEvent) => {
    // Don't stop propagation - let it reach the canvas
    // This allows trackpad swipes to work without clicking first
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#FAFAF7] overflow-hidden outline-none"
      style={{ margin: 0, padding: 0 }}
      tabIndex={0}
      onPointerDown={(e) => {
          // Stop propagation for all mouse buttons to prevent canvas pan interference
          e.stopPropagation();
      }}
      onWheel={handleContainerWheel}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#FAFAF7] via-transparent to-transparent z-10 opacity-20" />

      {/* Instructions - Bottom Left */}
      <div className="absolute bottom-3 left-3 text-[8px] font-mono text-secondary uppercase tracking-wider pointer-events-none z-20 transition-colors duration-300 space-y-1.5 opacity-60">
        {/* Mouse Controls */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <MousePointer2 size={10} strokeWidth={1.5} />
            <span>Right-Click: Orbit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Move size={10} strokeWidth={1.5} />
            <span>Middle-Click: Pan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ZoomIn size={10} strokeWidth={1.5} />
            <span>Scroll: Zoom</span>
          </div>
        </div>

        {/* Trackpad Controls */}
        <div className="border-t border-tertiary/30 pt-1.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <Hand size={10} strokeWidth={1.5} />
            <span>Trackpad: Orbit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ZoomIn size={10} strokeWidth={1.5} />
            <span>{isMac ? '⌘' : 'Alt'}+Swipe: Zoom</span>
          </div>
        </div>
      </div>

      <Canvas
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{ alpha: true, antialias: true }}
        resize={{ debounce: 0 }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <CustomOrbitControls />

        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#e0e0e0" />

        {/* Bounds with fit auto-centers and zooms to model regardless of scale */}
        {modelUrl ? (
          <Bounds fit margin={1.8}>
            <React.Suspense key={modelUrl} fallback={<GeometryMesh type={geometryType} />}>
              <ModelLoader url={modelUrl} />
            </React.Suspense>
          </Bounds>
        ) : (
          <Bounds fit margin={1.8}>
            <GeometryMesh type={geometryType} />
          </Bounds>
        )}

        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};
