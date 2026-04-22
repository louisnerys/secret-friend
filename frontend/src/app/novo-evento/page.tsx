'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './novo-evento.module.css';

export default function NovoEvento() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataRealizacao, setDataRealizacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    setError(null);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('eventos')
      .insert({ 
        nome: nome.trim(), 
        descricao: descricao.trim() || 'Novo sorteio de amigo secreto', 
        data_revelacao: dataRealizacao ? new Date(dataRealizacao).toISOString() : null,
        criador_id: user.user.id, 
        status: 'aberto' 
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Erro detalhado:', error);
      setError('Erro ao criar evento: ' + (error?.message || 'Falha desconhecida. Veja o console.'));
      setLoading(false);
      return;
    }

    // Add creator as participant automatically
    const { error: partError } = await supabase
      .from('participantes')
      .insert({ evento_id: data.id, usuario_id: user.user.id });
      
    if (partError) {
      console.error('Erro ao adicionar criador como participante:', partError);
    }

    router.push(`/evento/${data.id}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/dashboard')}>
          &larr; Voltar
        </button>
        <h1 className={styles.title}>Criar Novo Evento</h1>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleCreateEvent} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nome">Nome do Evento</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Amigo Secreto da Firma"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="data">Data de Realização / Revelação</label>
            <input
              id="data"
              type="date"
              value={dataRealizacao}
              onChange={(e) => setDataRealizacao(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descricao">Descrição ou Regras</label>
            <textarea
              id="descricao"
              placeholder="Ex: Valor mínimo R$ 50, revelação no dia 20 às 15h..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={styles.textarea}
              rows={4}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="submit" disabled={loading} className={styles.buttonPrimary}>
              {loading ? 'Criando...' : 'Criar Evento'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')} className={styles.buttonSecondary} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
