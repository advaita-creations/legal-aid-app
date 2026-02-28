import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { ClientForm } from '@/features/clients/components/ClientForm';
import { clientsApi } from '@/features/clients/api/clientsApi';

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading client...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load client.</p>
      </div>
    );
  }

  return (
    <ClientForm
      clientId={String(client.id)}
      initialData={{
        full_name: client.full_name,
        email: client.email,
        phone: client.phone ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      }}
    />
  );
}
