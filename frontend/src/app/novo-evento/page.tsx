'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewEvent() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [revealDate, setRevealDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .insert({ 
        name: name.trim(), 
        description: description.trim() || 'Novo sorteio de amigo secreto', 
        reveal_date: revealDate ? new Date(revealDate).toISOString() : null,
        creator_id: user.user.id, 
        status: 'open' 
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
      .from('participants')
      .insert({ event_id: data.id, user_id: user.user.id });
      
    if (partError) {
      console.error('Erro ao adicionar criador como participante:', partError);
    }

    router.push(`/evento/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Criar Novo Evento</h1>
        </header>

        <main className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-10 shadow-sm transition-colors">
          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nome do Evento</label>
              <input
                id="name"
                type="text"
                placeholder="Ex: Amigo Secreto da Firma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Data de Realização / Revelação</label>
              <input
                id="date"
                type="date"
                value={revealDate}
                onChange={(e) => setRevealDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors [&::-webkit-calendar-picker-indicator]:dark:filter [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descrição ou Regras</label>
              <textarea
                id="description"
                placeholder="Ex: Valor mínimo R$ 50, revelação no dia 20 às 15h..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors resize-y"
                rows={4}
              />
            </div>

            {error && (
              <div className="p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
                {error}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl shadow transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar Evento'}
              </button>
              <button 
                type="button" 
                onClick={() => router.push('/dashboard')} 
                disabled={loading} 
                className="flex-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-3 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
