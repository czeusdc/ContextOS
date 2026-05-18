import { motion } from 'motion/react';
import { Database, UserX, EyeOff } from 'lucide-react';

export function ProblemSection() {
  return (
    <section className="py-32 bg-[#0a0a0f] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            The invisible operational crisis.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Modern enterprises face massive friction because processes are undocumented, fragmented, and manually coordinated. Critical workflows remain trapped as tribal knowledge.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Database className="w-6 h-6" />,
              title: "Fragmented Infrastructure",
              desc: "Legacy systems operate independently, forcing teams to manually bridge data gaps between rigid silos."
            },
            {
              icon: <UserX className="w-6 h-6" />,
              title: "Human Workflow Bottlenecks",
              desc: "Execution relies heavily on employee memory. When seniors leave, undocumented operational knowledge is lost."
            },
            {
              icon: <EyeOff className="w-6 h-6" />,
              title: "Zero Operational Visibility",
              desc: "Leaders cannot visualize, simulate, or govern how work actually flows, making security enforcement and efficiency audits nearly impossible."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="p-8 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 group-hover:text-amber-400 group-hover:border-amber-400/30 group-hover:-translate-y-1 transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
