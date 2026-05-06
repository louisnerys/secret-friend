import { IEventRepository } from "@/core/domain/repositories/IEventRepository";

export class AdminUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async getAdminMetrics() {
    return this.eventRepository.getAdminMetrics();
  }
}
