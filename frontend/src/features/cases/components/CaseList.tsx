import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Plus, Tag, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { casesApi } from '../api/casesApi';
import type { CaseStatus } from '../types';

const statusColors: Record<CaseStatus, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  archived: 'bg-amber-100 text-amber-700',
};

export function CaseList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load cases. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cases</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your legal cases
          </p>
        </div>
        <Link
          to="/cases/new"
          className="flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Case
        </Link>
      </div>

      {!isLoading && cases && cases.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1754cf] focus:outline-none focus:ring-1 focus:ring-[#1754cf]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {cases && cases.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases yet</h3>
          <p className="text-gray-600 mb-4">Create your first legal case to get started.</p>
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Case
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases?.filter((c) => {
            const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.case_number.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).map((caseItem) => (
            <Link
              key={caseItem.id}
              to={`/cases/${caseItem.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-[#1754cf] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#1754cf]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{caseItem.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {caseItem.case_number}
                    </span>
                    {caseItem.client_name && (
                      <span>• {caseItem.client_name}</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium capitalize',
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
  );
}
