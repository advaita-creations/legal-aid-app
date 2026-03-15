import { useQuery } from '@tanstack/react-query';

import { reviewApi } from '../api/reviewApi';

export function useDocumentMismatches(documentId: string) {
  return useQuery({
    queryKey: ['document-mismatches', documentId],
    queryFn: () => reviewApi.getMismatches(documentId),
    enabled: !!documentId,
  });
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => reviewApi.getVersions(documentId),
    enabled: !!documentId,
  });
}

export function useReviewSummary(documentId: string) {
  return useQuery({
    queryKey: ['review-summary', documentId],
    queryFn: () => reviewApi.getReviewSummary(documentId),
    enabled: !!documentId,
    refetchInterval: 10_000,
  });
}
