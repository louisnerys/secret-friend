'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      router.push(redirectPath);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        name: name || email.split('@')[0],
      });

      if (data.session) {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get('redirect') || '/dashboard';
        router.push(redirectPath);
      } else {
        setError('Cadastro realizado! Confirme seu e-mail e faça login.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-surface font-body text-on-surface">
      {/* ── Left visual panel (desktop only) ── */}
      <section className="hidden lg:flex w-7/12 relative overflow-hidden bg-primary">
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

        {/* Copy */}
        <div className="relative z-10 flex flex-col justify-end p-20 w-full h-full">
          <div className="mb-8">
            <span className="font-label text-secondary-fixed tracking-[0.2em] uppercase text-xs mb-4 block">
              A Arte de Convidar
            </span>
            <h1 className="font-display text-7xl font-extrabold text-surface-bright tracking-tighter leading-tight max-w-2xl">
              A Celebração Começa Aqui.
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-12 h-[1px] bg-secondary-fixed/50" />
            <p className="font-body text-surface-container-low/80 text-lg max-w-md italic">
              &ldquo;Transforme cada encontro em um momento inesquecível de elegância e conexão.&rdquo;
            </p>
          </div>
        </div>

        {/* Decorative star */}
        <div className="absolute top-20 right-20 w-32 h-32 opacity-20 select-none">
          <span
            className="text-secondary-fixed"
            style={{ fontSize: 120, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 1" }}
          >
            hotel_class
          </span>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="w-full lg:w-5/12 bg-surface-bright flex flex-col justify-center items-center px-8 sm:px-12 md:px-20 relative overflow-y-auto">
        {/* Logo */}
        <div className="absolute top-10 left-8 md:left-12">
          <span className="font-display text-2xl font-black text-primary tracking-tighter">
            A Celebração
          </span>
        </div>

        <div className="w-full max-w-md py-24 lg:py-0">
          <header className="mb-10">
            <h2 className="font-display text-4xl font-bold text-on-surface tracking-tight mb-3">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-on-surface-variant font-medium">
              {isLogin
                ? 'Acesse sua conta para gerenciar seus eventos.'
                : 'Preencha os dados abaixo para participar.'}
            </p>
          </header>

          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="space-y-5"
          >
            {/* Name (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant font-bold ml-1" htmlFor="name">
                  Nome Completo
                </label>
                <div className="relative group">
                  <input
                    id="name"
                    type="text"
                    placeholder="João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-surface-container-highest border-none rounded-lg py-4 px-5 text-on-surface focus:bg-surface-container-lowest focus:ring-0 outline-none transition-all duration-300 placeholder:text-on-surface-variant/40"
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-secondary group-focus-within:w-full transition-all duration-500" />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant font-bold ml-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border-none rounded-lg py-4 px-5 text-on-surface focus:bg-surface-container-lowest focus:ring-0 outline-none transition-all duration-300 placeholder:text-on-surface-variant/40"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-secondary group-focus-within:w-full transition-all duration-500" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant font-bold" htmlFor="password">
                  Senha
                </label>
                {isLogin && (
                  <span className="text-xs text-primary font-bold cursor-pointer hover:text-primary-container transition-colors">
                    Esqueceu a senha?
                  </span>
                )}
              </div>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-highest border-none rounded-lg py-4 px-5 text-on-surface focus:bg-surface-container-lowest focus:ring-0 outline-none transition-all duration-300 placeholder:text-on-surface-variant/40"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-secondary group-focus-within:w-full transition-all duration-500" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-on-error bg-error rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="luxury-gradient w-full py-4 rounded-full text-on-primary font-bold tracking-tight shadow-[0_8px_24px_rgba(122,0,26,0.15)] hover:shadow-[0_12px_32px_rgba(122,0,26,0.25)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70"
              >
                {loading
                  ? isLogin ? 'Entrando…' : 'Cadastrando…'
                  : isLogin ? 'Entrar na Galeria' : 'Confirmar Cadastro'}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-container-high" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-label tracking-widest text-on-surface-variant bg-surface-bright px-4">
                  {isLogin ? 'Ainda não tem conta?' : 'Já possui conta?'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setError(null); setIsLogin(!isLogin); }}
                disabled={loading}
                className="w-full py-3 px-4 rounded-full border border-outline-variant hover:bg-surface-container-low transition-all duration-200 text-sm font-bold text-on-surface"
              >
                {isLogin ? 'Criar sua conta' : 'Voltar para o Login'}
              </button>
            </div>
          </form>
        </div>

        <div className="absolute bottom-8 text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-label">
          © 2024 A Celebração — Experiências de Prestígio
        </div>
      </section>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 -z-10 pointer-events-none overflow-hidden h-full w-full opacity-30">
        <div className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-secondary-container/10" />
        <div className="absolute top-[40%] right-[10%] w-[20vw] h-[20vw] rounded-full blur-[100px] bg-primary-container/5" />
      </div>
    </main>
  );
}
