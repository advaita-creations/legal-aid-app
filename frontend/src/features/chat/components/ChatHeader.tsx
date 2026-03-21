import { useQuery } from '@tanstack/react-query';
import { Bot, X, Users, Briefcase } from 'lucide-react';

import { clientsApi } from '@/features/clients/api/clientsApi';
import { casesApi } from '@/features/cases/api/casesApi';

interface ClientOption {
  id: number;
  full_name: string;
}

interface CaseOption {
  id: number;
  title: string;
  case_number: string;
}

interface ChatHeaderProps {
  onClose: () => void;
  selectedClientId: number | null;
  onClientChange: (clientId: number | null) => void;
  selectedCaseId: number | null;
  onCaseChange: (caseId: number | null) => void;
}

export function ChatHeader({ onClose, selectedClientId, onClientChange, selectedCaseId, onCaseChange }: ChatHeaderProps) {
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
    select: (data): ClientOption[] =>
      data.map((c) => ({ id: Number(c.id), full_name: c.full_name })),
  });

  const { data: cases } = useQuery({
    queryKey: ['cases'],
    queryFn: casesApi.getAll,
    select: (data): CaseOption[] =>
      data.map((c) => ({ id: Number(c.id), title: c.title, case_number: c.case_number })),
  });

  const contextLabel = selectedClientId && selectedCaseId
    ? 'RAG — Client + Case context'
    : selectedClientId
      ? 'RAG — Client context'
      : 'General chat';

  return (
    <div className="border-b border-gray-200 bg-white px-5 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">LIA - Your Legal AI Assistant</h3>
            <p className="text-[11px] text-gray-400">{contextLabel}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Client + Case selectors */}
      <div className="mt-2.5 space-y-1.5">
        {clients && clients.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedClientId ?? ''}
              onChange={(e) => onClientChange(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">All clients (general chat)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        {cases && cases.length > 0 && (
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={selectedCaseId ?? ''}
              onChange={(e) => onCaseChange(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">No specific case</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.case_number})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
