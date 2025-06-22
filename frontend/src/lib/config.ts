/**
 * Application configuration
 * Centralized configuration management for environment variables and API settings
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds
  },
  
  // App Configuration
  app: {
    name: 'TailorFrame',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },
  
  // Feature Flags
  features: {
    enableDebugMode: import.meta.env.DEV || false,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
} as const;

export type Config = typeof config; 