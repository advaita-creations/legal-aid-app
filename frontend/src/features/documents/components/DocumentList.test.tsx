import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DocumentList } from './DocumentList';
import { ToastProvider } from '@/components/ui/toast';

vi.mock('../api/documentsApi', () => ({
  documentsApi: {
    getAll: vi.fn(),
    updateStatus: vi.fn(),
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
      <ToastProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('DocumentList', () => {
  it('shows loading state initially', () => {
    renderWithProviders(<DocumentList />);
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Track and manage your uploaded documents')).toBeInTheDocument();
  });

  it('shows empty state when no documents', async () => {
    const { documentsApi } = await import('../api/documentsApi');
    vi.mocked(documentsApi.getAll).mockResolvedValue([]);

    renderWithProviders(<DocumentList />);

    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });

  it('renders document table when data exists', async () => {
    const { documentsApi } = await import('../api/documentsApi');
    vi.mocked(documentsApi.getAll).mockResolvedValue([
      {
        id: '1',
        case: '1',
        case_id: '1',
        case_title: 'Property Dispute',
        client_id: '1',
        client_name: 'Test Client',
        name: 'agreement_scan.jpg',
        file_url: 'http://localhost:8000/media/path/to/file.jpg',
        file_type: 'image',
        file_size_bytes: 2048576,
        mime_type: 'image/jpeg',
        status: 'uploaded',
        notes: null,
        processed_html_url: null,
        processed_json_url: null,
        processed_report_url: null,
        extracted_pdf_url: null,
        created_at: '2026-02-27T10:00:00Z',
        updated_at: '2026-02-27T10:00:00Z',
        status_history: [],
      },
    ]);

    renderWithProviders(<DocumentList />);

    expect(await screen.findByText('agreement_scan.jpg')).toBeInTheDocument();
    expect(screen.getByText('Property Dispute')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error state on fetch failure', async () => {
    const { documentsApi } = await import('../api/documentsApi');
    vi.mocked(documentsApi.getAll).mockRejectedValue(new Error('Network error'));

    renderWithProviders(<DocumentList />);

    expect(await screen.findByText(/failed to load documents/i)).toBeInTheDocument();
  });
});
