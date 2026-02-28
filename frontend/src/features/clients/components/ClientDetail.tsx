import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Briefcase, Trash2, Pencil } from 'lucide-react';

import { cn } from '@/lib/utils';

import { clientsApi } from '../api/clientsApi';
import { casesApi } from '@/features/cases/api/casesApi';
import { useToast } from '@/components/ui/toast';
import type { CaseStatus } from '@/features/cases/types';

const statusColors: Record<CaseStatus, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  archived: 'bg-amber-100 text-amber-700',
};

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
    select: (allCases) => allCases.filter((c) => c.client === id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast('Client deleted');
      navigate('/clients');
    },
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
        <p className="text-sm text-red-800">Failed to load client details.</p>
      </div>
    );
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

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{client.full_name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Added on {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this client?')) {
                deleteMutation.mutate();
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${client.email}`} className="text-[#1754cf] hover:underline">
                  {client.email}
                </a>
              </div>
              {client.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{client.address}</span>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{client.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Cases</h3>
              <Link
                to="/cases/new"
                className="text-sm text-[#1754cf] hover:underline font-medium"
              >
                + Add Case
              </Link>
            </div>

            {!cases || cases.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No cases for this client yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{caseItem.title}</p>
                        <p className="text-xs text-gray-500">{caseItem.case_number}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                        statusColors[caseItem.status],
                      )}
                    >
                      {caseItem.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
