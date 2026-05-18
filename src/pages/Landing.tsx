import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ArchitectureSection } from '@/components/landing/ArchitectureSection';
import { MultiAgentSection } from '@/components/landing/MultiAgentSection';
import { TechStackSection } from '@/components/landing/TechStackSection';
import { RuntimePreviewSection } from '@/components/landing/RuntimePreviewSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { CTASection } from '@/components/landing/CTASection';

export function Landing() {
  useEffect(() => {
    document.title = "ContextOS — Agentic Workflow Governance";
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Navigation */}
      <nav className="h-24 flex items-center justify-between px-8 absolute top-0 inset-x-0 z-50">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8 drop-shadow-lg" />
          <span className="text-white font-semibold tracking-tight text-lg">ContextOS</span>
        </div>
        <Link 
          to="/upload" 
          className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold uppercase tracking-widest transition-all backdrop-blur-md"
        >
          Initialize System
        </Link>
      </nav>

      <main className="relative z-10 w-full flex flex-col">
        <HeroSection />
        <ProblemSection />
        <ArchitectureSection />
        <MultiAgentSection />
        <TechStackSection />
        <RuntimePreviewSection />
        <SecuritySection />
        <CTASection />
      </main>
      
      {/* Footer minimal line */}
      <footer className="border-t border-white/5 py-8 flex items-center justify-between px-8 text-xs font-mono text-slate-600 bg-[#0B0F19]">
        <div>© 2026 ContextOS Intelligence. All rights reserved.</div>
        <div className="flex gap-6">
          <span className="hover:text-slate-400 cursor-pointer">Security</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
          <span className="hover:text-slate-400 cursor-pointer">Terms</span>
        </div>
      </footer>
    </div>
  );
}

