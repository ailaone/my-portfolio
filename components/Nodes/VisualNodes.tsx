
import React from 'react';
import { ProjectData, JobData, NodeState, NodeType, Connection } from '@/types/content';
import { ThreeScene } from '../ThreeScene';
import { ChevronLeft, ChevronRight, Mail, Plug, Box, BarChart as BarChartIcon, Github, Linkedin, Instagram, Youtube, Video, Maximize, Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ContentProps {
  node: NodeState;
  allNodes: NodeState[];
  connections: Connection[];
  projects: ProjectData[];
  jobs: JobData[];
  onNodeDataChange: (nodeId: string, data: any) => void;
  onOpenFullscreen: (gallery: string[], currentIndex: number, projectTitle: string) => void;
  onSpawnNode?: (nodeType: NodeType, sourceNodeId: string) => void;
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

export const VisualNodeContent: React.FC<ContentProps> = ({ node, allNodes, connections, projects, jobs, onNodeDataChange, onOpenFullscreen, onSpawnNode }) => {
  
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
        <div className="p-6 flex flex-col h-full justify-center bg-[#FAFAF7]">
          <h1 className="text-4xl font-serif tracking-tight mb-2 text-black">
            ARTHUR<span className="italic font-light">AZOULAI</span>
          </h1>
          <div className="w-12 h-[1px] bg-black mb-4"></div>
          <p className="text-xs font-sans tracking-widest text-gray-500 uppercase">
            Computational Designer / Architect
          </p>
        </div>
      );

    case NodeType.SOCIAL:
      return (
        <div className="p-6 flex items-center justify-around h-full bg-[#FAFAF7]">
           <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-black/60 hover:text-black hover:scale-110 transition-transform"><Linkedin strokeWidth={1.5} size={20} /></a>
           <a href="https://github.com" target="_blank" rel="noreferrer" className="text-black/60 hover:text-black hover:scale-110 transition-transform"><Github strokeWidth={1.5} size={20} /></a>
           <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-black/60 hover:text-black hover:scale-110 transition-transform"><Instagram strokeWidth={1.5} size={20} /></a>
           <a href="https://vimeo.com" target="_blank" rel="noreferrer" className="text-black/60 hover:text-black hover:scale-110 transition-transform"><Video strokeWidth={1.5} size={20} /></a>
           <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-black/60 hover:text-black hover:scale-110 transition-transform"><Youtube strokeWidth={1.5} size={20} /></a>
        </div>
      );

    case NodeType.PROJECT_LIST:
      // Use dynamic data if available (filtered list), otherwise show all
      const projectList = node.data?.displayedProjects || projects;
      
      return (
        <div className="flex flex-col h-full bg-[#FAFAF7] overflow-hidden">
           <div className="flex flex-col h-full"> 
            {projectList.map((p: ProjectData) => (
              <div key={p.slug} className="px-3 group flex items-center justify-between border-b border-transparent hover:bg-black/5 transition-colors shrink-0" style={{ height: node.socketStride || 40 }}>
                <div className="flex flex-col justify-center h-full">
                    <span className="font-serif text-sm text-black leading-tight line-clamp-2">{p.title}</span>
                    <span className="text-[9px] text-gray-500 leading-none mt-1">{p.category}</span>
                </div>
                <div className="w-1 h-1 bg-black/20 rounded-full opacity-0 group-hover:opacity-100" />
              </div>
            ))}
            {projectList.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
                  <Plug size={16} className="text-gray-400" />
                  <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">Connect Work Experience</p>
                </div>
            )}
          </div>
        </div>
      );

    case NodeType.CV:
      return (
        <div className="flex flex-col h-full bg-[#FAFAF7] overflow-hidden">
           <div className="flex flex-col"> 
            {jobs.map((j) => (
              <div key={j.id} className="px-3 group flex items-center justify-between border-b border-transparent hover:bg-black/5 transition-colors shrink-0" style={{ height: node.socketStride || 40 }}>
                <div className="flex flex-col justify-center h-full w-[85%]">
                    <span className="font-serif text-sm text-black leading-tight line-clamp-1">{j.role}</span>
                    <span className="text-[9px] text-gray-500 leading-none mt-1 uppercase tracking-wide">{j.company} — {j.year}</span>
                </div>
                <div className="w-1 h-1 bg-black/20 rounded-full opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      );

    case NodeType.DETAILS:
      if (!upstreamData) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Project or Work Experience</span>
          </div>
        );
      }

      if (isJob(upstreamData)) {
         return (
            <div className="p-6 flex flex-col h-full overflow-y-auto bg-[#FAFAF7]">
                <div className="mb-4">
                    <h2 className="text-xl font-serif text-black leading-tight">{upstreamData.role}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{upstreamData.company}</p>
                </div>
                <p className="font-serif text-sm text-gray-800 leading-relaxed mb-4 italic">
                    {upstreamData.description}
                </p>
                {upstreamData.details && (
                    <ul className="list-disc list-inside space-y-1 mb-6">
                        {upstreamData.details.map((d, i) => (
                            <li key={i} className="text-xs text-gray-600 font-sans leading-relaxed">{d}</li>
                        ))}
                    </ul>
                )}
                <div className="mt-auto border-t border-black/10 pt-4">
                    <h3 className="text-[9px] tracking-widest uppercase text-gray-400">Timeline</h3>
                    <p className="text-xs">{upstreamData.year}</p>
                </div>
            </div>
         );
      }

      // Default: Project
      const hasImages = upstreamData.galleryUrls && upstreamData.galleryUrls.length > 0;
      const hasVideo = !!upstreamData.videoEmbedUrl;
      const has3D = !!upstreamData.modelUrl;
      const hasAnyContent = hasImages || hasVideo || has3D;

      return (
        <div className="p-6 flex flex-col h-full overflow-y-auto bg-[#FAFAF7]">
          <div className="mb-4">
            <h2 className="text-xl font-serif text-black leading-tight">{upstreamData.title}</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{upstreamData.category}</p>
          </div>

          {/* Summary */}
          {upstreamData.summaryHtml && (
            <div className="font-serif text-sm text-gray-800 leading-relaxed mb-4 italic prose prose-sm"
                 dangerouslySetInnerHTML={{ __html: upstreamData.summaryHtml }} />
          )}

          {/* Description */}
          {upstreamData.descriptionHtml && (
            <div className="font-sans text-xs text-gray-600 leading-relaxed mb-4 prose prose-sm"
                 dangerouslySetInnerHTML={{ __html: upstreamData.descriptionHtml }} />
          )}

          {!upstreamData.summaryHtml && !upstreamData.descriptionHtml && (
            <p className="font-sans text-xs text-gray-600 leading-relaxed mb-4">No description available.</p>
          )}

          <div className="mt-auto">
            <div className="grid grid-cols-2 gap-4 border-t border-black/10 pt-4 mb-3">
               <div><h3 className="text-[9px] tracking-widest uppercase text-gray-400">Role</h3><p className="text-xs">{upstreamData.role.join(', ')}</p></div>
               <div><h3 className="text-[9px] tracking-widest uppercase text-gray-400">Year</h3><p className="text-xs">{upstreamData.year}</p></div>
            </div>

            {/* Available Content */}
            {hasAnyContent && (
              <div className="border-t border-black/10 pt-3">
                <h3 className="text-[9px] tracking-widest uppercase text-gray-400 mb-2">Available Content</h3>
                <div className="flex gap-2">
                  {hasImages && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpawnNode?.(NodeType.IMAGE, node.id);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-black/5 hover:bg-black/10 transition-colors group"
                      title="Create Gallery node"
                    >
                      <ImageIcon size={12} className="text-black/60 group-hover:text-black" />
                      <span className="text-[9px] uppercase tracking-wider text-black/60 group-hover:text-black">Gallery</span>
                    </button>
                  )}
                  {hasVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpawnNode?.(NodeType.VIDEO, node.id);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-black/5 hover:bg-black/10 transition-colors group"
                      title="Create Video node"
                    >
                      <Video size={12} className="text-black/60 group-hover:text-black" />
                      <span className="text-[9px] uppercase tracking-wider text-black/60 group-hover:text-black">Video</span>
                    </button>
                  )}
                  {has3D && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSpawnNode?.(NodeType.VIEWER_3D, node.id);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-black/5 hover:bg-black/10 transition-colors group"
                      title="Create 3D Viewer node"
                    >
                      <Box size={12} className="text-black/60 group-hover:text-black" />
                      <span className="text-[9px] uppercase tracking-wider text-black/60 group-hover:text-black">3D</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case NodeType.IMAGE:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center bg-[#f0f0f0]">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
          </div>
        );
      }

      const gallery = upstreamData.galleryUrls || (upstreamData.heroImageUrl ? [upstreamData.heroImageUrl] : []);

      // Check if there are no images available for this project
      if (gallery.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center bg-[#f0f0f0]">
            <Plug size={16} />
            <span className="text-[10px] uppercase tracking-widest">Images Not Available for This Project</span>
            <span className="text-[9px] text-gray-500 mt-1">{upstreamData.title}</span>
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
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center">
        <Box size={16} />
        <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
      </div>
    );
  }

  // Check if 3D model is available for this project
  if (!upstreamData.modelUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center bg-[#FAFAF7]">
        <Box size={16} />
        <span className="text-[10px] uppercase tracking-widest">3D Not Available for This Project</span>
        <span className="text-[9px] text-gray-500 mt-1">{upstreamData.title}</span>
      </div>
    );
  }

  return (
    <>
      <ThreeScene
        geometryType={upstreamData.geometryType || 'cube'}
        modelUrl={upstreamData.modelUrl}
      />
      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-black/50 uppercase tracking-wider pointer-events-none z-20">
         Geo: {upstreamData.geometryType || 'Standard'}
      </div>
    </>
  );

    case NodeType.DATA:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 p-4 text-center bg-[#FAFAF7]">
            <BarChartIcon size={16} />
            <span className="text-[10px] uppercase tracking-widest">Waiting for Data...</span>
          </div>
        );
      }

      const stats = upstreamData.stats || { "Optimization": 80, "Complexity": 60 };
      const chartData = Object.entries(stats).map(([k, v]) => ({ name: k, value: typeof v === 'number' ? v : 0 }));

      return (
         <div className="p-4 h-full flex flex-col font-mono text-[10px] bg-[#FAFAF7]">
            <div className="h-32 w-full mt-auto">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '0px', border: 'none', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        />
                        <Bar dataKey="value" fill="#1a1a1a" radius={[2, 2, 0, 0]} barSize={30} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
         </div>
      );

    case NodeType.VIDEO:
      if (!upstreamData || !isProject(upstreamData)) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center bg-[#FAFAF7]">
            <Video size={16} />
            <span className="text-[10px] uppercase tracking-widest">Connect Input to Project</span>
          </div>
        );
      }

      // Check if video is available for this project
      if (!upstreamData.videoEmbedUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center bg-[#FAFAF7]">
            <Video size={16} />
            <span className="text-[10px] uppercase tracking-widest">Video Not Available for This Project</span>
            <span className="text-[9px] text-gray-500 mt-1">{upstreamData.title}</span>
          </div>
        );
      }

      return (
        <div className="w-full h-full relative bg-[#000000]">
          <iframe
            src={upstreamData.videoEmbedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={upstreamData.title}
          />
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/50 uppercase tracking-wider pointer-events-none z-20 bg-black/30 px-2 py-1 rounded">
            {upstreamData.slug}
          </div>
        </div>
      );

    case NodeType.CONTACT:
       return (
          <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
             <a href="mailto:hello@example.com" className="flex items-center gap-2 text-sm hover:underline"><Mail size={14}/> Email Me</a>
             <div className="w-full h-[1px] bg-black/10"></div>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">Open for collaborations</p>
          </div>
       )

    default:
      return <div className="p-4 text-gray-400 flex items-center justify-center h-full text-xs uppercase tracking-widest">Coming Soon</div>;
  }
};
