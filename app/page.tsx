import { getAllProjects } from '@/lib/projects';
import LandingPageAnimation from '@/components/LandingPageAnimation';

export default function Home() {
  const projects = getAllProjects();

  return (
    // Crucial: w-screen h-screen ensures the canvas takes up the full window
    <main className="w-screen h-screen overflow-hidden bg-[#FAFAF7]">
      <LandingPageAnimation initialProjects={projects} />
    </main>
  );
}