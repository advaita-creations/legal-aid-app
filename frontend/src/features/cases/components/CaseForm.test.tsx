import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CaseForm } from './CaseForm';
import { ToastProvider } from '@/components/ui/toast';

const mockCreate = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../api/casesApi', () => ({
  casesApi: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

vi.mock('@/features/clients/api/clientsApi', () => ({
  clientsApi: {
    getAll: vi.fn().mockResolvedValue([
      { id: '1', full_name: 'Test Client', email: 'test@test.com' },
    ]),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>{ui}</ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('CaseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', async () => {
    renderWithProviders(<CaseForm />);
    expect(screen.getByLabelText(/case title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/case number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create case/i })).toBeInTheDocument();
  });

  it('loads client dropdown', async () => {
    renderWithProviders(<CaseForm />);
    expect(await screen.findByText('Test Client')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CaseForm />);

    await user.click(screen.getByRole('button', { name: /create case/i }));

    await waitFor(() => {
      expect(screen.getByText(/please select a client/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/title must be at least 2 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/case number is required/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockCreate.mockResolvedValue({ id: '1', title: 'Test Case' });
    const user = userEvent.setup();
    renderWithProviders(<CaseForm />);

    const clientSelect = await screen.findByLabelText(/client/i);
    await user.selectOptions(clientSelect, '1');
    await user.type(screen.getByLabelText(/case title/i), 'Property Dispute');
    await user.type(screen.getByLabelText(/case number/i), 'PD-001');
    await user.click(screen.getByRole('button', { name: /create case/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.client).toBe('1');
      expect(callArg.title).toBe('Property Dispute');
      expect(callArg.case_number).toBe('PD-001');
    });
  });
});
