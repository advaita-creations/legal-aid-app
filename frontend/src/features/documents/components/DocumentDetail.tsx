import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Image, File, Trash2, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { documentsApi } from '../api/documentsApi';
import { useToast } from '@/components/ui/toast';
import type { DocumentStatus } from '../types';

const statusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready to Process',
  in_progress: 'In Progress',
  processed: 'Processed',
};

const nextStatus: Partial<Record<DocumentStatus, DocumentStatus>> = {
  uploaded: 'ready_to_process',
  ready_to_process: 'in_progress',
  in_progress: 'processed',
};

const nextStatusLabel: Partial<Record<DocumentStatus, string>> = {
  uploaded: 'Mark Ready to Process',
  ready_to_process: 'Mark In Progress',
  in_progress: 'Mark Processed',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast('Document deleted');
      navigate('/documents');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: DocumentStatus) =>
      documentsApi.updateStatus(id!, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast('Document status updated');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load document details.</p>
      </div>
    );
  }

  const next = nextStatus[doc.status];

  return (
    <div>
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {doc.file_type === 'image' ? (
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <File className="w-6 h-6 text-red-500" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{doc.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Uploaded on {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this document?')) {
              deleteMutation.mutate();
            }
          }}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Document Information</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">File Type</dt>
                <dd className="mt-1 text-sm text-gray-900 uppercase">{doc.file_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">MIME Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{doc.mime_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatFileSize(doc.file_size_bytes)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</dt>
                <dd className="mt-1">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[doc.status])}>
                    {statusLabels[doc.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Case</dt>
                <dd className="mt-1">
                  <Link to={`/cases/${doc.case_id}`} className="text-sm text-[#1754cf] hover:underline">
                    {doc.case_title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</dt>
                <dd className="mt-1">
                  <Link to={`/clients/${doc.client_id}`} className="text-sm text-[#1754cf] hover:underline">
                    {doc.client_name}
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          {doc.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{doc.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(['uploaded', 'ready_to_process', 'in_progress', 'processed'] as DocumentStatus[]).map((s, i, arr) => (
                  <div key={s} className="flex items-center gap-1">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        doc.status === s ? statusColors[s] : 'bg-gray-50 text-gray-400',
                      )}
                    >
                      {statusLabels[s]}
                    </span>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                  </div>
                ))}
              </div>

              {next && (
                <button
                  onClick={() => {
                    if (window.confirm(`Transition document to "${statusLabels[next]}"?`)) {
                      statusMutation.mutate(next);
                    }
                  }}
                  disabled={statusMutation.isPending}
                  className="w-full mt-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {statusMutation.isPending ? 'Updating...' : nextStatusLabel[doc.status]}
                </button>
              )}

              {doc.status === 'processed' && (
                <p className="text-xs text-green-600 text-center font-medium">Document fully processed</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>
            <p className="text-sm text-gray-500 italic">Timeline feature coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
