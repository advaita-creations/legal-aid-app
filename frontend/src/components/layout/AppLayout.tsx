import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChatDrawer } from '@/features/chat';
import { isFeatureEnabled } from '@/lib/feature-flags';

export function AppLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatEnabled = isFeatureEnabled('CHAT');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      <main className={`transition-all duration-300 ease-in-out pt-0 ${
        sidebarCollapsed ? 'ml-16' : 'ml-60'
      }`}>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* Floating chat button + drawer */}
      {chatEnabled && (
        <>
          <AnimatePresence>
            {!chatOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={() => setChatOpen(true)}
                className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:brightness-110 transition-all"
                title="LIA - Your Legal AI Assistant"
              >
                <MessageCircle className="w-6 h-6" />
              </motion.button>
            )}
          </AnimatePresence>
          <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
        </>
      )}
    </div>
  );
}
