'use client';

import { Linkedin, Github, Instagram, Youtube } from 'lucide-react';
import { NewTwitterIcon } from 'hugeicons-react';

interface IntroScreenProps {
  onStartClick: () => void;
}

export default function IntroScreen({ onStartClick }: IntroScreenProps) {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ backgroundColor: '#FAFAF7' }}>
      {/* Main content container - positioned relative to center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto w-full px-8">
        {/* Name with HEADER node styling */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-center whitespace-nowrap mb-4" style={{ color: '#000000' }}>
          ARTHUR<span className="italic font-light">AZOULAI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs font-sans tracking-widest uppercase text-center" style={{ color: '#6b7280' }}>
          Creative Technologist / Computational Designer
        </p>

        {/* EXPLORE WORK button */}
        <button
          onClick={onStartClick}
          className="my-8 text-lg md:text-xl font-serif italic px-8 py-3 border hover:scale-105 focus:outline-none whitespace-nowrap transition-all duration-200"
          style={{
            color: '#000000',
            borderColor: '#000000'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          EXPLORE WORK
        </button>

        {/* Desktop recommendation */}
        <p className="text-xs" style={{ color: '#9ca3af' }}>
          Best experienced on desktop
        </p>
      </div>

      {/* Footer - Social icons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 pointer-events-auto">
        <a
          href="https://www.linkedin.com/in/arthurazoulai/"
          className="transition-all duration-200 hover:scale-110"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          target="_blank"
          rel="noreferrer"
        >
          <Linkedin strokeWidth={1.5} size={24} />
        </a>
        <a
          href="https://github.com/ailaone"
          className="transition-all duration-200 hover:scale-110"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          target="_blank"
          rel="noreferrer"
        >
          <Github strokeWidth={1.5} size={24} />
        </a>
        <a
          href="https://www.instagram.com/arthurazoulai/"
          className="transition-all duration-200 hover:scale-110"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          target="_blank"
          rel="noreferrer"
        >
          <Instagram strokeWidth={1.5} size={24} />
        </a>
        <a
          href="https://x.com/arthurazoulai"
          className="transition-all duration-200 hover:scale-110"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          target="_blank"
          rel="noreferrer"
        >
          <NewTwitterIcon strokeWidth={1.5} size={24} />
        </a>
        <a
          href="https://www.youtube.com/@slicelab3819"
          className="transition-all duration-200 hover:scale-110"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          target="_blank"
          rel="noreferrer"
        >
          <Youtube strokeWidth={1.5} size={24} />
        </a>
      </div>
    </div>
  );
}
