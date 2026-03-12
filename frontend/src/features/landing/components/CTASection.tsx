import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative bg-[#070B1E] py-28">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Glowing orbs */}
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">
              Limited Time Offer
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-black leading-tight text-white md:text-6xl">
            Stop Struggling.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Start Dominating.
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
            Join 500+ advocates who have already transformed their practice.
            Your first 14 days are completely free — no credit card, no strings attached.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#pricing"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
            >
              Start Your Free Trial
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="#demo"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-10 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
            >
              Watch Demo
            </a>
          </div>

          {/* Trust signals */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30-day money-back guarantee
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
