import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  UploadProgress,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
} from '@/types';
import { ProjectApiResponse, mapApiProjectToProject } from '@/types/project';

export class ProjectApi {
  /**
   * Get paginated list of projects
   */
  async getProjects(
    page: number = 1,
    pageSize: number = 20,
    filters?: ProjectFilters
  ): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await apiClient.get<PaginatedResponse<ProjectApiResponse>>(`/projects?${params}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(mapApiProjectToProject),
        },
      };
    }
    return response as ApiResponse<any>;
  }

  /**
   * Get single project by ID
   */
  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await apiClient.get<ProjectApiResponse>(`/projects/${id}`);
    if (response.success && response.data) {
      return { ...response, data: mapApiProjectToProject(response.data) };
    }
    return response as ApiResponse<any>;
  }

  /**
   * Create new project with video upload
   */
  async createProject(
    data: CreateProjectRequest,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<Project>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('video_file', data.videoFile);

    const response = await apiClient.upload<ProjectApiResponse>('/projects', formData, onProgress);
    if (response.success && response.data) {
      return { ...response, data: mapApiProjectToProject(response.data) };
    }
    return response as ApiResponse<any>;
  }

  /**
   * Update project
   */
  async updateProject(
    id: string,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    const response = await apiClient.put<ProjectApiResponse>(`/projects/${id}`, data);
    if (response.success && response.data) {
      return { ...response, data: mapApiProjectToProject(response.data) };
    }
    return response as ApiResponse<any>;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/projects/${id}`);
  }

  /**
   * Get project video stream URL
   */
  async getVideoStreamUrl(id: string): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get<{ url:string }>(`/projects/${id}/video`);
  }

  /**
   * Get project thumbnail URL
   */
  async getThumbnailUrl(id: string): Promise<ApiResponse<{ url: string }>> {
    return apiClient.get<{ url: string }>(`/projects/${id}/thumbnail`);
  }

  /**
   * Replace project video file
   */
  async replaceVideo(
    id: string,
    videoFile: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<Project>> {
    const formData = new FormData();
    formData.append('video_file', videoFile);

    const response = await apiClient.upload<ProjectApiResponse>(
      `/projects/${id}/video`,
      formData,
      onProgress,
      { method: 'PUT' }
    );
    if (response.success && response.data) {
      return { ...response, data: mapApiProjectToProject(response.data) };
    }
    return response as ApiResponse<any>;
  }

  /**
   * Generate project thumbnail
   */
  async generateThumbnail(
    id: string,
    timeSeconds: number = 0
  ): Promise<ApiResponse<{ thumbnailUrl: string }>> {
    return apiClient.post<{ thumbnailUrl: string }>(`/projects/${id}/thumbnail`, {
      timeSeconds,
    });
  }

  /**
   * Get project processing status
   */
  async getProcessingStatus(id: string): Promise<ApiResponse<{
    status: Project['status'];
    progress?: number;
    message?: string;
  }>> {
    return apiClient.get(`/projects/${id}/status`);
  }

  /**
   * Search projects
   */
  async searchProjects(
    query: string,
    limit: number = 10
  ): Promise<ApiResponse<Project[]>> {
    const response = await apiClient.get<ProjectApiResponse[]>(`/projects/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (response.success && response.data) {
      return { ...response, data: response.data.map(mapApiProjectToProject) };
    }
    return response as ApiResponse<any>;
  }

  async applyTranscriptChanges(projectId: string, changes: any[]): Promise<ApiResponse<Project>> {
    const response = await apiClient.post<ProjectApiResponse>(
      `/projects/${projectId}/apply-changes`,
      { changes }
    );
    if (response.success && response.data) {
      return { ...response, data: mapApiProjectToProject(response.data) };
    }
    return response as ApiResponse<any>;
  }
}

export const projectApi = new ProjectApi(); 