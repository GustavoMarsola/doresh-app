
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <svg 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Torah scroll */}
        <rect x="4" y="8" width="40" height="32" rx="2" fill="currentColor" opacity="0.1"/>
        <rect x="6" y="10" width="36" height="28" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        
        {/* Scroll handles */}
        <rect x="2" y="6" width="2" height="36" rx="1" fill="currentColor"/>
        <rect x="44" y="6" width="2" height="36" rx="1" fill="currentColor"/>
        
        {/* Hebrew text lines */}
        <line x1="10" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
        <line x1="10" y1="20" x2="35" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
        <line x1="10" y1="24" x2="38" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
        <line x1="10" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
        <line x1="10" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.7"/>
      </svg>
    </div>
  );
};
