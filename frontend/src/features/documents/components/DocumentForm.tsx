import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { documentsApi } from '../api/documentsApi';
import { casesApi } from '@/features/cases/api/casesApi';
import { useToast } from '@/components/ui/toast';

const documentSchema = z.object({
  case_id: z.string().min(1, 'Please select a case'),
  name: z.string().min(2, 'Document name must be at least 2 characters'),
  file_path: z.string().min(1, 'File path is required'),
  file_type: z.enum(['image', 'pdf']),
  file_size_bytes: z.number().min(1, 'File size is required'),
  mime_type: z.string().min(1, 'MIME type is required'),
  notes: z.string().max(2000).optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export function DocumentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      case_id: '',
      name: '',
      file_path: '',
      file_type: 'image',
      file_size_bytes: 0,
      mime_type: 'image/jpeg',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: DocumentFormValues) =>
      documentsApi.create({
        case: data.case_id,
        name: data.name,
        file_path: data.file_path,
        file_type: data.file_type,
        file_size_bytes: data.file_size_bytes,
        mime_type: data.mime_type,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast('Document created successfully');
      navigate('/documents');
    },
  });

  async function onSubmit(data: DocumentFormValues) {
    await mutation.mutateAsync(data);
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
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Document</h2>

        {mutation.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-sm text-red-800">Failed to create document. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              >
                <option value="">Select a case</option>
                {cases?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.case_number})
                  </option>
                ))}
              </select>
            )}
            {errors.case_id && (
              <p className="mt-1 text-sm text-red-600">{errors.case_id.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Document Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="e.g. agreement_scan.jpg"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="file_path" className="block text-sm font-medium text-gray-700 mb-1">
              File Path *
            </label>
            <input
              id="file_path"
              type="text"
              {...register('file_path')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="e.g. uploads/agreement_scan.jpg"
            />
            {errors.file_path && (
              <p className="mt-1 text-sm text-red-600">{errors.file_path.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="file_type" className="block text-sm font-medium text-gray-700 mb-1">
                File Type *
              </label>
              <select
                id="file_type"
                {...register('file_type')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              >
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label htmlFor="mime_type" className="block text-sm font-medium text-gray-700 mb-1">
                MIME Type *
              </label>
              <select
                id="mime_type"
                {...register('mime_type')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              >
                <option value="image/jpeg">image/jpeg</option>
                <option value="image/png">image/png</option>
                <option value="application/pdf">application/pdf</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="file_size_bytes" className="block text-sm font-medium text-gray-700 mb-1">
              File Size (bytes) *
            </label>
            <input
              id="file_size_bytes"
              type="number"
              {...register('file_size_bytes', { valueAsNumber: true })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="e.g. 2048576"
            />
            {errors.file_size_bytes && (
              <p className="mt-1 text-sm text-red-600">{errors.file_size_bytes.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="Optional notes about this document"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#1754cf] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Document'}
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
