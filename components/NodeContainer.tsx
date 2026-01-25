
import React from 'react';
import { NodeState } from '@/types/content';

interface NodeContainerProps {
  node: NodeState;
  isSelected: boolean;
  connectedSockets: Set<string>;
  hoveredSocket: { nodeId: string, socketId: string } | null;
  isDragInvalid: boolean;
  onHeaderDown: (e: React.PointerEvent, id: string) => void;
  onSocketDown: (e: React.PointerEvent, nodeId: string, socketId: string, isInput: boolean) => void;
  onSocketUp: (e: React.PointerEvent, nodeId: string, socketId: string, isInput: boolean) => void;
  onSocketHover: (nodeId: string, socketId: string, isInput: boolean, isHovering: boolean) => void;
  onSocketContextMenu: (e: React.MouseEvent, nodeId: string, socketId: string) => void;
  onSocketDoubleClick: (e: React.MouseEvent, nodeId: string, socketId: string) => void;
  onResizeDown: (e: React.PointerEvent, nodeId: string) => void;
  children: React.ReactNode;
}

export const NodeContainer: React.FC<NodeContainerProps> = ({
  node,
  isSelected,
  connectedSockets,
  hoveredSocket,
  isDragInvalid,
  onHeaderDown,
  onSocketDown,
  onSocketUp,
  onSocketHover,
  onSocketContextMenu,
  onSocketDoubleClick,
  onResizeDown,
  children,
}) => {
  
  const getSocketColor = (socketId: string, isInput: boolean) => {
    const isConnected = connectedSockets.has(socketId);
    const isHovered = hoveredSocket?.nodeId === node.id && hoveredSocket?.socketId === socketId;

    // If dragging an invalid wire to this socket
    if (isHovered && isDragInvalid) {
      return "border-2" ;
    }
    // If dragging a valid wire to this socket (snap preview)
    if (isHovered && !isDragInvalid) {
      return "scale-125 border-2 socket-glow";
    }
    // Standard connected state
    if (isConnected) {
      return "socket-glow border-2";
    }
    // Default empty state
    return "border-2";
  };

  const stride = node.socketStride || 40;
  // Calculate offset to center socket in the stride row.
  // Formula: index * stride + (stride/2 - 20). 
  // 20 comes from (40px container top + 12px socket center) - 32px header = 20px offset relative to stride center if header=32.
  const getSocketTop = (index: number) => `${index * stride + (stride / 2 - 20)}px`;

  return (
    <div
      className={`absolute flex flex-col bg-node border shadow-editorial rounded-[2px] node-container ${
        isSelected ? 'border-primary z-20 shadow-hover' : 'border-secondary z-10 hover:border-[var(--hover-border)]'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        height: node.height ? node.height : 'auto',
        transformOrigin: '0 0',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}
      onPointerDown={(e) => {
         // Stop propagation only for Left click (0).
         // Allow Middle (1) and Right (2) Click to bubble to CanvasExperience for panning.
         if (e.button !== 1 && e.button !== 2) {
            e.stopPropagation();
         }
      }}
    >
      {/* Header */}
      <div
        className="h-[32px] flex items-center justify-between px-3 pt-1 border-b border-tertiary cursor-grab active:cursor-grabbing select-none bg-node node-header transition-colors duration-300"
        onPointerDown={(e) => onHeaderDown(e, node.id)}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className={`w-1.5 h-1.5 rounded-full border border-secondary transition-colors duration-300 ${isSelected ? 'bg-primary' : 'bg-transparent'}`} />
          <span className="text-[9px] font-sans font-medium tracking-[0.2em] uppercase text-primary transition-colors duration-300">
            {node.title}
          </span>
        </div>
        <div className="flex gap-[2px] opacity-20 pointer-events-none">
           <div className="w-[2px] h-[2px] bg-primary rounded-full transition-colors duration-300"></div>
           <div className="w-[2px] h-[2px] bg-primary rounded-full transition-colors duration-300"></div>
           <div className="w-[2px] h-[2px] bg-primary rounded-full transition-colors duration-300"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-node cursor-default transition-colors duration-300">
         {children}
      </div>

      {/* Resize */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 z-50 opacity-50 hover:opacity-100 transition-opacity duration-200"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onResizeDown(e, node.id); }}
      >
         <div className="w-1.5 h-1.5 border-r border-b border-primary mb-1 mr-1 transition-colors duration-300"></div>
      </div>

      {/* Inputs */}
      <div className="absolute top-[40px] -left-[12px] w-6 z-30">
        {node.inputs.map((input, index) => {
          const isConnected = connectedSockets.has(input.id);
          return (
            <div 
              key={input.id} 
              className="absolute left-0 flex items-center group w-6 h-6"
              style={{ top: getSocketTop(index) }}
            >
              <div 
                className="w-6 h-6 flex items-center justify-center cursor-crosshair relative"
                onPointerDown={(e) => onSocketDown(e, node.id, input.id, true)}
                onPointerUp={(e) => onSocketUp(e, node.id, input.id, true)}
                onPointerEnter={() => onSocketHover(node.id, input.id, true, true)}
                onPointerLeave={() => onSocketHover(node.id, input.id, true, false)}
                onContextMenu={(e) => onSocketContextMenu(e, node.id, input.id)}
                onDoubleClick={(e) => onSocketDoubleClick(e, node.id, input.id)}
              >
                 <div className="relative w-[10px] h-[10px]">
                    {isConnected && (
                        <div className="absolute inset-0 rounded-full animate-pulse-ring opacity-75 pointer-events-none" style={{ backgroundColor: 'var(--socket-hover-valid)' }} />
                    )}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-200 ${getSocketColor(input.id, true)}`}
                      style={{
                        backgroundColor: isConnected ? 'var(--socket-connected)' : (hoveredSocket?.nodeId === node.id && hoveredSocket?.socketId === input.id && isDragInvalid) ? 'var(--socket-hover-invalid)' : (hoveredSocket?.nodeId === node.id && hoveredSocket?.socketId === input.id) ? 'var(--socket-hover-valid)' : 'var(--socket-empty)',
                        borderColor: isConnected ? 'var(--socket-connected-dark)' : 'var(--border-primary)'
                      }}
                    />
                 </div>
              </div>
              <span className="absolute left-5 text-[9px] font-sans tracking-wider text-primary bg-node px-1 border border-tertiary opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-300 shadow-sm z-40">
                {input.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Outputs */}
      <div className="absolute top-[40px] -right-[12px] w-6 z-30">
        {node.outputs.map((output, index) => {
          const isConnected = connectedSockets.has(output.id);
          return (
            <div 
              key={output.id} 
              className="absolute right-0 flex items-center justify-end group w-6 h-6"
              style={{ top: getSocketTop(index) }}
            >
               <span className="absolute right-5 text-[9px] font-sans tracking-wider text-primary bg-node px-1 border border-tertiary opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all duration-300 shadow-sm z-40">
                {output.label}
              </span>
              <div 
                 className="w-6 h-6 flex items-center justify-center cursor-crosshair relative"
                 onPointerDown={(e) => onSocketDown(e, node.id, output.id, false)}
                 onPointerUp={(e) => onSocketUp(e, node.id, output.id, false)}
                 onPointerEnter={() => onSocketHover(node.id, output.id, false, true)}
                 onPointerLeave={() => onSocketHover(node.id, output.id, false, false)}
                 onContextMenu={(e) => onSocketContextMenu(e, node.id, output.id)}
                 onDoubleClick={(e) => onSocketDoubleClick(e, node.id, output.id)}
              >
                 <div className="relative w-[10px] h-[10px]">
                    {isConnected && (
                        <div className="absolute inset-0 rounded-full animate-pulse-ring opacity-75 pointer-events-none" style={{ backgroundColor: 'var(--socket-hover-valid)' }} />
                    )}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-200 ${getSocketColor(output.id, false)}`}
                      style={{
                        backgroundColor: isConnected ? 'var(--socket-connected)' : (hoveredSocket?.nodeId === node.id && hoveredSocket?.socketId === output.id && isDragInvalid) ? 'var(--socket-hover-invalid)' : (hoveredSocket?.nodeId === node.id && hoveredSocket?.socketId === output.id) ? 'var(--socket-hover-valid)' : 'var(--socket-empty)',
                        borderColor: isConnected ? 'var(--socket-connected-dark)' : 'var(--border-primary)'
                      }}
                    />
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
