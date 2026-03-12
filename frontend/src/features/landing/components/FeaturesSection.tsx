import { motion } from 'framer-motion';
import {
  Brain,
  Zap,
  Shield,
  FileSearch,
  BarChart3,
  Clock,
} from 'lucide-react';

import { GlassCard } from './GlassCard';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered OCR',
    description:
      'Industry-leading 99.7% accuracy extracts every word, table, and clause from scanned legal documents — instantly.',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'shadow-cyan-500/20',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    description:
      'What used to take hours now takes seconds. Upload a document and watch it transform into structured, searchable data.',
    gradient: 'from-purple-400 to-pink-500',
    glow: 'shadow-purple-500/20',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description:
      'End-to-end encryption, role-based access, and SOC 2 compliant infrastructure protect every byte of client data.',
    gradient: 'from-green-400 to-emerald-500',
    glow: 'shadow-green-500/20',
  },
  {
    icon: FileSearch,
    title: 'Smart Validation',
    description:
      'Automatically cross-reference clauses, flag inconsistencies, and generate validation reports you can trust.',
    gradient: 'from-orange-400 to-red-500',
    glow: 'shadow-orange-500/20',
  },
  {
    icon: BarChart3,
    title: 'Structured JSON Output',
    description:
      'Every document is transformed into clean, structured data — ready for your case management system or analytics.',
    gradient: 'from-blue-400 to-indigo-500',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: Clock,
    title: 'Batch Processing',
    description:
      'Upload hundreds of documents at once. Our pipeline handles them all in parallel while you focus on strategy.',
    gradient: 'from-pink-400 to-rose-500',
    glow: 'shadow-pink-500/20',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#0A0E27] py-28">
      {/* Gradient divider */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-1.5 text-xs font-medium text-purple-300">
            Superpowers for Advocates
          </span>
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Everything You Need.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Nothing You Don't.
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Six powerful tools that turn document chaos into structured clarity — all working together seamlessly.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} delay={index * 0.1}>
              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.glow}`}
              >
                <feature.icon size={22} className="text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
