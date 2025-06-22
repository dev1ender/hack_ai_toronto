import { buildMediaUrl } from '@/lib/utils';

export interface Project {
  id: string;
  title: string;
  description?: string;
  videoFile?: File;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  fileSize?: number; // in bytes
  mimeType?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  videoFile: File;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: Project['status'];
}

export interface ProjectResponse {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  status: Project['status'];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ProjectFilters {
  status?: Project['status'];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// For API communication, matching backend's snake_case
export interface ProjectApiResponse {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  file_size?: number;
  mime_type?: string;
  status: Project['status'];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function mapApiProjectToProject(apiProject: ProjectApiResponse): Project {
  return {
    id: apiProject.id,
    title: apiProject.title,
    description: apiProject.description,
    videoUrl: apiProject.video_url ? buildMediaUrl(apiProject.video_url) : undefined,
    thumbnailUrl: apiProject.thumbnail_url ? buildMediaUrl(apiProject.thumbnail_url) : undefined,
    duration: apiProject.duration,
    fileSize: apiProject.file_size,
    mimeType: apiProject.mime_type,
    status: apiProject.status,
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    userId: apiProject.user_id,
  };
}