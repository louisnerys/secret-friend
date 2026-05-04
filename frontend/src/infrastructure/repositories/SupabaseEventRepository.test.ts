import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseEventRepository } from './SupabaseEventRepository';
import { supabase } from '@/lib/supabase';

// Helper to get mocked chain parts from setup
const mockFrom = vi.mocked(supabase.from);

describe('SupabaseEventRepository', () => {
  let repo: SupabaseEventRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SupabaseEventRepository();
  });

  it('getEvents returns data', async () => {
    const mockEvents = [{ id: '1', name: 'Evt' }];
    (supabase.from as any)().select.mockResolvedValue({ data: mockEvents, error: null });
    
    const result = await repo.getEvents();
    expect(result.data).toEqual(mockEvents);
  });

  it('createEvent inserts event and participant', async () => {
    const mockEvent = { id: 'evt-1' };
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
    };
    mockFrom.mockReturnValue(mockChain as any);

    const result = await repo.createEvent('Name', 'Desc', '2025-01-01', 'u1');
    
    expect(mockFrom).toHaveBeenCalledWith('events');
    expect(mockFrom).toHaveBeenCalledWith('participants');
    expect(result.data).toEqual(mockEvent);
  });

  it('getEventDetails aggregates data', async () => {
    const mockEvent = { id: 'evt1', name: 'Test' };
    const mockParts = [{ id: 'p1' }];
    const mockMsgs = [{ id: 'm1' }];

    // Mock RPC for event data
    vi.mocked(supabase.rpc).mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockEvent, error: null })
    } as any);

    // Mock from for participants and messages
    mockFrom.mockImplementation((table: string) => {
        if (table === 'vw_participants') {
            return { 
                select: vi.fn().mockReturnThis(), 
                eq: vi.fn().mockResolvedValue({ data: mockParts, error: null }) 
            } as any;
        }
        if (table === 'messages') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockMsgs, error: null })
            } as any;
        }
        if (table === 'exclusion_groups') {
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null })
            } as any;
        }
        return { 
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null })
        } as any;
    });

    const result = await repo.getEventDetails('evt1');
    expect(result.data.eventData).toEqual(mockEvent);
    expect(result.data.parts).toEqual(mockParts);
    expect(result.data.mMsgs).toEqual(mockMsgs);
  });

  it('joinEvent calls insert', async () => {
    const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(mockChain as any);
    const result = await repo.joinEvent('evt1', 'u1');
    expect(mockFrom).toHaveBeenCalledWith('participants');
    expect(result.error).toBeNull();
  });

  it('updateWishlist calls update', async () => {
    const mockChain = { 
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      mockResolvedValue: vi.fn().mockResolvedValue({ error: null })
    };
    // Need to handle the double .eq()
    const eq = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: eq,
      then: (cb: any) => cb({ error: null })
    } as any);

    await repo.updateWishlist('e1', 'u1', 'gift');
    expect(eq).toHaveBeenCalledTimes(2);
  });

  it('performDraw calls edge function', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const result = await repo.performDraw('e1', 'token');
    expect(global.fetch).toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it('addMessage inserts to mural', async () => {
    const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.addMessage('e1', 'u1', 'hi');
    expect(mockFrom).toHaveBeenCalledWith('messages');
  });

  it('toggleLike adds like', async () => {
    const mockMsg = { id: 'm1', reactions: {} };
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMsg, error: null }),
      update: mockUpdate,
    } as any);

    // Mocking the second call to from
    mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMsg, error: null }),
    } as any).mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
        then: (cb: any) => cb({ error: null })
    } as any);

    await repo.toggleLike('m1', 'u1');
    expect(mockUpdate).toHaveBeenCalledWith({ reactions: { u1: '👍' } });
  });

  it('toggleLike removes like when reaction already exists', async () => {
    const mockMsg = { id: 'm1', reactions: { u1: '👍' } }; // reaction exists → delete branch
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();

    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMsg, error: null }),
    } as any).mockReturnValueOnce({
      update: mockUpdate,
      eq: mockEq,
      then: (cb: any) => cb({ error: null })
    } as any);

    await repo.toggleLike('m1', 'u1');
    expect(mockUpdate).toHaveBeenCalledWith({ reactions: {} }); // reaction removed
  });

  it('toggleLike returns error when message not found', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }), // !msg branch
    } as any);

    const result = await repo.toggleLike('m1', 'u1');
    expect(result.error).toBeInstanceOf(Error);
  });

  it('createExclusionGroup calls insert', async () => {
    const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.createExclusionGroup('e1', 'grp');
    expect(mockFrom).toHaveBeenCalledWith('exclusion_groups');
  });

  it('deleteExclusionGroup calls delete', async () => {
    const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.deleteExclusionGroup('g1');
    expect(mockFrom).toHaveBeenCalledWith('exclusion_groups');
  });

  it('toggleMember inserts when not present', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
    };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.toggleMember('g1', 'u1');
    expect(mockFrom).toHaveBeenCalledWith('exclusion_group_members');
  });

  it('getPrivateMessages uses correct filters with drawnId', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.getPrivateMessages('e1', 'u1', 'u2');
    expect(mockChain.or).toHaveBeenCalled();
  });

  it('getPrivateMessages uses correct filters without drawnId', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    };
    mockFrom.mockReturnValue(mockChain as any);
    await repo.getPrivateMessages('e1', 'u1', null);
    expect(mockChain.eq).toHaveBeenCalledWith('receiver_id', 'u1');
  });

  it('sendAnonymousMessage calls rpc', async () => {
    (supabase.rpc as any).mockResolvedValue({ error: null });
    await repo.sendAnonymousMessage('e1', 'hi', true);
    expect(supabase.rpc).toHaveBeenCalledWith('send_anonymous_message', expect.anything());
  });

  it('getAdminMetrics calls rpc', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: {}, error: null });
    await repo.getAdminMetrics();
    expect(supabase.rpc).toHaveBeenCalledWith('get_admin_metrics');
  });
});
