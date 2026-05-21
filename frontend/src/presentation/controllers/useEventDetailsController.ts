import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { User, Event, Participant, Message, ExclusionGroup } from "@/lib/types";
import { eventRepository } from "@/infrastructure/repositories/SupabaseEventRepository";
import { EventDetailsUseCase } from "@/core/application/usecases/EventDetailsUseCase";

const eventDetailsUseCase = new EventDetailsUseCase(eventRepository);

export function useEventDetailsController(eventId: string) {
  const { t, i18n } = useTranslation();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipantes] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [muralMsgs, setMuralMsgs] = useState<Partial<Message>[]>([]);
  const [newMuralMsg, setNewMuralMsg] = useState("");

  const [exclusionGroups, setExclusionGroups] = useState<ExclusionGroup[]>([]);
  const [isManagingExclusions, setIsManagingExclusions] = useState(false);
  const [newExclusionGroupName, setNewExclusionGroupName] = useState("");

  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [myWishlist, setMyWishlist] = useState("");
  const [isEditingWishlist, setIsEditingWishlist] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [newWishlistItem, setNewWishlistItem] = useState("");
  const router = useRouter();

  const handleAddWishlistItem = async (description: string) => {
    if (!user || !description.trim()) return;
    if (wishlistItems.length >= 5) {
      alert(t("event.wishlist_limit_reached", { max: 5 }));
      return;
    }
    const { data, error } = await eventRepository.addWishlistItem(eventId, user.id, description.trim());
    if (!error && data) {
      setWishlistItems(prev => [...prev, data]);
      setNewWishlistItem("");
    } else {
      alert(t("event.wishlist_save_error") + (error ? ": " + error.message : ""));
    }
  };

  const handleDeleteWishlistItem = async (itemId: string) => {
    const { error } = await eventRepository.deleteWishlistItem(itemId);
    if (!error) {
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      alert(t("event.wishlist_delete_error") + (error ? ": " + error.message : ""));
    }
  };

  const fetchData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push("/login?redirect=/evento/" + eventId);
      return;
    }
    setUser(authData.user as unknown as User);

    const { data, error } = await eventDetailsUseCase.getEventDetails(eventId);

    if (error || !data.eventData) {
      alert(t("event.not_found"));
      router.push("/dashboard");
      return;
    }

    setEvent(data.eventData as Event);

    if (data.parts) {
      setParticipantes(data.parts as unknown as Participant[]);
      const me = data.parts.find(
        (p: Participant) => p.user_id === authData.user!.id,
      );
      setIsParticipant(!!me);
      if (me?.wishlist) setMyWishlist(me.wishlist);
    }

    if (data.mMsgs) setMuralMsgs(data.mMsgs as unknown as Partial<Message>[]);
    if (data.groups) setExclusionGroups(data.groups as ExclusionGroup[]);

    const { data: items } = await eventRepository.fetchWishlistItems(eventId, authData.user.id);
    if (items) {
      setWishlistItems(items);
    }

    setLoading(false);
  }, [eventId, router, t]);

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, [fetchData]);

  const handleJoin = async () => {
    if (!user) return;
    setIsJoining(true);
    const { error } = await eventDetailsUseCase.joinEvent(eventId, user.id);
    if (!error) {
      setTimeout(() => fetchData(), 0);
      setIsEditingWishlist(true);
    } else alert(t("event.join_error") + ": " + error.message);
    setIsJoining(false);
  };

  const handleSaveWishlist = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await eventDetailsUseCase.updateWishlist(
      eventId,
      user.id,
      myWishlist,
    );
    if (!error) {
      setIsEditingWishlist(false);
      setTimeout(() => fetchData(), 0);
    } else alert(t("event.wishlist_save_error") + ": " + error.message);
    setLoading(false);
  };

  const handleDraw = async () => {
    setIsDrawing(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await eventDetailsUseCase.performDraw(
      eventId,
      sessionData.session?.access_token || "",
    );

    if (res.ok) {
      alert(t("event.draw_success"));
      setTimeout(() => fetchData(), 0);
    } else {
      alert(t("event.draw_error"));
    }
    setIsDrawing(false);
  };

  const handleSendMuralMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuralMsg.trim() || !user) return;
    const { error } = await eventDetailsUseCase.addMessage(
      eventId,
      user.id,
      newMuralMsg.trim(),
    );
    if (!error) {
      setNewMuralMsg("");
      setTimeout(() => fetchData(), 0);
    }
  };

  const handleToggleLike = async (msgId: string) => {
    if (!user) return;
    const { error } = await eventDetailsUseCase.toggleLike(msgId, user.id);
    if (!error) setTimeout(() => fetchData(), 0);
  };

  const handleCreateExclusionGroup = async () => {
    if (!newExclusionGroupName.trim()) return;
    const { error } = await eventDetailsUseCase.createExclusionGroup(
      eventId,
      newExclusionGroupName.trim(),
    );
    if (!error) {
      setNewExclusionGroupName("");
      setTimeout(() => fetchData(), 0);
    }
  };

  const handleDeleteExclusionGroup = async (groupId: string) => {
    const { error } = await eventDetailsUseCase.deleteExclusionGroup(groupId);
    if (!error) setTimeout(() => fetchData(), 0);
  };

  const handleToggleMember = async (groupId: string, memberId: string) => {
    const { error } = await eventDetailsUseCase.toggleMember(groupId, memberId);
    if (!error) setTimeout(() => fetchData(), 0);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/evento/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return {
    t,
    i18n,
    event,
    participants,
    isParticipant,
    muralMsgs,
    newMuralMsg,
    setNewMuralMsg,
    exclusionGroups,
    isManagingExclusions,
    setIsManagingExclusions,
    newExclusionGroupName,
    setNewExclusionGroupName,
    loading,
    isDrawing,
    isJoining,
    user,
    myWishlist,
    setMyWishlist,
    isEditingWishlist,
    setIsEditingWishlist,
    wishlistItems,
    setWishlistItems,
    newWishlistItem,
    setNewWishlistItem,
    handleAddWishlistItem,
    handleDeleteWishlistItem,
    copySuccess,
    router,
    handleJoin,
    handleSaveWishlist,
    handleDraw,
    handleSendMuralMsg,
    handleToggleLike,
    handleCreateExclusionGroup,
    handleDeleteExclusionGroup,
    handleToggleMember,
    handleCopyLink,
  };
}
