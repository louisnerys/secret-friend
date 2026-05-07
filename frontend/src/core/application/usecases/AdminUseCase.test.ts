import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminUseCase } from "./AdminUseCase";
import { IEventRepository } from "@/core/domain/repositories/IEventRepository";

describe("AdminUseCase", () => {
  let useCase: AdminUseCase;
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
    useCase = new AdminUseCase(mockRepo);
  });

  it("delegates getAdminMetrics to repository", async () => {
    const mockMetrics = {
      data: {
        totalEvents: 10,
        totalUsers: 50,
      },
      error: null,
    };
    vi.mocked(mockRepo.getAdminMetrics).mockResolvedValue(mockMetrics);

    const result = await useCase.getAdminMetrics();

    expect(mockRepo.getAdminMetrics).toHaveBeenCalled();
    expect(result).toEqual(mockMetrics);
  });

  it("returns error if repository fails", async () => {
    const mockError = {
      data: null,
      error: { message: "Failed to fetch metrics" },
    };
    vi.mocked(mockRepo.getAdminMetrics).mockResolvedValue(mockError);

    const result = await useCase.getAdminMetrics();

    expect(mockRepo.getAdminMetrics).toHaveBeenCalled();
    expect(result).toEqual(mockError);
  });
});
