import React from 'react';

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-top" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" /> {/* blue-500 */}
          <stop offset="100%" stopColor="#60A5FA" /> {/* blue-400 */}
        </linearGradient>
        <linearGradient id="logo-right" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" /> {/* indigo-400 */}
          <stop offset="100%" stopColor="#4F46E5" /> {/* indigo-600 */}
        </linearGradient>
        <linearGradient id="logo-bottom" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3730A3" /> {/* indigo-800 */}
          <stop offset="100%" stopColor="#1E3A8A" /> {/* blue-900 */}
        </linearGradient>
        <linearGradient id="logo-left" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" /> {/* blue-600 */}
          <stop offset="100%" stopColor="#3B82F6" /> {/* blue-500 */}
        </linearGradient>
      </defs>
      
      {/* Inspired by Google Workspace modular geometric logos */}
      {/* Left vertical pill */}
      <rect x="2" y="7" width="5.5" height="15" rx="2.75" fill="url(#logo-left)" />
      {/* Top horizontal pill */}
      <rect x="2" y="2" width="15" height="5.5" rx="2.75" fill="url(#logo-top)" />
      {/* Right vertical pill */}
      <rect x="16.5" y="2" width="5.5" height="15" rx="2.75" fill="url(#logo-right)" />
      {/* Bottom horizontal pill */}
      <rect x="7" y="16.5" width="15" height="5.5" rx="2.75" fill="url(#logo-bottom)" />
    </svg>
  );
}
