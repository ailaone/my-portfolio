'use client';

import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { ProjectData } from '@/types/content';

interface AssetPreloaderProps {
  projects: ProjectData[];
  showDebug?: boolean; // Optional debug overlay
}

export const AssetPreloader: React.FC<AssetPreloaderProps> = ({ projects, showDebug = false }) => {
  const [stats, setStats] = useState({
    imagesLoaded: 0,
    modelsLoaded: 0,
    totalImages: 0,
    totalModels: 0,
    isComplete: false
  });

  useEffect(() => {
    // Gather all image URLs
    const imageUrls = projects.flatMap(p => {
      const urls: string[] = [];
      if (p.heroImageUrl) urls.push(p.heroImageUrl);
      if (p.galleryUrls) urls.push(...p.galleryUrls);
      return urls;
    });

    // Gather all 3D model URLs
    const modelUrls = projects
      .filter(p => p.modelUrl)
      .map(p => p.modelUrl!);

    const totalImages = imageUrls.length;
    const totalModels = modelUrls.length;

    let loadedImages = 0;
    let loadedModels = 0;

    const updateStats = () => {
      const isComplete = loadedImages >= totalImages && loadedModels >= totalModels;
      setStats({
        imagesLoaded: loadedImages,
        modelsLoaded: loadedModels,
        totalImages,
        totalModels,
        isComplete
      });
      if (isComplete) {
        console.log('✅ All assets preloaded');
      }
    };

    // Preload images using browser Image API (populates browser cache)
    imageUrls.forEach(url => {
      const img = new Image();
      img.onload = () => {
        loadedImages++;
        updateStats();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        loadedImages++;
        updateStats();
      };
      img.src = url;
    });

    // Preload 3D models using GLTFLoader (populates THREE.js cache)
    modelUrls.forEach(url => {
      useGLTF.preload(url);
      loadedModels++;
      updateStats();
    });

    console.log(`🚀 Preloading ${totalImages} images, ${totalModels} 3D models`);

    // Cleanup - cache persists intentionally
    return () => {
      // Keep cache for instant loading
    };
  }, [projects]);

  // Optional debug overlay (hidden by default)
  if (showDebug && !stats.isComplete) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded font-mono z-50 pointer-events-none">
        <div>Preloading assets...</div>
        <div>Images: {stats.imagesLoaded}/{stats.totalImages}</div>
        <div>Models: {stats.modelsLoaded}/{stats.totalModels}</div>
      </div>
    );
  }

  return null;
};
