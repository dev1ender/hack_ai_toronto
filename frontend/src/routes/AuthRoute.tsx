import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthPage } from '@/components/AuthPage';
import { useAuthStore } from '@/store';

export function AuthRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect to projects if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return <AuthPage />;
} 