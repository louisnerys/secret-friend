import { render, fireEvent, waitFor, act } from '@testing-library/react';
import Dashboard from './page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('Dashboard', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
  });

  it('renders loading state initially', async () => {
    // getSession pending
    const { getByText } = render(<Dashboard />);
    expect(getByText('common.loading')).toBeDefined();
  });

  it('redirects to login if no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders events list for authenticated user', async () => {
    const mockUser = { id: 'u1', email: 'test@test.com' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { name: 'Alice', is_admin: false }, error: null }),
        };
      }
      if (table === 'events') {
        return {
          select: vi.fn().mockResolvedValue({ 
            data: [{ id: 'e1', name: 'Party', status: 'open', reveal_date: '2025-12-25' }], 
            error: null 
          }),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const { getByText, getAllByText } = render(<Dashboard />);
    
    await waitFor(() => {
      expect(getByText('Party')).toBeDefined();
      // The name Alice is used to get the initial 'A' in the header
      // and in the greeting it renders dashboard.greeting which contains Alice
      expect(getAllByText(/A/)).toBeDefined();
    });
  });

  it('navigates to event details on click', async () => {
    // Setup authenticated state with 1 event
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'users') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { name: 'A' }, error: null }) };
        if (table === 'events') return { select: vi.fn().mockResolvedValue({ data: [{ id: 'e1', name: 'Party' }], error: null }) };
        return {};
    });

    const { getByText } = render(<Dashboard />);
    
    await waitFor(() => {
      const card = getByText('Party');
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith('/evento/e1');
    });
  });

  it('handles logout', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { name: 'A' }, error: null }) });

    const { getByLabelText } = render(<Dashboard />);
    
    await waitFor(async () => {
      const logoutBtn = getByLabelText('common.logout');
      fireEvent.click(logoutBtn);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
    
    // Wait for the navigation to login which happens after SIGNED_OUT event
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders admin button if user is admin', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'users') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { name: 'Admin', is_admin: true }, error: null }) };
        if (table === 'events') return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
        return {};
    });

    const { container } = render(<Dashboard />);
    
    await waitFor(() => {
      expect(container.querySelector('button.uppercase.text-secondary')).not.toBeNull();
    });
    const adminBtn = container.querySelector('button.uppercase.text-secondary') as HTMLElement;
    
    fireEvent.click(adminBtn);
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('handles error fetching data', async () => {
    const mockUser = { id: 'u1' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockImplementation(() => {
        throw new Error('Database error');
    });

    render(<Dashboard />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles auth state change SIGNED_IN', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
    let onAuthCb: any = null;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      onAuthCb = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(<Dashboard />);
    
    await act(async () => {
      if (onAuthCb) {
        onAuthCb('SIGNED_IN', { user: mockUser });
      }
    });

    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('handles auth state change SIGNED_OUT', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null }, error: null });
    let onAuthCb: any = null;
    (supabase.auth.onAuthStateChange as any).mockImplementation((cb: any) => {
      onAuthCb = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(<Dashboard />);
    
    await act(async () => {
      if (onAuthCb) {
        onAuthCb('SIGNED_OUT', null);
      }
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to create event page', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'users') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { name: 'User' }, error: null }) };
        if (table === 'events') return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
        return {};
    });

    const { getByText } = render(<Dashboard />);
    await waitFor(() => {
      fireEvent.click(getByText('dashboard.create_event'));
    });
    expect(mockPush).toHaveBeenCalledWith('/novo-evento');
  });

  it('navigates to event details page on card click and enter key', async () => {
    const mockUser = { id: 'u1' };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: mockUser } }, error: null });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'users') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { name: 'User' }, error: null }) };
        if (table === 'events') return { select: vi.fn().mockResolvedValue({ data: [{ id: 'evt-1', name: 'Test Event' }], error: null }) };
        return {};
    });

    const { getByText } = render(<Dashboard />);
    await waitFor(() => {
      expect(getByText('Test Event')).toBeDefined();
    });

    const eventCard = getByText('Test Event').closest('div[role="button"]')!;
    fireEvent.click(eventCard);
    expect(mockPush).toHaveBeenCalledWith('/evento/evt-1');

    fireEvent.keyDown(eventCard, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/evento/evt-1');
  });
});
