'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './evento.module.css';

interface EventoPageProps {
  params: Promise<{ id: string }>;
}

export default function EventoDetalhes(props: EventoPageProps) {
  const { id } = use(props.params);
  const [evento, setEvento] = useState<any>(null);
  const [participantes, setParticipantes] = useState<any[]>([]);
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

    // Fetch evento
    const { data: eventoData, error: eventoError } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();

    if (eventoError || !eventoData) {
      alert('Evento não encontrado');
      router.push('/dashboard');
      return;
    }
    setEvento(eventoData);

    // Fetch participantes (from security view vw_participantes)
    const { data: parts } = await supabase
      .from('vw_participantes')
      .select('usuario_id, sorteado_id, lista_desejos, usuarios(nome)')
      .eq('evento_id', id);

    if (parts) {
      setParticipantes(parts);
      const me = parts.find(p => p.usuario_id === authData.user.id);
      setIsParticipant(!!me);
      if (me && me.lista_desejos) {
        setMyWishlist(me.lista_desejos);
      }
    }

    // Fetch mural
    const { data: mMsgs } = await supabase
      .from('mensagens')
      .select('id, texto, reactions, usuarios(nome)')
      .eq('evento_id', id)
      .order('criado_at', { ascending: true });

    if (mMsgs) setMuralMsgs(mMsgs);

    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('participantes')
      .insert({ evento_id: id, usuario_id: user.id, lista_desejos: '' });

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
      .from('participantes')
      .update({ lista_desejos: myWishlist })
      .eq('evento_id', id)
      .eq('usuario_id', user.id);
      
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
      body: JSON.stringify({ evento_id: id }),
    });

    if (res.ok) {
      alert('Sorteio realizado com sucesso!');
      fetchData();
    } else {
      const data = await res.json();
      alert('Erro no sorteio: ' + data.error);
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
      texto: text,
      reactions: {},
      usuarios: { nome: user?.user_metadata?.nome || 'Você' },
    };
    setMuralMsgs(prev => [...prev, optMsg]);

    const { error } = await supabase
      .from('mensagens')
      .insert({ evento_id: id, remetente_id: user?.id, texto: text, reactions: {} });

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
    const { data: currMsg } = await supabase.from('mensagens').select('reactions').eq('id', msgId).single();
    if (currMsg) {
      const reacts = { ...(currMsg.reactions || {}) };
      if (reacts[userId]) delete reacts[userId];
      else reacts[userId] = '👍';
      
      await supabase.from('mensagens').update({ reactions: reacts }).eq('id', msgId);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  const isCreator = evento?.criador_id === user?.id;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/dashboard')}>
          &larr; Voltar
        </button>
        <h1 className={styles.title}>{evento.nome}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className={styles.badge}>{evento.status}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copiado!');
            }}
            className={styles.buttonSecondary}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
          >
            Copiar Link
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.infoSection}>
          <p>{evento.descricao}</p>
          {evento.data_revelacao && (
            <p><strong>Data de Revelação:</strong> {new Date(evento.data_revelacao).toLocaleDateString()}</p>
          )}
        </section>

        {isParticipant && evento.status === 'aberto' && (
          <section className={styles.infoSection} style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.1)' }}>
            <h3>Sua Lista de Desejos</h3>
            {isEditingWishlist ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <textarea 
                  value={myWishlist}
                  onChange={(e) => setMyWishlist(e.target.value)}
                  placeholder="O que você gostaria de ganhar?"
                  rows={3}
                  className={styles.muralInput}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleSaveWishlist} className={styles.buttonPrimary}>Salvar</button>
                  <button onClick={() => setIsEditingWishlist(false)} className={styles.buttonSecondary}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <p style={{ fontStyle: myWishlist ? 'normal' : 'italic', opacity: 0.8 }}>
                  {myWishlist || 'Você ainda não definiu sua lista de desejos.'}
                </p>
                <button onClick={() => setIsEditingWishlist(true)} className={styles.buttonSecondary}>Editar</button>
              </div>
            )}
          </section>
        )}

        <div className={styles.actionsBar}>
          {!isParticipant && evento.status === 'aberto' && (
            <button onClick={handleJoin} className={styles.buttonPrimary}>
              Participar do Evento
            </button>
          )}

          {isCreator && evento.status === 'aberto' && (
            <button 
              onClick={handleDraw} 
              className={styles.buttonWarning}
              disabled={participantes.length < 3}
              title={participantes.length < 3 ? 'É necessário pelo menos 3 participantes' : 'Realizar o sorteio agora'}
              style={{ opacity: participantes.length < 3 ? 0.5 : 1, cursor: participantes.length < 3 ? 'not-allowed' : 'pointer' }}
            >
              {participantes.length < 3 ? 'Precisa de 3+ Participantes' : 'Realizar Sorteio Inteligente'}
            </button>
          )}

          {isParticipant && evento.status === 'sorteado' && (
            <button onClick={() => router.push(`/evento/${id}/sorteio`)} className={styles.buttonPrimary}>
              Ver Meu Amigo Secreto & Chat
            </button>
          )}
        </div>

        <div className={styles.gridContainer}>
          <section className={styles.participantsSection}>
            <h2>Participantes ({participantes.length})</h2>
            <ul className={styles.list}>
              {participantes.map(p => (
                <li key={p.usuario_id} className={styles.listItem}>
                  <div className={styles.avatar}>{p.usuarios?.nome?.charAt(0).toUpperCase()}</div>
                  <span>{p.usuarios?.nome}</span>
                </li>
              ))}
            </ul>
          </section>

          {isParticipant && (
            <section className={styles.muralSection}>
              <h2>Mural do Evento</h2>
              <div className={styles.muralList}>
                {muralMsgs.map(msg => {
                  const reacts = msg.reactions || {};
                  const isLiked = user ? !!reacts[user.id] : false;
                  const totalLikes = Object.keys(reacts).length;

                  return (
                    <div key={msg.id} className={styles.muralMsg}>
                      <span className={styles.muralSender}>{msg.usuarios?.nome}</span>
                      <p>{msg.texto}</p>
                      <button 
                        onClick={() => handleToggleLike(msg.id)} 
                        className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
                      >
                        👍 {totalLikes > 0 && totalLikes}
                      </button>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSendMuralMsg} className={styles.muralForm}>
                <input 
                  type="text" 
                  value={newMuralMsg} 
                  onChange={e => setNewMuralMsg(e.target.value)} 
                  placeholder="Escreva no mural..." 
                  className={styles.muralInput} 
                />
                <button type="submit" className={styles.buttonPrimary}>Enviar</button>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
