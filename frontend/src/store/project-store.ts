import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { projectApi } from '@/lib/api';
import type {
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  UploadProgress,
} from '@/types';

interface ProjectState {
  projects: ProjectResponse[];
  currentProject: ProjectResponse | null;
  isLoading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  filters: ProjectFilters;
  totalPages: number;
  currentPage: number;
}

interface ProjectActions {
  fetchProjects: (page?: number, filters?: ProjectFilters) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<boolean>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  setCurrentProject: (project: ProjectResponse | null) => void;
  setUpdatedProject: (project: ProjectResponse) => void;
  refreshCurrentProject: () => Promise<void>;
  setFilters: (filters: ProjectFilters) => void;
  clearError: () => void;
  setUploadProgress: (progress: UploadProgress | null) => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      isLoading: false,
      uploadProgress: null,
      error: null,
      filters: {},
      totalPages: 0,
      currentPage: 1,

      // Actions
      fetchProjects: async (page = 1, filters?: ProjectFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          const activeFilters = filters || get().filters;
          const response = await projectApi.getProjects(page, 20, activeFilters);
          
          if (response.success && response.data) {
            set({
              projects: response.data.items,
              totalPages: response.data.totalPages,
              currentPage: page,
              filters: activeFilters,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch projects',
            isLoading: false,
          });
        }
      },

      fetchProject: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectApi.getProject(id);
          
          if (response.success && response.data) {
            set({
              currentProject: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch project',
            isLoading: false,
          });
        }
      },

      createProject: async (data: CreateProjectRequest) => {
        set({ isLoading: true, error: null, uploadProgress: null });
        
        try {
          const response = await projectApi.createProject(
            data,
            (progress) => set({ uploadProgress: progress })
          );
          
          if (response.success && response.data) {
            // Add new project to the beginning of the list
            set((state) => ({
              projects: [response.data!, ...state.projects],
              isLoading: false,
              uploadProgress: null,
              error: null,
            }));
            return true;
          } else {
            set({
              error: response.error as string,
              isLoading: false,
              uploadProgress: null,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create project',
            isLoading: false,
            uploadProgress: null,
          });
          return false;
        }
      },

      updateProject: async (id: string, data: UpdateProjectRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectApi.updateProject(id, data);
          
          if (response.success && response.data) {
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === id ? response.data! : p
              ),
              currentProject: state.currentProject?.id === id ? response.data! : state.currentProject,
              isLoading: false,
              error: null,
            }));
            return true;
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update project',
            isLoading: false,
          });
          return false;
        }
      },

      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectApi.deleteProject(id);
          
          if (response.success) {
            set((state) => ({
              projects: state.projects.filter((p) => p.id !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject,
              isLoading: false,
              error: null,
            }));
            return true;
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete project',
            isLoading: false,
          });
          return false;
        }
      },

      setCurrentProject: (project: ProjectResponse | null) => {
        set({ currentProject: project });
      },

      setUpdatedProject: (project: ProjectResponse) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? project : p
          ),
          currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
        }));
      },

      setFilters: (filters: ProjectFilters) => {
        set({ filters });
      },

      clearError: () => set({ error: null }),

      setUploadProgress: (progress: UploadProgress | null) => {
        set({ uploadProgress: progress });
      },

      refreshCurrentProject: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectApi.getProject(get().currentProject?.id || '');
          
          if (response.success && response.data) {
            set({
              currentProject: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh current project',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'project-store',
    }
  )
); 