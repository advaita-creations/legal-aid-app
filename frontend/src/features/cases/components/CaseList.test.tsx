import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CaseList } from './CaseList';

vi.mock('../api/casesApi', () => ({
  casesApi: {
    getAll: vi.fn(),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('CaseList', () => {
  it('shows loading state initially', () => {
    renderWithProviders(<CaseList />);
    expect(screen.getByText('Loading cases...')).toBeInTheDocument();
  });

  it('renders heading and add button after loading', async () => {
    const { casesApi } = await import('../api/casesApi');
    vi.mocked(casesApi.getAll).mockResolvedValue([]);

    renderWithProviders(<CaseList />);

    expect(await screen.findByText('Cases')).toBeInTheDocument();
    expect(screen.getAllByText('Add Case').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no cases', async () => {
    const { casesApi } = await import('../api/casesApi');
    vi.mocked(casesApi.getAll).mockResolvedValue([]);

    renderWithProviders(<CaseList />);

    expect(await screen.findByText('No cases yet')).toBeInTheDocument();
  });

  it('renders case cards when data exists', async () => {
    const { casesApi } = await import('../api/casesApi');
    vi.mocked(casesApi.getAll).mockResolvedValue([
      {
        id: '1',
        client: '1',
        client_name: 'Test Client',
        title: 'Property Dispute',
        case_number: 'PD-2026-001',
        description: 'Test description',
        status: 'active',
        created_at: '2026-02-27T10:00:00Z',
        updated_at: '2026-02-27T10:00:00Z',
      },
    ]);

    renderWithProviders(<CaseList />);

    expect(await screen.findByText('Property Dispute')).toBeInTheDocument();
    expect(screen.getByText('PD-2026-001')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    const { casesApi } = await import('../api/casesApi');
    vi.mocked(casesApi.getAll).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<CaseList />);

    expect(await screen.findByText(/failed to load cases/i)).toBeInTheDocument();
  });
});
