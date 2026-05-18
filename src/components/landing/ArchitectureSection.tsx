import { motion } from 'motion/react';
import { Eye, BrainCircuit, Workflow, ShieldCheck } from 'lucide-react';

export function ArchitectureSection() {
  const steps = [
    {
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      title: "Observe",
      desc: "Ingest SOPs, screens, and logs",
      border: "border-indigo-500/20",
      bg: "bg-indigo-500/5"
    },
    {
      icon: <BrainCircuit className="w-5 h-5 text-violet-400" />,
      title: "Reason",
      desc: "Gemini infers workflow structure",
      border: "border-violet-500/20",
      bg: "bg-violet-500/5"
    },
    {
      icon: <Workflow className="w-5 h-5 text-blue-400" />,
      title: "Generate",
      desc: "Model execution-ready topologies",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5"
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: "Execute Securely",
      desc: "Policy-governed integration",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/5"
    }
  ];

  return (
    <section className="py-32 bg-[#0B0F19] relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            From operational chaos <br className="hidden md:block"/> to structured orchestration.
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 hidden lg:block -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className={`p-8 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-md relative`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-3">
                  Step 0{i + 1}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
