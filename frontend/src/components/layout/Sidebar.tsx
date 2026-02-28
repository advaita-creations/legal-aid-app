import { NavLink } from 'react-router-dom';
import { Scale, LayoutDashboard, Users, Briefcase, FileText, Shield } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/cases', label: 'Cases', icon: Briefcase },
  { to: '/documents', label: 'Documents', icon: FileText },
];

export function Sidebar() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="w-9 h-9 bg-[#1754cf] rounded-lg flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Legal Aid</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
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
    </aside>
  );
}
