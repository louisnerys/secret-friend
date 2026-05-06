import { IEventRepository } from "@/core/domain/repositories/IEventRepository";

export class EventDrawUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async getPrivateMessages(
    eventId: string,
    userId: string,
    drawnId: string | null,
  ) {
    return this.eventRepository.getPrivateMessages(eventId, userId, drawnId);
  }

  async sendAnonymousMessage(eventId: string, text: string, toDrawer: boolean) {
    return this.eventRepository.sendAnonymousMessage(eventId, text, toDrawer);
  }
}
