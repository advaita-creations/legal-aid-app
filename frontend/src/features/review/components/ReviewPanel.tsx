import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';

import { useDocumentMismatches, useReviewSummary } from '../hooks/useDocumentReview';
import { useResolveMismatch, useFinalizeVersion } from '../hooks/useMismatchActions';
import { MismatchList } from './MismatchList';
import { ReviewProgress } from './ReviewProgress';
import { VersionTimeline } from './VersionTimeline';
import { ReviewCompleteBanner } from './ReviewCompleteBanner';
import type { MismatchAction } from '../types';

interface ReviewPanelProps {
  documentId: string;
}

export function ReviewPanel({ documentId }: ReviewPanelProps) {
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const { data: mismatches, isLoading: loadingMismatches } = useDocumentMismatches(documentId);
  const { data: summary, isLoading: loadingSummary } = useReviewSummary(documentId);
  const resolveMutation = useResolveMismatch(documentId);
  const finalizeMutation = useFinalizeVersion(documentId);

  const isLoading = loadingMismatches || loadingSummary;
  const hasMismatches = mismatches && mismatches.length > 0;
  const isComplete = summary?.is_complete ?? false;
  const isFinalized = (summary?.latest_version ?? 0) >= 2;

  function handleResolve(mismatchId: number, action: MismatchAction, resolvedText?: string) {
    setResolvingId(mismatchId);
    resolveMutation.mutate(
      { mismatchId, action, resolved_text: resolvedText },
      { onSettled: () => setResolvingId(null) },
    );
  }

  function handleFinalize() {
    finalizeMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Loading review data...</p>
      </div>
    );
  }

  if (!hasMismatches) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Document Review</h3>
          <p className="text-xs text-gray-500">
            Review AI-detected mismatches and generate the final document
          </p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Version timeline */}
        {summary && <VersionTimeline summary={summary} />}

        {/* Progress ring + stats */}
        {summary && <ReviewProgress summary={summary} />}

        {/* Complete banner */}
        {isComplete && (
          <ReviewCompleteBanner
            totalResolved={summary?.total ?? 0}
            onFinalize={handleFinalize}
            isFinalizing={finalizeMutation.isPending}
            isFinalized={isFinalized}
          />
        )}

        {/* Mismatch list */}
        {mismatches && (
          <MismatchList
            mismatches={mismatches}
            onResolve={handleResolve}
            resolvingId={resolvingId}
          />
        )}
      </div>
    </motion.div>
  );
}
