import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

import { supabase } from '@/lib/supabase';

type WaitlistVariant = 'inline' | 'full';

interface WaitlistFormProps {
  variant?: WaitlistVariant;
  className?: string;
}

export function WaitlistForm({ variant = 'inline', className = '' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: email.trim().toLowerCase(), full_name: fullName.trim() || null });

      if (error) {
        if (error.code === '23505') {
          setErrorMessage('You\'re already on the waitlist!');
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

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center ${className}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.1 }}
        >
          <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-1">You&apos;re on the list!</h3>
        {position && (
          <p className="text-blue-300 font-semibold">
            You&apos;re #{position} on the waitlist
          </p>
        )}
        <p className="text-gray-400 text-sm mt-2">
          We&apos;ll notify you when it&apos;s your turn.
        </p>
      </motion.div>
    );
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Join Waitlist
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
        <AnimatePresence>
          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs sm:col-span-2 px-2"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-gray-400 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:brightness-110 disabled:opacity-60 transition-all"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Join the Waitlist
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
            className="text-red-400 text-xs text-center"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
