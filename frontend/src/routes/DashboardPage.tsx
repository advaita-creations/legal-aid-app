import { useNavigate, Link } from 'react-router-dom';
import { Scale, Users, Briefcase, FileText, LogOut } from 'lucide-react';

import { useAuth } from '@/features/auth';

export function DashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const stats = [
    { label: 'Active Clients', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Open Cases', value: '0', icon: Briefcase, color: 'text-green-600' },
    { label: 'Documents', value: '0', icon: FileText, color: 'text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1754cf] rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Legal Aid</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors">
              <Briefcase className="w-5 h-5 text-[#1754cf]" />
              <span className="font-medium text-gray-900">Create Case</span>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-[#1754cf] hover:bg-blue-50/50 transition-colors">
              <FileText className="w-5 h-5 text-[#1754cf]" />
              <span className="font-medium text-gray-900">Upload Document</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
