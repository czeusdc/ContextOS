import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-40 bg-[#0B0F19] relative overflow-hidden border-t border-white/5">
      {/* Mesh background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-[100%] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Operational orchestration for the <br/> AI-native enterprise.
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Transform undocumented workflows into structured, governed execution graphs.
          </p>

          <div className="flex justify-center items-center gap-4">
            <Link 
              to="/upload" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-white text-black hover:scale-105 transition-transform duration-300 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Launch ContextOS
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="mt-8">
            <Link to="/report" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm font-medium">
              Already have a workflow? <span className="underline underline-offset-4 decoration-indigo-500/30">View Session Report →</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
