'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Event {
  id: string;
  name: string;
  description: string;
  status: string;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      router.push('/login');
      return;
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.user.id)
      .single();

    if (userProfile?.is_admin) {
      setIsAdmin(true);
    }

    const { data, error } = await supabase
      .from('events')
      .select('*');

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-12 transition-colors">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 md:px-12 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Meus Eventos</h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => router.push('/admin')} className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded-lg transition-colors">
              Admin Panel
            </button>
          )}
          <button onClick={() => router.push('/novo-evento')} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow transition-colors">
            + Novo Evento
          </button>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center transition-colors">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🎁</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Nenhum evento encontrado</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">Você ainda não participa de nenhum evento de Amigo Oculto. Crie um novo evento ou aguarde um convite.</p>
            <button onClick={() => router.push('/novo-evento')} className="px-6 py-2.5 font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 rounded-lg transition-colors">
              Criar meu primeiro evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event.id} 
                onClick={() => router.push(`/evento/${event.id}`)}
                className="group flex flex-col justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{event.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4">{event.description}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${event.status === 'aberto' || event.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {event.status?.toUpperCase() || 'ABERTO'}
                  </span>
                  <span className="text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalhes →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
