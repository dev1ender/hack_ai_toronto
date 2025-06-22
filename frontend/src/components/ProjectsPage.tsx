import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, FolderOpen, AlertCircle, Loader2 } from 'lucide-react';
import { ProjectResponse } from '@/types/project';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { useProjectStore } from '@/store/project-store';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectsPageProps {
  onProjectSelect: (project: ProjectResponse) => void;
}

export function ProjectsPage({ onProjectSelect }: ProjectsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const {
    projects,
    isLoading,
    error,
    currentPage,
    totalPages,
    fetchProjects,
    deleteProject,
    updateProject,
    clearError,
    filters,
    setFilters
  } = useProjectStore();

  // Load projects on component mount and when filters change
  useEffect(() => {
    const projectFilters = {
      status: statusFilter === 'all' ? undefined : (statusFilter as 'uploading' | 'processing' | 'completed' | 'error'),
      search: searchQuery || undefined,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const
    };
    
    setFilters(projectFilters);
    fetchProjects(1, projectFilters);
  }, [statusFilter, searchQuery, fetchProjects, setFilters]);

  const handleCreateProject = async () => {
    // The CreateProjectModal will handle the actual creation
    // After successful creation, we refresh the projects list
    await fetchProjects(currentPage, filters);
  };

  const handleUpdateProject = async (id: string, updates: Partial<ProjectResponse>) => {
    try {
      await updateProject(id, updates);
      // Projects will be automatically updated in the store
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      // Project will be automatically removed from the store
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handlePageChange = (page: number) => {
    fetchProjects(page, filters);
  };

  const getStatusCount = (status: string) => {
    if (!projects || !Array.isArray(projects)) return 0;
    if (status === 'all') return projects.length;
    return projects.filter(p => p.status === status).length;
  };

  // Show loading state on initial load
  if (isLoading && (!projects || projects.length === 0)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage your video transcription projects
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button variant="ghost" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters and Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    All Projects ({getStatusCount('all')})
                  </div>
                </SelectItem>
                <SelectItem value="completed" className="hover:bg-green-50 dark:hover:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-700 dark:text-green-400">
                      Completed ({getStatusCount('completed')})
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="processing" className="hover:bg-blue-50 dark:hover:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-blue-700 dark:text-blue-400">
                      Processing ({getStatusCount('processing')})
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="error" className="hover:bg-red-50 dark:hover:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-700 dark:text-red-400">
                      Error ({getStatusCount('error')})
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Summary */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                {getStatusCount('completed')} Completed
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                {getStatusCount('processing')} Processing
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                {getStatusCount('uploading')} Uploading
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {getStatusCount('error')} Error
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!projects || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first project to start transcribing videos.'
                }
              </p>
            </div>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
                             {projects.map((project) => (
                 <ProjectCard
                   key={project.id}
                   project={project}
                   onProjectClick={onProjectSelect}
                   onUpdateProject={handleUpdateProject}
                   onDeleteProject={handleDeleteProject}
                 />
               ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Loading overlay for pagination */}
            {isLoading && projects.length > 0 && (
              <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-background p-4 rounded-lg border shadow-lg">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading projects...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}