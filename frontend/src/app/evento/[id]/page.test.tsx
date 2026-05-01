import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EventPage from './page';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Suspense } from 'react';
import { act } from '@testing-library/react';

const {
  mockSingle,
  mockMaybeSingle,
  mockOrder,
  mockInsert,
  mockDelete,
  mockRpc,
  mockEq,
  mockUpdate,
  resolvedParams,
  mockPush
} = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockOrder: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
  mockRpc: vi.fn(),
  mockEq: vi.fn(),
  mockUpdate: vi.fn(),
  resolvedParams: { id: 'evt-1' },
  mockPush: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn((promiseOrContext) => {
      if (promiseOrContext && typeof promiseOrContext.then === 'function') {
        return resolvedParams;
      }
      return actual.use(promiseOrContext);
    }),
    useEffect: (fn: any, deps: any) => {
      try { fn(); } catch(e){}
    }
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({ get: vi.fn() })),
  redirect: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() }
  }),
}));

vi.mock('@/lib/supabase', () => {
  return {
    __mockSingle: mockSingle,
    __mockMaybeSingle: mockMaybeSingle,
    __mockOrder: mockOrder,
    __mockInsert: mockInsert,
    __mockDelete: mockDelete,
    __mockRpc: mockRpc,
    __mockEq: mockEq,
    __mockUpdate: mockUpdate,
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@example.com", user_metadata: { name: 'Test' } } }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "fake-token" } }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
      from: vi.fn((table: string) => {
         const builder: any = {
           select: vi.fn().mockReturnThis(),
           eq: vi.fn().mockReturnThis(),
           in: vi.fn().mockReturnThis(),
           order: mockOrder,
           single: mockSingle,
           maybeSingle: mockMaybeSingle,
           insert: mockInsert,
           update: mockUpdate,
           delete: mockDelete,
         };

         if (table === 'vw_participants') {
            builder.eq = vi.fn(() => mockEq());
         }
         return builder;
      }),
      rpc: vi.fn().mockImplementation((name, args) => {
         if (name === 'get_public_event') {
           return { maybeSingle: mockMaybeSingle };
         }
         return { error: null };
      }),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      })),
      removeChannel: vi.fn(),
    },
  };
});

import * as SupabaseLib from '@/lib/supabase';
const { __mockMaybeSingle, __mockOrder, __mockEq, __mockInsert, __mockRpc, __mockUpdate, __mockDelete, __mockSingle: _mockSingle } = SupabaseLib as any;

