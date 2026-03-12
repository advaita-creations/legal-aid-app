import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Briefcase, FileText, Plus, Image, File, Clock, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { cn } from '@/lib/utils';

import { useAuth } from '@/features/auth';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import { documentsApi } from '@/features/documents/api/documentsApi';
import type { DocumentStatus } from '@/features/documents/types';

const statusColors: Record<DocumentStatus, string> = {
  uploaded: 'bg-gray-100 text-gray-700',
  ready_to_process: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  processed: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  ready_to_process: 'Ready',
  in_progress: 'In Progress',
  processed: 'Processed',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsApi.getAll(),
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name}!
            </h2>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your practice today.
            </p>
          </div>
          <Link
            to="/documents/new"
            className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-blue-600/40 hover:scale-105"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <Plus className="relative w-5 h-5" />
            <span className="relative">Easy Doc Upload</span>
          </Link>
        </div>

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

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
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
                {statusFilter ? `No ${statusLabels[statusFilter].toLowerCase()} documents.` : 'No documents yet. Upload your first file.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {doc.file_type === 'image' ? (
                          <Image className="w-4 h-4 text-blue-500" />
                        ) : (
                          <File className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{doc.case_title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium uppercase text-gray-500">{doc.file_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.file_size_bytes)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[doc.status])}>
                        {statusLabels[doc.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/clients/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Add Client</span>
            </Link>
            <Link
              to="/cases/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Add Case</span>
            </Link>
            <Link
              to="/documents/new"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Upload Document</span>
            </Link>
          </div>
        </div>
    </div>
  );
}
