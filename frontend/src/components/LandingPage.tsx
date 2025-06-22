
import { LandingHeader } from './landing/LandingHeader';
import { LandingHero } from './landing/LandingHero';
import { LandingCarousel } from './landing/LandingCarousel';
import { LandingDemo } from './landing/LandingDemo';
import { LandingFooter } from './landing/LandingFooter';

interface LandingPageProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export function LandingPage({ onSignInClick, onSignUpClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onSignInClick={onSignInClick} onSignUpClick={onSignUpClick} />
      <LandingHero onSignUpClick={onSignUpClick} />
      <LandingCarousel />
      <LandingDemo onSignUpClick={onSignUpClick} />
      <LandingFooter onSignInClick={onSignInClick} onSignUpClick={onSignUpClick} />
    </div>
  );
} 