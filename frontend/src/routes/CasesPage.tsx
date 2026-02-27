import { CaseList } from '@/features/cases/components/CaseList';

export function CasesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CaseList />
      </main>
    </div>
  );
}
