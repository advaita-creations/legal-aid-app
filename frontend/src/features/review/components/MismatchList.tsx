import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';

import { cn } from '@/lib/utils';

import { MismatchCard } from './MismatchCard';
import type { DocumentMismatch, MismatchAction, MismatchStatus } from '../types';

interface MismatchListProps {
  mismatches: DocumentMismatch[];
  onResolve: (mismatchId: number, action: MismatchAction, resolvedText?: string) => void;
  resolvingId: number | null;
}

const filterOptions: { value: MismatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'edited', label: 'Edited' },
];

export function MismatchList({ mismatches, onResolve, resolvingId }: MismatchListProps) {
  const [filter, setFilter] = useState<MismatchStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? mismatches
    : mismatches.filter((m) => m.status === filter);

  const pendingCount = mismatches.filter((m) => m.status === 'pending').length;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <div className="flex gap-1">
          {filterOptions.map((opt) => {
            const count = opt.value === 'all'
              ? mismatches.length
              : mismatches.filter((m) => m.status === opt.value).length;

            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  filter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                )}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending hint */}
      {pendingCount > 0 && filter === 'all' && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
          {pendingCount} mismatch{pendingCount > 1 ? 'es' : ''} still need your review.
          Accept the AI suggestion, edit it, or reject to keep the original.
        </p>
      )}

      {/* Mismatch cards */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((mismatch) => (
            <MismatchCard
              key={mismatch.id}
              mismatch={mismatch}
              onResolve={(action, text) => onResolve(mismatch.id, action, text)}
              isPending={resolvingId === mismatch.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          No mismatches match the current filter.
        </p>
      )}
    </div>
  );
}
