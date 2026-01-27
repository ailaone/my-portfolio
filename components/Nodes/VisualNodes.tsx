
import React from 'react';
import { ProjectData, JobData, ThemeData, NodeState, NodeType, Connection } from '@/types/content';
import { ThreeScene, getContrastTextColor } from '../ThreeScene';
import { ChevronLeft, ChevronRight, Mail, Plug, Box, BarChart as BarChartIcon, Github, Linkedin, Instagram, Youtube, Maximize, Image as ImageIcon, Calendar, Video, Monitor } from 'lucide-react';
import { NewTwitterIcon } from 'hugeicons-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ContentProps {
  node: NodeState;
  allNodes: NodeState[];
  connections: Connection[];
  projects: ProjectData[];
  jobs: JobData[];
  themes: ThemeData[];
  onNodeDataChange: (nodeId: string, data: any) => void;
  onOpenFullscreen: (gallery: string[], currentIndex: number, projectTitle: string) => void;
  onSpawnNode?: (nodeType: NodeType, sourceNodeId: string) => void;
  onSmartSwitch?: (nodeId: string, socketId: string) => void;
}

// --- Helper: Recursive Graph Traversal ---
const findUpstreamData = (
  currentNodeId: string, 
  allNodes: NodeState[], 
  connections: Connection[], 
  projects: ProjectData[],
  jobs: JobData[],
  visited = new Set<string>()
): ProjectData | JobData | null => {
  if (visited.has(currentNodeId)) return null; 
  visited.add(currentNodeId);

  const inputConnections = connections.filter(c => c.toNodeId === currentNodeId);
  
  for (const conn of inputConnections) {
    // SKIP the Filter Input connection for Project Lists
    if (conn.toSocketId === 'in-filter') continue;

    const upstreamNode = allNodes.find(n => n.id === conn.fromNodeId);
    
    // Project Source
    if (upstreamNode?.type === NodeType.PROJECT_LIST && conn.fromSocketId.startsWith('out-p-')) {
        const slug = conn.fromSocketId.replace('out-p-', '');
        return projects.find(p => p.slug === slug) || null;
    }

    // CV Source
    if (upstreamNode?.type === NodeType.CV && conn.fromSocketId.startsWith('out-cv-')) {
        const id = conn.fromSocketId.replace('out-cv-', '');
        return jobs.find(j => j.id === id) || null;
    }

    const result = findUpstreamData(conn.fromNodeId, allNodes, connections, projects, jobs, visited);
    if (result) return result;
  }

  return null;
};

// Type guard
const isProject = (data: any): data is ProjectData => !!data && 'slug' in data;
const isJob = (data: any): data is JobData => !!data && 'company' in data;

