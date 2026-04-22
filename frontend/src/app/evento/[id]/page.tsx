'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetalhes(props: EventPageProps) {
  const { id } = use(props.params);
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipantes] = useState<any[]>([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [muralMsgs, setMuralMsgs] = useState<any[]>([]);
  const [newMuralMsg, setNewMuralMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myWishlist, setMyWishlist] = useState('');
  const [isEditingWishlist, setIsEditingWishlist] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push('/login?redirect=/evento/' + id);
      return;
    }
    setUser(authData.user);

    // Fetch event using RPC to bypass RLS for users who have the link
    const { data: eventData, error: eventError } = await supabase
      .rpc('get_public_event', { p_id: id })
      .maybeSingle();

    if (eventError || !eventData) {
      alert('Evento não encontrado');
      router.push('/dashboard');
      return;
    }
    setEvent(eventData);

    // Fetch participants (from security view vw_participants)
    const { data: parts } = await supabase
      .from('vw_participants')
      .select('user_id, drawn_id, wishlist, users(name)')
      .eq('event_id', id);

    if (parts) {
      setParticipantes(parts);
      const me = parts.find(p => p.user_id === authData.user.id);
      setIsParticipant(!!me);
      if (me && me.wishlist) {
        setMyWishlist(me.wishlist);
      }
    }

    // Fetch mural
    const { data: mMsgs } = await supabase
      .from('messages')
      .select('id, text, reactions, users(name)')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    if (mMsgs) setMuralMsgs(mMsgs);

    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('participants')
      .insert({ event_id: id, user_id: user.id, wishlist: '' });

    if (!error) {
      fetchData(); // Refresh
      setIsEditingWishlist(true); // Open wishlist editor automatically
    } else {
      alert('Erro ao entrar no evento: ' + error.message);
    }
  };

  const handleSaveWishlist = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('participants')
      .update({ wishlist: myWishlist })
      .eq('event_id', id)
      .eq('user_id', user.id);
      
    if (!error) {
      setIsEditingWishlist(false);
      fetchData();
    } else {
      alert('Erro ao salvar lista de desejos: ' + error.message);
    }
    setLoading(false);
  };

  const handleDraw = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/perform-draw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ event_id: id }),
    });

    if (res.ok) {
      alert('Sorteio realizado com sucesso!');
      fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Erro no sorteio: ' + (data.error || data.message || 'Erro desconhecido.'));
    }
    setLoading(false);
  };

  const handleSendMuralMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuralMsg.trim()) return;

    const text = newMuralMsg.trim();
    setNewMuralMsg('');

    // Optimistic UI for sending
    const optMsg = {
      id: Date.now().toString(),
      text: text,
      reactions: {},
      users: { name: user?.user_metadata?.name || 'Você' },
    };
    setMuralMsgs(prev => [...prev, optMsg]);

    const { error } = await supabase
      .from('messages')
      .insert({ event_id: id, sender_id: user?.id, text: text, reactions: {} });

    if (error) fetchData(); // rollback if error
    else fetchData(); // refresh for real ID
  };

  const handleToggleLike = async (msgId: string) => {
    if (!user) return;
    const userId = user.id;

    // Optimistic Update
    setMuralMsgs(prev => prev.map(msg => {
      if (msg.id === msgId) {
        const reacts = { ...(msg.reactions || {}) };
        if (reacts[userId]) {
          delete reacts[userId]; // unlike
        } else {
          reacts[userId] = '👍'; // like
        }
        return { ...msg, reactions: reacts };
      }
      return msg;
    }));

    // Update DB (Fetch current first to avoid race condition)
    const { data: currMsg } = await supabase.from('messages').select('reactions').eq('id', msgId).single();
    if (currMsg) {
      const reacts = { ...(currMsg.reactions || {}) };
      if (reacts[userId]) delete reacts[userId];
      else reacts[userId] = '👍';
      
      await supabase.from('messages').update({ reactions: reacts }).eq('id', msgId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-12 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const isCreator = event?.creator_id === user?.id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-12 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{event.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${event.status === 'aberto' || event.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {event.status?.toUpperCase() || 'ABERTO'}
          </span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copiado!');
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Copiar Link
          </button>
        </div>
      </header>

      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-6">
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm transition-colors">
          <p className="text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{event.description}</p>
          {event.reveal_date && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-200">Data de Revelação:</strong> {new Date(event.reveal_date).toLocaleDateString()}
            </p>
          )}
        </section>

        {isParticipant && event.status === 'open' && (
          <section className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-3xl p-6 md:p-8 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-primary-900 dark:text-primary-300 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Sua Lista de Desejos
            </h3>
            {isEditingWishlist ? (
              <div className="space-y-4">
                <textarea 
                  value={myWishlist}
                  onChange={(e) => setMyWishlist(e.target.value)}
                  placeholder="O que você gostaria de ganhar?"
                  rows={3}
                  className="w-full px-4 py-3 border border-primary-200 dark:border-primary-800/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors resize-y shadow-sm"
                />
                <div className="flex gap-3">
                  <button onClick={handleSaveWishlist} className="bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-6 rounded-lg transition-colors">Salvar</button>
                  <button onClick={() => setIsEditingWishlist(false)} className="bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2 px-6 rounded-lg transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                <p className={`flex-1 ${myWishlist ? 'text-slate-700 dark:text-slate-300' : 'italic text-slate-400 dark:text-slate-500'}`}>
                  {myWishlist || 'Você ainda não definiu sua lista de desejos. Ajude o seu amigo secreto!'}
                </p>
                <button onClick={() => setIsEditingWishlist(true)} className="flex-none bg-primary-100 hover:bg-primary-200 text-primary-700 dark:bg-primary-900/40 dark:hover:bg-primary-900/60 dark:text-primary-300 font-medium py-2 px-4 rounded-lg transition-colors">
                  {myWishlist ? 'Editar Lista' : 'Criar Lista'}
                </button>
              </div>
            )}
          </section>
        )}

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 md:p-6 shadow-sm flex flex-wrap gap-4 items-center justify-between transition-colors">
          {!isParticipant && event.status === 'open' && (
            <button onClick={handleJoin} className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl shadow transition-colors flex-1 md:flex-none">
              Participar do Evento
            </button>
          )}

          {isCreator && event.status === 'open' && (
            <button 
              onClick={handleDraw} 
              disabled={participants.length < 3}
              title={participants.length < 3 ? 'É necessário pelo menos 3 participantes' : 'Realizar o sorteio agora'}
              className={`font-semibold py-3 px-6 rounded-xl shadow transition-all flex-1 md:flex-none ${participants.length < 3 ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/20 dark:text-amber-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-white cursor-pointer'}`}
            >
              {participants.length < 3 ? 'Precisa de 3+ Participantes' : 'Realizar Sorteio Inteligente'}
            </button>
          )}

          {isParticipant && event.status === 'drawn' && (
            <button onClick={() => router.push(`/evento/${id}/draw`)} className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl shadow transition-all flex-1 md:flex-none">
              Ver Meu Amigo Secreto
            </button>
          )}
          
          <div className="text-sm text-slate-500 dark:text-slate-400 flex-1 md:flex-none text-right">
            Status atual: <span className="font-semibold text-slate-700 dark:text-slate-300">{event.status === 'open' ? 'Aguardando Sorteio' : 'Sorteio Realizado'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm transition-colors lg:col-span-1 h-fit">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              Participantes 
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm py-1 px-3 rounded-full">{participants.length}</span>
            </h2>
            <ul className="space-y-3">
              {participants.map(p => (
                <li key={p.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold shadow-sm border border-primary-200 dark:border-primary-700/50">
                    {p.users?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{p.users?.name}</span>
                </li>
              ))}
            </ul>
          </section>

          {isParticipant && (
            <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm transition-colors lg:col-span-2 flex flex-col h-[600px]">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mural do Evento</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Deixe uma mensagem para o grupo!</p>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
                {muralMsgs.map(msg => {
                  const reacts = msg.reactions || {};
                  const isLiked = user ? !!reacts[user.id] : false;
                  const totalLikes = Object.keys(reacts).length;

                  return (
                    <div key={msg.id} className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm text-primary-700 dark:text-primary-300">{msg.users?.name}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mb-3">{msg.text}</p>
                      <button 
                        onClick={() => handleToggleLike(msg.id)} 
                        className={`text-sm py-1 px-2.5 rounded-lg border transition-colors flex items-center gap-1 ${isLiked ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                      >
                        <span className="text-base">👍</span> 
                        {totalLikes > 0 && <span className="font-medium">{totalLikes}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
                <form onSubmit={handleSendMuralMsg} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMuralMsg} 
                    onChange={e => setNewMuralMsg(e.target.value)} 
                    placeholder="Escreva no mural..." 
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors" 
                  />
                  <button type="submit" disabled={!newMuralMsg.trim()} className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Enviar
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
