'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { User, Event, Participant, Message } from '@/lib/types';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

const MSO = ({ children, fill, size = 22, ariaHidden = true }: { children: string; fill?: boolean; size?: number; ariaHidden?: boolean }) => (
  <span
    className="material-symbols-outlined"
    aria-hidden={ariaHidden}
    style={{
      fontSize: size,
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
    }}
  >
    {children}
  </span>
);

export default function EventDetalhes(props: EventPageProps) {
  const { t, i18n } = useTranslation();
  const { id } = use(props.params);
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipantes] = useState<Participant[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [muralMsgs, setMuralMsgs] = useState<Partial<Message>[]>([]);
  const [newMuralMsg, setNewMuralMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [myWishlist, setMyWishlist] = useState('');
  const [isEditingWishlist, setIsEditingWishlist] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { router.push('/login?redirect=/evento/' + id); return; }
    setUser(authData.user as unknown as User);

    const { data: eventData, error: eventError } = await supabase
      .rpc('get_public_event', { p_id: id })
      .maybeSingle();

    if (eventError || !eventData) {
      alert(t('event.not_found'));
      router.push('/dashboard');
      return;
    }
    setEvent(eventData as Event);

    const { data: parts } = await supabase
      .from('vw_participants')
      .select('user_id, drawn_id, wishlist, users(name)')
      .eq('event_id', id);

    if (parts) {
      setParticipantes(parts as unknown as Participant[]);
      const me = parts.find((p: Participant) => p.user_id === authData.user!.id);
      setIsParticipant(!!me);
      if (me?.wishlist) setMyWishlist(me.wishlist);
    }

    const { data: mMsgs } = await supabase
      .from('messages')
      .select('id, text, reactions, users(name)')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    if (mMsgs) setMuralMsgs(mMsgs as unknown as Partial<Message>[]);
    setLoading(false);
  }, [id, router, t]);

  useEffect(() => {
    const doFetch = async () => {
        await fetchData();
    };
    doFetch();
  }, [fetchData]);

  const handleJoin = async () => {
    if (!user) return;
    const { error } = await supabase.from('participants').insert({ event_id: id, user_id: user.id, wishlist: '' });
    if (!error) { fetchData(); setIsEditingWishlist(true); }
    else alert(t('event.join_error') + ': ' + error.message);
  };

  const handleSaveWishlist = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('participants').update({ wishlist: myWishlist }).eq('event_id', id).eq('user_id', user.id);
    if (!error) { setIsEditingWishlist(false); fetchData(); }
    else alert(t('event.wishlist_save_error') + ': ' + error.message);
    setLoading(false);
  };

  const handleDraw = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/perform-draw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionData.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: id }),
    });

    if (res.ok) {
      alert(t('event.draw_success'));
      fetchData();
    }
    else {
      const data = await res.json().catch(() => ({}));
      alert(t('event.draw_error') + ': ' + (data.error || data.message || t('common.error')));
    }
    setLoading(false);
  };

  const handleSendMuralMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuralMsg.trim()) return;
    const text = newMuralMsg.trim();
    setNewMuralMsg('');
    // Optimistic update
    const optMsg: Partial<Message> = { id: Date.now().toString(), text, reactions: {}, users: { name: user?.user_metadata?.name || 'User' } };
    setMuralMsgs(prev => [...prev, optMsg]);

    await supabase.from('messages').insert({ event_id: id, sender_id: user?.id, text, reactions: {} });
    fetchData();
  };

  const handleToggleLike = async (msgId: string) => {
    if (!user) return;
    const userId = user.id;
    setMuralMsgs(prev => prev.map(msg => {
      if (msg.id !== msgId) return msg;
      const reacts = { ...(msg.reactions || {}) };
      if (reacts[userId]) delete reacts[userId]; else reacts[userId] = '👍';
      return { ...msg, reactions: reacts };
    }));
    const { data: currMsg } = await supabase.from('messages').select('reactions').eq('id', msgId).single();
    if (currMsg) {
      const reacts = { ...(currMsg.reactions || {}) };
      if (reacts[userId]) delete reacts[userId]; else reacts[userId] = '👍';
      await supabase.from('messages').update({ reactions: reacts }).eq('id', msgId);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label text-on-surface-variant uppercase tracking-widest text-xs">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isCreator = event.creator_id === user?.id;
  const dateLabel = event.reveal_date
    ? new Date(event.reveal_date).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const statusBg: Record<string, string> = {
    open: 'bg-secondary-container/20 text-secondary',
    drawn: 'bg-primary-container/20 text-primary',
    closed: 'bg-surface-container-highest text-on-surface-variant',
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(26,28,26,0.06)] flex items-center justify-between px-6 py-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary active:scale-90 transition-transform"
            aria-label={t('common.back')}
          >
            <MSO>arrow_back</MSO>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline tracking-tighter text-xl font-bold text-primary leading-none">
              {event.name}
            </h1>
            {dateLabel && (
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                {dateLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusBg[event.status] || statusBg.open}`}>
            {t(`dashboard.status.${event.status}`)}
          </span>
          <button
            onClick={handleCopyLink}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center"
            aria-label={t('common.copy')}
            title={t('common.copy')}
          >
            <MSO>{copySuccess ? 'check_circle' : 'link'}</MSO>
          </button>
        </div>
      </header>

      <main className="mt-24 px-6 max-w-2xl mx-auto space-y-8">
        {/* Event Info */}
        <section className="relative bg-surface-container-low rounded-xl p-8 overflow-hidden border-t-2 border-secondary/20">
          <div className="absolute top-4 right-4 text-secondary-container/30" aria-hidden="true">
            <MSO fill size={36}>auto_awesome</MSO>
          </div>
          <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </section>

        {/* Reveal / Draw section */}
        {isParticipant && event.status === 'drawn' && (
          <section className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden border-t-2 border-secondary/20">
            <div className="absolute top-4 right-4 text-secondary-container/30" aria-hidden="true">
              <MSO fill size={36}>auto_awesome</MSO>
            </div>
            <div className="space-y-6 relative z-10">
              <h2 className="font-headline text-2xl tracking-tight text-primary">{t('event.your_friend_is')}</h2>
              <button
                onClick={() => router.push(`/evento/${id}/draw`)}
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold shadow-[0_8px_24px_rgba(122,0,26,0.2)] hover:opacity-90 transition-opacity flex items-center gap-3"
              >
                <MSO>visibility</MSO>
                {t('event.reveal_name')}
              </button>
            </div>
          </section>
        )}

        {/* Wishlist */}
        {isParticipant && event.status === 'open' && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="font-headline text-xl text-primary">{t('event.my_wishlist')}</h2>
              {!isEditingWishlist && (
                <button
                  onClick={() => setIsEditingWishlist(true)}
                  className="text-primary font-bold text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <MSO size={18}>{myWishlist ? 'edit' : 'add_circle'}</MSO>
                  {myWishlist ? t('event.edit') : t('event.add_item')}
                </button>
              )}
            </div>
            {isEditingWishlist ? (
              <div className="space-y-4">
                <div className="relative group">
                  <textarea
                    value={myWishlist}
                    onChange={(e) => setMyWishlist(e.target.value)}
                    placeholder={t('event.wishlist_placeholder')}
                    rows={3}
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 resize-none text-on-surface"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-500 group-focus-within:w-full" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveWishlist} className="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-full shadow-[0_4px_12px_rgba(122,0,26,0.2)]">
                    {t('common.save')}
                  </button>
                  <button onClick={() => setIsEditingWishlist(false)} className="text-on-surface-variant font-medium py-2.5 px-6 rounded-full border border-outline-variant hover:bg-surface-container">
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myWishlist ? (
                  myWishlist.split('\n').filter(Boolean).map((item: string, i: number) => (
                    <div key={i} className="bg-surface-container-lowest p-5 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-secondary">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center" aria-hidden="true">
                          <MSO size={18}>card_giftcard</MSO>
                        </div>
                        <p className="font-bold text-on-surface">{item}</p>
                      </div>
                      <MSO size={20}>more_vert</MSO>
                    </div>
                  ))
                ) : (
                  <p className="italic text-on-surface-variant text-sm p-4 bg-surface-container-low rounded-xl">
                    {t('event.wishlist_empty')}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Actions bar */}
        <div className="flex flex-wrap gap-3 items-center">
          {!isParticipant && event.status === 'open' && (
            <button
              onClick={handleJoin}
              className="bg-primary text-on-primary font-bold py-4 px-8 rounded-full shadow-[0_8px_24px_rgba(122,0,26,0.2)] hover:shadow-[0_12px_32px_rgba(122,0,26,0.3)] transition-all flex items-center gap-2"
            >
              <MSO>person_add</MSO>
              {t('event.join_event')}
            </button>
          )}

          {isCreator && event.status === 'open' && (
            <button
              onClick={handleDraw}
              disabled={participants.length < 3}
              title={participants.length < 3 ? t('event.draw_requirement') : t('event.draw_now')}
              className={`w-full bg-surface-container-highest border-2 border-secondary/30 text-primary p-6 rounded-2xl flex items-center justify-between group transition-all ${participants.length < 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary-fixed'}`}
            >
              <div className="text-left">
                <p className="font-headline text-xl">{t('event.draw_now')}</p>
                <p className="text-sm font-body text-on-surface-variant">
                  {participants.length < 3
                    ? t('event.participants_count', { count: participants.length })
                    : t('event.draw_warning')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
                <MSO>casino</MSO>
              </div>
            </button>
          )}
        </div>

        {/* Participants */}
        <section className="space-y-4">
          <h2 className="font-headline text-2xl text-primary">{t('event.participants')}</h2>
          <div className="flex overflow-x-auto pb-4 gap-4" style={{ scrollbarWidth: 'none' }}>
            {participants.map((p) => {
              const p_users = p.users;
              const name = Array.isArray(p_users) ? p_users[0]?.name : p_users?.name;
              return (
                <div key={p.user_id} className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center font-display font-bold text-on-primary-container text-xl border-2 border-surface shadow-md" aria-hidden="true">
                      {name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-secondary w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface" aria-hidden="true">
                      <MSO size={10}>check</MSO>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-on-surface">{name?.split(' ')[0]}</span>
                </div>
              );
            })}
            {isCreator && event.status === 'open' && (
              <button
                onClick={() => handleCopyLink()}
                className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
                aria-label={t('common.invite')}
              >
                <MSO>person_add</MSO>
              </button>
            )}
          </div>
        </section>

        {/* Mural */}
        {isParticipant && (
          <section className="space-y-4 pb-8">
            <h2 className="font-headline text-2xl text-primary">{t('event.event_mural')}</h2>
            <div className="space-y-3">
              {muralMsgs.map((msg: Partial<Message>) => {
                const reacts = msg.reactions || {};
                const isLiked = user ? !!reacts[user.id] : false;
                const totalLikes = Object.keys(reacts).length;
                const msg_users = msg.users;
                const name = Array.isArray(msg_users) ? msg_users[0]?.name : msg_users?.name;
                return (
                  <div key={msg.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-l-4 border-secondary">
                    <span className="font-bold text-sm text-primary block mb-1">{name}</span>
                    <p className="text-on-surface mb-3 leading-relaxed">{msg.text}</p>
                    <button
                      onClick={() => handleToggleLike(msg.id!)}
                      className={`text-sm py-1.5 px-3 rounded-full border transition-colors flex items-center gap-1.5 ${isLiked ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      <span aria-hidden="true">👍</span>
                      {totalLikes > 0 && <span className="font-medium">{totalLikes}</span>}
                    </button>
                  </div>
                );
              })}
              {muralMsgs.length === 0 && (
                <p className="italic text-on-surface-variant text-sm text-center py-8">
                  {t('event.mural_empty')}
                </p>
              )}
            </div>

            <form onSubmit={handleSendMuralMsg} className="flex gap-3 mt-4">
              <div className="relative group flex-1">
                <input
                  type="text"
                  value={newMuralMsg}
                  onChange={e => setNewMuralMsg(e.target.value)}
                  placeholder={t('event.mural_placeholder')}
                  className="w-full bg-surface-container-highest border-none rounded-full px-5 py-3 focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 text-on-surface"
                />
              </div>
              <button
                type="submit"
                disabled={!newMuralMsg.trim()}
                className="bg-primary text-on-primary font-bold py-3 px-6 rounded-full shadow-[0_4px_12px_rgba(122,0,26,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MSO>send</MSO>
              </button>
            </form>
          </section>
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-lg flex justify-around items-center px-4 pb-6 pt-2 shadow-[0_-8px_24px_rgba(26,28,26,0.04)] rounded-t-3xl transition-colors">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex flex-col items-center justify-center text-primary bg-primary-container/20 rounded-full p-3 transition-all"
        >
          <MSO fill>event</MSO>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">{t('event.nav_events')}</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/50 p-3 hover:text-primary transition-colors">
          <MSO>card_giftcard</MSO>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">{t('event.nav_list')}</span>
        </button>
        {isParticipant && event.status === 'drawn' && (
          <button
            onClick={() => router.push(`/evento/${id}/draw`)}
            className="flex flex-col items-center justify-center text-on-surface-variant/50 p-3 hover:text-primary transition-colors"
          >
            <MSO>auto_awesome</MSO>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">{t('event.nav_draw')}</span>
          </button>
        )}
        <button className="flex flex-col items-center justify-center text-on-surface-variant/50 p-3 hover:text-primary transition-colors">
          <MSO>person</MSO>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">{t('event.nav_profile')}</span>
        </button>
      </nav>
    </div>
  );
}
