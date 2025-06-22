import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // High-quality images from Pexels with descriptive subtitles and detailed descriptions
  const images = [
    {
      url: 'https://images.pexels.com/photos/3184300/pexels-photo-3184300.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Professional video production setup with cameras, lighting equipment, and monitors in a modern studio environment',
      subtitle: 'Professional Video Production Setup',
      description: 'State-of-the-art video production facility featuring professional cameras, advanced lighting systems, and high-resolution monitors for content creation and post-production workflows.'
    },
    {
      url: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Creative content creation workspace with editing equipment, computers, and design tools for digital media production',
      subtitle: 'Creative Content Creation Workspace',
      description: 'Modern creative workspace equipped with professional editing software, high-performance computers, and specialized tools designed for digital content creation and multimedia production.'
    },
    {
      url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Modern video editing environment showcasing professional workstations and cutting-edge technology for media production',
      subtitle: 'Modern Video Editing Environment',
      description: 'Advanced video editing suite featuring professional workstations, multiple displays, and industry-standard software for seamless post-production and content refinement processes.'
    },
    {
      url: 'https://images.pexels.com/photos/3184341/pexels-photo-3184341.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Digital content production studio with professional equipment, streaming setup, and broadcast-quality recording capabilities',
      subtitle: 'Digital Content Production Studio',
      description: 'Comprehensive digital production studio with broadcast-quality equipment, professional streaming capabilities, and advanced recording technology for creating high-impact multimedia content.'
    },
    {
      url: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Professional media creation tools including cameras, audio equipment, and technical devices for content production',
      subtitle: 'Professional Media Creation Tools',
      description: 'Professional-grade media creation toolkit featuring high-end cameras, studio-quality audio equipment, and specialized technical devices for producing broadcast-ready content.'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            What's our Workflow?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From upload to download, witness how TailorFrame works to save you time, money and not sweat the small edits
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Image Container */}
          <div className="relative aspect-video bg-white rounded-2xl overflow-hidden group">
            {/* Images */}
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((image, index) => (
                <div key={index} className="w-full flex-shrink-0 relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  {/* Bottom Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                    <p className="text-white text-base font-sans text-center px-4" style={{ marginBottom: '20px', fontFamily: 'Arial, sans-serif', fontSize: '16px' }}>
                      {image.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <Button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-white p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/25 opacity-80 hover:opacity-100"
              size="icon"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-white p-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/25 opacity-80 hover:opacity-100"
              size="icon"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Gradient overlays for better arrow visibility */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
          </div>

          {/* Static Description Container with Rounded Corners */}
          <div className="mt-0 max-w-5xl mx-auto">
            <div 
              className="text-center px-2 rounded-2xl"
              style={{ backgroundColor: '#f0f0f0', padding: '8px' }}
            >
              <p className="text-gray-800 text-base leading-relaxed font-medium">
                {images[currentIndex].description}
              </p>
            </div>
          </div>

          {/* Position Indicators */}
          <div className="flex justify-center items-center mt-4 space-x-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-black' 
                    : 'w-6 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="text-center mt-2">
            <span className="text-sm text-gray-500 font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
} 