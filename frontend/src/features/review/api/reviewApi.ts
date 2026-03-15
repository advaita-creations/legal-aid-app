import { apiClient } from '@/lib/api/client';

import type {
  DocumentMismatch,
  DocumentVersion,
  MismatchResolutionRequest,
  ReviewSummary,
} from '../types';

const V2_BASE = '/v2/documents';

export const reviewApi = {
  getVersions: async (documentId: string): Promise<DocumentVersion[]> => {
    const { data } = await apiClient.get<DocumentVersion[]>(
      `${V2_BASE}/${documentId}/versions/`,
    );
    return data;
  },

  getMismatches: async (
    documentId: string,
    status?: string,
  ): Promise<DocumentMismatch[]> => {
    const params = status ? { status } : {};
    const { data } = await apiClient.get<DocumentMismatch[]>(
      `${V2_BASE}/${documentId}/mismatches/`,
      { params },
    );
    return data;
  },

  resolveMismatch: async (
    documentId: string,
    mismatchId: number,
    resolution: MismatchResolutionRequest,
  ): Promise<DocumentMismatch> => {
    const { data } = await apiClient.patch<DocumentMismatch>(
      `${V2_BASE}/${documentId}/mismatches/${mismatchId}/`,
      resolution,
    );
    return data;
  },

  getReviewSummary: async (documentId: string): Promise<ReviewSummary> => {
    const { data } = await apiClient.get<ReviewSummary>(
      `${V2_BASE}/${documentId}/review-summary/`,
    );
    return data;
  },

  finalizeVersion: async (documentId: string): Promise<DocumentVersion> => {
    const { data } = await apiClient.post<DocumentVersion>(
      `${V2_BASE}/${documentId}/versions/finalize/`,
    );
    return data;
  },
};
