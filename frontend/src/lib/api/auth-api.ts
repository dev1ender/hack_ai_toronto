import { apiClient } from './client';
import type { ApiResponse } from '@/types';

// API Response Types - matches backend exactly (snake_case)
export interface AuthApiResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
  };
}

export interface UserApiResponse {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// Frontend Types (camelCase) - redefining to avoid conflicts
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: AuthUser;
}

// Request Types for API calls (will be mapped to snake_case when sent)
export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface AuthUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
}

export interface AuthChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Mapping Functions
export function mapApiUserToUser(apiUser: UserApiResponse): AuthUser {
  return {
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    avatar: apiUser.avatar,
    role: apiUser.role,
    createdAt: apiUser.created_at,
    updatedAt: apiUser.updated_at,
  };
}

export function mapApiAuthToAuth(apiAuth: AuthApiResponse): AuthData {
  return {
    accessToken: apiAuth.access_token,
    refreshToken: apiAuth.refresh_token,
    tokenType: apiAuth.token_type,
    user: mapApiUserToUser(apiAuth.user),
  };
}

// Request mapping functions (frontend camelCase -> backend snake_case)
export function mapRegisterRequestToApi(request: AuthRegisterRequest) {
  return {
    email: request.email,
    password: request.password,
    first_name: request.firstName,
    last_name: request.lastName,
    username: request.username,
  };
}

export function mapUpdateProfileRequestToApi(request: AuthUpdateProfileRequest) {
  return {
    first_name: request.firstName,
    last_name: request.lastName,
    username: request.username,
    avatar: request.avatar,
  };
}

export function mapChangePasswordRequestToApi(request: AuthChangePasswordRequest) {
  return {
    current_password: request.currentPassword,
    new_password: request.newPassword,
  };
}

/**
 * Authentication API client
 */
export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: AuthLoginRequest): Promise<ApiResponse<AuthData>> {
    // Remove the automatic conversion since we're handling it manually
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const wrappedResponse = await response.json();
      const apiData: AuthApiResponse = wrappedResponse.data;
      const authData = mapApiAuthToAuth(apiData);
      
      // Store tokens
      apiClient.setTokens(authData.accessToken, authData.refreshToken);
      
      return {
        success: true,
        data: authData,
        error: null,
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        data: null,
        error: errorData.detail || 'Login failed',
      };
    }
  },

  /**
   * Register a new user
   */
  async register(userData: AuthRegisterRequest): Promise<ApiResponse<AuthData>> {
    const apiRequest = mapRegisterRequestToApi(userData);
    
    const response = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (response.ok) {
      const wrappedResponse = await response.json();
      const apiData: AuthApiResponse = wrappedResponse.data;
      const authData = mapApiAuthToAuth(apiData);
      
      // Store tokens
      apiClient.setTokens(authData.accessToken, authData.refreshToken);
      
      return {
        success: true,
        data: authData,
        error: null,
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        data: null,
        error: errorData.detail || 'Registration failed',
      };
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    const response = await apiClient.get<UserApiResponse>('/users/me');
    
    if (response.success && response.data) {
      const user = mapApiUserToUser(response.data);
      return {
        success: true,
        data: user,
        error: null,
      };
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: AuthUpdateProfileRequest): Promise<ApiResponse<AuthUser>> {
    const apiRequest = mapUpdateProfileRequestToApi(profileData);
    const response = await apiClient.patch<UserApiResponse>('/users/me', apiRequest);
    
    if (response.success && response.data) {
      const user = mapApiUserToUser(response.data);
      return {
        success: true,
        data: user,
        error: null,
      };
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
    };
  },

  /**
   * Change password
   */
  async changePassword(passwordData: AuthChangePasswordRequest): Promise<ApiResponse<void>> {
    const apiRequest = mapChangePasswordRequestToApi(passwordData);
    const response = await apiClient.post<void>('/auth/change-password', apiRequest);
    
    return response;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh', 
      { refresh_token: refreshToken }, 
      { skipAuth: true }
    );
    
    if (response.success && response.data) {
      return {
        success: true,
        data: { accessToken: response.data.access_token },
        error: null,
      };
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
    };
  },

  /**
   * Logout user
   */
  logout(): void {
    apiClient.logout();
  },
}; 