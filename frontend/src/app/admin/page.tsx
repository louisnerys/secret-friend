'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminMetrics {
  mau: number;
  events: {
    open: number;
    drawn: number;
    finished: number;
  };
  engagement: {
    total_participants: number;
    with_wishlist: number;
    rate_percentage: number;
  };
  messages_24h: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchMetrics = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    const init = async () => {
      await fetchMetrics();
    };
    init();
  }, [fetchMetrics]);

  const handleMakeMeAdmin = async () => {
    alert('Para testar, atualize a coluna is_admin do seu usuário para true diretamente no banco de dados.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Acesso Negado</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-2">Você não tem permissão para acessar o painel administrativo.</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-8 font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded">({error})</p>
          
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 px-4 rounded-xl transition-colors">
              Voltar ao Dashboard
            </button>
            <button onClick={handleMakeMeAdmin} className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium py-3 px-4 rounded-xl transition-colors">
              Como virar admin?
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-12">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-12 py-4 flex items-center justify-between transition-colors">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary-600 dark:text-primary-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Admin Dashboard
        </h1>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="p-6 md:p-12 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Usuários Ativos (MAU)</h3>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{metrics.mau}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mensagens (24h)</h3>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{metrics.messages_24h}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full blur-2xl"></div>
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Engajamento</h3>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{metrics.engagement.rate_percentage}%</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              <span className="text-slate-700 dark:text-slate-300">{metrics.engagement.with_wishlist}</span> de <span className="text-slate-700 dark:text-slate-300">{metrics.engagement.total_participants}</span> participantes com lista
            </p>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm transition-colors">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            Status dos Eventos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
                {metrics.events.open}
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Abertos</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Aguardando Sorteio</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center font-bold text-xl">
                {metrics.events.drawn}
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Sorteados</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Sorteio Realizado</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xl">
                {metrics.events.finished}
              </div>
              <div>
                <span className="block font-semibold text-slate-800 dark:text-slate-200">Finalizados</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Evento Concluído</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
