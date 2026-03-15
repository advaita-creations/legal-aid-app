import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ChatRole } from '../types';

interface ChatBubbleProps {
  role: ChatRole;
  content: string;
  timestamp: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2.5 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser ? 'bg-blue-600' : 'bg-gray-100 border border-gray-200',
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-gray-600" />
        )}
      </div>

      {/* Bubble */}
      <div>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-blue-600 text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-tl-md',
          )}
        >
          {content}
        </div>
        <p
          className={cn(
            'text-[10px] text-gray-400 mt-1 px-1',
            isUser ? 'text-right' : 'text-left',
          )}
        >
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
