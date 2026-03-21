import { motion } from 'framer-motion';
import { Bot, FileText, Search, Scale } from 'lucide-react';

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  { icon: FileText, text: 'Summarize this case' },
  { icon: Search, text: 'What are the key clauses?' },
  { icon: Scale, text: 'Find discrepancies in the agreement' },
];

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20"
      >
        <Bot className="w-7 h-7 text-white" />
      </motion.div>

      <h3 className="text-base font-semibold text-gray-900 mb-1">LIA - Your AI Assistant</h3>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-[260px]">
        Ask me anything about your documents, cases, or legal research.
      </p>

      <div className="w-full space-y-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">
          Suggested prompts
        </p>
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.button
              key={s.text}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => onSuggestionClick(s.text)}
              className="flex items-center gap-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-400 shrink-0" />
              {s.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
