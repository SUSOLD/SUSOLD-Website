
import React from 'react';

const Logo = ({ width = 48, height = 48, className = "" }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Logo arka planı */}
      <rect width="200" height="200" rx="30" fill="url(#logo-gradient)" />
      
      {/* S harfi */}
      <path d="M55 75 C55 65, 80 60, 100 60 C125 60, 145 70, 145 85 C145 105, 115 110, 100 115 C85 120, 55 125, 55 140 C55 155, 80 165, 110 165 C130 165, 145 160, 145 145" 
        stroke="white" strokeWidth="15" strokeLinecap="round" fill="none" />
      
      {/* Alt çizgi */}
      <line x1="50" y1="140" x2="150" y2="140" stroke="rgba(255,255,255,0.6)" strokeWidth="5" />
    </svg>
  );
};

export default Logo;