import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  Calendar,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { casesApi } from '../api/casesApi';
import type { CaseEventType } from '../types';

interface CaseTimelineProps {
  caseId: string;
}

const eventConfig: Record<CaseEventType, { icon: typeof FileText; color: string; bg: string }> = {
  created: { icon: Star, color: 'text-blue-600', bg: 'bg-blue-100' },
  status_change: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
  document_added: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-100' },
  document_processed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  note: { icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' },
  hearing: { icon: Calendar, color: 'text-red-600', bg: 'bg-red-100' },
  milestone: { icon: Star, color: 'text-indigo-600', bg: 'bg-indigo-100' },
};

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['case-events', caseId],
    queryFn: () => casesApi.getEvents(caseId),
    enabled: !!caseId,
  });

  const addMutation = useMutation({
    mutationFn: (data: { event_type: string; title: string; description?: string }) =>
      casesApi.addEvent(caseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-events', caseId] });
      setNoteTitle('');
      setNoteDescription('');
      setShowForm(false);
    },
  });

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    addMutation.mutate({
      event_type: 'note',
      title: noteTitle.trim(),
      description: noteDescription.trim(),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Case Timeline</h3>
          {events && (
            <span className="text-xs text-gray-400">({events.length} events)</span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Add note button */}
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center mb-4"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Note
                </button>
              )}

              {/* Inline note form */}
              <AnimatePresence>
                {showForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddNote}
                    className="mb-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50/30 p-3"
                  >
                    <input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note title..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      autoFocus
                    />
                    <textarea
                      value={noteDescription}
                      onChange={(e) => setNoteDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!noteTitle.trim() || addMutation.isPending}
                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {addMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Timeline */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : !events || events.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No events yet</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

                  <div className="space-y-4">
                    {events.map((event, i) => {
                      const config = eventConfig[event.event_type] ?? eventConfig.note;
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 relative"
                        >
                          <div
                            className={cn(
                              'w-[31px] h-[31px] rounded-full flex items-center justify-center shrink-0 z-10',
                              config.bg,
                            )}
                          >
                            <Icon className={cn('w-3.5 h-3.5', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400">
                                {new Date(event.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {event.created_by_name && (
                                <span className="text-[10px] text-gray-400">
                                  by {event.created_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
