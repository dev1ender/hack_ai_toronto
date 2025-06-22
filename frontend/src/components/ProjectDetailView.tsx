import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ProjectsPage } from '@/components/ProjectsPage';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ProjectResponse } from '@/types/project';
import { useProjectStore } from '@/store';
import { Loader2 } from 'lucide-react';

interface ProjectDetailViewProps {
  onProjectSelect: (project: ProjectResponse) => void;
}

export function ProjectDetailView({ onProjectSelect }: ProjectDetailViewProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject } = useProjectStore();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadProject = async () => {
      if (projectId && (!currentProject || currentProject.id !== projectId)) {
        setIsLoading(true);
        try {
          await fetchProject(projectId);
        } catch (error) {
          console.error('Failed to load project:', error);
          // Redirect to projects list if project not found
          navigate('/projects', { replace: true });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProject();
  }, [projectId, currentProject, fetchProject, navigate]);

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  // Show loading while fetching project
  if (isLoading) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show projects list if no current project
  if (!currentProject) {
    return (
      <div className="flex-1 w-full overflow-hidden">
        <ProjectsPage onProjectSelect={onProjectSelect} />
      </div>
    );
  }

  // Show transcription interface
  return (
    <div className="flex-1 w-full overflow-hidden">
      <div className="flex-1 overflow-hidden h-full">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
            <TranscriptPanel onBack={handleBackToProjects} selectedProject={currentProject} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={40} maxSize={70}>
            <VideoPlayer selectedProject={currentProject} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 