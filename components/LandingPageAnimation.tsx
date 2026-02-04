'use client';

import { useState, useEffect } from 'react';
import { ProjectData } from '@/types/content';
import CanvasExperience from '@/components/CanvasExperience';
import IntroScreen from '@/components/Landing/IntroScreen';

type AnimationPhase =
  | 'intro'       // Landing page with button
  | 'transitioning' // Blur/fade transition
  | 'complete';   // Canvas revealed

interface LandingPageAnimationProps {
  initialProjects: ProjectData[];
}

export default function LandingPageAnimation({ initialProjects }: LandingPageAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('intro');

  // DEBUG: Set to true to always play animation (ignoring session storage)
  const ALWAYS_PLAY_ANIMATION = true;

  // Check session storage, responsive behavior, and reduced motion on mount
  useEffect(() => {
    // Check if animation has already played this session
    const hasPlayed = !ALWAYS_PLAY_ANIMATION && sessionStorage.getItem('portfolio-landing-played') === 'true';
    if (hasPlayed) {
      setPhase('complete');
      return;
    }

    // Skip on mobile (< 1280px)
    const isDesktop = window.innerWidth >= 1280;
    if (!isDesktop) {
      setPhase('complete');
      sessionStorage.setItem('portfolio-landing-played', 'true');
      return;
    }

    // Skip for users who prefer reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setPhase('complete');
      sessionStorage.setItem('portfolio-landing-played', 'true');
      return;
    }
  }, []);

  // Handle START HERE click - begin blur/fade transition
  const handleStartClick = () => {
    setPhase('transitioning');
    // Complete transition after 1 second
    setTimeout(() => {
      setPhase('complete');
      sessionStorage.setItem('portfolio-landing-played', 'true');
    }, 1000);
  };

  // ESC key to skip animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'complete') {
        setPhase('complete');
        sessionStorage.setItem('portfolio-landing-played', 'true');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  return (
    <div className="fixed inset-0">
      {/* Canvas - blurs in and fades in during transition */}
      <div
        className="transition-all duration-1000 ease-out"
        style={{
          opacity: phase === 'complete' ? 1 : 0,
          filter: phase === 'complete' ? 'blur(0px)' : 'blur(20px)',
          pointerEvents: phase === 'complete' ? 'auto' : 'none'
        }}
      >
        <CanvasExperience initialProjects={initialProjects} />
      </div>

      {/* Landing page - blurs out and fades out during transition */}
      {phase !== 'complete' && (
        <div
          className="absolute inset-0 z-50 transition-all duration-1000 ease-out"
          style={{
            opacity: phase === 'intro' ? 1 : 0,
            filter: phase === 'intro' ? 'blur(0px)' : 'blur(20px)',
            pointerEvents: phase === 'intro' ? 'auto' : 'none'
          }}
        >
          <IntroScreen onStartClick={handleStartClick} />
        </div>
      )}
    </div>
  );
}
