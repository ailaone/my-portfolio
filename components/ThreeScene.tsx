
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Bounds } from '@react-three/drei';
import * as THREE from 'three';
import { MousePointer2, Move, ZoomIn, Hand, RotateCcw } from 'lucide-react';
import { Material3D, Lighting3D } from '@/types/content';

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
  material?: Material3D;
  lighting?: Lighting3D;
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

// Process GLB scene: remove non-mesh objects, apply materials, and center at origin
function processScene(scene: THREE.Group, materialOverride?: Material3D): THREE.Group {
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

  // Compute bounding box and apply material overrides
  clonedScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }

      // Apply material overrides if provided
      if (materialOverride && mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (materialOverride.color !== undefined) {
          mat.color = new THREE.Color(materialOverride.color);
        }
        if (materialOverride.metalness !== undefined) {
          mat.metalness = materialOverride.metalness;
        }
        if (materialOverride.roughness !== undefined) {
          mat.roughness = materialOverride.roughness;
        }
        if (materialOverride.emissive !== undefined) {
          mat.emissive = new THREE.Color(materialOverride.emissive);
        }
        if (materialOverride.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = materialOverride.emissiveIntensity;
        }
        if (materialOverride.opacity !== undefined) {
          mat.opacity = materialOverride.opacity;
          mat.transparent = materialOverride.opacity < 1;
        }

        mat.needsUpdate = true;
      }

      // Add wireframe overlay if enabled
      if (materialOverride?.wireframe && mesh.geometry) {
        const wireframeOpacity = materialOverride.wireframeOpacity ?? 0.1;
        const wireframeColor = materialOverride.wireframeColor ?? '#000000';

        // Create edges geometry (shows only significant edges, not all triangles)
        const edges = new THREE.EdgesGeometry(mesh.geometry, 30); // 30 degree threshold
        const lineMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(wireframeColor),
          transparent: true,
          opacity: wireframeOpacity,
          depthTest: true,
          depthWrite: false,
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);

        // Add wireframe as child of the mesh (inherits transforms)
        mesh.add(wireframe);
      }
    }
  });

  // Calculate bounding box and center at origin
  const box = new THREE.Box3().setFromObject(clonedScene);
  const center = box.getCenter(new THREE.Vector3());
  clonedScene.position.set(-center.x, -center.y, -center.z);

  return clonedScene;
}

const ModelLoader: React.FC<{ url: string; material?: Material3D }> = ({ url, material }) => {
  const { scene } = useGLTF(url);

  // Process scene synchronously with useMemo (Bounds needs this immediately)
  const processedScene = React.useMemo(() => {
    const processed = processScene(scene, material);

    // Log for debugging
    const box = new THREE.Box3().setFromObject(processed);
    const size = box.getSize(new THREE.Vector3());
    console.log('Model processed:', {
      url: url.split('/').pop(),
      size: size.toArray(),
      maxDim: Math.max(size.x, size.y, size.z)
    });

    return processed;
  }, [scene, url, material]);

  // Cleanup on unmount - dispose of resources but don't clear cache immediately
  useEffect(() => {
    return () => {
      // Dispose of geometries and materials to free GPU memory
      processedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          // Dispose wireframe if it exists
          const wireframe = mesh.children.find(c => c.type === 'LineSegments') as THREE.LineSegments;
          if (wireframe) {
            if (wireframe.geometry) wireframe.geometry.dispose();
            if (wireframe.material) {
              if (Array.isArray(wireframe.material)) {
                wireframe.material.forEach(mat => mat.dispose());
              } else {
                wireframe.material.dispose();
              }
            }
          }

          // Dispose main mesh
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    };
  }, [processedScene]);

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
        LEFT: THREE.MOUSE.ROTATE,  // Left click = rotate (required, can't be null)
        MIDDLE: THREE.MOUSE.PAN,   // Middle click = pan
        RIGHT: THREE.MOUSE.ROTATE  // Right click = orbit
      }}
      enableRotate={true}
    />
  );
};

// Calculate text color based on background luminance
export function getContrastTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance > 0.5, background is light, use dark text
  // If luminance <= 0.5, background is dark, use light text
  return luminance > 0.5 ? '#333333' : '#e8e8e8';
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ geometryType, modelUrl, material, lighting }) => {
  const [isMac, setIsMac] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Apply lighting defaults
  const environmentPreset = lighting?.environment || 'studio';
  const exposure = lighting?.exposure || 1.0;
  const ambientIntensity = lighting?.ambientIntensity || 0.8;
  const backgroundColor = lighting?.backgroundColor || '#f0f0f0';
  const textColor = getContrastTextColor(backgroundColor);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    // Auto-focus container so wheel events work immediately
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handle WebGL context loss and restore
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost, attempting to restore...');
      setContextLost(true);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      setContextLost(false);
    };

    // Find the canvas element
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvasRef.current = canvas;
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, []);

  // Warn about multiple 3D viewers
  useEffect(() => {
    const canvasCount = document.querySelectorAll('canvas').length;
    if (canvasCount > 3) {
      console.warn(`${canvasCount} WebGL contexts active. Browser limit is typically 8-16. Consider closing unused 3D viewers to prevent context loss.`);
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
      <div className="absolute bottom-3 left-3 text-[8px] font-mono uppercase tracking-wider pointer-events-none z-20 transition-colors duration-300 space-y-1.5 opacity-60" style={{ color: textColor }}>
        {/* Mouse Controls */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <MousePointer2 size={10} strokeWidth={1.5} />
            <span>Click & Drag: Orbit</span>
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

      {/* Refresh Button - Top Right */}
      <button
        onClick={handleRefresh}
        className="absolute top-3 right-3 flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-wider z-20 transition-colors duration-300 opacity-60 hover:opacity-100 pointer-events-auto px-2 py-1.5 rounded border border-tertiary/30 bg-node/50 hover:bg-node/80"
        style={{ color: textColor, borderColor: `${textColor}30` }}
        title="Reset camera view"
      >
        <RotateCcw size={10} strokeWidth={1.5} />
        <span>Refresh</span>
      </button>

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-node/90">
          <div className="text-center">
            <div className="text-sm text-secondary mb-2">WebGL Context Lost</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs bg-primary text-white rounded hover:bg-primary/80"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      <Canvas
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          // Enable context loss detection - gl is THREE.WebGLRenderer
          const context = gl.getContext();
          const ext = context.getExtension('WEBGL_lose_context');
          if (ext) {
            console.log('WebGL context loss extension available');
          }

          // Apply tone mapping for exposure control
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = exposure;
        }}
        resize={{ debounce: 0 }}
      >
        <color attach="background" args={[backgroundColor]} />
        <PerspectiveCamera makeDefault position={[0, 0, 6]} near={0.00001} far={100000} />
        <CustomOrbitControls />

        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#e0e0e0" />

        {/* Bounds with fit auto-centers and zooms to model regardless of scale */}
        {modelUrl ? (
          <Bounds key={`${modelUrl}-${refreshKey}`} fit clip margin={2.0}>
            <React.Suspense fallback={null}>
              <ModelLoader url={modelUrl} material={material} />
            </React.Suspense>
          </Bounds>
        ) : (
          <Bounds key={refreshKey} fit margin={2.0}>
            <GeometryMesh type={geometryType} />
          </Bounds>
        )}

        <Environment preset={environmentPreset} />
      </Canvas>
    </div>
  );
};
