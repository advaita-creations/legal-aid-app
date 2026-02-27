import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClientForm } from './ClientForm';
import { ToastProvider } from '@/components/ui/toast';

const mockCreate = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../api/clientsApi', () => ({
  clientsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
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

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    renderWithProviders(<ClientForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create client/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClientForm />);

    await user.click(screen.getByRole('button', { name: /create client/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockCreate.mockResolvedValue({ id: '1', full_name: 'Test' });
    const user = userEvent.setup();
    renderWithProviders(<ClientForm />);

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /create client/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.full_name).toBe('John Doe');
      expect(callArg.email).toBe('john@example.com');
    });
  });
});
