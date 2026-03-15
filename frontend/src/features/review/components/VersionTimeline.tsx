import { motion } from 'framer-motion';
import { FileText, UserCheck, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ReviewSummary } from '../types';

interface VersionTimelineProps {
  summary: ReviewSummary;
}

const steps = [
  { key: 'v1', label: 'AI Draft (V1)', icon: Sparkles, description: 'Processed by AI' },
  { key: 'review', label: 'Human Review', icon: UserCheck, description: 'Accept / Edit / Reject' },
  { key: 'v2', label: 'Final (V2)', icon: FileText, description: 'Error-free document' },
] as const;

function getActiveStep(summary: ReviewSummary): number {
  if (summary.latest_version >= 2) return 2;
  if (summary.is_complete) return 2;
  if (summary.total > 0 && summary.pending < summary.total) return 1;
  if (summary.total > 0) return 1;
  return 0;
}

export function VersionTimeline({ summary }: VersionTimelineProps) {
  const activeStep = getActiveStep(summary);

  return (
    <div className="flex items-center justify-between gap-2">
      {steps.map((step, i) => {
        const isActive = i === activeStep;
        const isComplete = i < activeStep;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step */}
            <div className="flex flex-col items-center text-center min-w-[80px]">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isComplete
                    ? '#2563eb'
                    : isActive
                      ? '#dbeafe'
                      : '#f3f4f6',
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-1.5',
                  isActive && 'ring-2 ring-blue-300 ring-offset-2',
                )}
              >
                <Icon
                  className={cn(
                    'w-4.5 h-4.5',
                    isComplete
                      ? 'text-white'
                      : isActive
                        ? 'text-blue-600'
                        : 'text-gray-400',
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  isActive ? 'text-blue-700' : isComplete ? 'text-blue-600' : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-gray-400">{step.description}</span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-20px] rounded-full overflow-hidden bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isComplete ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
