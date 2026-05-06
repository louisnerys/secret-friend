import { Event } from "@/lib/types";

export interface IEventRepository {
  getEvents(): Promise<{ data: Event[] | null; error: any }>;
  createEvent(
    name: string,
    description: string,
    revealDate: string | null,
    creatorId: string,
  ): Promise<{ data: Event | null; error: any }>;
  getEventDetails(eventId: string): Promise<{ data: any; error: any }>;
  joinEvent(eventId: string, userId: string): Promise<{ error: any }>;
  updateWishlist(
    eventId: string,
    userId: string,
    wishlist: string,
  ): Promise<{ error: any }>;
  performDraw(eventId: string, accessToken: string): Promise<{ ok: boolean }>;
  addMessage(
    eventId: string,
    userId: string,
    text: string,
  ): Promise<{ error: any }>;
  toggleLike(messageId: string, userId: string): Promise<{ error: any }>;
  createExclusionGroup(eventId: string, name: string): Promise<{ error: any }>;
  deleteExclusionGroup(groupId: string): Promise<{ error: any }>;
  toggleMember(groupId: string, memberId: string): Promise<{ error: any }>;
  getPrivateMessages(
    eventId: string,
    userId: string,
    drawnId: string | null,
  ): Promise<{ data: any; error: any }>;
  sendAnonymousMessage(
    eventId: string,
    text: string,
    toDrawer: boolean,
  ): Promise<{ error: any }>;
  getAdminMetrics(): Promise<{ data: any; error: any }>;
}
