import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { CaseForm } from '@/features/cases/components/CaseForm';
import { casesApi } from '@/features/cases/api/casesApi';

export function CaseEditPage() {
  const { id } = useParams<{ id: string }>();

  const { data: caseItem, isLoading, error } = useQuery({
    queryKey: ['cases', id],
    queryFn: () => casesApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading case...</div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Failed to load case.</p>
      </div>
    );
  }

  return (
    <CaseForm
      caseId={String(caseItem.id)}
      initialData={{
        client: String(caseItem.client),
        title: caseItem.title,
        case_number: caseItem.case_number,
        description: caseItem.description ?? '',
        status: caseItem.status,
      }}
    />
  );
}
