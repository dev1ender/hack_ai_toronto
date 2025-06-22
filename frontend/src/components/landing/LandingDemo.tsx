import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingDemoProps {
  onSignUpClick?: () => void;
}

export function LandingDemo({ onSignUpClick }: LandingDemoProps) {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            TailorFrame's Demo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See TailorFrame in action and discover how easy it is to make your message clear without a do-over
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-2xl overflow-hidden group">
            {/* Video Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-black/10 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-black/20 transition-colors duration-300">
                  <Play className="w-8 h-8 text-gray-600 ml-1" />
                </div>
                <p className="text-gray-500 font-medium">Video Demo Coming Soon</p>
              </div>
            </div>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="absolute top-4 left-10 w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="absolute top-4 left-16 w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center items-center mt-6 animate-fade-in-up animation-delay-600">
          <Button 
            onClick={onSignUpClick}
            className="group bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/25 flex items-center gap-2"
          >
            Sign up
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </section>
  );
} 