import { FileText, Loader2, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { DocumentStatus } from '../types';

interface ProcessingStatusProps {
  status: DocumentStatus;
  name: string;
}

const steps = [
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'in_progress', label: 'Processing' },
  { key: 'processed', label: 'Complete' },
] as const;

function getActiveStep(status: DocumentStatus): number {
  if (status === 'uploaded' || status === 'ready_to_process') return 0;
  if (status === 'in_progress') return 1;
  return 2;
}

export function ProcessingStatus({ status, name }: ProcessingStatusProps) {
  const activeStep = getActiveStep(status);
  const isProcessing = status === 'in_progress' || status === 'ready_to_process';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div
            className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center',
              isProcessing
                ? 'bg-blue-50 animate-pulse'
                : status === 'processed'
                  ? 'bg-green-50'
                  : 'bg-gray-50',
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            ) : status === 'processed' ? (
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            ) : (
              <FileText className="w-10 h-10 text-gray-400" />
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {isProcessing
            ? 'Analyzing Your Document...'
            : status === 'processed'
              ? 'Processing Complete'
              : name}
        </h3>

        <p className="text-sm text-gray-500 mb-8 max-w-sm">
          {isProcessing
            ? 'Our AI is extracting text, validating content, and cross-referencing OCR sources. This usually takes 5–10 minutes.'
            : status === 'processed'
              ? 'Your document has been analyzed. View the results below.'
              : 'Mark this document as "Ready to Process" to begin AI analysis.'}
        </p>

        {/* Progress steps */}
        <div className="flex items-center gap-0 w-full max-w-xs">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500',
                    i < activeStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === activeStep
                        ? isProcessing
                          ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                          : 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400',
                  )}
                >
                  {i < activeStep ? '✓' : i + 1}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium',
                    i <= activeStep ? 'text-gray-900' : 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 -mt-5 transition-colors duration-500',
                    i < activeStep ? 'bg-blue-600' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
