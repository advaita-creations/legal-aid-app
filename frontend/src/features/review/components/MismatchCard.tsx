import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pencil, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { DocumentMismatch, MismatchAction } from '../types';

interface MismatchCardProps {
  mismatch: DocumentMismatch;
  onResolve: (action: MismatchAction, resolvedText?: string) => void;
  isPending: boolean;
}

const statusStyles: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50/50',
  accepted: 'border-blue-200 bg-blue-50/30',
  rejected: 'border-gray-200 bg-gray-50/30',
  edited: 'border-purple-200 bg-purple-50/30',
};

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: 'Needs Review', color: 'text-amber-600 bg-amber-100' },
  accepted: { text: 'Accepted', color: 'text-blue-600 bg-blue-100' },
  rejected: { text: 'Rejected', color: 'text-gray-600 bg-gray-100' },
  edited: { text: 'Edited', color: 'text-purple-600 bg-purple-100' },
};

export function MismatchCard({ mismatch, onResolve, isPending }: MismatchCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(mismatch.suggested_text);
  const [expanded, setExpanded] = useState(mismatch.status === 'pending');

  const isResolved = mismatch.status !== 'pending';
  const badge = statusLabels[mismatch.status];

  function handleAccept() {
    onResolve('accept');
  }

  function handleReject() {
    onResolve('reject');
  }

  function handleEdit() {
    if (isEditing && editText.trim()) {
      onResolve('edit', editText.trim());
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-xl border-2 transition-colors overflow-hidden',
        statusStyles[mismatch.status],
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {mismatch.status === 'pending' && (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <div>
            <span className="text-sm font-semibold text-gray-900">
              {mismatch.field_label || mismatch.mismatch_id}
            </span>
            {mismatch.confidence_score !== null && (
              <span className="ml-2 text-xs text-gray-400">
                {Math.round(mismatch.confidence_score * 100)}% confidence
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', badge.color)}>
            {badge.text}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Diff view */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                    Original
                  </p>
                  <p className="text-sm text-red-700 line-through decoration-red-300">
                    {mismatch.original_text}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    Suggested
                  </p>
                  <p className="text-sm text-emerald-700 font-medium">
                    {mismatch.suggested_text}
                  </p>
                </div>
              </div>

              {/* Resolved text (shown after resolution) */}
              {isResolved && mismatch.resolved_text && (
                <div className="rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Final Text
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {mismatch.resolved_text}
                  </p>
                </div>
              )}

              {/* Edit input */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                      rows={2}
                      autoFocus
                      placeholder="Enter corrected text..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              {!isResolved && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAccept}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isEditing ? 'Save Edit' : 'Edit'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
