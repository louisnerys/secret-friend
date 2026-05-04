import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './page';
import { supabase } from '@/lib/supabase';
import { mockGetUser, mockRpc } from '../../../vitest.setup';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics correctly', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: {
        mau: 100,
        messages_24h: 50,
        engagement: {
          rate_percentage: 30,
          with_wishlist: 10,
          total_participants: 100
        },
        events: {
           open: 1,
           drawn: 2,
           finished: 3
        }
      },
      error: null,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/100/i)).not.toBeNull();
    });
  });

  it('handles error state', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Test Error" },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Test Error/i)).not.toBeNull();
    });
  });

  it('handles error state without message', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    // error without a .message property — exercises the `||` fallback branch
    mockRpc.mockRejectedValue({});

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Erro ao carregar/i)).not.toBeNull();
    });
  });

  it('handles missing user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(<AdminDashboard />);
    // Should stay in loading or redirect (which is mocked)
  });

  it('calls alert when make-me-admin is clicked', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });
    // Trigger error state to show the "how_to_admin" button
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Denied' } });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<AdminDashboard />);
    
    await waitFor(() => {
      const btn = screen.getByText('admin.how_to_admin');
      fireEvent.click(btn);
      expect(alertSpy).toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('renders nothing when metrics are null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { container } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('navigates back to dashboard on back button click', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // Trigger error state to show the back_dashboard button
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Denied' } });

    const { getByText } = render(<AdminDashboard />);
    
    await waitFor(() => {
      const btn = getByText('admin.back_dashboard');
      fireEvent.click(btn);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates back to dashboard from main header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockRpc.mockResolvedValue({ data: {
      mau: 100,
      messages_24h: 50,
      engagement: {
        rate_percentage: 30,
        with_wishlist: 10,
        total_participants: 100
      },
      events: {
         open: 1,
         drawn: 2,
         finished: 3
      }
    }, error: null });

    const { getByText, getByRole } = render(<AdminDashboard />);
    
    await waitFor(() => {
      const btn = getByText('admin.back');
      fireEvent.click(btn);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
