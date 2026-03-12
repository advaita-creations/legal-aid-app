import { motion } from 'framer-motion';

import { AnimatedCounter } from './AnimatedCounter';

const stats = [
  {
    value: 12500,
    suffix: '+',
    label: 'Documents Processed',
    description: 'Legal documents analyzed and validated',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    value: 4200,
    suffix: 'h',
    label: 'Hours Saved',
    description: 'Manual review time eliminated',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    value: 99,
    suffix: '.7%',
    label: 'Accuracy Rate',
    description: 'Industry-leading OCR precision',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    value: 500,
    suffix: '+',
    label: 'Active Advocates',
    description: 'Professionals trusting LegalAiD daily',
    gradient: 'from-orange-400 to-red-500',
  },
];

export function StatsSection() {
  return (
    <section className="relative bg-[#0A0E27] py-24">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

      <div className="pointer-events-none absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan-600/5 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-600/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {/* Gradient accent line */}
              <div
                className={`absolute left-0 right-0 top-0 h-px bg-gradient-to-r ${stat.gradient} opacity-50`}
              />

              <AnimatedCounter
                target={stat.value}
                suffix={stat.suffix}
                className={`block bg-gradient-to-r ${stat.gradient} bg-clip-text text-5xl font-black text-transparent`}
                duration={2.5}
              />
              <h3 className="mt-3 text-base font-bold text-white">
                {stat.label}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
