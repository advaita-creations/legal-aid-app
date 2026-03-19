import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, FileText, Shield, UserPlus, FolderPlus, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <img src="/images/legal-aid.png" alt="LegalAiD" className="w-9 h-9 flex-shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold text-gray-900">Legal<span className="text-blue-600">AiD</span></span>
        )}
      </div>

      <nav className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto ${
        collapsed ? 'px-2' : 'px-3'
      }`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2 py-3' : '',
                isActive
                  ? 'bg-blue-50 text-[#1754cf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className={`pt-4 pb-1 px-3 ${collapsed ? 'hidden' : ''}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-3' : '',
                  isActive
                    ? 'bg-blue-50 text-[#1754cf]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
              title={collapsed ? 'Admin Dashboard' : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              {!collapsed && 'Admin Dashboard'}
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-3' : '',
                  isActive
                    ? 'bg-blue-50 text-[#1754cf]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
              title={collapsed ? 'Manage Advocates' : undefined}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!collapsed && 'Manage Advocates'}
            </NavLink>
          </>
        )}
      </nav>

      {/* Quick Actions */}
      <div className={`border-t border-gray-200 ${collapsed ? 'px-2 py-3' : 'px-3 py-3'}`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Quick Actions</p>
        )}
        <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                collapsed ? 'justify-center px-2 py-2' : ''
              }`}
              title={collapsed ? action.label : undefined}
            >
              <action.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {!collapsed && action.label}
            </Link>
          ))}
        </div>
      </div>
      {/* Collapse toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-8 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>
      )}
    </aside>
  );
}
