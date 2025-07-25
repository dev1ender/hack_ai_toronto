import React from 'react';

interface CheckmarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

export function Checkmark({ 
  size = 24, 
  color = 'currentColor', 
  className = '',
  width = size,
  height = size,
  fill,
  ...props 
}: CheckmarkProps) {
  return (
    <svg
      width={width || size}
      height={height || size}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Checkmark"
      {...props}
    >
      <path
        fill={fill || color}
        d="M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032Z"
      />
    </svg>
  );
}