import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Pencil, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ReviewSummary } from '../types';

interface ReviewProgressProps {
  summary: ReviewSummary;
}

export function ReviewProgress({ summary }: ReviewProgressProps) {
  const { total, pending, accepted, rejected, edited, is_complete } = summary;
  const resolved = total - pending;
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      {/* Circular progress ring */}
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke={is_complete ? '#2563eb' : '#f59e0b'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'text-xl font-bold',
            is_complete ? 'text-blue-600' : 'text-amber-600',
          )}>
            {percentage}%
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {resolved}/{total}
          </span>
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="flex-1 space-y-1.5">
        <StatRow icon={Clock} label="Pending" count={pending} color="text-amber-500" />
        <StatRow icon={CheckCircle2} label="Accepted" count={accepted} color="text-blue-500" />
        <StatRow icon={Pencil} label="Edited" count={edited} color="text-purple-500" />
        <StatRow icon={X} label="Rejected" count={rejected} color="text-gray-400" />
      </div>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: typeof Clock;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', color)} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <span className="text-xs font-semibold text-gray-900">{count}</span>
    </div>
  );
}
