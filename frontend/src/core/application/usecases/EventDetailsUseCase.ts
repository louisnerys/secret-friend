import { IEventRepository } from "@/core/domain/repositories/IEventRepository";

export class EventDetailsUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async getEventDetails(eventId: string) {
    return this.eventRepository.getEventDetails(eventId);
  }

  async joinEvent(eventId: string, userId: string) {
    return this.eventRepository.joinEvent(eventId, userId);
  }

  async updateWishlist(eventId: string, userId: string, wishlist: string) {
    return this.eventRepository.updateWishlist(eventId, userId, wishlist);
  }

  async performDraw(eventId: string, accessToken: string) {
    return this.eventRepository.performDraw(eventId, accessToken);
  }

  async addMessage(eventId: string, userId: string, text: string) {
    return this.eventRepository.addMessage(eventId, userId, text);
  }

  async toggleLike(messageId: string, userId: string) {
    return this.eventRepository.toggleLike(messageId, userId);
  }

  async createExclusionGroup(eventId: string, name: string) {
    return this.eventRepository.createExclusionGroup(eventId, name);
  }

  async deleteExclusionGroup(groupId: string) {
    return this.eventRepository.deleteExclusionGroup(groupId);
  }

  async toggleMember(groupId: string, memberId: string) {
    return this.eventRepository.toggleMember(groupId, memberId);
  }
}
