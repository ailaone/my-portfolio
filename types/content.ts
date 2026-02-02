
export interface ProjectNodeLayout {
  id: string;
  type: string;
  x: number;
  y: number;
}

export interface ProjectLayout {
  nodes: ProjectNodeLayout[];
  connections: string[][];
}

export interface ProjectStats {
  [key: string]: number | string;
}

export interface Material3D {
  color?: string;           // Hex color for mesh (e.g., "#D4AF37" for gold)
  metalness?: number;       // 0-1, how metallic (0=plastic, 1=metal)
  roughness?: number;       // 0-1, surface smoothness (0=mirror, 1=matte)
  emissive?: string;        // Hex color for glow/self-illumination
  emissiveIntensity?: number; // 0-1+, strength of glow
  opacity?: number;         // 0-1, transparency (requires transparent: true)
  wireframe?: boolean;      // Enable wireframe/edge overlay
  wireframeOpacity?: number; // 0-1, how visible the wireframe is (default: 0.1)
  wireframeColor?: string;  // Hex color for wireframe (default: "#000000")
}

export interface Lighting3D {
  environment?: 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby';
  exposure?: number;        // 0-2+, tone mapping exposure (like camera exposure)
  ambientIntensity?: number; // 0-2, overall scene brightness
  backgroundColor?: string;  // Hex color for scene background (e.g., "#f0f0f0")
  cameraNear?: number;       // Camera near clipping plane (default: 0.1)
  cameraFar?: number;        // Camera far clipping plane (default: 1000)
}

export interface VideoItem {
  title?: string;        // Optional title for the video
  url: string;           // YouTube or Vimeo URL
  autoplay?: boolean;    // Enable autoplay for this video (will be muted)
}

export interface ProjectJson {
  slug: string;
  title: string;
  year: string;
  category: string;
  role: string[];
  client?: string;
  technologies: string[];
  tags?: string[];
  themes?: string[]; // Theme categories: ai-dev, comp-design, 3d-dfam, arch-fab, edu-conf
  description_file?: string;
  summary_file?: string;
  process_file?: string;
  images: string[];
  model?: string;
  videoUrl?: string;        // Legacy: single video URL (deprecated, use videos[] instead)
  autoplayVideo?: boolean;  // Legacy: Enable autoplay for video (deprecated)
  videos?: VideoItem[];     // NEW: Array of videos for gallery navigation
  presentationUrl?: string; // Google Slides embed URL
  stats?: ProjectStats;
  layout?: ProjectLayout;
  jobId?: string; // Link to CV Data ID
  // Fallback visual property from old version
  geometryType?: 'cube' | 'sphere' | 'torus' | 'icosahedron';
  // 3D Material and Lighting
  material?: Material3D;        // Single material for all meshes
  materials?: Material3D[];     // Array of materials applied by mesh index
  lighting?: Lighting3D;
}

export interface ProcessedVideo {
  title?: string;
  embedUrl: string;
  autoplay?: boolean;
}

export interface ProjectData extends ProjectJson {
  // Content loaded from markdown files
  descriptionHtml?: string;
  summaryHtml?: string;
  processHtml?: string;

  // Constructed Asset URLs
  heroImageUrl?: string;
  galleryUrls?: string[];
  modelUrl?: string;
  videoEmbedUrl?: string;        // Legacy: single video embed (deprecated)
  videoEmbeds?: ProcessedVideo[]; // NEW: Array of processed video embeds
  presentationEmbedUrl?: string;
}

export interface JobData {
  id: string;
  role: string;
  company: string;
  year: string;
  description: string;
  details?: string[];
}

export interface ThemeData {
  id: string;
  label: string;
}

// --- Application Types for the Canvas ---

export interface Position {
  x: number;
  y: number;
}

export enum NodeType {
  HEADER = 'HEADER',
  SOCIAL = 'SOCIAL',
  PROJECT_LIST = 'PROJECT_LIST',
  CV = 'CV',
  THEME = 'THEME',
  VIEWER_3D = 'VIEWER_3D',
  DETAILS = 'DETAILS',
  DATA = 'DATA',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PRESENTATION = 'PRESENTATION',
  CONTACT = 'CONTACT',
}

export interface NodeState {
  id: string;
  type: NodeType;
  position: Position;
  title: string;
  selected?: boolean;
  inputs: { id: string; label: string }[];
  outputs: { id: string; label: string }[];
  width: number;
  height?: number;
  data?: any;
  socketStride?: number;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromSocketId: string;
  toNodeId: string;
  toSocketId: string;
}

export type DragMode = 'NONE' | 'CANVAS_PAN' | 'NODE_DRAG' | 'WIRE_CREATE' | 'NEW_NODE_DRAG' | 'RESIZE_NODE';
