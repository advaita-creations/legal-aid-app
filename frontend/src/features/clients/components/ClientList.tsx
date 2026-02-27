import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { clientsApi } from '../api/clientsApi';

export function ClientList() {
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load clients. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your client information
          </p>
        </div>
        <Link
          to="/clients/new"
          className="flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {clients && clients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first client.</p>
          <Link
            to="/clients/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients?.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#1754cf] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1754cf]" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{client.full_name}</h3>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
