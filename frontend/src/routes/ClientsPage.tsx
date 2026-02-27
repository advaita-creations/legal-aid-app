import { ClientList } from '@/features/clients/components/ClientList';

export function ClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ClientList />
      </main>
    </div>
  );
}
