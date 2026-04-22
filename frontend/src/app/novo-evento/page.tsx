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
    if (!user.user) { router.push('/login'); return; }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: name.trim(),
        description: description.trim() || 'Novo sorteio de amigo secreto',
        reveal_date: revealDate ? new Date(revealDate).toISOString() : null,
        creator_id: user.user.id,
        status: 'open',
      })
      .select()
      .single();

    if (error || !data) {
      setError('Erro ao criar evento: ' + (error?.message || 'Falha desconhecida.'));
      setLoading(false);
      return;
    }

    await supabase.from('participants').insert({ event_id: data.id, user_id: user.user.id });
    router.push(`/evento/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface pb-24">
      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(26,28,26,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-primary active:scale-95 transition-transform"
            >
              <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 24 }}>arrow_back</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-primary font-display">
              Novo Evento
            </h1>
          </div>
          <div className="w-6" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-md mx-auto">
        {/* Hero Banner */}
        <div className="relative mb-10 overflow-hidden rounded-xl h-48 bg-surface-container-low flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary to-secondary-container" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
          <div className="relative z-10 text-center">
            <span className="inline-block px-3 py-1 bg-secondary-container/30 text-primary text-[10px] font-bold tracking-[0.1em] uppercase rounded-full mb-2">
              Novo
            </span>
            <h2 className="text-3xl font-extrabold text-primary tracking-tighter font-display">
              Criar Novo Evento
            </h2>
          </div>
          {/* Decorative star */}
          <span
            className="absolute top-4 right-4 text-secondary-container/30 pointer-events-none"
            style={{ fontFamily: 'Material Symbols Outlined', fontSize: 48, fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateEvent} className="space-y-8">
          {/* Event Name */}
          <div className="space-y-2">
            <label
              className="block text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant px-1"
              htmlFor="event-name"
            >
              Nome do Evento
            </label>
            <div className="relative group">
              <input
                id="event-name"
                type="text"
                placeholder="Ex: Amigo Oculto da Firma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 text-on-surface"
              />
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label
              className="block text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant px-1"
              htmlFor="event-date"
            >
              Data da Troca de Presentes
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20 }}>calendar_today</span>
              </div>
              <input
                id="event-date"
                type="date"
                value={revealDate}
                onChange={(e) => setRevealDate(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-4 focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 text-on-surface"
              />
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-500 group-focus-within:w-full" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              className="block text-[11px] font-bold uppercase tracking-[0.05em] text-on-surface-variant px-1"
              htmlFor="event-rules"
            >
              Descrição ou Regras
            </label>
            <div className="relative group">
              <textarea
                id="event-rules"
                placeholder="Defina o valor mínimo, sugestões de presentes ou local do evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 focus:ring-0 focus:bg-surface-container-lowest outline-none transition-all duration-300 placeholder:text-on-surface-variant/40 resize-none text-on-surface"
              />
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-500 group-focus-within:w-full" />
              <div className="absolute top-4 right-4 text-secondary-container opacity-20 pointer-events-none">
                <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 text-sm text-on-error bg-error rounded-lg">{error}</div>
          )}

          {/* Actions */}
          <div className="pt-6 space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full shadow-[0_8px_24px_rgba(122,0,26,0.2)] active:scale-95 transition-transform disabled:opacity-70"
            >
              {loading ? 'Criando…' : 'Criar Evento'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={loading}
              className="w-full py-2 text-primary font-bold text-sm tracking-wide hover:opacity-70 transition-opacity"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Info chip */}
        <div className="mt-12 p-4 bg-tertiary-fixed/30 rounded-xl flex items-start gap-3">
          <span
            className="text-on-tertiary-container shrink-0"
            style={{ fontFamily: 'Material Symbols Outlined', fontSize: 20 }}
          >
            auto_awesome
          </span>
          <p className="text-[12px] text-on-tertiary-container leading-relaxed">
            Ao criar este evento, você se tornará o organizador e poderá convidar amigos através de um link exclusivo.
          </p>
        </div>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 px-8 pb-6 pt-2 bg-surface/90 backdrop-blur-2xl shadow-[0_-8px_24px_rgba(26,28,26,0.06)]">
        <div className="flex justify-around items-center w-full max-w-lg mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex flex-col items-center justify-center text-primary bg-primary/5 rounded-full px-4 py-2"
          >
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22, fontVariationSettings: "'FILL' 1" }}>celebration</span>
            <span className="font-label text-[11px] uppercase tracking-[0.05em] font-medium mt-1">Events</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant/50 px-4 py-2">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22 }}>group_add</span>
            <span className="font-label text-[11px] uppercase tracking-[0.05em] font-medium mt-1">Invite</span>
          </button>
          <button className="flex flex-col items-center justify-center text-on-surface-variant/50 px-4 py-2">
            <span style={{ fontFamily: 'Material Symbols Outlined', fontSize: 22 }}>person</span>
            <span className="font-label text-[11px] uppercase tracking-[0.05em] font-medium mt-1">Me</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
