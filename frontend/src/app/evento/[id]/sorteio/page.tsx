'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './sorteio.module.css';

export default function SorteioPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [meuSorteado, setMeuSorteado] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSorteioAndMessages();
    
    // Subscribe to new private messages
    const channel = supabase
      .channel('mensagens_privadas_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens_privadas',
        filter: `evento_id=eq.${id}`
      }, (payload) => {
        // Na prática, ideal seria usar a Edge Function para evitar vazamento
        // mas para tempo real recarregamos as mensagens anonimizadas
        fetchSorteioAndMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSorteioAndMessages = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    // 1. Quem eu tirei
    const { data: parts } = await supabase
      .from('participantes')
      .select('sorteado_id')
      .eq('evento_id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (parts?.sorteado_id) {
      const { data: sorteado } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', parts.sorteado_id)
        .single();
      
      setMeuSorteado(sorteado);
    }

    // 2. Mensagens anônimas via Edge Function
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-anonymous-messages?evento_id=${id}`, {
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
      texto: text,
      remetente_display: "Você",
      is_mine: true,
      criado_em: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

    const { data: user } = await supabase.auth.getUser();
    const { data: parts } = await supabase
      .from('participantes')
      .select('sorteado_id')
      .eq('evento_id', id)
      .eq('usuario_id', user.user?.id)
      .single();

    // Sends to the person I drew
    if (parts?.sorteado_id) {
      const { error } = await supabase
        .from('mensagens_privadas')
        .insert({
          evento_id: id,
          remetente_id: user.user?.id,
          destinatario_id: parts.sorteado_id,
          texto: text
        });

      if (error) {
        alert("Erro ao enviar mensagem");
        fetchSorteioAndMessages(); // revert optimistic
      }
    }
  };

  if (loading) return <div className={styles.loading}>Carregando o segredo...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push(`/evento/${id}`)}>
          &larr; Voltar
        </button>
        <h1 className={styles.title}>Seu Amigo Secreto</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.revealCard}>
          <p className={styles.revealLabel}>Você tirou:</p>
          <h2 className={styles.revealName}>{meuSorteado?.nome || '???'}</h2>
        </div>

        <section className={styles.chatSection}>
          <h3 className={styles.chatTitle}>Chat Anônimo</h3>
          <p className={styles.chatSubtitle}>Converse com quem você tirou (e com quem te tirou) mantendo o segredo!</p>
          
          <div className={styles.messageList}>
            {messages.length === 0 ? (
              <p className={styles.emptyChat}>Nenhuma mensagem ainda.</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={msg.is_mine ? styles.messageMine : styles.messageOther}>
                  <div className={styles.messageBubble}>
                    <span className={styles.messageSender}>{msg.remetente_display}</span>
                    <p className={styles.messageText}>{msg.texto}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={styles.chatForm}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Envie uma mensagem (sua identidade será ocultada)..." 
              className={styles.chatInput}
            />
            <button type="submit" className={styles.sendButton}>Enviar</button>
          </form>
        </section>
      </main>
    </div>
  );
}
