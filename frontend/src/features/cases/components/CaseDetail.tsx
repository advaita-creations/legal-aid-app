import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag, User, FileText, Trash2, Image, File, Pencil } from 'lucide-react';

import { cn } from '@/lib/utils';

import { casesApi } from '../api/casesApi';
import { documentsApi } from '@/features/documents/api/documentsApi';
import { useToast } from '@/components/ui/toast';
import type { CaseStatus } from '../types';
import type { DocumentStatus } from '@/features/documents/types';

const statusColors: Record<CaseStatus, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  archived: 'bg-amber-100 text-amber-700',
};

const docStatusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
};

const docStatusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready',
  in_progress: 'In Progress',
  processed: 'Processed',
};

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: caseItem, isLoading, error } = useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesApi.getById(id!),
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
    select: (allDocs) => allDocs.filter((d) => String(d.case_id) === id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => casesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast('Case deleted');
      navigate('/cases');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => casesApi.update(id!, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases', id] });
      toast('Case closed');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading case...</div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load case details.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/cases')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cases
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{caseItem.title}</h2>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize',
                statusColors[caseItem.status],
              )}
            >
              {caseItem.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {caseItem.case_number}
            </span>
            {caseItem.client_name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {caseItem.client_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/cases/${id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          {caseItem.status === 'active' && (
            <button
              onClick={() => closeMutation.mutate()}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close Case
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this case?')) {
                deleteMutation.mutate();
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {caseItem.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-sm text-gray-600">{caseItem.description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
          <Link
            to="/documents/new"
            className="text-sm text-[#1754cf] hover:underline font-medium"
          >
            + Upload Document
          </Link>
        </div>

        {!documents || documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No documents for this case yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex items-center gap-3">
                  {doc.file_type === 'image' ? (
                    <Image className="w-4 h-4 text-blue-500" />
                  ) : (
                    <File className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    docStatusColors[doc.status],
                  )}
                >
                  {docStatusLabels[doc.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
