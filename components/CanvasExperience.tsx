
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowUpRight, Layers, RefreshCw, MousePointer2,
  Box, FileText, Image as ImageIcon, BarChart, Activity, List, Mail, GripHorizontal, Zap,
  ChevronLeft, ChevronRight, Trash2, Briefcase, Share2, Maximize, X, Video, Palette
} from 'lucide-react';
import { ProjectData, JobData, NodeState, Position, NodeType, Connection, DragMode } from '@/types/content';
import { GridBackground } from './GridBackground';
import { NodeContainer } from './NodeContainer';
import { WireConnections } from './WireConnections';
import { VisualNodeContent } from './Nodes/VisualNodes';
import { useTheme } from '@/lib/ThemeContext';

const CV_DATA: JobData[] = [
  {
    id: 'slice',
    role: 'Co-Founder',
    company: 'Slicelab',
    year: '2012-Present',
    description: 'Design studio specializing in DfAM consulting and computational design.',
    details: [
      'Led fabrication consulting across dramatically different domains: 3D-printed jewelry, sports protective padding, architectural components, and product design.',
      'Bridged design ambition and manufacturing reality for clients, focusing on additive manufacturing feasibility, budget constraints, and timeline coordination.',
      'Developed custom Grasshopper workflows and cross-platform tools for geometry transfer between software systems.',
      'Ongoing client: Freeform Sports (protective padding design using advanced AM techniques).'
    ],
  },
  {
    id: 'rg', role: 'Senior Associate', company: 'Rockwell Group', year: '2015-Present',
    description: 'Led design, coordination, and delivery of large-scale hospitality projects.',
    details: ['Managed ground-up and interior projects including restaurants, private residences, airport venues, and more.',
      'Coordinated multidisciplinary teams from concept through construction.',
      'Oversaw complex Rhino to BIM documentation, interior design, and experiential design packages for high-profile clients.'],
  },
  {
    id: 'solo',
    role: 'Independent Development',
    company: 'Personal R&D',
    year: 'Ongoing',
    description: 'AI-augmented workflow experimentations. Teaching. Tool design.',
    details: [
      'Built iSnap: open-source macOS screenshot tool using Swift (99% AI-assisted development).',
      'Conducted AI tool research: ComfyUI for architectural design exploration, Midjourney for product visualization (Velox AI knitted sneaker project).',
      'Developed teaching materials integrating AI tools (Vizcom, generative workflows) for NYIT visualization course.',
      'Focus: exploring how deep tool mastery enables precise AI specification for rapid custom tool development.'
    ],
  },
  {
    id: 'fbs',
    role: 'Design Director',
    company: 'Francis Bitonti Studio',
    year: '2014–2015',
    description: 'Directed computational design for fashion, footwear, jewelry, and consumer products.',
    details: [
      'Led design of 3D printed fashion, footwear, and luxury accessories.',
      'Collaborated with United Nude, 3DSystems, Feetz, Stillnest, and Nanotronics.',
      'Developed advanced digital fabrication workflows for production-ready pieces.'
    ]
  },
  {
    id: 'jmf',
    role: 'Architectural Designer / 3D Modeling Director',
    company: 'Jakob + MacFarlane',
    year: '2011–2014',
    description: 'Produced architectural design and advanced 3D modeling for cultural and commercial buildings.',
    details: [
      'Led modeling for built projects such as Euronews HQ facade, Wanderlust, and Noisy Music & Dance Conservatory.',
      'Developed façade rationalization and parametric systems for complex geometries.',
      'Worked across concept design, documentation, and client presentations.'
    ]
  }
];

const TOOLBAR_ITEMS = [
  { type: NodeType.PROJECT_LIST, label: 'Project Index', icon: List },
  { type: NodeType.CV, label: 'Work Experience', icon: Briefcase },
  { type: NodeType.DETAILS, label: 'Details', icon: FileText },
  { type: NodeType.VIEWER_3D, label: '3D Viewer', icon: Box },
  { type: NodeType.IMAGE, label: 'Gallery', icon: ImageIcon },
  { type: NodeType.VIDEO, label: 'Video', icon: Video },
  { type: NodeType.CONTACT, label: 'Contact', icon: Mail },
];

// Helper function to get consistent title for a node type
const getNodeTitle = (nodeType: NodeType): string => {
  const toolbarItem = TOOLBAR_ITEMS.find(item => item.type === nodeType);
  if (toolbarItem) return toolbarItem.label;
  
  // Fallback for node types not in toolbar (HEADER, SOCIAL)
  switch (nodeType) {
    case NodeType.HEADER:
      return 'WhoIs';
    case NodeType.SOCIAL:
      return 'Social';
    default:
      return nodeType.toString();
  }
};

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

interface CanvasExperienceProps {
  initialProjects: ProjectData[];
}

