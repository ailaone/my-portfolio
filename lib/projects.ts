import fs from 'fs';
import path from 'path';
import { ProjectData, ProjectJson } from '@/types/content';

const CONTENT_DIR = path.join((process as any).cwd(), 'content', 'projects');

export function getAllProjects(): ProjectData[] {
  // If directory doesn't exist (e.g. first run), return empty or mock
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn('Content directory not found at:', CONTENT_DIR);
    return generateMockProjects();
  }

  const slugs = fs.readdirSync(CONTENT_DIR);
  
  const projects = slugs.map((slug) => {
    return getProjectBySlug(slug);
  }).filter((p): p is ProjectData => p !== null);

  return projects;
}

export function getProjectBySlug(slug: string): ProjectData | null {
  const projectDir = path.join(CONTENT_DIR, slug);
  const jsonPath = path.join(projectDir, 'project.json');

  if (!fs.existsSync(jsonPath)) return null;

  try {
    const fileContents = fs.readFileSync(jsonPath, 'utf8');
    const projectJson: ProjectJson = JSON.parse(fileContents);

    // Helper to read text file if it exists
    const readText = (filename?: string) => {
      if (!filename) return undefined;
      const filePath = path.join(projectDir, filename);
      return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
    };

    // Construct Asset URLs for the frontend API
    // /api/project-asset?project=<slug>&type=image&file=<filename>
    const getUrl = (type: 'image' | 'model', relativePath?: string) => {
      if (!relativePath) return undefined;
      const filename = path.basename(relativePath);
      return `/api/project-asset?project=${slug}&type=${type}&file=${filename}`;
    };

    const heroImage = projectJson.images.length > 0 ? projectJson.images[0] : undefined;

    const projectData: ProjectData = {
      ...projectJson,
      slug,
      // Normalize jobId: handle both 'jobId' (correct) and 'jobID' (common typo)
      jobId: projectJson.jobId || (projectJson as any).jobID, 
      descriptionHtml: readText(projectJson.description_file),
      summaryHtml: readText(projectJson.summary_file),
      processHtml: readText(projectJson.process_file),
      heroImageUrl: getUrl('image', heroImage),
      galleryUrls: projectJson.images.map(img => getUrl('image', img)!),
      modelUrl: getUrl('model', projectJson.model),
    };

    return projectData;
  } catch (error) {
    console.error(`Error loading project ${slug}:`, error);
    return null;
  }
}

// Fallback mock data so the app runs immediately without creating files
function generateMockProjects(): ProjectData[] {
  return [
    {
      slug: "parametric-pavilion",
      title: "Parametric Pavilion",
      year: "2023",
      category: "Architecture",
      role: ["Lead Designer"],
      client: "City Art Council",
      technologies: ["Rhino", "Grasshopper", "Python"],
      images: [],
      geometryType: 'torus',
      descriptionHtml: "A generative structure optimized for sunlight exposure and structural integrity using evolutionary solvers.",
      heroImageUrl: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?q=80&w=1000&auto=format&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518005052351-e9819a59f5a4?q=80&w=1000&auto=format&fit=crop"
      ],
      stats: { "Optimization": 85, "Iterations": 500 }
    },
    {
      slug: "voronoi-facade",
      title: "Voronoi Facade",
      year: "2022",
      category: "Facade Engineering",
      role: ["Facade Consultant"],
      technologies: ["Revit", "Dynamo"],
      images: [],
      geometryType: 'icosahedron',
      descriptionHtml: "Adaptive facade system responsive to environmental data, reducing solar gain by 40%.",
      heroImageUrl: "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000&auto=format&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000&auto=format&fit=crop"
      ]
    },
    {
      slug: "urban-flow",
      title: "Urban Flow",
      year: "2024",
      category: "Urban Design",
      role: ["Data Specialist"],
      technologies: ["Processing", "Mapbox"],
      images: [],
      geometryType: 'sphere',
      descriptionHtml: "Agent-based simulation to predict pedestrian flow in high-density transit hubs.",
      heroImageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1000&auto=format&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1000&auto=format&fit=crop"
      ]
    }
  ];
}