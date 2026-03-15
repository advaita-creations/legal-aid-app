import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, FileText, Shield, UserPlus, FolderPlus, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/cases', label: 'Cases', icon: Briefcase },
  { to: '/documents', label: 'Documents', icon: FileText },
];

const quickActions = [
  { to: '/clients/new', label: 'Add Client', icon: UserPlus },
  { to: '/cases/new', label: 'Add Case', icon: FolderPlus },
  { to: '/documents/new', label: 'Upload Doc', icon: Upload },
];

export function Sidebar() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <img src="/images/legal-aid.png" alt="LegalAiD" className="w-9 h-9" />
        <span className="text-lg font-bold text-gray-900">Legal<span className="text-blue-600">AiD</span></span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-[#1754cf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-[#1754cf]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              <Shield className="w-5 h-5" />
              Admin Dashboard
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-[#1754cf]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              <Users className="w-5 h-5" />
              Manage Advocates
            </NavLink>
          </>
        )}
      </nav>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 px-3 py-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Quick Actions</p>
        <div className="space-y-0.5">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
