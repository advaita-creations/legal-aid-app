import { DocumentList } from '@/features/documents/components/DocumentList';

export function DocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DocumentList />
      </main>
    </div>
  );
}
