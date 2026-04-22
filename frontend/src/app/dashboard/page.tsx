'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './dashboard.module.css';

interface Evento {
  id: string;
  nome: string;
  descricao: string;
  status: string;
}

export default function Dashboard() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (userProfile?.is_admin) {
      setIsAdmin(true);
    }

    const { data, error } = await supabase
      .from('eventos')
      .select('*');

    if (!error && data) {
      setEventos(data);
    }
    setLoading(false);
  };

  // create event logic moved to /novo-evento

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meus Eventos</h1>
        <div className={styles.headerActions}>
          {isAdmin && (
            <button onClick={() => router.push('/admin')} className={styles.buttonWarning}>
              Admin Panel
            </button>
          )}
          <button onClick={() => router.push('/novo-evento')} className={styles.buttonPrimary}>
            + Novo Evento
          </button>
          <button onClick={handleLogout} className={styles.buttonSecondary}>
            Sair
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {eventos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você ainda não participa de nenhum evento.</p>
            <button onClick={() => router.push('/novo-evento')} className={styles.buttonOutline}>Criar meu primeiro evento</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {eventos.map((evento) => (
              <div 
                key={evento.id} 
                className={styles.card}
                onClick={() => router.push(`/evento/${evento.id}`)}
              >
                <h3 className={styles.cardTitle}>{evento.nome}</h3>
                <p className={styles.cardDesc}>{evento.descricao}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.badge}>{evento.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
