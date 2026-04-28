import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './page';
import { supabase } from '@/lib/supabase';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

// We'll mock the hook to avoid the setTimeout inside useEffect
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (fn: any, deps: any) => {
       // Just call it immediately synchronously for tests
       fn();
    }
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics correctly', async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    (supabase.rpc as any) = vi.fn().mockResolvedValue({
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
    }, { timeout: 3000 });
  });

  it('handles error state', async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    (supabase.rpc as any) = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Test Error" },
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Test Error/i)).not.toBeNull();
    }, { timeout: 3000 });
  });

  it('handles missing user', async () => {
    (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(<AdminDashboard />);
  });
});
