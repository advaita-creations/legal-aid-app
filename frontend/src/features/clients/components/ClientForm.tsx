import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { clientsApi } from '../api/clientsApi';

const clientSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().max(500, 'Address must be under 500 characters').optional(),
  notes: z.string().max(1000, 'Notes must be under 1000 characters').optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function ClientForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    },
  });

  async function onSubmit(data: ClientFormValues) {
    await mutation.mutateAsync(data);
  }

  return (
    <div>
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Client</h2>

        {mutation.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-sm text-red-800">Failed to create client. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              id="full_name"
              type="text"
              {...register('full_name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="Enter client's full name"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="client@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              {...register('phone')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              {...register('address')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
              placeholder="Enter client's address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
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
              placeholder="Any additional notes about this client"
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
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/clients')}
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
