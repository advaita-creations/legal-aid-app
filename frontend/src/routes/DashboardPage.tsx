import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, Image, File, Clock, CheckCircle, AlertTriangle, Loader, Upload, X, Zap, Sparkles, ArrowRight, FileImage, FileScan } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

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
  finalized: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready',
  in_progress: 'In Progress',
  processed: 'Processed',
  finalized: 'Finalized',
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

function HeroUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
      setUploadSuccess(false);
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
      toast('Document uploaded successfully!');
      setSelectedFile(null);
      setUploadSuccess(true);
      reset();
      setTimeout(() => setUploadSuccess(false), 3000);
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
    <div className="relative mb-8 overflow-hidden rounded-2xl">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E27] via-[#131842] to-[#1a1f4e]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-[80px]" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-purple-600/20 blur-[80px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-cyan-500/10 blur-[60px]" />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">AI-Powered Upload</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Left — dropzone */}
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Upload &amp; Process Documents
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Drop your legal documents here. Our AI will OCR, validate, and structure them automatically.
            </p>

            <AnimatePresence mode="wait">
              {uploadSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-300">Uploaded!</p>
                    <p className="text-xs text-emerald-400/70">Mark it ready to start AI processing.</p>
                  </div>
                </motion.div>
              ) : !selectedFile ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    {...getRootProps()}
                    className={cn(
                      'group relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
                      isDragActive
                        ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                        : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/[0.07]',
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="flex justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <FileScan className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {isDragActive ? 'Drop it here!' : 'Drag & drop your document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, or PDF — up to 20 MB
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="file-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-white/20 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center shrink-0">
                      {selectedFile.type.startsWith('image/') ? (
                        <FileImage className="w-6 h-6 text-blue-300" />
                      ) : (
                        <FileScan className="w-6 h-6 text-red-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setValue('name', ''); }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {fileError && <p className="mt-2 text-xs text-red-400">{fileError}</p>}
            {mutation.error && <p className="mt-2 text-xs text-red-400">Upload failed. Please try again.</p>}
          </div>

          {/* Right — form fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-8 lg:pt-0">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Case</label>
              {casesLoading ? (
                <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ) : (
                <select
                  {...register('case_id')}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 [&_option]:text-gray-900"
                >
                  <option value="">Select a case</option>
                  {cases?.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.case_number})</option>
                  ))}
                </select>
              )}
              {errors.case_id && <p className="mt-1 text-[10px] text-red-400">{errors.case_id.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Document Name</label>
              <input
                {...register('name')}
                placeholder="e.g. Sale Agreement - Page 1"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {errors.name && <p className="mt-1 text-[10px] text-red-400">{errors.name.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || !selectedFile}
              className="group w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {mutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Document
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
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

        {/* 1. Hero Upload — main feature, stands out */}
        <HeroUpload />

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

        {/* 3. Recent Documents with "Mark Ready" action */}
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
