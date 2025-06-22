import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authApi, type AuthUser, type AuthLoginRequest, type AuthRegisterRequest } from '@/lib/api/auth-api';
import type { LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,

        // Actions
        login: async (data: LoginRequest) => {
          set({ isLoading: true, error: null });
          
          try {
            const authLoginData: AuthLoginRequest = {
              email: data.email,
              password: data.password,
            };
            
            const response = await authApi.login(authLoginData);
            
            if (response.success && response.data) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return true;
            } else {
              set({
                error: response.error as string,
                isLoading: false,
                isAuthenticated: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false,
              isAuthenticated: false,
            });
            return false;
          }
        },

        register: async (data: RegisterRequest) => {
          set({ isLoading: true, error: null });
          
          try {
            const authRegisterData: AuthRegisterRequest = {
              email: data.email,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
            };
            
            const response = await authApi.register(authRegisterData);
            
            if (response.success && response.data) {
              set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return true;
            } else {
              set({
                error: response.error as string,
                isLoading: false,
                isAuthenticated: false,
              });
              return false;
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Registration failed',
              isLoading: false,
              isAuthenticated: false,
            });
            return false;
          }
        },

        logout: () => {
          authApi.logout();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        },

        fetchCurrentUser: async () => {
          // Check if we have tokens in localStorage
          const token = localStorage.getItem('auth_token');
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ isLoading: true });
          
          try {
            const response = await authApi.getCurrentUser();
            
            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: response.error as string,
              });
            }
          } catch (error) {
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
            });
          }
        },

        updateProfile: async (data: Partial<AuthUser>) => {
          set({ isLoading: true, error: null });
          
          try {
            const updateData = {
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
              avatar: data.avatar,
            };
            
            const response = await authApi.updateProfile(updateData);
            
            if (response.success && response.data) {
              set({
                user: response.data,
                isLoading: false,
                error: null,
              });
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
              error: error instanceof Error ? error.message : 'Profile update failed',
              isLoading: false,
            });
            return false;
          }
        },

        clearError: () => set({ error: null }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Listen for auth logout events
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
} 