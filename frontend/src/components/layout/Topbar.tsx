import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

import { useAuth } from '@/features/auth';

export function Topbar() {
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

  return (
    <header className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 ml-60">
      <div className="flex items-center gap-4">
        <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-[#1754cf]" />
          </div>
          <span className="font-medium">{profile?.full_name}</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
