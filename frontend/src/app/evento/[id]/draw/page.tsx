'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DrawPageProps {
  params: Promise<{ id: string }>;
}

const MSO = ({ children, fill, size = 22 }: { children: string; fill?: boolean; size?: number }) => (
  <span
    style={{
      fontFamily: 'Material Symbols Outlined',
      fontSize: size,
      fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
    }}
  >
    {children}
  </span>
);

export default function DrawPage(props: DrawPageProps) {
  const { id } = use(props.params);
  const [myDrawn, setMyDrawn] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<'drawn' | 'drawer'>('drawn');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDrawAndMessages();

    const channel = supabase
      .channel('private_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `event_id=eq.${id}`,
      }, () => { fetchDrawAndMessages(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDrawAndMessages = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { router.push('/login'); return; }

    const { data: parts } = await supabase
      .from('participants')
      .select('drawn_id')
      .eq('event_id', id)
      .eq('user_id', user.user.id)
      .single();

    if (parts?.drawn_id) {
      const { data: drawn } = await supabase
        .from('users')
        .select('name')
        .eq('id', parts.drawn_id)
        .single();
      setMyDrawn(drawn);
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
    }

    setLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');

    const optMsg = {
      id: Date.now().toString(),
      text,
      sender_display: 'Você',
      is_mine: true,
      chat_type: activeChat,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optMsg]);

    const { error } = await supabase.rpc('send_anonymous_message', {
      p_event_id: id,
      p_text: text,
      p_to_drawer: activeChat === 'drawer',
    });

    if (error) { alert('Erro ao enviar mensagem'); fetchDrawAndMessages(); }
  };

  const filteredMessages = messages.filter(m => m.chat_type === activeChat);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label text-on-surface-variant uppercase tracking-widest text-xs animate-pulse">
            Revelando o segredo…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* ── Top App Bar ── */}
      <header className="shrink-0 bg-surface/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(26,28,26,0.04)] px-6 py-4 flex items-center justify-between z-50">
        <button
          onClick={() => router.push(`/evento/${id}`)}
          className="text-primary active:scale-90 transition-transform"
        >
          <MSO>arrow_back</MSO>
        </button>
        <h1 className="font-display font-bold text-xl text-primary tracking-tighter">
          Amigo Oculto
        </h1>
        <div className="w-6" />
      </header>

      <main className="flex-1 flex flex-col px-5 pb-6 gap-6 min-h-0 max-w-xl mx-auto w-full">

        {/* ── Reveal Card ── */}
        <div className="shrink-0 relative mt-4 rounded-2xl overflow-hidden">
          {/* Luxury background */}
          <div className="absolute inset-0 luxury-gradient opacity-95" />
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
          {/* Decorative star */}
          <span
            className="absolute top-4 right-5 text-white/20 pointer-events-none"
            style={{ fontFamily: 'Material Symbols Outlined', fontSize: 48, fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>

          <div className="relative z-10 p-8 text-center">
            <p className="text-on-primary/70 font-label uppercase tracking-[0.15em] text-[10px] font-bold mb-3">
              Você tirou
            </p>

            {revealed ? (
              <h2 className="text-4xl font-display font-extrabold text-on-primary tracking-tight drop-shadow-sm animate-[fadeIn_0.4s_ease]">
                {myDrawn?.name || '???'}
              </h2>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="group inline-flex items-center gap-3 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-full px-7 py-3.5 text-on-primary font-bold text-lg border border-white/20 shadow-inner"
              >
                <MSO size={20}>visibility</MSO>
                Revelar Nome
              </button>
            )}

            {revealed && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setRevealed(false)}
                  className="text-on-primary/50 text-xs font-bold uppercase tracking-widest hover:text-on-primary/80 transition-colors"
                >
                  Ocultar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Section ── */}
        <section className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10">

          {/* Tab header */}
          <div className="shrink-0 px-5 pt-5 pb-4 border-b border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary flex items-center gap-2">
                <MSO fill size={20}>chat</MSO>
                Chat Anônimo
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                Identidade oculta
              </span>
            </div>

            {/* Pill tab switcher */}
            <div className="flex bg-surface-container rounded-full p-1 gap-1">
              <button
                onClick={() => setActiveChat('drawn')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  activeChat === 'drawn'
                    ? 'bg-primary text-on-primary shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Meu Amigo Secreto
              </button>
              <button
                onClick={() => setActiveChat('drawer')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  activeChat === 'drawer'
                    ? 'bg-primary text-on-primary shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Quem me tirou
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface-container/30">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                <span
                  className="text-secondary-container"
                  style={{ fontFamily: 'Material Symbols Outlined', fontSize: 48, fontVariationSettings: "'FILL' 1" }}
                >
                  forum
                </span>
                <p className="font-display font-bold text-on-surface-variant">Nenhuma mensagem ainda</p>
                <p className="text-xs text-on-surface-variant/60 text-center max-w-[180px]">
                  Mande a primeira mensagem anônima!
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.is_mine
                        ? 'luxury-gradient text-on-primary rounded-br-sm'
                        : 'bg-surface-container border border-outline-variant/20 text-on-surface rounded-bl-sm'
                    }`}
                  >
                    <span className={`block text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      msg.is_mine ? 'text-on-primary/60' : 'text-on-surface-variant/70'
                    }`}>
                      {msg.sender_display}
                    </span>
                    <p className="leading-relaxed text-sm">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSendMessage}
            className="shrink-0 flex gap-3 p-4 border-t border-outline-variant/10 bg-surface"
          >
            <div className="relative flex-1 group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mensagem anônima…"
                className="w-full bg-surface-container-highest border-none rounded-full px-5 py-3 text-sm focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 text-on-surface"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full luxury-gradient text-on-primary flex items-center justify-center shadow-[0_4px_12px_rgba(122,0,26,0.25)] disabled:opacity-40 disabled:shadow-none active:scale-95 transition-all shrink-0"
            >
              <MSO size={20}>send</MSO>
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
