import React from 'react';
import { Logo } from '@/components/ui/logo';

export function LogoShot() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 text-white font-sans">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center justify-center w-48 h-48 bg-indigo-500/20 border border-indigo-500/30 rounded-3xl shadow-[0_0_100px_rgba(99,102,241,0.2)]">
          <Logo className="w-24 h-24" />
        </div>
        <div className="text-center mt-4">
          <h1 className="font-bold text-7xl tracking-tight leading-none mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>ContextOS</h1>
          <p className="text-lg text-slate-400 uppercase tracking-[0.3em] font-medium mt-4">Executive Intelligence</p>
        </div>
      </div>
    </div>
  );
}
