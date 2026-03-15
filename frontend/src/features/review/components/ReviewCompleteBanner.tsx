import { motion } from 'framer-motion';
import { PartyPopper, FileCheck, Loader2 } from 'lucide-react';

interface ReviewCompleteBannerProps {
  totalResolved: number;
  onFinalize: () => void;
  isFinalizing: boolean;
  isFinalized: boolean;
}

export function ReviewCompleteBanner({
  totalResolved,
  onFinalize,
  isFinalizing,
  isFinalized,
}: ReviewCompleteBannerProps) {
  if (isFinalized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center"
      >
        <FileCheck className="w-10 h-10 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">Document Finalized</h3>
        <p className="text-sm text-gray-500 mt-1">
          Version 2 has been generated. The document is now error-free.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6"
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PartyPopper className="w-8 h-8 text-blue-600 shrink-0" />
        </motion.div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">
            All {totalResolved} Mismatches Reviewed!
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Click below to generate the final error-free document (Version 2).
            This action combines all your corrections into a clean output.
          </p>
          <button
            onClick={onFinalize}
            disabled={isFinalizing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                Generate Final Document
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
