import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, Shield, ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { adminApi } from '@/features/admin/api/adminApi';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-advocates', search],
    queryFn: () => adminApi.getAdvocates(search ? { search } : undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleAdvocate(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advocates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast('Advocate status updated');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading advocates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load advocates. You may not have admin access.</p>
      </div>
    );
  }

  const advocates = data?.results ?? [];

  return (
    <div>
      <Link
        to="/admin"
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advocate Management</h2>
          <p className="text-sm text-gray-600 mt-1">{data?.count ?? 0} advocates registered</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {advocates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">No advocates found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {advocates.map((adv) => (
                <tr key={adv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{adv.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{adv.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{adv.clients_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{adv.documents_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        adv.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700',
                      )}
                    >
                      {adv.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(adv.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => {
                        const action = adv.is_active ? 'deactivate' : 'activate';
                        const confirmed = await confirm({
                          title: `${adv.is_active ? 'Deactivate' : 'Activate'} Advocate`,
                          description: `Are you sure you want to ${action} ${adv.full_name}? ${adv.is_active ? 'They will lose access to the platform immediately.' : 'They will regain full access to the platform.'}`,
                          confirmLabel: adv.is_active ? 'Deactivate' : 'Activate',
                          variant: adv.is_active ? 'danger' : 'info',
                        });
                        if (confirmed) {
                          toggleMutation.mutate({ id: adv.id, is_active: !adv.is_active });
                        }
                      }}
                      disabled={toggleMutation.isPending}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        adv.is_active
                          ? 'border border-red-200 text-red-600 hover:bg-red-50'
                          : 'border border-green-200 text-green-600 hover:bg-green-50',
                      )}
                    >
                      {adv.is_active ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          Activate
                        </>
                      )}
                    </button>
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
