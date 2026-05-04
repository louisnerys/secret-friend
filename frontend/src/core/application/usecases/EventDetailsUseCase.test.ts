import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventDetailsUseCase } from './EventDetailsUseCase';
import { IEventRepository } from '@/core/domain/repositories/IEventRepository';

describe('EventDetailsUseCase', () => {
  let useCase: EventDetailsUseCase;
  let mockRepo: IEventRepository;

  beforeEach(() => {
    mockRepo = {
      getEvents: vi.fn(),
      createEvent: vi.fn(),
      getEventDetails: vi.fn(),
      joinEvent: vi.fn(),
      updateWishlist: vi.fn(),
      performDraw: vi.fn(),
      addMessage: vi.fn(),
      toggleLike: vi.fn(),
      createExclusionGroup: vi.fn(),
      deleteExclusionGroup: vi.fn(),
      toggleMember: vi.fn(),
      getPrivateMessages: vi.fn(),
      sendAnonymousMessage: vi.fn(),
      getAdminMetrics: vi.fn(),
    } as unknown as IEventRepository;
    useCase = new EventDetailsUseCase(mockRepo);
  });

  it('delegates getEventDetails to repository', async () => {
    const mockData = { data: { id: '1' }, error: null };
    vi.mocked(mockRepo.getEventDetails).mockResolvedValue(mockData);
    
    const result = await useCase.getEventDetails('1');
    
    expect(mockRepo.getEventDetails).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockData);
  });

  it('delegates joinEvent to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.joinEvent).mockResolvedValue(mockError);
    
    const result = await useCase.joinEvent('1', 'u1');
    
    expect(mockRepo.joinEvent).toHaveBeenCalledWith('1', 'u1');
    expect(result).toEqual(mockError);
  });

  it('delegates updateWishlist to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.updateWishlist).mockResolvedValue(mockError);
    
    const result = await useCase.updateWishlist('1', 'u1', 'gift');
    
    expect(mockRepo.updateWishlist).toHaveBeenCalledWith('1', 'u1', 'gift');
    expect(result).toEqual(mockError);
  });

  it('delegates performDraw to repository', async () => {
    const mockResult = { ok: true };
    vi.mocked(mockRepo.performDraw).mockResolvedValue(mockResult);
    
    const result = await useCase.performDraw('1', 'token');
    
    expect(mockRepo.performDraw).toHaveBeenCalledWith('1', 'token');
    expect(result).toEqual(mockResult);
  });

  it('delegates addMessage to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.addMessage).mockResolvedValue(mockError);
    
    const result = await useCase.addMessage('1', 'u1', 'text');
    
    expect(mockRepo.addMessage).toHaveBeenCalledWith('1', 'u1', 'text');
    expect(result).toEqual(mockError);
  });

  it('delegates toggleLike to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.toggleLike).mockResolvedValue(mockError);
    
    const result = await useCase.toggleLike('m1', 'u1');
    
    expect(mockRepo.toggleLike).toHaveBeenCalledWith('m1', 'u1');
    expect(result).toEqual(mockError);
  });

  it('delegates createExclusionGroup to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.createExclusionGroup).mockResolvedValue(mockError);
    
    const result = await useCase.createExclusionGroup('1', 'group');
    
    expect(mockRepo.createExclusionGroup).toHaveBeenCalledWith('1', 'group');
    expect(result).toEqual(mockError);
  });

  it('delegates deleteExclusionGroup to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.deleteExclusionGroup).mockResolvedValue(mockError);
    
    const result = await useCase.deleteExclusionGroup('g1');
    
    expect(mockRepo.deleteExclusionGroup).toHaveBeenCalledWith('g1');
    expect(result).toEqual(mockError);
  });

  it('delegates toggleMember to repository', async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.toggleMember).mockResolvedValue(mockError);
    
    const result = await useCase.toggleMember('g1', 'u1');
    
    expect(mockRepo.toggleMember).toHaveBeenCalledWith('g1', 'u1');
    expect(result).toEqual(mockError);
  });
});
