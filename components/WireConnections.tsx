
import React from 'react';
import { Connection, NodeState, Position } from '@/types/content';

interface WireConnectionsProps {
  connections: Connection[];
  nodes: NodeState[];
  tempConnection: { start: Position; end: Position } | null;
  selectedWireId: string | null;
  onSelectWire: (id: string) => void;
  isTempInvalid?: boolean;
}

export const WireConnections: React.FC<WireConnectionsProps> = ({ 
  connections, 
  nodes, 
  tempConnection, 
  selectedWireId, 
  onSelectWire,
  isTempInvalid
}) => {
  
  const getSocketPosition = (nodeId: string, socketId: string, isInput: boolean): Position | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const socketIndex = isInput 
        ? node.inputs.findIndex(i => i.id === socketId)
        : node.outputs.findIndex(o => o.id === socketId);
    
    if (socketIndex === -1) return null;

    // Match logic in NodeContainer / CanvasExperience
    // Header is 32px. Stride starts there. Sockets centered in stride.
    const stride = node.socketStride || 40;
    const yOffset = 32 + (socketIndex * stride) + (stride / 2);
    const xOffset = isInput ? 0 : node.width; 

    return {
      x: node.position.x + xOffset,
      y: node.position.y + yOffset
    };
  };

  const renderPath = (start: Position, end: Position, id?: string, isTemp: boolean = false, isSelected: boolean = false, isInvalid: boolean = false) => {
    const dist = Math.abs(end.x - start.x);
    const controlPointOffset = Math.max(dist * 0.5, 50);

    const path = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;

    const strokeColor = isInvalid ? "var(--socket-hover-invalid)" : (isSelected ? "var(--wire-selected)" : (isTemp ? "var(--wire-temp)" : "var(--wire-color)"));
    const strokeWidth = isSelected ? "2" : (isTemp ? "1.5" : "1");

    return (
      <g key={id}>
         {/* Invisible Hit Area for Easier Selection */}
         {!isTemp && (
           <path 
            d={path} 
            stroke="transparent" 
            strokeWidth="12"
            fill="none"
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (id) onSelectWire(id);
            }}
           />
         )}
         {/* Visible Path */}
         <path
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isTemp && !isInvalid ? "4,4" : "none"}
            fill="none"
            className="pointer-events-none transition-colors duration-200 wire-path"
          />
      </g>
    );
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {connections.map(conn => {
        const start = getSocketPosition(conn.fromNodeId, conn.fromSocketId, false);
        const end = getSocketPosition(conn.toNodeId, conn.toSocketId, true);
        if (!start || !end) return null;
        return renderPath(start, end, conn.id, false, selectedWireId === conn.id, false);
      })}

      {tempConnection && (
         renderPath(tempConnection.start, tempConnection.end, undefined, true, false, isTempInvalid)
      )}
    </svg>
  );
};
