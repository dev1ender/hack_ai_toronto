import { useAuthStore } from '@/store';
import type { LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    clearError,
  } = useAuthStore();

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,

    // Actions
    login: async (data: LoginRequest) => {
      clearError();
      return login(data);
    },

    register: async (data: RegisterRequest) => {
      clearError();
      return register(data);
    },

    logout,
    fetchCurrentUser,
    updateProfile,
    clearError,

    // Computed
    isLoggedIn: isAuthenticated && !!user,
    userDisplayName: user?.firstName || user?.username || user?.email?.split('@')[0] || 'User',
  };
} 