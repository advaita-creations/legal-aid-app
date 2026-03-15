import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

import { ParticleField } from './ParticleField';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#0A0E27]">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-600/8 blur-[100px]" />

      {/* Animated grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <ParticleField />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — Copy */}
          <div>
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300">
                AI-Powered Legal Document Processing
              </span>
            </motion.div>

            <motion.h1
              className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              The Future of{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Legal Work
              </span>{' '}
              is Here
            </motion.h1>

            <motion.p
              className="mb-8 max-w-lg text-lg leading-relaxed text-gray-400 md:text-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              Stop drowning in paperwork. Let AI process, validate, and
              structure your legal documents in seconds — so you can focus on
              what truly matters: <strong className="text-white">winning cases.</strong>
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
            >
              <a
                href="/waitlist"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:brightness-110"
              >
                Add Your Name to Waitlist
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="#demo"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
              >
                <Play size={16} className="text-cyan-400" />
                See It In Action
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="mt-10 flex items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex -space-x-3">
                {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
                  <div
                    key={letter}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0A0E27] text-xs font-bold text-white"
                    style={{
                      background: [
                        'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                        'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        'linear-gradient(135deg, #10b981, #06b6d4)',
                        'linear-gradient(135deg, #f59e0b, #ef4444)',
                        'linear-gradient(135deg, #6366f1, #06b6d4)',
                      ][i],
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Trusted by <strong className="text-white">500+</strong> advocates
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — Floating Dashboard Preview */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 60, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          >
            {/* Glow behind card */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-pink-500/20 blur-2xl" />

            {/* Dashboard mockup */}
            <div className="relative rounded-2xl border border-white/10 bg-[#0f1235]/80 p-1 shadow-2xl backdrop-blur-xl">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
                <span className="ml-4 text-xs text-gray-500">LegalAiD Dashboard</span>
              </div>

              {/* Mock content */}
              <div className="space-y-4 p-6">
                {/* Processing bar */}
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-300">
                      Processing: Kalpataru_NOC.pdf
                    </span>
                    <span className="text-xs text-green-400">99.7% accuracy</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        delay: 1.5,
                        duration: 2.5,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Processed', value: '1,247', color: 'text-cyan-400' },
                    { label: 'Time Saved', value: '340h', color: 'text-purple-400' },
                    { label: 'Accuracy', value: '99.7%', color: 'text-green-400' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-white/5 bg-white/5 p-3 text-center"
                    >
                      <div className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Document list */}
                {[
                  { name: 'Agreement_Draft.pdf', status: 'Processed', statusColor: 'bg-green-400' },
                  { name: 'Court_Filing_v2.pdf', status: 'Processing', statusColor: 'bg-cyan-400' },
                  { name: 'Client_Brief.pdf', status: 'Queued', statusColor: 'bg-yellow-400' },
                ].map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                  >
                    <span className="text-sm text-gray-300">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${doc.statusColor} ${doc.status === 'Processing' ? 'animate-pulse' : ''}`} />
                      <span className="text-xs text-gray-500">{doc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-6 -left-6 rounded-xl border border-green-400/30 bg-[#0A0E27]/90 px-4 py-3 backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-400/20">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Document Validated</div>
                  <div className="text-xs text-gray-400">Just now</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
