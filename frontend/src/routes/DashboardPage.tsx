import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, Image, File, Clock, CheckCircle, AlertTriangle, Loader, Upload, X, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';

import { cn } from '@/lib/utils';

import { useAuth } from '@/features/auth';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import { documentsApi } from '@/features/documents/api/documentsApi';
import { casesApi } from '@/features/cases/api/casesApi';
import { useToast } from '@/components/ui/toast';
import type { DocumentStatus } from '@/features/documents/types';

const statusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready',
  in_progress: 'In Progress',
  processed: 'Processed',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
const MAX_SIZE = 20 * 1024 * 1024;

const uploadSchema = z.object({
  case_id: z.string().min(1, 'Select a case'),
  name: z.string().min(2, 'Name required'),
});

type UploadValues = z.infer<typeof uploadSchema>;

function CompactUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
  });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { case_id: '', name: '' },
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      setFileError(null);
      if (accepted.length === 0) return;
      const file = accepted[0];
      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        setFileError('Only JPG, PNG, and PDF files are allowed.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setFileError('File too large. Max 20 MB.');
        return;
      }
      setSelectedFile(file);
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setValue('name', baseName, { shouldValidate: true });
    },
    [setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === 'file-too-large') setFileError('File too large. Max 20 MB.');
      else if (err?.code === 'file-invalid-type') setFileError('Only JPG, PNG, PDF allowed.');
      else setFileError('File not accepted.');
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { file: File; case_id: string; name: string }) =>
      documentsApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Document uploaded successfully');
      setSelectedFile(null);
      reset();
    },
  });

  async function onSubmit(values: UploadValues) {
    if (!selectedFile) {
      setFileError('Select a file first.');
      return;
    }
    await mutation.mutateAsync({ file: selectedFile, case_id: values.case_id, name: values.name });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
          <Upload className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Quick Upload</h3>
      </div>

      {mutation.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 mb-3">
          <p className="text-xs text-red-800">Upload failed. Please try again.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-start">
          {/* Drop zone */}
          <div>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors h-[72px] flex flex-col items-center justify-center',
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50',
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">
                  {isDragActive ? 'Drop here' : 'Drop file or click'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 h-[72px]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setValue('name', ''); }}
                  className="p-1 rounded hover:bg-gray-200 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}
            {fileError && <p className="mt-1 text-[10px] text-red-600">{fileError}</p>}
          </div>

          {/* Case selector */}
          <div>
            {casesLoading ? (
              <div className="h-[72px] flex items-center justify-center text-xs text-gray-500">Loading...</div>
            ) : (
              <select
                {...register('case_id')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select a case</option>
                {cases?.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} ({c.case_number})</option>
                ))}
              </select>
            )}
            {errors.case_id && <p className="mt-1 text-[10px] text-red-600">{errors.case_id.message}</p>}
          </div>

          {/* Name */}
          <div>
            <input
              {...register('name')}
              placeholder="Document name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {errors.name && <p className="mt-1 text-[10px] text-red-600">{errors.name.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function DashboardPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll(),
  });

  const markReadyMutation = useMutation({
    mutationFn: (docId: string) =>
      documentsApi.updateStatus(docId, { status: 'ready_to_process' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Document marked ready to process');
    },
  });

  const docsByStatus = statsData?.documents_by_status;

  const summaryStats = [
    { label: 'Active Clients', value: String(statsData?.total_clients ?? '–'), icon: Users, color: 'text-blue-600' },
    { label: 'Open Cases', value: String(statsData?.total_cases ?? '–'), icon: Briefcase, color: 'text-blue-600' },
    { label: 'Total Files', value: String(statsData?.total_documents ?? '–'), icon: FileText, color: 'text-orange-600' },
  ];

  const docStats: { label: string; value: string; icon: React.ElementType; color: string; bg: string; status: DocumentStatus }[] = [
    { label: 'Ready to Process', value: String(docsByStatus?.ready_to_process ?? '–'), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', status: 'ready_to_process' },
    { label: 'In Progress', value: String(docsByStatus?.in_progress ?? '–'), icon: Loader, color: 'text-blue-600', bg: 'bg-blue-50', status: 'in_progress' },
    { label: 'Processed', value: String(docsByStatus?.processed ?? '–'), icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', status: 'processed' },
    { label: 'Uploaded', value: String(docsByStatus?.uploaded ?? '–'), icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', status: 'uploaded' },
  ];

  const filteredDocs = statusFilter
    ? (documents ?? []).filter((d) => d.status === statusFilter)
    : documents ?? [];
  const recentDocs = filteredDocs.slice(0, 20);

  return (
    <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name}!
            </h2>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your practice today.
            </p>
          </div>
        </div>

        {/* 1. Quick Upload — top of dashboard */}
        <CompactUpload />

        {/* 2. Summary stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {docStats.map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter((prev) => prev === stat.status ? null : stat.status)}
              className={cn(
                'bg-white rounded-xl border p-4 hover:shadow-md transition-all text-left',
                statusFilter === stat.status
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200',
              )}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 3. Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/clients/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Add Client</span>
            </Link>
            <Link
              to="/cases/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Add Case</span>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">All Documents</span>
            </Link>
          </div>
        </div>

        {/* 4. Recent Documents with "Mark Ready" action */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {statusFilter ? `${statusLabels[statusFilter]} Documents` : 'Recent Documents'}
              </h3>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <Link to="/documents" className="text-sm text-blue-600 hover:underline font-medium">
              View All
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {statusFilter ? `No ${statusLabels[statusFilter].toLowerCase()} documents.` : 'No documents yet. Upload your first file above.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-2 hover:underline">
                        {doc.file_type === 'image' ? (
                          <Image className="w-4 h-4 text-blue-500" />
                        ) : (
                          <File className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.case_title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.file_size_bytes)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[doc.status])}>
                        {statusLabels[doc.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.status === 'uploaded' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadyMutation.mutate(doc.id);
                          }}
                          disabled={markReadyMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          <Zap className="w-3 h-3" />
                          Mark Ready
                        </button>
                      )}
                      {doc.status === 'processed' && (
                        <Link
                          to={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          View Results
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );
}
