import { supabase } from "@/lib/supabase";
import { IEventRepository } from "@/core/domain/repositories/IEventRepository";
import { Event } from "@/lib/types";

export class SupabaseEventRepository implements IEventRepository {
  async getEvents(): Promise<{ data: Event[] | null; error: any }> {
    const { data, error } = await supabase.from("events").select("*");
    return { data: data as unknown as Event[], error };
  }

  async createEvent(
    name: string,
    description: string,
    revealDate: string | null,
    creatorId: string,
  ): Promise<{ data: Event | null; error: any }> {
    const { data, error } = await supabase
      .from("events")
      .insert({
        name,
        description,
        reveal_date: revealDate,
        creator_id: creatorId,
        status: "open",
      })
      .select()
      .single();

    if (data) {
      await supabase
        .from("participants")
        .insert({ event_id: data.id, user_id: creatorId });
    }

    return { data: data as unknown as Event, error };
  }

  async getEventDetails(eventId: string): Promise<{ data: any; error: any }> {
    const { data: eventData, error: eventError } = await supabase
      .rpc("get_public_event", { p_id: eventId })
      .maybeSingle();
    const { data: parts } = await supabase
      .from("vw_participants")
      .select("user_id, drawn_id, wishlist, users(name)")
      .eq("event_id", eventId);
    const { data: mMsgs } = await supabase
      .from("messages")
      .select("id, text, reactions, users(name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    const { data: groups } = await supabase
      .from("exclusion_groups")
      .select("*, exclusion_group_members(*)")
      .eq("event_id", eventId);

    return { data: { eventData, parts, mMsgs, groups }, error: eventError };
  }

  async joinEvent(eventId: string, userId: string): Promise<{ error: any }> {
    return supabase
      .from("participants")
      .insert({ event_id: eventId, user_id: userId, wishlist: "" });
  }

  async updateWishlist(
    eventId: string,
    userId: string,
    wishlist: string,
  ): Promise<{ error: any }> {
    return supabase
      .from("participants")
      .update({ wishlist })
      .eq("event_id", eventId)
      .eq("user_id", userId);
  }

  async performDraw(
    eventId: string,
    accessToken: string,
  ): Promise<{ ok: boolean }> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/perform-draw`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_id: eventId }),
      },
    );
    return { ok: res.ok };
  }

  async addMessage(
    eventId: string,
    userId: string,
    text: string,
  ): Promise<{ error: any }> {
    return supabase
      .from("messages")
      .insert({ event_id: eventId, sender_id: userId, text, reactions: {} });
  }

  async toggleLike(messageId: string, userId: string): Promise<{ error: any }> {
    const { data: msg } = await supabase
      .from("messages")
      .select("reactions")
      .eq("id", messageId)
      .single();
    if (!msg) return { error: new Error("Message not found") };
    const reacts = msg.reactions || {};
    if (reacts[userId]) delete reacts[userId];
    else reacts[userId] = "👍";
    return supabase
      .from("messages")
      .update({ reactions: reacts })
      .eq("id", messageId);
  }

  async createExclusionGroup(
    eventId: string,
    name: string,
  ): Promise<{ error: any }> {
    return supabase
      .from("exclusion_groups")
      .insert({ event_id: eventId, name });
  }

  async deleteExclusionGroup(groupId: string): Promise<{ error: any }> {
    return supabase.from("exclusion_groups").delete().eq("id", groupId);
  }

  async toggleMember(
    groupId: string,
    memberId: string,
  ): Promise<{ error: any }> {
    const { data: existing } = await supabase
      .from("exclusion_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", memberId)
      .maybeSingle();
    if (existing)
      return supabase
        .from("exclusion_group_members")
        .delete()
        .eq("id", existing.id);
    else
      return supabase
        .from("exclusion_group_members")
        .insert({ group_id: groupId, user_id: memberId });
  }

  async getPrivateMessages(
    eventId: string,
    userId: string,
    drawnId: string | null,
  ): Promise<{ data: any; error: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { data: null, error: new Error("Unauthorized") };
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${eventId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: new Error(errText || "Failed to fetch private messages") };
      }

      const body = await res.json();
      return { data: body.messages, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async sendAnonymousMessage(
    eventId: string,
    text: string,
    toDrawer: boolean,
  ): Promise<{ error: any }> {
    const { error } = await supabase.rpc("send_anonymous_message", {
      p_event_id: eventId,
      p_text: text,
      p_to_drawer: toDrawer,
    });
    return { error };
  }

  async getAdminMetrics(): Promise<{ data: any; error: any }> {
    return supabase.rpc("get_admin_metrics");
  }

  async fetchWishlistItems(
    eventId: string,
    userId: string,
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return { data, error };
  }

  async addWishlistItem(
    eventId: string,
    userId: string,
    description: string,
  ): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({ event_id: eventId, user_id: userId, description })
      .select()
      .single();
    return { data, error };
  }

  async deleteWishlistItem(
    itemId: string,
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", itemId);
    return { error };
  }
}

export const eventRepository = new SupabaseEventRepository();