export const VisualNodeContent: React.FC<ContentProps> = ({ node, allNodes, connections, projects, jobs, themes, onNodeDataChange, onOpenFullscreen, onSpawnNode, onSmartSwitch }) => {
  
  const handleImageNav = (direction: 'prev' | 'next', currentProject: ProjectData) => {
     const gallery = currentProject.galleryUrls || [];
     if (gallery.length === 0) return;
     
     const currentIndex = node.data?.imageIndex || 0;
     let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
     
     if (newIndex >= gallery.length) newIndex = 0;
     if (newIndex < 0) newIndex = gallery.length - 1;
     
     onNodeDataChange(node.id, { imageIndex: newIndex });
  };

  // Find upstream data (Project or Job)
  const upstreamData = (node.type !== NodeType.PROJECT_LIST && node.type !== NodeType.CV && node.type !== NodeType.HEADER && node.type !== NodeType.CONTACT && node.type !== NodeType.SOCIAL)
    ? findUpstreamData(node.id, allNodes, connections, projects, jobs)
    : null;

  switch (node.type) {
    case NodeType.HEADER:
      return (
        <div className="p-6 flex flex-col h-full justify-center bg-node transition-colors duration-300">
          <h1 className="text-4xl font-serif tracking-tight mb-2 text-primary transition-colors duration-300">
            ARTHUR<span className="italic font-light">AZOULAI</span>
          </h1>
          <div className="w-12 h-[1px] bg-primary mb-4 transition-colors duration-300"></div>
          <p className="text-xs font-sans tracking-widest text-secondary uppercase transition-colors duration-300">
          CREATIVE TECHNOLOGIST / COMPUTATIONAL DESIGNER
          </p>
        </div>
      );

    case NodeType.SOCIAL:
      return (
        <div className="p-6 flex items-center justify-around h-full bg-node transition-colors duration-300">
           <a href="https://www.linkedin.com/in/arthurazoulai/" target="_blank" rel="noreferrer" className="text-secondary hover:text-primary hover:scale-110 transition-all duration-200"><Linkedin strokeWidth={1.5} size={20} /></a>
           <a href="https://github.com/ailaone" target="_blank" rel="noreferrer" className="text-secondary hover:text-primary hover:scale-110 transition-all duration-200"><Github strokeWidth={1.5} size={20} /></a>
           <a href="https://www.instagram.com/arthurazoulai/" target="_blank" rel="noreferrer" className="text-secondary hover:text-primary hover:scale-110 transition-all duration-200"><Instagram strokeWidth={1.5} size={20} /></a>
           <a href="https://x.com/arthurazoulai" target="_blank" rel="noreferrer" className="text-secondary hover:text-primary hover:scale-110 transition-all duration-200"><NewTwitterIcon strokeWidth={1.5} size={20} /></a>
           <a href="https://www.youtube.com/@slicelab3819" target="_blank" rel="noreferrer" className="text-secondary hover:text-primary hover:scale-110 transition-all duration-200"><Youtube strokeWidth={1.5} size={20} /></a>
        </div>
      );

    case NodeType.PROJECT_LIST:
      // Use dynamic data if available (filtered list), otherwise show all
      const projectList = node.data?.displayedProjects || projects;

      return (
        <div className="flex flex-col h-full bg-node overflow-hidden transition-colors duration-300">
           <div className="flex flex-col h-full">
            {projectList.map((p: ProjectData) => (
              <div
                key={p.slug}
                className="px-3 group flex items-center justify-between border-b border-transparent hover:bg-hover transition-colors shrink-0 cursor-pointer"
                style={{ height: node.socketStride || 40 }}
                onClick={() => onSmartSwitch?.(node.id, `out-p-${p.slug}`)}
              >
                <div className="flex flex-col justify-center h-full">
                    <span className="font-serif font-normal text-base text-primary leading-tight line-clamp-2 transition-colors duration-300">{p.title}</span>
                    <span className="text-[10px] text-secondary uppercase leading-none mt-1 transition-colors duration-300">{p.category}</span>
                </div>
                <div className="w-1 h-1 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
            {projectList.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
                  <Plug size={16} className="text-tertiary" />
                  <p className="text-center text-[10px] text-tertiary uppercase tracking-widest transition-colors duration-300">Connect THEME or Work Experience</p>
                </div>
            )}
          </div>
        </div>
      );

    case NodeType.THEME:
      return (
        <div className="flex flex-col h-full bg-node overflow-hidden transition-colors duration-300">
           <div className="flex flex-col">
            {themes.map((t) => (
              <div
                key={t.id}
                className="px-3 group flex items-center justify-between border-b border-transparent hover:bg-hover transition-colors shrink-0 cursor-pointer"
                style={{ height: node.socketStride || 40 }}
                onClick={() => onSmartSwitch?.(node.id, `out-theme-${t.id}`)}
              >
                <div className="flex flex-col justify-center h-full w-[85%]">
                    <span className="font-serif font-normal text-lg text-primary leading-tight line-clamp-1 transition-colors duration-300">{t.label}</span>
                </div>
                <div className="w-1 h-1 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      );

    case NodeType.CV:
      return (
        <div className="flex flex-col h-full bg-node overflow-hidden transition-colors duration-300">
           <div className="flex flex-col">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="px-3 group flex items-center justify-between border-b border-transparent hover:bg-hover transition-colors shrink-0 cursor-pointer"
                style={{ height: node.socketStride || 40 }}
                onClick={() => onSmartSwitch?.(node.id, `out-cv-${j.id}`)}
              >
                <div className="flex flex-col justify-center h-full w-[85%]">
                    <span className="font-serif font-normal text-base text-primary leading-tight line-clamp-1 transition-colors duration-300">{j.role}</span>
                    <span className="text-[10px] text-secondary leading-none mt-1 uppercase tracking-wide transition-colors duration-300">{j.company} — {j.year}</span>
                </div>
                <div className="w-1 h-1 bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      );

    case NodeType.DETAILS:
      if (!upstreamData) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center transition-colors duration-300">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Project or Work Experience</span>
          </div>
        );
      }

      if (isJob(upstreamData)) {
         return (
            <div className="p-6 flex flex-col h-full overflow-y-auto bg-node transition-colors duration-300">
                <div className="mb-4">
                    <h2 className="text-xl font-serif text-primary leading-tight transition-colors duration-300">{upstreamData.role}</h2>
                    <p className="text-xs text-secondary uppercase tracking-widest mt-1 transition-colors duration-300">{upstreamData.company}</p>
                </div>
                <p className="font-serif font-medium text-base text-primary leading-relaxed mb-4 italic opacity-80 transition-colors duration-300">
                    {upstreamData.description}
                </p>
                {upstreamData.details && (
                    <ul className="list-disc list-inside space-y-1 mb-6">
                        {upstreamData.details.map((d, i) => (
                            <li key={i} className="text-sm text-secondary font-sans leading-relaxed transition-colors duration-300">{d}</li>
                        ))}
                    </ul>
                )}
                <div className="mt-auto border-t border-tertiary pt-4 transition-colors duration-300">
                    <h3 className="text-[9px] tracking-widest uppercase text-tertiary transition-colors duration-300">Timeline</h3>
                    <p className="text-xs text-primary transition-colors duration-300">{upstreamData.year}</p>
                </div>
            </div>
         );
      }

      // Default: Project
      const hasImages = upstreamData.galleryUrls && upstreamData.galleryUrls.length > 0;
      const hasVideo = !!upstreamData.videoEmbedUrl;
      const has3D = !!upstreamData.modelUrl;
      const hasPresentation = !!upstreamData.presentationEmbedUrl;
      const hasAnyContent = hasImages || hasVideo || has3D || hasPresentation;

      return (
        <div className="p-6 flex flex-col h-full overflow-y-auto bg-node transition-colors duration-300">
          {/* Header with title and available content buttons */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-serif text-primary leading-tight transition-colors duration-300">{upstreamData.title}</h2>
              <p className="text-xs text-secondary uppercase tracking-widest mt-1 transition-colors duration-300">{upstreamData.category}</p>
            </div>

            {/* Available Content - Top Right */}
            {hasAnyContent && (
              <div className="flex gap-1.5 flex-shrink-0">
                {hasImages && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpawnNode?.(NodeType.IMAGE, node.id);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded bg-hover hover:bg-primary/20 transition-colors group"
                    title="Open Gallery"
                  >
                    <ImageIcon size={14} className="text-secondary group-hover:text-primary transition-colors duration-200" />
                  </button>
                )}
                {hasVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpawnNode?.(NodeType.VIDEO, node.id);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded bg-hover hover:bg-primary/20 transition-colors group"
                    title="Open Video"
                  >
                    <Video size={14} className="text-secondary group-hover:text-primary transition-colors duration-200" />
                  </button>
                )}
                {has3D && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpawnNode?.(NodeType.VIEWER_3D, node.id);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded bg-hover hover:bg-primary/20 transition-colors group"
                    title="Open 3D Viewer"
                  >
                    <Box size={14} className="text-secondary group-hover:text-primary transition-colors duration-200" />
                  </button>
                )}
                {hasPresentation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpawnNode?.(NodeType.PRESENTATION, node.id);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded bg-hover hover:bg-primary/20 transition-colors group"
                    title="Open Presentation"
                  >
                    <Monitor size={14} className="text-secondary group-hover:text-primary transition-colors duration-200" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {upstreamData.summaryHtml && (
            <div className="font-serif font-medium text-base text-primary leading-relaxed mb-4 italic prose prose-sm opacity-80 transition-colors duration-300"
                 dangerouslySetInnerHTML={{ __html: upstreamData.summaryHtml }} />
          )}

          {/* Description */}
          {upstreamData.descriptionHtml && (
            <div className="font-sans text-sm text-secondary leading-relaxed mb-4 prose prose-sm transition-colors duration-300"
                 dangerouslySetInnerHTML={{ __html: upstreamData.descriptionHtml }} />
          )}

          {!upstreamData.summaryHtml && !upstreamData.descriptionHtml && (
            <p className="font-sans text-sm text-secondary leading-relaxed mb-4 transition-colors duration-300">No description available.</p>
          )}

          <div className="mt-auto">
            <div className="grid grid-cols-2 gap-4 border-t border-tertiary pt-4 transition-colors duration-300">
               <div><h3 className="text-[11px] tracking-widest uppercase text-tertiary transition-colors duration-300">Role</h3><p className="text-sm text-primary transition-colors duration-300">{upstreamData.role.join(', ')}</p></div>
               <div><h3 className="text-[11px] tracking-widest uppercase text-tertiary transition-colors duration-300">Year</h3><p className="text-sm text-primary transition-colors duration-300">{upstreamData.year}</p></div>
            </div>

            {/* Technologies */}
            {upstreamData.technologies && upstreamData.technologies.length > 0 && (
              <div className="border-t border-tertiary pt-4 mt-4 transition-colors duration-300">
                <h3 className="text-[11px] tracking-widest uppercase text-tertiary mb-2 transition-colors duration-300">Technologies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {upstreamData.technologies.map((tech, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-hover text-secondary rounded tracking-wide transition-colors duration-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case NodeType.IMAGE:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
          </div>
        );
      }

      const gallery = upstreamData.galleryUrls || (upstreamData.heroImageUrl ? [upstreamData.heroImageUrl] : []);

      // Check if there are no images available for this project
      if (gallery.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Images Not Available for This Project</span>
            <span className="text-[9px] text-secondary mt-1 transition-colors duration-300">{upstreamData.title}</span>
          </div>
        );
      }

      const idx = node.data?.imageIndex || 0;
      const currentImage = gallery[idx] || null;

      return (
        <div className="w-full h-full relative group overflow-hidden bg-[#ffffff]">
           {/* Blurred background image */}
           {currentImage && (
             <div 
               className="absolute inset-0"
               style={{
                 backgroundImage: `url(${currentImage})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 filter: 'blur(10px)',
                 transform: 'scale(1.1)',
                 opacity: 0.4
               }}
             />
           )}
           
           {/* Main image on top */}
           {currentImage ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img 
                 src={currentImage} 
                 alt={upstreamData.title} 
                 className="relative w-full h-full object-contain transition-all duration-700 z-10"
               />
           ) : (
               <div className="relative w-full h-full flex items-center justify-center text-gray-400 text-xs z-10">No Image Available, Plug Project Input</div>
           )}
           
           {gallery.length > 1 && (
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <button 
                     onClick={(e) => { e.stopPropagation(); handleImageNav('prev', upstreamData); }}
                     className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm backdrop-blur-sm"
                 >
                     <ChevronLeft size={16} />
                 </button>
                 <button 
                     onClick={(e) => { e.stopPropagation(); handleImageNav('next', upstreamData); }}
                     className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm backdrop-blur-sm"
                 >
                     <ChevronRight size={16} />
                 </button>
             </div>
           )}
   
           <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 border-t border-white/10 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-center z-20">
              <p className="text-[9px] font-mono uppercase text-white/90">{upstreamData.slug}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFullscreen(gallery, idx, upstreamData.title);
                  }}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Fullscreen"
                >
                  <Maximize size={12} className="text-white" />
                </button>
                <p className="text-[9px] font-mono text-white/90">{gallery.length > 0 ? idx + 1 : 0} / {gallery.length}</p>
              </div>
           </div>
        </div>
     );

case NodeType.VIEWER_3D:
  if (!upstreamData || !isProject(upstreamData)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center transition-colors duration-300">
        <Box size={16} />
        <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
      </div>
    );
  }

  // Check if 3D model is available for this project
  if (!upstreamData.modelUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
        <Box size={16} />
        <span className="text-[10px] uppercase tracking-widest">3D Not Available for This Project</span>
        <span className="text-[9px] text-secondary mt-1 transition-colors duration-300">{upstreamData.title}</span>
      </div>
    );
  }

  const backgroundColor = upstreamData.lighting?.backgroundColor || '#f0f0f0';
  const textColor = getContrastTextColor(backgroundColor);

  return (
    <div className="relative w-full h-full">
      <ThreeScene
        geometryType={upstreamData.geometryType || 'cube'}
        modelUrl={upstreamData.modelUrl}
        material={upstreamData.material}
        lighting={upstreamData.lighting}
      />
      <div className="absolute bottom-3 right-3 text-[9px] font-mono uppercase tracking-wider pointer-events-none z-20 transition-colors duration-300" style={{ color: textColor }}>
         {upstreamData.geometryType || 'Standard'}
      </div>
    </div>
  );

    case NodeType.DATA:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <BarChartIcon size={16} />
            <span className="text-[10px] uppercase tracking-widest">Waiting for Data...</span>
          </div>
        );
      }

      const stats = upstreamData.stats || { "Optimization": 80, "Complexity": 60 };
      const chartData = Object.entries(stats).map(([k, v]) => ({ name: k, value: typeof v === 'number' ? v : 0 }));

      return (
         <div className="p-4 h-full flex flex-col font-mono text-[10px] bg-node transition-colors duration-300">
            <div className="h-32 w-full mt-auto">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{fontSize: 9, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--node-bg)', color: 'var(--text-primary)', borderRadius: '2px', border: '1px solid var(--border-secondary)', fontSize: '12px' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            cursor={{fill: 'var(--hover-bg)'}}
                        />
                        <Bar dataKey="value" fill="var(--text-primary)" radius={[2, 2, 0, 0]} barSize={30} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
         </div>
      );

    case NodeType.VIDEO:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Video size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
          </div>
        );
      }

      // Check if video is available for this project
      if (!upstreamData.videoEmbedUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Video size={16} />
            <span className="text-[10px] uppercase tracking-widest">Video Not Available for This Project</span>
            <span className="text-[9px] text-secondary mt-1 transition-colors duration-300">{upstreamData.title}</span>
          </div>
        );
      }

      // Add autoplay parameters if enabled
      let videoSrc = upstreamData.videoEmbedUrl;
      if (upstreamData.autoplayVideo) {
        const separator = videoSrc.includes('?') ? '&' : '?';
        videoSrc = `${videoSrc}${separator}autoplay=1&mute=1`;
      }

      return (
        <div className="w-full h-full relative bg-[#000000]">
          <iframe
            src={videoSrc}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
           // title={upstreamData.title}
          />
        </div>
      );

    case NodeType.PRESENTATION:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Monitor size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
          </div>
        );
      }

      // Check if presentation is available for this project
      if (!upstreamData.presentationEmbedUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-tertiary gap-2 p-4 text-center bg-node transition-colors duration-300">
            <Monitor size={16} />
            <span className="text-[10px] uppercase tracking-widest">Presentation Not Available for This Project</span>
            <span className="text-[9px] text-secondary mt-1 transition-colors duration-300">{upstreamData.title}</span>
          </div>
        );
      }

      return (
        <div className="w-full h-full relative bg-[#000000]">
          <iframe
            src={upstreamData.presentationEmbedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title={upstreamData.title}
          />
        </div>
      );

    case NodeType.CONTACT:
       return (
          <div className="p-6 flex flex-col items-center justify-center h-full gap-4 bg-node transition-colors duration-300">
             <a href="mailto:arthur.azoulai@gmail.com" className="flex items-center gap-2 text-sm text-primary hover:underline hover:text-secondary transition-colors duration-200"><Mail size={14}/> Email Me</a>
             <a href="https://calendly.com/arthur-azoulai/30min" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline hover:text-secondary transition-colors duration-200"><Calendar size={14}/> Book a Meeting</a>
             <div className="w-full h-[1px] bg-border-tertiary transition-colors duration-300"></div>
             <p className="text-[10px] text-tertiary uppercase tracking-widest transition-colors duration-300">Open for collaborations</p>
          </div>
       )

    default:
      return <div className="p-4 text-tertiary flex items-center justify-center h-full text-xs uppercase tracking-widest bg-node transition-colors duration-300">Coming Soon</div>;
  }
};
