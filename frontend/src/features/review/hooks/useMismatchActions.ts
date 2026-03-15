import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reviewApi } from '../api/reviewApi';
import type { MismatchAction } from '../types';

export function useResolveMismatch(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mismatchId,
      action,
      resolved_text,
    }: {
      mismatchId: number;
      action: MismatchAction;
      resolved_text?: string;
    }) => reviewApi.resolveMismatch(documentId, mismatchId, { action, resolved_text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-mismatches', documentId] });
      queryClient.invalidateQueries({ queryKey: ['review-summary', documentId] });
    },
  });
}

export function useFinalizeVersion(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reviewApi.finalizeVersion(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
      queryClient.invalidateQueries({ queryKey: ['review-summary', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-mismatches', documentId] });
    },
  });
}
