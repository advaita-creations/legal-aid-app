import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Image, File, Trash2, ArrowRight, Send,
  ChevronDown, ChevronRight, Terminal, Activity, RotateCcw,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { documentsApi } from '../api/documentsApi';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { ProcessingStatus } from './ProcessingStatus';
import { DocumentDiffView } from './DocumentDiffView';
import type { DocumentStatus, DocumentStatusEntry, ProcessingLogEntry } from '../types';

const statusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-blue-100 text-blue-700',
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

const logLevelColors: Record<string, string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
};

const logTypeIcons: Record<string, string> = {
  status: '⟳',
  version: '📄',
  file: '💾',
};

function ProcessingLogsPane({ documentId }: { documentId: string }) {
  const [expanded, setExpanded] = useState(false);

  const { data: logs } = useQuery({
    queryKey: ['processing-logs', documentId],
    queryFn: () => documentsApi.getProcessingLogs(documentId),
    refetchInterval: 10000,
  });

  const entries = logs?.entries ?? [];

  return (
    <div className="fixed bottom-0 left-60 right-0 z-20 bg-gray-900 border-t border-gray-700 shadow-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">
            Processing Logs
          </span>
          <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
            {entries.length} entries
          </span>
          {logs?.current_status && (
            <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">
              {logs.current_status}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="max-h-[200px] overflow-y-auto px-4 pb-3 font-mono text-[11px] leading-5">
          {entries.length === 0 ? (
            <p className="text-gray-500 py-2">No processing activity yet.</p>
          ) : (
            entries.map((entry: ProcessingLogEntry, i: number) => (
              <div key={i} className="flex gap-3 py-0.5">
                <span className="text-gray-600 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="shrink-0">{logTypeIcons[entry.type] ?? '●'}</span>
                <span className={cn('shrink-0 w-8', logLevelColors[entry.level] ?? 'text-gray-400')}>
                  {entry.level.toUpperCase().slice(0, 4)}
                </span>
                <span className="text-gray-300">{entry.message}</span>
                {entry.detail && (
                  <span className="text-gray-600 truncate">{entry.detail}</span>
                )}
                <span className="text-gray-600 ml-auto shrink-0">{entry.actor}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [statusExpanded, setStatusExpanded] = useState(false);

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'in_progress' || s === 'ready_to_process' ? 10000 : false;
    },
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
      queryClient.invalidateQueries({ queryKey: ['processing-logs', id] });
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
  const fileUrl = doc.file_url ?? null;
  const isProcessing = doc.status === 'in_progress' || doc.status === 'ready_to_process';
  const isProcessed = doc.status === 'processed';
  const hasProcessedHtml = !!doc.processed_html_url;

  return (
    <div className="pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </button>

      {/* Header: title + action buttons */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {doc.file_type === 'image' ? (
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Image className="w-5 h-5 text-blue-500" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <File className="w-5 h-5 text-red-500" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{doc.name}</h2>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[doc.status])}>
                {statusLabels[doc.status]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              <Link to={`/clients/${doc.client_id}`} className="text-blue-600 hover:underline">{doc.client_name}</Link>
              {' · '}
              <Link to={`/cases/${doc.case_id}`} className="text-blue-600 hover:underline">{doc.case_title}</Link>
              {' · '}
              {formatFileSize(doc.file_size_bytes)} · {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Finalize button — only when processed */}
          {isProcessed && hasProcessedHtml && (
            <button
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all"
              onClick={() => {
                const diffEl = document.getElementById('diff-view-section');
                if (diffEl) diffEl.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Send className="w-4 h-4" />
              Finalize & RAG
            </button>
          )}

          {/* Retry Processing — for stuck in_progress or re-processing */}
          {(doc.status === 'in_progress' || doc.status === 'processed') && (
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: 'Retry Processing',
                  description: 'Re-send this document to the OCR pipeline? Previous processed files will be cleared.',
                  confirmLabel: 'Retry',
                  variant: 'info',
                });
                if (ok) statusMutation.mutate('ready_to_process');
              }}
              disabled={statusMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {statusMutation.isPending ? 'Retrying...' : 'Retry Processing'}
            </button>
          )}

          {/* Status advance button */}
          {next && doc.status !== 'in_progress' && (
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: 'Update Status',
                  description: `Transition document to "${statusLabels[next]}"?`,
                  confirmLabel: 'Confirm',
                  variant: 'info',
                });
                if (ok) statusMutation.mutate(next);
              }}
              disabled={statusMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {statusMutation.isPending ? 'Updating...' : nextStatusLabel[doc.status]}
            </button>
          )}

          <button
            onClick={async () => {
              const ok = await confirm({
                title: 'Delete Document',
                description: 'Are you sure you want to delete this document? This action cannot be undone.',
                confirmLabel: 'Delete',
                variant: 'danger',
              });
              if (ok) deleteMutation.mutate();
            }}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main content — full width */}
      <div className="space-y-5">
        {/* Processing animation when in_progress */}
        {isProcessing && (
          <ProcessingStatus status={doc.status} name={doc.name} />
        )}

        {/* Full-width Diff View (original vs processed) with edit + save + finalize */}
        {isProcessed && hasProcessedHtml && fileUrl && (
          <div id="diff-view-section">
            <DocumentDiffView doc={doc} />
          </div>
        )}

        {/* Document info bar (compact) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">File Type</span>
              <p className="text-gray-900 uppercase">{doc.file_type}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">MIME</span>
              <p className="text-gray-900">{doc.mime_type}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Size</span>
              <p className="text-gray-900">{formatFileSize(doc.file_size_bytes)}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Case</span>
              <p><Link to={`/cases/${doc.case_id}`} className="text-blue-600 hover:underline">{doc.case_title}</Link></p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">Client</span>
              <p><Link to={`/clients/${doc.client_id}`} className="text-blue-600 hover:underline">{doc.client_name}</Link></p>
            </div>
            {doc.notes && (
              <div className="basis-full">
                <span className="text-xs font-medium text-gray-500 uppercase">Notes</span>
                <p className="text-gray-700">{doc.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Actions + History — collapsible at bottom */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStatusExpanded(!statusExpanded)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Status Actions & History</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {doc.status_history?.length ?? 0} entries
              </span>
            </div>
            {statusExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
            }
          </button>

          {statusExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100">
              {/* Status pipeline */}
              <div className="flex items-center gap-2 flex-wrap py-4">
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

              {/* Status history timeline */}
              {(!doc.status_history || doc.status_history.length === 0) ? (
                <p className="text-sm text-gray-500 italic">No status history recorded.</p>
              ) : (
                <div className="space-y-2">
                  {doc.status_history.map((entry: DocumentStatusEntry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                        <div className="flex-1 w-px bg-gray-200" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{statusLabels[entry.to_status as DocumentStatus] ?? entry.to_status}</span>
                          {entry.from_status && (
                            <span className="text-gray-500"> from {statusLabels[entry.from_status as DocumentStatus] ?? entry.from_status}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.changed_by_name} · {new Date(entry.changed_at).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-gray-600 mt-0.5">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Processing logs pane — fixed at bottom of viewport */}
      {id && <ProcessingLogsPane documentId={id} />}
    </div>
  );
}
