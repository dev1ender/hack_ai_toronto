import React from 'react';

interface ProfilePhotoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function ProfilePhoto({ 
  className = '', 
  size, 
  width = size || 32, 
  height = size || 32, 
  ...props 
}: ProfilePhotoProps) {
  return (
    <div className="relative">
      {/* Profile photo content */}
      <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          {...props}
        >
          <circle cx="20" cy="20" r="19.5" stroke="#e5e7eb" strokeWidth="1"/>
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M20 20C23.3137 20 26 17.3137 26 14C26 10.6863 23.3137 8 20 8C16.6863 8 14 10.6863 14 14C14 17.3137 16.6863 20 20 20ZM20 32C26.6274 32 32 30.2091 32 28C32 25.7909 26.6274 24 20 24C13.3726 24 8 25.7909 8 28C8 30.2091 13.3726 32 20 32Z" 
            fill="#374151"
          />
        </svg>
      </div>
    </div>
  );
}