import { renderHook, waitFor } from '@testing-library/react';
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

function createMockChain(data: any) {
  const c: any = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    or: vi.fn(() => c),
    order: vi.fn(() => c),
    single: vi.fn(() => Promise.resolve({ data, error: null })),
    insert: vi.fn().mockResolvedValue({ error: null }),
    then: vi.fn((resolve) => resolve({ data, error: null }))
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
});
