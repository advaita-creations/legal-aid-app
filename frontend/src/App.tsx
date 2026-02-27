import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';

import { AuthProvider, ProtectedRoute } from '@/features/auth';

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
const CasesPage = lazy(() =>
  import('./routes/CasesPage').then((m) => ({ default: m.CasesPage })),
);
const CaseNewPage = lazy(() =>
  import('./routes/CaseNewPage').then((m) => ({ default: m.CaseNewPage })),
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
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/new"
                element={
                  <ProtectedRoute>
                    <ClientNewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cases"
                element={
                  <ProtectedRoute>
                    <CasesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cases/new"
                element={
                  <ProtectedRoute>
                    <CaseNewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export { App };
