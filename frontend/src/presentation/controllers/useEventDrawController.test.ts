import { renderHook, waitFor, act } from '@testing-library/react';
import { useEventDrawController } from './useEventDrawController';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { 
  mockGetUser, 
  mockRpc, 
  mockGetSession,
} from '../../../vitest.setup';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock window.alert
vi.spyOn(window, 'alert').mockImplementation(() => {});

function createMockChain(data: any, isError = false) {
  const c: any = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    or: vi.fn(() => c),
    order: vi.fn(() => c),
    single: vi.fn(() => Promise.resolve({ data, error: isError ? { message: 'error' } : null })),
    insert: vi.fn().mockResolvedValue({ error: isError ? { message: 'error' } : null }),
    then: vi.fn((resolve) => resolve({ data, error: isError ? { message: 'error' } : null }))
  };
  return c;
}

describe('useEventDrawController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('fetches drawn participant and messages', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockParts = [{ user_id: 'user-1', drawn_id: 'drawn-1' }];
    const mockDrawn = { name: 'Alice' };
    const mockPrivMsgs = [
      { id: 'm1', sender_id: 'drawn-1', receiver_id: 'user-1', text: 'Hi', sender_display: 'Alice' }
    ];

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vw_participants') return createMockChain(mockParts);
      if (table === 'users') return createMockChain(mockDrawn);
      if (table === 'private_messages') return createMockChain(mockPrivMsgs);
      return createMockChain(null);
    });

    mockRpc.mockResolvedValue({ data: mockPrivMsgs, error: null });

    const { result } = renderHook(() => useEventDrawController('evt-1'));

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    expect(result.current.myDrawn).toEqual(mockDrawn);
    expect(result.current.messages).toHaveLength(1);
  });

  it('handles sending message', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockParts = [{ user_id: 'user-1', drawn_id: 'drawn-1' }];
    
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
        if (table === 'vw_participants') return createMockChain(mockParts);
        if (table === 'users') return createMockChain({ name: 'Alice' });
        if (table === 'private_messages') return createMockChain([]);
        return createMockChain(null);
    });
    mockRpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useEventDrawController('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    result.current.setNewMessage('Hello');
    
    const e = { preventDefault: vi.fn() } as any;
    await result.current.handleSendMessage(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('private_messages');
  });

  it('handles sending message error and realtime payload', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockParts = [{ user_id: 'user-1', drawn_id: 'drawn-1' }];
    
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
        if (table === 'vw_participants') return createMockChain(mockParts);
        if (table === 'users') return createMockChain({ name: 'Alice' });
        return createMockChain(null);
    });
    
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Network error' } });

    let onPayload: any = null;
    const mockChannel = {
      on: vi.fn().mockImplementation((event, filter, callback) => {
        onPayload = callback;
        return mockChannel;
      }),
      subscribe: vi.fn()
    };
    supabase.channel = vi.fn().mockReturnValue(mockChannel);
    supabase.removeChannel = vi.fn();

    const { result } = renderHook(() => useEventDrawController('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // Test error
    act(() => {
      result.current.setNewMessage('Error Message');
    });
    await act(async () => {
      await result.current.handleSendMessage({ preventDefault: vi.fn() } as any);
    });
    expect(window.alert).toHaveBeenCalledWith('draw.error_send');

    // Test payload
    if (onPayload) {
      onPayload({ new: { sender_id: 'other', receiver_id: 'user-1', text: 'Hello' } });
    }

    expect(supabase.channel).toHaveBeenCalledWith('private_msgs');
  });

  it('redirects to event page if not drawn', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockParts = [{ user_id: 'user-1', drawn_id: null }];
    
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
        if (table === 'vw_participants') return createMockChain(mockParts);
        return createMockChain(null);
    });

    renderHook(() => useEventDrawController('evt-1'));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('draw.not_drawn');
    });
  });

  it('handles null parts — sets loading false and returns early', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockFrom = vi.mocked(supabase.from);
    // vw_participants returns null data — !parts branch
    mockFrom.mockImplementation((table: string) => {
        if (table === 'vw_participants') return createMockChain(null);
        return createMockChain(null);
    });

    const { result } = renderHook(() => useEventDrawController('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.myDrawn).toBeNull();
  });

  it('formats sender_display correctly for messages from self', async () => {
    const mockUser = { id: 'user-1' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } }, error: null });

    const mockParts = [{ user_id: 'user-1', drawn_id: 'drawn-1' }];
    // A message sent by the current user — exercises sender_display ternary "You" branch
    const selfMsg = [{ id: 'm1', sender_id: 'user-1', receiver_id: 'drawn-1', text: 'Hi', sender_display: 'Me' }];

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vw_participants') return createMockChain(mockParts);
      if (table === 'users') return createMockChain({ name: 'Alice' });
      if (table === 'private_messages') return createMockChain(selfMsg);
      return createMockChain(null);
    });

    mockRpc.mockResolvedValue({ data: selfMsg, error: null });

    const { result } = renderHook(() => useEventDrawController('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

    // The self-message should get sender_display = 'You'
    const selfFormatted = result.current.messages.find((m: any) => m.sender_id === 'user-1');
    expect(selfFormatted?.sender_display).toBe('You');
  });
});
