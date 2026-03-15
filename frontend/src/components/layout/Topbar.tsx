import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Search } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { SearchCommand } from '@/features/search';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function Topbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchEnabled = isFeatureEnabled('GLOBAL_SEARCH');

  useEffect(() => {
    if (!searchEnabled) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchEnabled]);

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 ml-60">
        {/* Search trigger */}
        <div>
          {searchEnabled && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-300 hover:bg-white transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="ml-4 hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

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

      {searchEnabled && (
        <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
