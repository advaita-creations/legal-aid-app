import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { casesApi } from '../api/casesApi';
import { clientsApi } from '@/features/clients/api/clientsApi';
import { useToast } from '@/components/ui/toast';

const caseSchema = z.object({
  client: z.string().min(1, 'Please select a client'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  case_number: z.string().min(1, 'Case number is required'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  status: z.enum(['active', 'closed', 'archived']).optional(),
});

type CaseFormValues = z.infer<typeof caseSchema>;

interface CaseFormProps {
  caseId?: string;
  initialData?: CaseFormValues;
}

export function CaseForm({ caseId, initialData }: CaseFormProps = {}) {
  const isEdit = !!caseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: initialData ?? {
      client: '',
      title: '',
      case_number: '',
      description: '',
      status: 'active',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CaseFormValues) =>
      isEdit ? casesApi.update(caseId, data) : casesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast(isEdit ? 'Case updated successfully' : 'Case created successfully');
      navigate(isEdit ? `/cases/${caseId}` : '/cases');
    },
  });

  async function onSubmit(data: CaseFormValues) {
    await mutation.mutateAsync(data);
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Case' : 'Add New Case'}</h2>

        {mutation.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-sm text-red-800">Failed to {isEdit ? 'update' : 'create'} case. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            {clientsLoading ? (
              <p className="text-sm text-gray-500">Loading clients...</p>
            ) : (
              <select
                id="client"
                {...register('client')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              >
                <option value="">Select a client</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            )}
            {errors.client && (
              <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Case Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="e.g. Property Dispute"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="case_number" className="block text-sm font-medium text-gray-700 mb-1">
              Case Number *
            </label>
            <input
              id="case_number"
              type="text"
              {...register('case_number')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="e.g. PD-2026-001"
            />
            {errors.case_number && (
              <p className="mt-1 text-sm text-red-600">{errors.case_number.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="Brief description of the case"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#1754cf] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Case')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/cases')}
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
