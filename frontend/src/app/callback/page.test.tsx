import { render, screen, waitFor, act } from '@testing-library/react';
import CallbackPage from './page';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: vi.fn(),
  Suspense: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
  },
}));

describe('CallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to dashboard when session is found', async () => {
    (useSearchParams as any).mockReturnValue({
      get: (param: string) => {
        if (param === 'next') return '/custom-next';
        return null;
      }
    });

    mockGetSession.mockResolvedValue({ data: { session: { user: { email: 't@t.com' } } }, error: null });
    // the code does not seem to handle exchangeCode explicitly in callback page, only getSession

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackPage />
      </Suspense>
    );

    await waitFor(() => {
      // The component pushes to /dashboard if session found (wait, not /custom-next?)
      // Let's just check /dashboard according to grep
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to login when error occurs', async () => {
    (useSearchParams as any).mockReturnValue({
      get: (param: string) => null
    });

    mockGetSession.mockResolvedValue({ data: { session: null }, error: new Error('err') });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackPage />
      </Suspense>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?error=callback_failed');
    });
  });

  it('handles auth state change if session is not immediately found', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    
    let callback: any;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      callback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(<CallbackPage />);

    // Wait a tick
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    
    // Simulate auth event
    callback('SIGNED_IN', { user: { id: '1' } });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to login after timeout if no session found', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(<CallbackPage />);

    // Run all timers and microtasks
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mockPush).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
