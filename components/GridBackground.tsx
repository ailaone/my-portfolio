import React from 'react';
import { Position } from '@/types/content';

interface GridBackgroundProps {
  pan: Position;
  zoom: number;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ pan, zoom }) => {
  const spacing = 50 * zoom;
  const offsetX = pan.x % spacing;
  const offsetY = pan.y % spacing;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-0 bg-[#FAFAF7]"
      style={{ overflow: 'hidden' }}
    >
      <svg className="w-full h-full opacity-20">
        <defs>
          <pattern
            id="cross-grid"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
            x={offsetX}
            y={offsetY}
          >
            <path d={`M ${spacing/2 - 2} ${spacing/2} h 4 M ${spacing/2} ${spacing/2 - 2} v 4`} stroke="black" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cross-grid)" />
      </svg>
    </div>
  );
};
