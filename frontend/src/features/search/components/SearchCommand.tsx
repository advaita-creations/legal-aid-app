import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Briefcase, FileText, Loader2, Command } from 'lucide-react';

import { cn } from '@/lib/utils';

import { searchApi } from '../api/searchApi';
import type { SearchResult, SearchResponse } from '../types';

interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

const typeIcons = {
  client: Users,
  case: Briefcase,
  document: FileText,
};

const typeLabels = {
  client: 'Client',
  case: 'Case',
  document: 'Document',
};

const typeColors = {
  client: 'text-purple-500 bg-purple-50',
  case: 'text-blue-500 bg-blue-50',
  document: 'text-amber-500 bg-amber-50',
};

function getResultLabel(result: SearchResult): string {
  if (result.type === 'client') return result.full_name;
  if (result.type === 'case') return result.title;
  return result.name;
}

function getResultSublabel(result: SearchResult): string {
  if (result.type === 'client') return result.email;
  if (result.type === 'case') return result.case_number;
  return result.file_type.toUpperCase();
}

function getResultPath(result: SearchResult): string {
  if (result.type === 'client') return `/clients/${result.id}`;
  if (result.type === 'case') return `/cases/${result.id}`;
  return `/documents/${result.id}`;
}

export function SearchCommand({ open, onClose }: SearchCommandProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data: SearchResponse = await searchApi.search(q);
      const combined: SearchResult[] = [
        ...data.clients,
        ...data.cases,
        ...data.documents,
      ];
      setResults(combined);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  function handleSelect(result: SearchResult) {
    navigate(getResultPath(result));
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search clients, cases, documents..."
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto">
                {results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, i) => {
                      const Icon = typeIcons[result.type];
                      const color = typeColors[result.type];
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50',
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getResultLabel(result)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {getResultSublabel(result)}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 uppercase">
                            {typeLabels[result.type]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : query.length >= 2 && !isLoading ? (
                  <div className="py-10 text-center">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No results found</p>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Command className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Start typing to search...</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
