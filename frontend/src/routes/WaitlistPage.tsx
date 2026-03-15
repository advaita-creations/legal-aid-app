import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export function WaitlistPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase.from('waitlist').insert({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        mobile: mobile.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          setErrorMessage("You're already on the waitlist! We'll reach out soon.");
          setStatus('error');
          return;
        }
        throw error;
      }

      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      setPosition(count ?? 0);
      setStatus('success');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />

      {/* Header */}
      <div className="relative z-10 px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                >
                  <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2">You're on the list!</h2>
                {position && (
                  <p className="text-xl text-blue-300 font-bold mb-2">
                    #{position} on the waitlist
                  </p>
                )}
                <p className="text-gray-400 mb-8">
                  We'll notify you as soon as your spot opens up. Stay tuned!
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">Early Access</span>
                </div>

                <h1 className="text-4xl font-black text-white mb-3">
                  Join the{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Waitlist
                  </span>
                </h1>
                <p className="text-gray-400 mb-8 text-lg">
                  Be among the first advocates to experience AI-powered legal document processing.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Adv. Rajesh Sharma"
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-gray-500 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajesh@legalfirm.com"
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-gray-500 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-gray-500 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:brightness-110 disabled:opacity-60 transition-all"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Add My Name to Waitlist
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm text-center"
                      >
                        {errorMessage}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </form>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  We respect your privacy. No spam, ever.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
