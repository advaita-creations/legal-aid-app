import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, X, FileText, Image } from 'lucide-react';

import { cn } from '@/lib/utils';
import { documentsApi } from '../api/documentsApi';
import { casesApi } from '@/features/cases/api/casesApi';
import { useToast } from '@/components/ui/toast';

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};
const MAX_SIZE = 20 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const formSchema = z.object({
  case_id: z.string().min(1, 'Please select a case'),
  name: z.string().min(2, 'Document name must be at least 2 characters'),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DocumentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { case_id: '', name: '', notes: '' },
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
        setFileError('File is too large. Maximum size is 20 MB.');
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
      if (err?.code === 'file-too-large') setFileError('File is too large. Maximum size is 20 MB.');
      else if (err?.code === 'file-invalid-type') setFileError('Only JPG, PNG, and PDF files are allowed.');
      else setFileError('File not accepted.');
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { file: File; case_id: string; name: string; notes?: string }) =>
      documentsApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast('Document uploaded successfully');
      navigate('/documents');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
    },
  });

  async function onSubmit(values: FormValues) {
    if (!selectedFile) {
      setFileError('Please select a file to upload.');
      return;
    }
    await mutation.mutateAsync({
      file: selectedFile,
      case_id: values.case_id,
      name: values.name,
      notes: values.notes,
    });
  }

  return (
    <div>
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Documents
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Document</h2>

        {mutation.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-sm text-red-800">Failed to upload document. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50',
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to browse'}
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, or PDF — up to 20 MB</p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  {selectedFile.type === 'application/pdf' ? (
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Image className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setValue('name', '');
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
            {fileError && <p className="mt-1.5 text-sm text-red-600">{fileError}</p>}
          </div>

          <div>
            <label htmlFor="case_id" className="block text-sm font-medium text-gray-700 mb-1">
              Case *
            </label>
            {casesLoading ? (
              <p className="text-sm text-gray-500">Loading cases...</p>
            ) : (
              <select
                id="case_id"
                {...register('case_id')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              >
                <option value="">Select a case</option>
                {cases?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.case_number})
                  </option>
                ))}
              </select>
            )}
            {errors.case_id && <p className="mt-1 text-sm text-red-600">{errors.case_id.message}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Document Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Auto-filled from filename"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Optional notes about this document"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || mutation.isPending ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
