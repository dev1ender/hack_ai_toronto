import type { ApiResponse, ApiError, UploadProgress } from '@/types';
import { config } from '@/lib/config';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  onUploadProgress?: (progress: UploadProgress) => void;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    // Use centralized configuration
    this.baseUrl = config.api.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private removeAuthToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  public setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data && apiResponse.data.access_token) {
          this.setTokens(apiResponse.data.access_token, apiResponse.data.refresh_token || refreshToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.removeAuthToken();
    return false;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, onUploadProgress, ...fetchOptions } = options;
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(this.defaultHeaders);

    // Add auth token if not skipped
    if (!skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Handle FormData - don't set Content-Type for uploads
    if (fetchOptions.body instanceof FormData) {
      headers.delete('Content-Type');
    }

    // Merge headers
    if (fetchOptions.headers) {
      Object.entries(fetchOptions.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers.set(key, value);
        }
      });
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    try {
      let response: Response;

      // Handle upload progress if callback provided
      if (onUploadProgress && fetchOptions.body instanceof FormData) {
        response = await this.fetchWithProgress(url, config, onUploadProgress);
      } else {
        response = await fetch(url, config);
      }

      // Handle 401 - try to refresh token
      if (response.status === 401 && !skipAuth) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          headers.set('Authorization', `Bearer ${this.getAuthToken()}`);
          response = await fetch(url, { ...config, headers });
        } else {
          // Redirect to login or emit auth error
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return {
            success: false,
            data: null,
            error: 'Authentication required',
          };
        }
      }

      const data = await response.json();

      if (response.ok) {
        // Check if the backend already returns an ApiResponse structure
        if (data && typeof data === 'object' && 'success' in data) {
          // Backend returns ApiResponse structure, return it as-is
          return data;
        } else {
          // Backend returns raw data, wrap it
          return {
            success: true,
            data,
            error: null,
          };
        }
      } else {
        // Handle error response
        if (data && typeof data === 'object' && 'success' in data) {
          // Backend returns ApiResponse error structure
          return data;
        } else {
          return {
            success: false,
            data: null,
            error: data.message || data.error || 'Request failed',
          };
        }
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async fetchWithProgress(
    url: string,
    config: RequestInit,
    onProgress: (progress: UploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress: UploadProgress = {
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
            const [key, value] = line.split(': ');
            if (key && value) headers[key] = value;
            return headers;
          }, {} as Record<string, string>)),
        });
        resolve(response);
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open(config.method || 'GET', url);

      // Set headers
      if (config.headers) {
        if (config.headers instanceof Headers) {
          config.headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        } else {
          Object.entries(config.headers).forEach(([key, value]) => {
            if (typeof value === 'string') {
              xhr.setRequestHeader(key, value);
            }
          });
        }
      }

      xhr.send(config.body as any);
    });
  }

  // Public methods
  public get<T = any>(endpoint: string, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, data?: any, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public put<T = any>(endpoint: string, data?: any, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, data?: any, options: RequestOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options: RequestOptions = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public upload<T = any>(
    endpoint: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void,
    options: RequestOptions = {}
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      onUploadProgress: onProgress,
    });
  }

  public logout(): void {
    this.removeAuthToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 