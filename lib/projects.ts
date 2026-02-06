import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { ProjectData, ProjectJson } from '@/types/content';

const CONTENT_DIR = path.join((process as any).cwd(), 'public', 'projects');

// Helper to convert YouTube/Vimeo URLs to embed URLs
function getVideoEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // YouTube patterns (including Shorts)
  const youtubeRegex = /(?:youtube\.com\/(?:shorts\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo patterns
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If already an embed URL, return as-is
  if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
    return url;
  }

  return undefined;
}

// Helper to convert Google Slides URLs to embed URLs
function getPresentationEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // If already an embed URL, return as-is
  if (url.includes('/embed')) {
    return url;
  }

  // Published presentation: https://docs.google.com/presentation/d/e/{ID}/pub
  // These keep the /e/ in the path
  if (url.includes('/d/e/') && url.includes('/pub')) {
    return url.replace(/\/pub(\?.*)?$/, '/embed?start=false');
  }

  // Regular sharing/edit URL: https://docs.google.com/presentation/d/{ID}/edit
  const slidesRegex = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
  const slidesMatch = url.match(slidesRegex);
  if (slidesMatch) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed?start=false`;
  }

  return undefined;
}

// Configure marked for safe HTML rendering with links opening in new tabs
marked.use({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  }
});

// Helper to parse year for sorting (handles "2024", "2024-2025", "2012-Present")
function parseYearForSorting(yearString: string): number {
  if (!yearString) return 0;

  // Handle "Present" or "Ongoing" - use current year
  if (yearString.toLowerCase().includes('present') || yearString.toLowerCase().includes('ongoing')) {
    return new Date().getFullYear();
  }

  // Extract first year from ranges like "2024-2025" or single years like "2024"
  const match = yearString.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 0;
}

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

  // Sort by year, newest first
  projects.sort((a, b) => {
    const yearA = parseYearForSorting(a.year);
    const yearB = parseYearForSorting(b.year);
    return yearB - yearA; // Descending order (newest first)
  });

  return projects;
}

export function getProjectBySlug(slug: string): ProjectData | null {
  const projectDir = path.join(CONTENT_DIR, slug);
  const jsonPath = path.join(projectDir, 'project.json');

  if (!fs.existsSync(jsonPath)) return null;

  try {
    const fileContents = fs.readFileSync(jsonPath, 'utf8');
    const projectJson: ProjectJson = JSON.parse(fileContents);

    // Helper to read markdown file and convert to HTML
    const readMarkdown = (filename?: string) => {
      if (!filename) return undefined;
      const filePath = path.join(projectDir, filename);
      if (!fs.existsSync(filePath)) return undefined;
      const markdownContent = fs.readFileSync(filePath, 'utf8');
      return marked.parse(markdownContent) as string;
    };

    // Construct static asset URLs (assets now served from /public/projects/)
    const getUrl = (type: 'image' | 'model', relativePath?: string) => {
      if (!relativePath) return undefined;
      const filename = path.basename(relativePath);
      const folder = type === 'image' ? 'images' : '3d';
      return `/projects/${slug}/${folder}/${filename}`;
    };

    // Check if model file actually exists before creating URL
    const getModelUrl = (modelFilename?: string) => {
      if (!modelFilename) return undefined;
      const modelPath = path.join(projectDir, '3d', modelFilename);
      if (!fs.existsSync(modelPath)) return undefined;
      return getUrl('model', modelFilename);
    };

    // Check if image file actually exists before creating URL
    const getImageUrl = (imageFilename?: string) => {
      if (!imageFilename) return undefined;
      const imagePath = path.join(projectDir, 'images', imageFilename);
      if (!fs.existsSync(imagePath)) return undefined;
      return getUrl('image', imageFilename);
    };

    // Filter images to only those that exist on disk
    const existingImages = projectJson.images.filter(img => {
      const imagePath = path.join(projectDir, 'images', img);
      return fs.existsSync(imagePath);
    });

    const heroImage = existingImages.length > 0 ? existingImages[0] : undefined;

    // Process videos array (new multi-video support)
    const processedVideos = projectJson.videos?.map(video => ({
      title: video.title,
      embedUrl: getVideoEmbedUrl(video.url) || '',
      autoplay: video.autoplay
    })).filter(v => v.embedUrl) || [];

    const projectData: ProjectData = {
      ...projectJson,
      slug,
      // Normalize jobId: handle both 'jobId' (correct) and 'jobID' (common typo)
      jobId: projectJson.jobId || (projectJson as any).jobID,
      descriptionHtml: readMarkdown(projectJson.description_file),
      summaryHtml: readMarkdown(projectJson.summary_file),
      processHtml: readMarkdown(projectJson.process_file),
      heroImageUrl: getImageUrl(heroImage),
      galleryUrls: existingImages.map(img => getImageUrl(img)!).filter(Boolean),
      modelUrl: getModelUrl(projectJson.model),
      videoEmbedUrl: getVideoEmbedUrl(projectJson.videoUrl),  // Legacy: single video
      videoEmbeds: processedVideos && processedVideos.length > 0 ? processedVideos : undefined, // NEW: video array
      presentationEmbedUrl: getPresentationEmbedUrl(projectJson.presentationUrl),
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