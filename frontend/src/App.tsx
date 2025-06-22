import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingRoute, AuthRoute, ProjectsRoute } from '@/routes';
import { useAuthStore } from '@/store';
import { Loader2 } from 'lucide-react';

function App() {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      // Check for token and validate it
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetchCurrentUser();
      }
      setIsAuthChecked(true);
    };

    checkAuth();
  }, [fetchCurrentUser]);

  // Show a loader while checking for authentication status
  if (!isAuthChecked) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/" element={<LandingRoute />} />
        
        {/* Auth route with redirection logic */}
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? <Navigate to="/projects" replace /> : <AuthRoute />
          } 
        />
        
        {/* Protected projects route */}
        <Route 
          path="/projects/*" 
          element={
            isAuthenticated ? <ProjectsRoute /> : <Navigate to="/auth" replace />
          } 
        />
        
        {/* Catch all route - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;