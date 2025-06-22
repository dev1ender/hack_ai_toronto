import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProjectsPage } from '@/components/ProjectsPage';
import { ProjectDetailView } from '@/components/ProjectDetailView';
import { ProjectResponse } from '@/types/project';
import { useAuthStore, useProjectStore } from '@/store';

export function ProjectsRoute() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { currentProject, setCurrentProject } = useProjectStore();

  const handleProjectSelect = (project: ProjectResponse) => {
    navigate(`/projects/${project.id}`);
  };

  const handleSignOut = () => {
    logout();
    setCurrentProject(null);
    navigate('/', { replace: true });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      <Header 
        currentProjectTitle={currentProject?.title}
        showProjectInfo={!!currentProject}
        onSignOut={handleSignOut}
      />
      
      <Routes>
        {/* Projects list route */}
        <Route 
          index 
          element={
            <div className="flex-1 w-full overflow-hidden">
              <ProjectsPage onProjectSelect={handleProjectSelect} />
            </div>
          } 
        />
        
        {/* Project detail route */}
        <Route 
          path=":projectId" 
          element={<ProjectDetailView onProjectSelect={handleProjectSelect} />} 
        />
      </Routes>
    </div>
  );
} 