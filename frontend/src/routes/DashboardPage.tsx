import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';

export function DashboardPage() {
  const { profile } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const stats = [
    { label: 'Active Clients', value: String(statsData?.total_clients ?? '–'), icon: Users, color: 'text-blue-600' },
    { label: 'Open Cases', value: String(statsData?.total_cases ?? '–'), icon: Briefcase, color: 'text-green-600' },
    { label: 'Documents', value: String(statsData?.total_documents ?? '–'), icon: FileText, color: 'text-orange-600' },
  ];

  return (
    <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="mt-1 text-gray-600">
            Here's what's happening with your practice today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {stats.map((stat) => (
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

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/clients"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
            >
              <Users className="w-5 h-5 text-[#1754cf]" />
              <span className="font-medium text-gray-900">View Clients</span>
            </Link>
            <Link
              to="/cases"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
            >
              <Briefcase className="w-5 h-5 text-[#1754cf]" />
              <span className="font-medium text-gray-900">View Cases</span>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors"
            >
              <FileText className="w-5 h-5 text-[#1754cf]" />
              <span className="font-medium text-gray-900">View Documents</span>
            </Link>
          </div>
        </div>
    </div>
  );
}
