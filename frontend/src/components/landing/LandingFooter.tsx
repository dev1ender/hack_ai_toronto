import React from 'react';
import { SewingNeedleIcon } from '@/components/icons/SewingNeedleIcon';

interface LandingFooterProps {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export function LandingFooter({ onSignInClick, onSignUpClick }: LandingFooterProps) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative p-2 rounded-lg">
              <SewingNeedleIcon className="w-6 h-6 text-black" />
            </div>
            <span className="text-gray-900 font-semibold text-xl">TailorFrame</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8 text-sm">
            <button 
              onClick={() => window.scrollTo(0, 0)}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Home
            </button>
            <button 
              onClick={onSignInClick}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Sign in
            </button>
            <button 
              onClick={onSignUpClick}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 TailorFrame. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 