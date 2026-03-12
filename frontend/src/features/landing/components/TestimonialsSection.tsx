import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Adv. Priya Sharma',
    role: 'Senior Advocate, Mumbai High Court',
    quote:
      'I used to spend 6 hours reviewing a single property agreement. With LegalAiD, I get validated, structured output in under a minute. It has completely transformed my practice.',
    metric: '6 hours → 1 minute',
    avatar: 'PS',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    name: 'Adv. Rajesh Mehta',
    role: 'Managing Partner, Mehta & Associates',
    quote:
      'We process 200+ documents a month. LegalAiD handles them all in batch — the accuracy is incredible. My team can finally focus on strategy instead of data entry.',
    metric: '200+ docs/month',
    avatar: 'RM',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    name: 'Adv. Sneha Kulkarni',
    role: 'Legal Aid Counsel, District Court',
    quote:
      'For someone working in legal aid with minimal staff, this tool is a lifeline. The validation reports catch errors I would have missed. It pays for itself every single day.',
    metric: '10x productivity boost',
    avatar: 'SK',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    name: 'Adv. Vikram Desai',
    role: 'Corporate Law, Desai Legal LLP',
    quote:
      'The structured JSON output integrates perfectly with our case management system. No more manual data entry, no more copy-paste errors. Pure efficiency.',
    metric: 'Zero manual errors',
    avatar: 'VD',
    gradient: 'from-orange-400 to-red-500',
  },
];

export function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prev = () =>
    setActive((v) => (v - 1 + testimonials.length) % testimonials.length);
  const next = () => setActive((v) => (v + 1) % testimonials.length);

  return (
    <section id="testimonials" className="relative bg-[#070B1E] py-28">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1.5 text-xs font-medium text-green-300">
            Success Stories
          </span>
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Advocates{' '}
            <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Love
            </span>{' '}
            What We Do
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Real stories from real advocates who have transformed their practice.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm md:p-12"
            >
              <Quote size={40} className="mb-6 text-white/10" />

              <blockquote className="mb-8 text-xl font-medium leading-relaxed text-gray-200 md:text-2xl">
                "{testimonials[active].quote}"
              </blockquote>

              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${testimonials[active].gradient} text-lg font-bold text-white`}
                  >
                    {testimonials[active].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {testimonials[active].name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {testimonials[active].role}
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2">
                  <span className="text-sm font-bold text-cyan-400">
                    {testimonials[active].metric}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActive(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === active
                      ? 'w-8 bg-gradient-to-r from-cyan-400 to-purple-400'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-white/20 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
