'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

interface AdminMetrics {
  mau: number;
  eventos: {
    aberto: number;
    sorteado: number;
    finalizado: number;
  };
  engajamento: {
    total_participantes: number;
    com_lista: number;
    taxa_percentual: number;
  };
  mensagens_24h: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.rpc('get_admin_metrics');

    if (error) {
      setError(error.message);
    } else {
      setMetrics(data as AdminMetrics);
    }
    setLoading(false);
  };

  const handleMakeMeAdmin = async () => {
    // For test purposes since we can't easily modify the table without policy.
    // Wait, users cannot update their own is_admin column. We have to do it via supabase client 
    // but RLS prevents it. Let's just show a message.
    alert('Para testar, atualize a coluna is_admin do seu usuário para true diretamente no banco de dados.');
  };

  if (loading) return <div className={styles.loading}>Carregando métricas globais...</div>;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorTitle}>Acesso Negado</h2>
          <p className={styles.errorText}>Você não tem permissão para acessar o painel administrativo.</p>
          <p className={styles.errorDetails}>({error})</p>
          <div className={styles.actions}>
            <button onClick={() => router.push('/dashboard')} className={styles.buttonPrimary}>
              Voltar ao Dashboard
            </button>
            <button onClick={handleMakeMeAdmin} className={styles.buttonSecondary}>
              Como virar admin?
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
          &larr; Voltar
        </button>
        <h1 className={styles.title}>Admin Global Dashboard</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Usuários Ativos (MAU)</h3>
            <p className={styles.metricValue}>{metrics.mau}</p>
          </div>

          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Volume de Mensagens (24h)</h3>
            <p className={styles.metricValue}>{metrics.mensagens_24h}</p>
          </div>

          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Taxa de Engajamento</h3>
            <p className={styles.metricValue}>{metrics.engajamento.taxa_percentual}%</p>
            <p className={styles.metricSub}>
              {metrics.engajamento.com_lista} de {metrics.engajamento.total_participantes} participantes com lista.
            </p>
          </div>
        </div>

        <section className={styles.chartSection}>
          <h2 className={styles.sectionTitle}>Status dos Eventos</h2>
          <div className={styles.eventosStats}>
            <div className={styles.statBox}>
              <span className={styles.statName}>Abertos</span>
              <span className={styles.statNum}>{metrics.eventos.aberto}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statName}>Sorteados</span>
              <span className={styles.statNum}>{metrics.eventos.sorteado}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statName}>Finalizados</span>
              <span className={styles.statNum}>{metrics.eventos.finalizado}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
