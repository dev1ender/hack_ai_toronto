import { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingHeroProps {
  onSignUpClick?: () => void;
}

export function LandingHero({ onSignUpClick }: LandingHeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create floating particles animation
    const createParticle = () => {
      if (!particlesRef.current) return;
      
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-blue-400/40 rounded-full animate-float';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 3 + 's';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      particlesRef.current.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 5000);
    };

    const interval = setInterval(createParticle, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-gray-100 pt-32 pb-24"
    >
      {/* Animated background particles */}
      <div 
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      />
      
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5" />
      
      {/* Floating elements - positioned within content margins */}
      <div className="absolute top-32 left-4 sm:left-8 lg:left-16 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-4 sm:right-8 lg:right-16 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse animation-delay-1000" />
      <div className="absolute top-1/2 left-1/3 sm:left-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-lg animate-bounce animation-delay-2000" />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up animation-delay-200">
          Don't Reshoot,
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Rebrand
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
          TailorFrame clarifies your message and updates your brand without doing it from scratch
        </p>

        {/* CTA Button */}
        <div className="flex justify-center items-center mb-20 animate-fade-in-up animation-delay-600">
          <Button 
            onClick={onSignUpClick}
            className="group bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-black/25 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
          {[
            { icon: <Clock className="w-5 h-5" />, title: "Simple Workflow", desc: "Save your time, money and momentum. It's as simple as upload, edit, download and post" },
            { icon: <Sparkles className="w-5 h-5" />, title: "Keep your Quality", desc: "Keep the original footage and edit the outdated audio with a simple edit to your video transcript" },
            { icon: <User className="w-5 h-5" />, title: "Clarify your Rebrand", desc: "Don't let outdated or unclear messaging damage your brand and confuse your audience" }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:bg-white/80 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <h3 className="text-gray-900 font-semibold text-lg mb-2 flex items-center gap-2">
                <span className="text-blue-600 group-hover:scale-110 transition-transform duration-200">
                  {feature.icon}
                </span>
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced bottom gradient fade for better separation */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-gray-50/80 to-transparent" />

      {/* Add custom styles for animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.3;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
} 