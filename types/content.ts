
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

export interface ProjectJson {
  slug: string;
  title: string;
  year: string;
  category: string;
  role: string[];
  client?: string;
  technologies: string[];
  tags?: string[];
  description_file?: string;
  summary_file?: string;
  process_file?: string;
  images: string[];
  model?: string;
  videoUrl?: string;
  autoplayVideo?: boolean; // Enable autoplay for video (will be muted)
  presentationUrl?: string; // Google Slides embed URL
  stats?: ProjectStats;
  layout?: ProjectLayout;
  jobId?: string; // Link to CV Data ID
  // Fallback visual property from old version
  geometryType?: 'cube' | 'sphere' | 'torus' | 'icosahedron';
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
  videoEmbedUrl?: string;
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
