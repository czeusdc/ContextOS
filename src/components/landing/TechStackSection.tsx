import { motion } from 'motion/react';
import { Blocks, Box, Shield, Workflow, Cpu, Braces, Cloud, Globe } from 'lucide-react';

export function TechStackSection() {
  const stack = [
    { icon: <Blocks />, title: "Gemini 3.1 Pro", desc: "Long-context multimodal inference" },
    { icon: <Shield />, title: "Veea Edge", desc: "Policy-driven execution governance" },
    { icon: <Workflow />, title: "React Flow", desc: "Orchestration topology visualization" },
    { icon: <Box />, title: "LangGraph", desc: "Multi-agent coordination framework" },
    { icon: <Braces />, title: "TypeScript", desc: "Type-safe environment" },
    { icon: <Globe />, title: "TailwindCSS", desc: "Enterprise design system" },
    { icon: <Cloud />, title: "Google Cloud", desc: "Scale-ready infrastructure" },
    { icon: <Cpu />, title: "Node.js", desc: "High-throughput runtime" },
  ];

  return (
    <section className="py-32 bg-[#0a0a0f] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
            Built on enterprise-grade AI infrastructure.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stack.map((item, i) => (
             <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-colors group cursor-default"
             >
                <div className="text-slate-400 group-hover:text-indigo-400 transition-colors mb-4 *:w-6 *:h-6">
                  {item.icon}
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
             </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
