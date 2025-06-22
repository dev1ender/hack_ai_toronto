export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | object | null;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
} 