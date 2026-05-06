import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { PrivateMessage, Participant } from "@/lib/types";
import { eventRepository } from "@/infrastructure/repositories/SupabaseEventRepository";
import { EventDrawUseCase } from "@/core/application/usecases/EventDrawUseCase";

const eventDrawUseCase = new EventDrawUseCase(eventRepository);

export function useEventDrawController(eventId: string) {
  const { t, i18n } = useTranslation();
  const [myDrawn, setMyDrawn] = useState<{ name: string } | null>(null);
  const [messages, setMessages] = useState<Partial<PrivateMessage>[]>([]);
  const [activeChat, setActiveChat] = useState<"drawn" | "drawer">("drawn");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDrawnAndMessages = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push("/login");
      return;
    }

    const { data: parts } = await supabase
      .from("vw_participants")
      .select("user_id, drawn_id")
      .eq("event_id", eventId);

    if (!parts) {
      setLoading(false);
      return;
    }

    const me = parts.find((p: Participant) => p.user_id === authData.user.id);
    if (!me || !me.drawn_id) {
      alert(t("draw.not_drawn"));
      router.push(`/evento/${eventId}`);
      return;
    }

    const { data: drawn } = await supabase
      .from("users")
      .select("name")
      .eq("id", me.drawn_id)
      .single();

    if (drawn) setMyDrawn(drawn as { name: string });

    const { data: privMsgs } = await eventDrawUseCase.getPrivateMessages(
      eventId,
      authData.user.id,
      me.drawn_id,
    );

    if (privMsgs) {
      const formatted = privMsgs.map((m: PrivateMessage) => ({
        ...m,
        is_mine: m.sender_id === authData.user.id,
        sender_display:
          m.sender_id === authData.user.id ? "You" : m.sender_display,
      }));
      setMessages(formatted as Partial<PrivateMessage>[]);
    }
    setLoading(false);
  }, [eventId, router, t]);

  useEffect(() => {
    setTimeout(() => fetchDrawnAndMessages(), 0);
  }, [fetchDrawnAndMessages]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const myUserId = sessionData.session.user.id;

      channel = supabase
        .channel("private_msgs")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "private_messages",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            const newMsg = payload.new as PrivateMessage;
            if (
              newMsg.sender_id !== myUserId &&
              newMsg.receiver_id === myUserId
            ) {
              setMessages((prev) => [...prev, { ...newMsg, is_mine: false }]);
            }
          },
        )
        .subscribe();
    };

    setTimeout(() => setupRealtime(), 0);

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage("");

    const optMsg: Partial<PrivateMessage> = {
      id: Date.now().toString(),
      text,
      sender_display: "You",
      is_mine: true,
      chat_type: activeChat,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optMsg]);

    const { error } = await eventDrawUseCase.sendAnonymousMessage(
      eventId,
      text,
      activeChat === "drawer",
    );

    if (error) {
      console.error("Error sending message:", error);
      alert(t("draw.error_send"));
      setMessages((prev) => prev.filter((m) => m.id !== optMsg.id));
    }
  };

  const filteredMessages = messages.filter((m) => m.chat_type === activeChat);

  return {
    t,
    i18n,
    myDrawn,
    messages,
    activeChat,
    setActiveChat,
    newMessage,
    setNewMessage,
    loading,
    revealed,
    setRevealed,
    router,
    chatEndRef,
    handleSendMessage,
    filteredMessages,
  };
}
