import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventDrawUseCase } from "./EventDrawUseCase";
import { IEventRepository } from "@/core/domain/repositories/IEventRepository";

describe("EventDrawUseCase", () => {
  let useCase: EventDrawUseCase;
  let mockRepo: IEventRepository;

  beforeEach(() => {
    mockRepo = {
      getPrivateMessages: vi.fn(),
      sendAnonymousMessage: vi.fn(),
    } as unknown as IEventRepository;
    useCase = new EventDrawUseCase(mockRepo);
  });

  it("delegates getPrivateMessages to repository", async () => {
    const mockData = { data: [], error: null };
    vi.mocked(mockRepo.getPrivateMessages).mockResolvedValue(mockData);

    const result = await useCase.getPrivateMessages("1", "u1", "u2");

    expect(mockRepo.getPrivateMessages).toHaveBeenCalledWith("1", "u1", "u2");
    expect(result).toEqual(mockData);
  });

  it("delegates sendAnonymousMessage to repository", async () => {
    const mockError = { error: null };
    vi.mocked(mockRepo.sendAnonymousMessage).mockResolvedValue(mockError);

    const result = await useCase.sendAnonymousMessage("1", "hi", true);

    expect(mockRepo.sendAnonymousMessage).toHaveBeenCalledWith("1", "hi", true);
    expect(result).toEqual(mockError);
  });
});