export default function CanvasExperience({ initialProjects }: CanvasExperienceProps) {

  // --- Theme ---
  const { theme, cycleTheme } = useTheme();

  // --- Initialize State with Dynamic Props ---
  
  const getInitialNodes = (projects: ProjectData[]): NodeState[] => {
    const jobOutputs = CV_DATA.map(j => ({ id: `out-cv-${j.id}`, label: '' }));

    // Use 60px stride for lists to allow multi-line titles
    const socketStride = 60;
    const minContentHeight = 80; // Minimum height for empty state message
    const listHeight = 32 + minContentHeight;
    const cvHeight = 32 + (CV_DATA.length * socketStride);

    return [
      // COLUMN 1: LEFT STACK
      { id: 'n-header', type: NodeType.HEADER, position: { x: 50, y: 50 }, title: 'WhoIs', inputs: [], outputs: [], width: 350 },

      { id: 'n-social', type: NodeType.SOCIAL, position: { x: 50, y: 250 }, title: 'Social', inputs: [], outputs: [], width: 350 },

      {
        id: 'n-cv',
        type: NodeType.CV,
        position: { x: 50, y: 375 },
        title: 'Work Experience',
        inputs: [],
        outputs: jobOutputs,
        width: 350,
        height: cvHeight,
        socketStride: socketStride,
        data: {}
      },

      {
        id: 'n-list',
        type: NodeType.PROJECT_LIST,
        position: { x: 50, y: 390 + cvHeight + 10 }, // Positioned below CV
        title: 'Project Index',
        inputs: [{ id: 'in-filter', label: 'Filter by Job' }],
        outputs: [],
        width: 350,
        height: listHeight,
        socketStride: socketStride,
        data: { displayedProjects: [] }
      },

      // COLUMN 2: CENTER
      { id: 'n-details', type: NodeType.DETAILS, position: { x: 600, y: 350 }, title: 'Details', inputs: [{ id: 'in-select', label: 'Context' }], outputs: [{ id: 'out-meta', label: 'Metadata' }], width: 550 },
      
      // COLUMN 3: RIGHT
      { id: 'n-image', type: NodeType.IMAGE, position: { x: 1250, y: 250 }, title: 'Gallery', inputs: [{ id: 'in-img-data', label: 'Visual Data' }], outputs: [], width: 500, height: 400, data: { imageIndex: 0 } },
      
      { id: 'n-viewer', type: NodeType.VIEWER_3D, position: { x: 1250, y: 700 }, title: '3D Viewer', inputs: [{ id: 'in-geo', label: 'Geometry' }], outputs: [], width: 500, height: 400 },
    ];
  };

  const getInitialConnections = (projects: ProjectData[]): Connection[] => {
    const conns: Connection[] = [
      { id: 'c2', fromNodeId: 'n-details', fromSocketId: 'out-meta', toNodeId: 'n-image', toSocketId: 'in-img-data' },
      { id: 'c3', fromNodeId: 'n-details', fromSocketId: 'out-meta', toNodeId: 'n-viewer', toSocketId: 'in-geo' },
    ];

    // Connect solo developer CV item to Details
    if (CV_DATA.length > 0) {
        conns.push({ id: 'c1', fromNodeId: 'n-cv', fromSocketId: `out-cv-${CV_DATA[2].id}`, toNodeId: 'n-details', toSocketId: 'in-select' });
    }

    return conns;
  };

  // --- State ---
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.75);

  // Initialize state once
  const [nodes, setNodes] = useState<NodeState[]>(() => getInitialNodes(initialProjects));
  const [connections, setConnections] = useState<Connection[]>(() => getInitialConnections(initialProjects));

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [copiedData, setCopiedData] = useState<{ nodes: NodeState[], connections: Connection[] } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{
    gallery: string[];
    currentIndex: number;
    projectTitle: string;
  } | null>(null);
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  const copiedDataRef = useRef(copiedData);
  const shiftPressed = useRef(false);

  // Dragging State
  const [dragMode, setDragMode] = useState<DragMode>('NONE');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [initialDragState, setInitialDragState] = useState<{
    mousePos: Position;
    nodePos: Position;
    nodeSize: { w: number, h?: number };
  } | null>(null);

  // Wire Creation
  const [tempWireStart, setTempWireStart] = useState<{ nodeId: string, socketId: string, isInput: boolean } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [hoveredSocket, setHoveredSocket] = useState<{ nodeId: string, socketId: string, isInput: boolean } | null>(null);
  
  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string, socketId: string } | null>(null);

  // New Node Drag
  const [newNodeType, setNewNodeType] = useState<NodeType | null>(null);
  const [ghostNodePos, setGhostNodePos] = useState<Position>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // --- EFFECT: Dynamic Node Updates (Filtering Projects) ---
  useEffect(() => {
    // We need to check if any Project List nodes have an input connection.
    // If so, we must filter their contents and update their outputs/height.
    
    let nodesUpdated = false;
    const newNodes = nodes.map(node => {
        if (node.type !== NodeType.PROJECT_LIST) return node;

        // Check for incoming connection to 'in-filter'
        const filterConn = connections.find(c => c.toNodeId === node.id && c.toSocketId === 'in-filter');
        
        let displayedProjects: ProjectData[] = [];
        
        if (filterConn) {
          const fromNode = nodes.find(n => n.id === filterConn.fromNodeId);
          
          // CASE 1: Direct - CV → Project List
          if (fromNode && fromNode.type === NodeType.CV && filterConn.fromSocketId.startsWith('out-cv-')) {
              const jobId = filterConn.fromSocketId.replace('out-cv-', '');
              console.log('🔍 Direct CV, jobId:', jobId);
              displayedProjects = initialProjects.filter(p => p.jobId === jobId);
          } 
          // CASE 2: Upstream - CV → Details → Project List
          else if (fromNode && fromNode.type === NodeType.DETAILS) {
              // Trace back to find CV
              const detailsInputConn = connections.find(c => c.toNodeId === fromNode.id && c.toSocketId === 'in-select');
              if (detailsInputConn) {
                  const cvNode = nodes.find(n => n.id === detailsInputConn.fromNodeId);
                  if (cvNode && cvNode.type === NodeType.CV && detailsInputConn.fromSocketId.startsWith('out-cv-')) {
                      const jobId = detailsInputConn.fromSocketId.replace('out-cv-', '');
                      console.log('🔗 Upstream through Details, jobId:', jobId);
                      displayedProjects = initialProjects.filter(p => p.jobId === jobId);
                  } else {
                      displayedProjects = [];
                  }
              } else {
                  displayedProjects = [];
              }
          }
          else {
              displayedProjects = [];
          }

    } else {
      // No filter connected - show empty state
      displayedProjects = [];
  }

        // Compare with current state to avoid infinite loops
        const currentSlugs = (node.data?.displayedProjects || []).map((p: ProjectData) => p.slug).join(',');
        const newSlugs = displayedProjects.map(p => p.slug).join(',');

        if (currentSlugs !== newSlugs) {
            nodesUpdated = true;
            const socketStride = node.socketStride || 60;
            // Ensure minimum height when there are no projects (header + minimum content area)
            const minContentHeight = 80; // Minimum height for empty state message
            const calculatedHeight = displayedProjects.length * socketStride;
            const contentHeight = displayedProjects.length === 0 ? minContentHeight : calculatedHeight;
            return {
                ...node,
                height: 32 + contentHeight,
                outputs: displayedProjects.map(p => ({ id: `out-p-${p.slug}`, label: '' })),
                data: { ...node.data, displayedProjects }
            };
        }
        return node;
    });

    if (nodesUpdated) {
        setNodes(newNodes);
        // Clean up connections that point to non-existent project outputs
        // (This happens if we switch filters and the old project list disappears)
        const validOutputIds = new Set<string>();
        newNodes.forEach(n => n.outputs.forEach(o => validOutputIds.add(`${n.id}-${o.id}`)));
        
        // We only care about connections originating FROM the project list
        setConnections(prev => prev.filter(c => {
            const fromNode = newNodes.find(n => n.id === c.fromNodeId);
            if (fromNode?.type === NodeType.PROJECT_LIST) {
                // Check if this specific output still exists
                return validOutputIds.has(`${c.fromNodeId}-${c.fromSocketId}`);
            }
            return true;
        }));
    }

  }, [connections, initialProjects, nodes]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    copiedDataRef.current = copiedData;
  }, [copiedData]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Track shift key
      if (e.key === 'Shift') {
        shiftPressed.current = true;
      }

      // ESC key: Close fullscreen
      if (e.key === 'Escape' && fullscreenImage) {
        e.preventDefault();
        setFullscreenImage(null);
        return;
      }

      // Copy: Cmd/Ctrl + C (copy all selected nodes and their internal connections)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedNodeIds.size > 0) {
        e.preventDefault();
        const selectedIds = Array.from(selectedNodeIds);
        const nodesToCopy = nodesRef.current.filter(n => selectedIds.includes(n.id));

        // Find connections where BOTH nodes are in the selection
        const internalConnections = connectionsRef.current.filter(c =>
          selectedIds.includes(c.fromNodeId) && selectedIds.includes(c.toNodeId)
        );

        setCopiedData({ nodes: nodesToCopy, connections: internalConnections });
        console.log(`📋 Copied ${nodesToCopy.length} node(s) and ${internalConnections.length} connection(s)`);
        return;
      }

    // Paste: Cmd/Ctrl + V
    if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedDataRef.current) {
      e.preventDefault();

      const { nodes: copiedNodes, connections: copiedConnections } = copiedDataRef.current;

      // Create ID mapping from old IDs to new IDs
      const idMap = new Map<string, string>();
      const timestamp = Date.now();

      // Create new nodes with new IDs
      const newNodes: NodeState[] = copiedNodes.map((node, index) => {
        const newId = `n-${timestamp}-${index}`;
        idMap.set(node.id, newId);

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50
          },
          data: node.data ? { ...node.data } : undefined,
          inputs: node.inputs.map(i => ({ ...i })),
          outputs: node.outputs.map(o => ({ ...o }))
        };
      });

      // Create new connections with remapped IDs
      const newConnections: Connection[] = copiedConnections.map((conn, index) => ({
        ...conn,
        id: `c-${timestamp}-${index}`,
        fromNodeId: idMap.get(conn.fromNodeId)!,
        toNodeId: idMap.get(conn.toNodeId)!
      }));

      // Add to canvas
      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConnections]);

      // Select the newly pasted nodes
      const newNodeIds = new Set(newNodes.map(n => n.id));
      setSelectedNodeIds(newNodeIds);

      console.log(`📌 Pasted ${newNodes.length} node(s) and ${newConnections.length} connection(s)`);
      return;
    }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedWireId) {
          setConnections(prev => prev.filter(c => c.id !== selectedWireId));
          setSelectedWireId(null);
          setSelectedNodeIds(new Set());
        }
        else if (selectedNodeIds.size > 0) {
          // Delete all selected nodes
          const idsToDelete = Array.from(selectedNodeIds);
          setNodes(prev => prev.filter(n => !idsToDelete.includes(n.id)));
          setConnections(prev => prev.filter(c =>
            !idsToDelete.includes(c.fromNodeId) && !idsToDelete.includes(c.toNodeId)
          ));
          // Clear copied data if any deleted nodes were in the copied set
          setCopiedData(prev => {
            if (!prev) return null;
            const hasDeletedNode = prev.nodes.some(n => idsToDelete.includes(n.id));
            return hasDeletedNode ? null : prev;
          });
          setSelectedNodeIds(new Set());
          console.log(`🗑️ Deleted ${idsToDelete.length} node(s)`);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedWireId, selectedNodeIds, fullscreenImage]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // --- Helpers ---
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  };

  const handleNodeDataChange = (nodeId: string, newData: any) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
    ));
  };

  const handleSmartSwitch = (nodeId: string, socketId: string) => {
    // Find all connections FROM this node
    const outgoingConnections = connections.filter(c => c.fromNodeId === nodeId);

    // If no outgoing connections, do nothing
    if (outgoingConnections.length === 0) return;

    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;

    // Update all outgoing connections to use the new socketId
    setConnections(prev => prev.map(conn => {
      if (conn.fromNodeId === nodeId) {
        return { ...conn, fromSocketId: socketId };
      }
      return conn;
    }));

    // Special handling for CV nodes: cascade to project list and auto-select first project
    if (sourceNode.type === NodeType.CV) {
      // Find if this CV connects to a PROJECT_LIST via the filter input
      const cvToProjectListConn = outgoingConnections.find(c => c.toSocketId === 'in-filter');

      if (cvToProjectListConn) {
        const projectListNode = nodes.find(n => n.id === cvToProjectListConn.toNodeId);

        if (projectListNode && projectListNode.type === NodeType.PROJECT_LIST) {
          // Extract jobId from socketId (format: "out-cv-{jobId}")
          const jobId = socketId.replace('out-cv-', '');

          // Find projects with this jobId
          const filteredProjects = initialProjects.filter(p => p.jobId === jobId);

          if (filteredProjects.length > 0) {
            const firstProject = filteredProjects[0];
            const firstProjectSocketId = `out-p-${firstProject.slug}`;

            // Find if PROJECT_LIST connects to DETAILS
            const projectListConnections = connections.filter(c => c.fromNodeId === projectListNode.id);

            // Update PROJECT_LIST → DETAILS connection to use first project
            setConnections(prev => prev.map(conn => {
              if (conn.fromNodeId === projectListNode.id && conn.toSocketId === 'in-select') {
                return { ...conn, fromSocketId: firstProjectSocketId };
              }
              return conn;
            }));
          }
        }
      }
    }
  };

  const handleSpawnNode = (nodeType: NodeType, sourceNodeId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;

    // Position new node to the right of source node
    const newNodeX = sourceNode.position.x + sourceNode.width + 50;
    const newNodeY = sourceNode.position.y;

    const timestamp = Date.now();
    const newNodeId = `n-${timestamp}`;

    // Determine socket IDs based on node type
    let inputSocketId = 'in-1';
    let inputSocketLabel = 'Input';

    if (nodeType === NodeType.IMAGE) {
      inputSocketId = 'in-img-data';
      inputSocketLabel = 'Visual Data';
    } else if (nodeType === NodeType.VIEWER_3D) {
      inputSocketId = 'in-geo';
      inputSocketLabel = 'Geometry';
    }

    // Create new node
    const newNode: NodeState = {
      id: newNodeId,
      type: nodeType,
      position: { x: newNodeX, y: newNodeY },
      title: getNodeTitle(nodeType),
      inputs: [{ id: inputSocketId, label: inputSocketLabel }],
      outputs: [],
      width: 400,
      height: 300,
      data: nodeType === NodeType.IMAGE ? { imageIndex: 0 } : undefined
    };

    // Create connection from source output to new node input
    const newConnection: Connection = {
      id: `c-${timestamp}`,
      fromNodeId: sourceNodeId,
      fromSocketId: 'out-meta', // DETAILS node output socket
      toNodeId: newNodeId,
      toSocketId: inputSocketId
    };

    // Add node and connection to state
    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, newConnection]);
    setSelectedNodeIds(new Set([newNodeId]));

    console.log(`✨ Auto-spawned ${nodeType} node connected to ${sourceNodeId}`);
  };

  const checkConnectionValidity = (start: typeof tempWireStart, end: typeof hoveredSocket) => {
    if (!start || !end) return false;
    if (start.nodeId === end.nodeId) return false;
    if (start.isInput === end.isInput) return false;

    // Allow connection even if occupied (we will replace it)
    return true;
  };

  const isDragInvalid = tempWireStart && hoveredSocket && !checkConnectionValidity(tempWireStart, hoveredSocket);


  // --- Event Handlers ---

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.defaultPrevented) return;
    const target = e.target as Element;
    const isBackground = target === containerRef.current || 
                         target.id === 'canvas-transform-layer' || 
                         target.tagName === 'svg' || 
                         target.id.includes('background');
    
    const isPanButton = e.button === 1 || e.button === 2;

    if (isBackground || isPanButton) {
       // If dragging wire hit area (but not dragging it), treat as click
       if (!isPanButton && (e.button !== 0 || !isBackground)) {
          // If we clicked background with left mouse, deselect
          if (e.button === 0) {
             setSelectedWireId(null);
             setSelectedNodeIds(new Set());
          }
          return;
       }

       setDragMode('CANVAS_PAN');
       // Only clear selection if we are actually clicking background
       if (isBackground) {
           setSelectedWireId(null);
           setSelectedNodeIds(new Set());
       }
       
       (containerRef.current || target).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setMousePos(canvasPos);

    if (dragMode === 'CANVAS_PAN') {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    } else if (dragMode === 'NODE_DRAG' && draggedNodeId && initialDragState) {
      const deltaX = (e.clientX - initialDragState.mousePos.x) / zoom;
      const deltaY = (e.clientY - initialDragState.mousePos.y) / zoom;

      // If multiple nodes are selected, move all of them together
      if (selectedNodeIds.size > 1 && selectedNodeIds.has(draggedNodeId)) {
        setNodes(prev => prev.map(n => {
          if (selectedNodeIds.has(n.id)) {
            return { ...n, position: { x: n.position.x + deltaX, y: n.position.y + deltaY } };
          }
          return n;
        }));
        // Update initial drag state for next frame
        setInitialDragState(prev => prev ? {
          ...prev,
          mousePos: { x: e.clientX, y: e.clientY }
        } : null);
      } else {
        // Single node drag
        setNodes(prev => prev.map(n =>
          n.id === draggedNodeId
            ? { ...n, position: { x: initialDragState.nodePos.x + deltaX, y: initialDragState.nodePos.y + deltaY } }
            : n
        ));
      }
    } else if (dragMode === 'RESIZE_NODE' && draggedNodeId && initialDragState) {
       const deltaX = (e.clientX - initialDragState.mousePos.x) / zoom;
       const deltaY = (e.clientY - initialDragState.mousePos.y) / zoom;
       setNodes(prev => prev.map(n => 
        n.id === draggedNodeId
          ? { 
              ...n, 
              width: Math.max(200, initialDragState.nodeSize.w + deltaX),
              height: n.height ? Math.max(150, (initialDragState.nodeSize.h || 0) + deltaY) : undefined
            }
          : n
       ));
    } else if (dragMode === 'NEW_NODE_DRAG') {
      setGhostNodePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode === 'NEW_NODE_DRAG' && newNodeType) {
      const isClick = e.clientY < 100; 
      
      let dropPos;
      if (isClick) {
         const centerX = (window.innerWidth / 2 - pan.x) / zoom;
         const centerY = (window.innerHeight / 2 - pan.y) / zoom;
         dropPos = { x: centerX, y: centerY };
      } else {
         dropPos = screenToCanvas(e.clientX, e.clientY);
      }

      const newNode: NodeState = {
        id: `n-${Date.now()}`,
        type: newNodeType,
        position: { x: dropPos.x - 150, y: dropPos.y - 20 },
        title: getNodeTitle(newNodeType),
        inputs: [{ id: 'in-1', label: 'Input' }],
        outputs: [{ id: 'out-1', label: 'Output' }],
        width: 300
      };
      
      if (newNodeType === NodeType.VIEWER_3D || newNodeType === NodeType.IMAGE || newNodeType === NodeType.VIDEO) {
        newNode.height = 300; newNode.width = 400;
        if (newNodeType === NodeType.IMAGE) newNode.data = { imageIndex: 0 };
      }
      
      // Customize Project List
      if (newNodeType === NodeType.PROJECT_LIST) {
        const socketStride = 60;
        const minContentHeight = 80; // Minimum height for empty state message
        newNode.inputs = [{ id: 'in-filter', label: 'Filter by Job' }];
        newNode.outputs = [];
        newNode.height = 32 + minContentHeight;
        newNode.socketStride = socketStride;
        newNode.data = { displayedProjects: [] };
      }

      // Customize CV List
      if (newNodeType === NodeType.CV) {
        const socketStride = 60;
        newNode.inputs = [];
        newNode.outputs = CV_DATA.map(j => ({ id: `out-cv-${j.id}`, label: '' }));
        newNode.height = 32 + (CV_DATA.length * socketStride); 
        newNode.socketStride = socketStride;
      }

      setNodes(prev => [...prev, newNode]);
      setNewNodeType(null);
    }
    
    setDragMode('NONE');
    setDraggedNodeId(null);
    setInitialDragState(null);
    setTempWireStart(null);
    
    if (containerRef.current && (e.target as Element).hasPointerCapture(e.pointerId)) {
       (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Explicit Zoom (Ctrl+Wheel or Pinch on some browsers)
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Prevent browser zoom
        zoomCanvas(e.clientX, e.clientY, -e.deltaY);
        return;
    }

    // Heuristic for Mouse Wheel Zoom vs Trackpad Pan
    // Mouse wheels typically have large integer deltas (e.g., 53, 100) and deltaX is 0.
    // Trackpads have smaller, fractional deltas and often have deltaX != 0.
    const isMouseWheel = Math.abs(e.deltaY) >= 20 && e.deltaX === 0 && Number.isInteger(e.deltaY);

    if (isMouseWheel) {
        // Zoom
        e.preventDefault(); // Prevent browser zoom
        zoomCanvas(e.clientX, e.clientY, -e.deltaY);
    } else {
        // Pan (Inverted for natural feeling)
        setPan(prev => ({
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY
        }));
    }
  };

  const zoomCanvas = (clientX: number, clientY: number, delta: number) => {
    const zoomSensitivity = 0.002; 
    const scaleDelta = delta * zoomSensitivity;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + scaleDelta));
    
    const worldX = (clientX - pan.x) / zoom;
    const worldY = (clientY - pan.y) / zoom;
    const newPanX = clientX - worldX * newZoom;
    const newPanY = clientY - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }

  const handleNodeDown = (e: React.PointerEvent, id: string) => {
    if (e.button === 1 || e.button === 2) return;

    e.stopPropagation();
    e.preventDefault();
    setDragMode('NODE_DRAG');
    setDraggedNodeId(id);
    setSelectedWireId(null);

    // Handle shift+click for multi-select
    if (shiftPressed.current) {
      setSelectedNodeIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          // Deselect if already selected
          newSet.delete(id);
        } else {
          // Add to selection
          newSet.add(id);
        }
        return newSet;
      });
    } else {
      // Normal click: if node is already selected, keep current selection (for dragging multiple nodes)
      // Otherwise, select only this node
      if (!selectedNodeIds.has(id)) {
        setSelectedNodeIds(new Set([id]));
      }
    }

    const node = nodes.find(n => n.id === id);
    if (node) {
        setInitialDragState({
            mousePos: { x: e.clientX, y: e.clientY },
            nodePos: { ...node.position },
            nodeSize: { w: node.width, h: node.height }
        });
    }
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleResizeDown = (e: React.PointerEvent, id: string) => {
     if (e.button === 1 || e.button === 2) return;

     e.stopPropagation();
     e.preventDefault();
     setDragMode('RESIZE_NODE');
     setDraggedNodeId(id);
     const node = nodes.find(n => n.id === id);
     if (node) {
        setInitialDragState({
            mousePos: { x: e.clientX, y: e.clientY },
            nodePos: { ...node.position },
            nodeSize: { w: node.width, h: node.height }
        });
     }
     (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handleSocketDown = (e: React.PointerEvent, nodeId: string, socketId: string, isInput: boolean) => {
    if (e.button === 1 || e.button === 2) return;
    e.stopPropagation(); 
    e.preventDefault();
    setDragMode('WIRE_CREATE');
    setTempWireStart({ nodeId, socketId, isInput });
    setMousePos(screenToCanvas(e.clientX, e.clientY));
  };

  const handleSocketUp = (e: React.PointerEvent, nodeId: string, socketId: string, isInput: boolean) => {
    e.stopPropagation();
    if (dragMode === 'WIRE_CREATE' && tempWireStart) {
      if (tempWireStart.nodeId !== nodeId && tempWireStart.isInput !== isInput) {
        const from = !tempWireStart.isInput ? tempWireStart : { nodeId, socketId };
        const to = tempWireStart.isInput ? tempWireStart : { nodeId, socketId };
        
        // REPLACE LOGIC: Remove existing wire connected to the input
        setConnections(prev => {
            const targetInput = tempWireStart.isInput ? tempWireStart : { nodeId, socketId };
            // Remove any connection pointing TO this input
            const filtered = prev.filter(c => !(c.toNodeId === targetInput.nodeId && c.toSocketId === targetInput.socketId));
            
            // Add new connection
            return [...filtered, {
                id: `c-${Date.now()}`,
                fromNodeId: from.nodeId, fromSocketId: from.socketId,
                toNodeId: to.nodeId, toSocketId: to.socketId 
            }];
        });
      }
    }
    setDragMode('NONE');
    setTempWireStart(null);
  };

  const handleSocketHover = (nodeId: string, socketId: string, isInput: boolean, isHovering: boolean) => {
    if (isHovering) {
      setHoveredSocket({ nodeId, socketId, isInput });
    } else {
      setHoveredSocket(null);
    }
  };

  const handleSocketContextMenu = (e: React.MouseEvent, nodeId: string, socketId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId, socketId });
  };

  const handleSocketDoubleClick = (e: React.MouseEvent, nodeId: string, socketId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setConnections(prev => prev.filter(c => 
      !((c.fromNodeId === nodeId && c.fromSocketId === socketId) || 
        (c.toNodeId === nodeId && c.toSocketId === socketId))
    ));
  };

  const handleDisconnectSocket = () => {
    if (!contextMenu) return;
    const { nodeId, socketId } = contextMenu;
    setConnections(prev => prev.filter(c => 
      !((c.fromNodeId === nodeId && c.fromSocketId === socketId) || 
        (c.toNodeId === nodeId && c.toSocketId === socketId))
    ));
    setContextMenu(null);
  };

  const handleReset = () => {
    setNodes(getInitialNodes(initialProjects));
    setConnections(getInitialConnections(initialProjects));
    setPan({ x: 0, y: 0 });
    setZoom(0.75);
  };

  const getSocketPos = (nodeId: string, socketId: string, isInput: boolean) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      const socketIndex = isInput 
        ? node.inputs.findIndex(i => i.id === socketId)
        : node.outputs.findIndex(o => o.id === socketId);
      
      const stride = node.socketStride || 40; 
      const yOffset = 32 + (socketIndex * stride) + (stride / 2);
      const xOffset = isInput ? 0 : node.width; 
      return { x: node.position.x + xOffset, y: node.position.y + yOffset };
  }

  return (
    <>
      {/* Fixed UI Layer - Never transforms */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-14 backdrop-blur-md border rounded-full shadow-editorial flex items-center px-2 gap-1 pointer-events-auto transition-all duration-300" style={{ backgroundColor: 'var(--toolbar-bg)', borderColor: 'var(--toolbar-border)' }}>
           {TOOLBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-hover cursor-grab active:cursor-grabbing transition-all duration-200"
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragMode('NEW_NODE_DRAG'); setNewNodeType(item.type); setGhostNodePos({ x: e.clientX, y: e.clientY }); }}
                >
                   <Icon strokeWidth={1.5} className="w-5 h-5 text-secondary group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
                   <span className="absolute -bottom-8 bg-primary text-canvas text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.label}
                   </span>
                </div>
              )
           })}
           <div className="w-[1px] h-6 mx-2 transition-colors duration-300" style={{ backgroundColor: 'var(--border-tertiary)' }}></div>
           <button
             onClick={cycleTheme}
             className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-hover transition-all duration-200 group text-secondary hover:text-primary"
             title={`Theme: ${theme} (click to toggle)`}
           >
               <Palette className="w-4 h-4" />
           </button>
           <button onClick={handleReset} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-hover transition-all duration-200 text-secondary hover:text-primary">
               <RefreshCw className="w-4 h-4" />
           </button>
        </div>

        {/* Multi-Selection Counter */}
        {selectedNodeIds.size > 1 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-primary text-canvas px-3 py-1.5 rounded-full shadow-lg pointer-events-none transition-colors duration-300">
            <span className="text-[10px] font-mono font-medium tracking-wider">
              {selectedNodeIds.size} NODES SELECTED
            </span>
          </div>
        )}

        {/* Ghost Node During Drag */}
        {dragMode === 'NEW_NODE_DRAG' && newNodeType && (
          <div
             className="absolute pointer-events-none bg-node border border-secondary shadow-xl rounded p-2 flex items-center gap-2 opacity-80 transition-colors duration-300"
             style={{ left: ghostNodePos.x, top: ghostNodePos.y, transform: 'translate(-50%, -50%)' }}
          >
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
             <span className="text-xs font-mono uppercase text-primary">Adding {newNodeType}...</span>
          </div>
        )}

        {/* Fullscreen Image Overlay */}
        {fullscreenImage && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Close button */}
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center p-8">
              <img
                src={fullscreenImage.gallery[fullscreenImage.currentIndex]}
                alt={fullscreenImage.projectTitle}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Navigation */}
            {fullscreenImage.gallery.length > 1 && (
              <>
                <button
                  onClick={() => {
                    setFullscreenImage(prev => {
                      if (!prev) return null;
                      const newIndex = prev.currentIndex === 0 ? prev.gallery.length - 1 : prev.currentIndex - 1;
                      return { ...prev, currentIndex: newIndex };
                    });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={() => {
                    setFullscreenImage(prev => {
                      if (!prev) return null;
                      const newIndex = prev.currentIndex === prev.gallery.length - 1 ? 0 : prev.currentIndex + 1;
                      return { ...prev, currentIndex: newIndex };
                    });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}

            {/* Info bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-4">
              <span className="text-white text-sm font-mono">{fullscreenImage.projectTitle}</span>
              <div className="w-px h-4 bg-white/20"></div>
              <span className="text-white/70 text-xs font-mono">
                {fullscreenImage.currentIndex + 1} / {fullscreenImage.gallery.length}
              </span>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute bg-white border border-black/10 shadow-xl rounded py-1 px-1 min-w-[120px] pointer-events-auto"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button onClick={handleDisconnectSocket} className="w-full text-left px-2 py-1.5 text-[10px] uppercase tracking-wider hover:bg-red-50 hover:text-red-600 flex items-center gap-2 rounded">
              <Trash2 size={12} /> Disconnect
            </button>
          </div>
        )}

        {/* Coordinate & Scale Display */}
        <div className="absolute bottom-12 left-12 text-black font-mono text-[10px] tracking-widest select-none bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-black/5 shadow-sm">
          COORD: {pan.x.toFixed(0)} / {pan.y.toFixed(0)} :: SCALE: {(zoom * 100).toFixed(0)}%
        </div>

        {/* Zoom Instructions */}
        <div className="absolute bottom-6 right-6 opacity-60">
           <div className="flex flex-col items-end gap-1 text-[9px] font-mono tracking-wider text-black/70">
              <div className="flex items-center gap-2"><MousePointer2 size={10}/> <span>PAN: RIGHT DRAG</span></div>
              <div className="flex items-center gap-2"><Box size={10}/> <span>ZOOM: PINCH / CTRL+WHEEL</span></div>
           </div>
        </div>
      </div>

      {/* Canvas Layer - Transforms with zoom/pan */}
      <div
        ref={containerRef}
        className="w-screen h-screen bg-[#FAFAF7] overflow-hidden relative select-none font-sans cursor-default overscroll-none"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={(e) => { if (e.touches.length > 1) e.preventDefault(); }}
      >
        <GridBackground pan={pan} zoom={zoom} />

        <div
          id="canvas-transform-layer"
          className="absolute origin-top-left w-full h-full"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className="absolute inset-0 pointer-events-none z-0">
              <WireConnections
              connections={connections}
              nodes={nodes}
              selectedWireId={selectedWireId}
              onSelectWire={(id) => { setSelectedWireId(id); setSelectedNodeIds(new Set()); }}
              isTempInvalid={!!isDragInvalid}
              tempConnection={dragMode === 'WIRE_CREATE' && tempWireStart ? {
                  start: getSocketPos(tempWireStart.nodeId, tempWireStart.socketId, tempWireStart.isInput),
                  end: mousePos
              } : null}
              />
          </div>

          {nodes.map((node) => (
            <NodeContainer
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              hoveredSocket={hoveredSocket}
              connectedSockets={connections.reduce((acc, c) => {
                if (c.fromNodeId === node.id) acc.add(c.fromSocketId);
                if (c.toNodeId === node.id) acc.add(c.toSocketId);
                return acc;
              }, new Set<string>())}
              isDragInvalid={!!isDragInvalid}
              onHeaderDown={handleNodeDown}
              onSocketDown={handleSocketDown}
              onSocketUp={handleSocketUp}
              onSocketHover={handleSocketHover}
              onSocketContextMenu={handleSocketContextMenu}
              onSocketDoubleClick={handleSocketDoubleClick}
              onResizeDown={handleResizeDown}
            >
               <VisualNodeContent
                  node={node}
                  allNodes={nodes}
                  connections={connections}
                  projects={initialProjects}
                  jobs={CV_DATA}
                  onNodeDataChange={handleNodeDataChange}
                  onOpenFullscreen={(gallery, currentIndex, projectTitle) => {
                    setFullscreenImage({ gallery, currentIndex, projectTitle });
                  }}
                  onSpawnNode={handleSpawnNode}
                  onSmartSwitch={handleSmartSwitch}
               />
            </NodeContainer>
          ))}
        </div>
      </div>
    </>
  );
}
