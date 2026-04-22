'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DrawPageProps {
  params: Promise<{ id: string }>;
}

export default function DrawPage(props: DrawPageProps) {
  const { id } = use(props.params);
  const [myDrawn, setMyDrawn] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<'drawn' | 'drawer'>('drawn');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDrawAndMessages();
    
    // Subscribe to new private messages
    const channel = supabase
      .channel('private_messages_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'private_messages',
        filter: `event_id=eq.${id}`
      }, (payload) => {
        // Na prática, ideal seria usar a Edge Function para evitar vazamento
        // mas para tempo real recarregamos as messages anonimizadas
        fetchDrawAndMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDrawAndMessages = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    // 1. Quem eu tirei
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

    // 2. Mensagens anônimas via Edge Function
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-anonymous-messages?event_id=${id}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

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

    // Optimistic UI update
    const optMsg = {
      id: Date.now().toString(),
      text: text,
      sender_display: "Você",
      is_mine: true,
      chat_type: activeChat,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

    const { error } = await supabase.rpc('send_anonymous_message', {
      p_event_id: id,
      p_text: text,
      p_to_drawer: activeChat === 'drawer'
    });

    if (error) {
      alert("Erro ao enviar mensagem");
      fetchDrawAndMessages(); // revert optimistic
    }
  };

  const filteredMessages = messages.filter(m => m.chat_type === activeChat);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-200 dark:bg-primary-900/50 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="text-slate-500 dark:text-slate-400 font-medium">Carregando o segredo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-12 py-4 flex items-center justify-between transition-colors">
        <button 
          onClick={() => router.push(`/evento/${id}`)}
          className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para o Evento
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
          Seu Amigo Secreto
        </h1>
        <div className="w-24 hidden sm:block"></div>{/* Spacer for center alignment */}
      </header>

      <main className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-8 h-[calc(100vh-80px)]">
        {/* Reveal Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-primary-600 dark:from-indigo-900 dark:to-primary-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl flex-none relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
          
          <p className="text-indigo-100 font-medium tracking-wide uppercase text-sm mb-3">Você tirou:</p>
          <h2 className="text-4xl md:text-5xl font-extrabold drop-shadow-md tracking-tight">
            {myDrawn?.name || '???'}
          </h2>
        </div>

        {/* Chat Section */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm flex flex-col flex-1 min-h-0 transition-colors">
          <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-500 dark:text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              Chat Anônimo
            </h3>
            
            <div className="mt-4 flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveChat('drawn')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeChat === 'drawn' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Com meu Amigo Secreto
              </button>
              <button
                onClick={() => setActiveChat('drawer')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeChat === 'drawer' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Com quem me tirou
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <p>Nenhuma mensagem ainda.</p>
                <p className="text-sm mt-1">Mande a primeira mensagem anônima!</p>
              </div>
            ) : (
              filteredMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.is_mine 
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm' 
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm'
                  }`}>
                    <span className={`block text-xs font-semibold mb-1 ${msg.is_mine ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                      {msg.sender_display}
                    </span>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-3xl">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Envie uma mensagem (sua identidade será ocultada)..." 
                className="flex-1 px-5 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 md:px-8 rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-none"
              >
                <span className="hidden sm:inline">Enviar</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
