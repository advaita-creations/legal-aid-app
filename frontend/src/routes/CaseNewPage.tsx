import { CaseForm } from '@/features/cases/components/CaseForm';

export function CaseNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CaseForm />
      </main>
    </div>
  );
}
