
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '@/components/LandingPage';

export function LandingRoute() {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate('/auth');
  };

  const handleSignUpClick = () => {
    navigate('/auth');
  };

  return (
    <LandingPage 
      onSignInClick={handleSignInClick}
      onSignUpClick={handleSignUpClick}
    />
  );
} 