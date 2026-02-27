import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClientList } from './ClientList';

vi.mock('../api/clientsApi', () => ({
  clientsApi: {
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

describe('ClientList', () => {
  it('shows loading state initially', () => {
    renderWithProviders(<ClientList />);

    expect(screen.getByText('Loading clients...')).toBeInTheDocument();
  });

  it('renders heading and add button after loading', async () => {
    const { clientsApi } = await import('../api/clientsApi');
    vi.mocked(clientsApi.getAll).mockResolvedValue([]);

    renderWithProviders(<ClientList />);

    expect(await screen.findByText('Clients')).toBeInTheDocument();
    expect(screen.getAllByText('Add Client').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no clients', async () => {
    const { clientsApi } = await import('../api/clientsApi');
    vi.mocked(clientsApi.getAll).mockResolvedValue([]);

    renderWithProviders(<ClientList />);

    expect(await screen.findByText('No clients yet')).toBeInTheDocument();
    expect(screen.getByText('Get started by adding your first client.')).toBeInTheDocument();
  });

  it('renders client cards when data exists', async () => {
    const { clientsApi } = await import('../api/clientsApi');
    vi.mocked(clientsApi.getAll).mockResolvedValue([
      {
        id: '1',
        advocate: '1',
        advocate_name: 'Adv. Rajesh',
        full_name: 'Test Client',
        email: 'test@example.com',
        phone: '+919876543210',
        created_at: '2026-02-27T10:00:00Z',
        updated_at: '2026-02-27T10:00:00Z',
      },
    ]);

    renderWithProviders(<ClientList />);

    expect(await screen.findByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    const { clientsApi } = await import('../api/clientsApi');
    vi.mocked(clientsApi.getAll).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<ClientList />);

    expect(await screen.findByText(/failed to load clients/i)).toBeInTheDocument();
  });
});