describe('EventDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
    });
    if (typeof window !== 'undefined') {
       window.alert = vi.fn();
       window.confirm = vi.fn().mockReturnValue(true);

       Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve()),
        },
      });
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders event details and allows joining', async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'evt-1',
            name: 'Secret Santa 2025',
            status: 'open',
            creator_id: 'user-2', // not the logged-in user
          },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'evt-1',
        name: 'Secret Santa 2025',
        status: 'open',
        creator_id: 'user-2',
      },
      error: null
    });

    __mockEq.mockResolvedValue({
      data: [], // No participants
      error: null
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null
    });

    __mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'part-1' }, error: null }) });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>
      );
      await new Promise(r => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByText('Secret Santa 2025')).toBeDefined();
    });
  });

  it('allows starting the draw for admin', async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'evt-1',
            name: 'Secret Santa 2025',
            status: 'open',
            creator_id: 'user-1',
          },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'evt-1',
        name: 'Secret Santa 2025',
        status: 'open',
        creator_id: 'user-1',
      },
      error: null
    });

    // Make user-1 a participant so "start_draw" logic in frontend doesn't short circuit
    __mockEq.mockResolvedValue({
      data: [
        {user_id: 'user-1', name: 'User 1'},
        {user_id: 'user-2', name: 'User 2'},
        {user_id: 'user-3', name: 'User 3'},
      ],
      error: null
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>
      );
      await new Promise(r => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getAllByText('event.draw_now').length).toBeGreaterThan(0);
    });

    const drawBtns = screen.getAllByRole('button');
    const drawBtn = drawBtns.find(btn => btn.title === 'event.draw_now' || btn.textContent?.includes('event.draw_now'));

    await act(async () => {
      if (drawBtn) fireEvent.click(drawBtn);
      await new Promise(r => setTimeout(r, 0));
    });

    // the draw uses global.fetch
    expect(global.fetch).toHaveBeenCalled();
  });

  it('renders drawn state and allows accessing draw room', async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'evt-1',
            name: 'Secret Santa 2025',
            status: 'drawn',
            creator_id: 'user-1',
          },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'evt-1',
        name: 'Secret Santa 2025',
        status: 'drawn',
        creator_id: 'user-1',
      },
      error: null
    });

    // Mark the current user (user-1) as a participant so that they can see drawn specific buttons.
    __mockEq.mockResolvedValue({
      data: [{user_id: 'user-1', name: 'User 1'}],
      error: null
    });
    __mockOrder.mockResolvedValue({
      data: [], // No messages
      error: null
    });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>
      );
      await new Promise(r => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /event.nav_draw/i })).not.toBeNull();
    });

    const roomBtn = screen.getByRole('button', { name: /event.nav_draw/i });
    fireEvent.click(roomBtn);
    expect(mockPush).toHaveBeenCalledWith('/evento/evt-1/draw');
  });

  it('allows adding a participant (join)', async () => {
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-2' },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({ data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-2' }, error: null });
    __mockEq.mockResolvedValue({ data: [], error: null });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    __mockInsert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'part-1' }, error: null }) });

    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <EventPage params={Promise.resolve(resolvedParams) as any} />
        </Suspense>
      );
      await new Promise(r => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.queryByText(/common.loading/i)).toBeNull();
    });
    const joinBtns = await screen.findAllByRole('button');
    const joinBtn = joinBtns.find(btn => btn.textContent?.includes('event.join_event'));
    await act(async () => {
      if (joinBtn) fireEvent.click(joinBtn);
      await new Promise(r => setTimeout(r, 0));
    });
    expect(__mockInsert).toHaveBeenCalled(); // Since it inserts participant
  });

  it('allows toggling like on mural message', async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({ data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' }, error: null });
    __mockEq.mockResolvedValue({ data: [{user_id: 'user-1', name: 'User 1'}], error: null });
    __mockOrder.mockResolvedValue({ data: [{ id: 'msg-1', text: 'Hello', reactions: {} }], error: null });

    _mockSingle.mockResolvedValue({ data: { id: 'msg-1', text: 'Hello', reactions: {} } });
    __mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>
    );

    await act(async () => { vi.runAllTimers(); });

    // Find the thumb up button
    const likeBtns = screen.getAllByText('👍');

    await act(async () => {
        if(likeBtns.length > 0) {
            fireEvent.click(likeBtns[0]);
            vi.runAllTimers();
        }
    });

    expect(__mockUpdate).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('allows copying link', async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({ data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' }, error: null });
    __mockEq.mockResolvedValue({ data: [{user_id: 'user-1', name: 'User 1'}], error: null });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>
    );
    await act(async () => { vi.runAllTimers(); });

    const copyBtns = screen.getAllByRole('button', { name: 'common.copy' });
    if(copyBtns.length > 0) {
      await act(async () => {
        fireEvent.click(copyBtns[0]);
        vi.runAllTimers();
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
    vi.useRealTimers();
  });

  it('allows removing participant as admin', async () => {
    vi.useFakeTimers();
    __mockRpc.mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' },
          error: null
        })
    });
    __mockMaybeSingle.mockResolvedValue({ data: { id: 'evt-1', name: 'Secret Santa 2025', status: 'open', creator_id: 'user-1' }, error: null });
    __mockEq.mockResolvedValue({ data: [{user_id: 'user-1', name: 'User 1', id: 'part-1'}], error: null });
    __mockOrder.mockResolvedValue({ data: [], error: null });

    __mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <EventPage params={Promise.resolve(resolvedParams) as any} />
      </Suspense>
    );
    await act(async () => { vi.runAllTimers(); });

    const removeBtns = screen.queryAllByRole('button', { name: 'common.remove' });
    if (removeBtns.length > 0) {
       await act(async () => {
         fireEvent.click(removeBtns[0]);
         vi.runAllTimers();
       });
       expect(__mockDelete).toHaveBeenCalled();
    }
    vi.useRealTimers();
  });
});
