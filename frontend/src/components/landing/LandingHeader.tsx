import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SewingNeedleIcon } from '@/components/icons/SewingNeedleIcon';

interface LandingHeaderProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export function LandingHeader({ onSignInClick, onSignUpClick }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative p-2 rounded-lg transition-all duration-200">
                <SewingNeedleIcon className="w-6 h-6 text-black" />
              </div>
              <span className="text-gray-900 font-semibold text-lg">TailorFrame</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={onSignInClick}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            >
              Sign In
            </Button>
            <Button 
              onClick={onSignUpClick}
              className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-black/25"
            >
              Sign up
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Button 
                variant="ghost"
                onClick={onSignInClick}
                className="block w-full text-left text-gray-600 hover:text-gray-900 px-4 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              >
                Sign In
              </Button>
              <Button 
                onClick={onSignUpClick}
                className="block w-full bg-black hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Sign up
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 