import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, Shield, CheckCircle, AlertTriangle, Loader, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/features/admin/api/adminApi';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    );
  }

  const summaryStats = [
    { label: 'Total Advocates', value: String(stats?.total_advocates ?? '–'), icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Advocates', value: String(stats?.active_advocates ?? '–'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Clients', value: String(stats?.total_clients ?? '–'), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Cases', value: String(stats?.total_cases ?? '–'), icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Documents', value: String(stats?.total_documents ?? '–'), icon: FileText, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const docsByStatus = stats?.documents_by_status;
  const docStats = [
    { label: 'Uploaded', value: String(docsByStatus?.uploaded ?? '–'), icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Ready to Process', value: String(docsByStatus?.ready_to_process ?? '–'), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: String(docsByStatus?.in_progress ?? '–'), icon: Loader, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Processed', value: String(docsByStatus?.processed ?? '–'), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="mt-1 text-gray-600">System-wide overview and management.</p>
        </div>
        <Link
          to="/admin/users"
          className="flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3db4] transition-colors"
        >
          <Users className="w-4 h-4" />
          Manage Advocates
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Status</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {docStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
          >
            <Users className="w-5 h-5 text-[#1754cf]" />
            <span className="font-medium text-gray-900">Manage Advocates</span>
          </Link>
          <Link
            to="/documents"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
          >
            <FileText className="w-5 h-5 text-[#1754cf]" />
            <span className="font-medium text-gray-900">View Documents</span>
          </Link>
          <Link
            to="/cases"
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
          >
            <Briefcase className="w-5 h-5 text-[#1754cf]" />
            <span className="font-medium text-gray-900">View Cases</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
