import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

import { AuthProvider, ProtectedRoute } from '@/features/auth';
import { AppLayout } from '@/components/layout/AppLayout';

const LoginPage = lazy(() =>
  import('./routes/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('./routes/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ClientsPage = lazy(() =>
  import('./routes/ClientsPage').then((m) => ({ default: m.ClientsPage })),
);
const ClientNewPage = lazy(() =>
  import('./routes/ClientNewPage').then((m) => ({ default: m.ClientNewPage })),
);
const ClientDetailPage = lazy(() =>
  import('./routes/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })),
);
const CasesPage = lazy(() =>
  import('./routes/CasesPage').then((m) => ({ default: m.CasesPage })),
);
const CaseNewPage = lazy(() =>
  import('./routes/CaseNewPage').then((m) => ({ default: m.CaseNewPage })),
);
const CaseDetailPage = lazy(() =>
  import('./routes/CaseDetailPage').then((m) => ({ default: m.CaseDetailPage })),
);
const DocumentsPage = lazy(() =>
  import('./routes/DocumentsPage').then((m) => ({ default: m.DocumentsPage })),
);
const UnauthorizedPage = lazy(() =>
  import('./routes/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/new" element={<ClientNewPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/cases/new" element={<CaseNewPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export { App };
