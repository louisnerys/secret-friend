'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    setError(null);
    setSuccessMsg(null);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('redirect') || '/dashboard';
    const redirectTo = `${window.location.origin}/callback?next=${encodeURIComponent(redirectPath)}`;

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg(t('login.check_email'));
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Redirect directly since it's password login
        window.location.href = redirectPath;
      }
    }
    setLoadingEmail(false);
  };

  const handleSocialLogin = async (provider: 'google') => {
    if (provider === 'google') setLoadingGoogle(true);
    setError(null);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('redirect') || '/dashboard';

    // We need the full URL for OAuth redirect
    const redirectTo = `${window.location.origin}/callback?next=${encodeURIComponent(redirectPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError(error.message);
      if (provider === 'google') setLoadingGoogle(false);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-surface font-body text-on-surface">
      {/* Language Switcher in the corner */}
      <div className="fixed top-8 right-8 z-50">
        <LanguageSwitcher />
      </div>

      {/* ── Left visual panel (desktop only) ── */}
      <section className="hidden lg:flex w-7/12 relative overflow-hidden bg-primary" aria-hidden="true">
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />

        {/* Copy */}
        <div className="relative z-10 flex flex-col justify-end p-20 w-full h-full">
          <div className="mb-8">
            <span className="font-label text-secondary-fixed tracking-[0.2em] uppercase text-xs mb-4 block">
              {t('login.subtitle')}
            </span>
            <h1 className="font-display text-7xl font-extrabold text-surface-bright tracking-tighter leading-tight max-w-2xl">
              {t('login.hero_title')}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-12 h-[1px] bg-secondary-fixed/50" />
            <p className="font-body text-surface-container-low/80 text-lg max-w-md italic">
              &ldquo;{t('login.hero_quote')}&rdquo;
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
            {t('login.title')}
          </span>
        </div>

        <div className="w-full max-w-md py-24 lg:py-0">
          <header className="mb-10 text-center">
            <h2 className="font-display text-4xl font-bold text-on-surface tracking-tight mb-3">
              {t('login.welcome')}
            </h2>
            <p className="text-on-surface-variant font-medium">
              {t('login.login_prompt')}
            </p>
          </header>

          <div className="space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-on-error bg-error rounded-lg text-center" role="alert">
                {error}
              </div>
            )}

            {/* Google Login Button */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loadingGoogle || loadingEmail}
              className="flex items-center justify-center gap-3 w-full py-4 bg-white text-gray-800 rounded-full border border-gray-300 font-bold tracking-tight hover:bg-gray-50 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {loadingGoogle ? (
                t('common.connecting')
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {t('login.continue_google')}
                </>
              )}
            </button>


            {successMsg && (
              <div className="p-3 text-sm text-on-primary-container bg-primary-container rounded-lg text-center" role="status">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label htmlFor="name-input" className="block text-sm font-medium text-on-surface-variant mb-1">
                    {t('login.name_label')}
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-on-surface-variant mb-1">
                  {t('login.email_label')}
                </label>
                <input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-on-surface-variant mb-1">
                  {t('login.password_label')}
                </label>
                <input
                  id="password-input"
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-outline bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEmail || loadingGoogle}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-bold tracking-tight hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {loadingEmail ? t('common.connecting') : (isRegister ? t('login.sign_up') : t('login.sign_in'))}
              </button>
            </form>

            <div className="flex items-center justify-between mt-6">
              <div className="w-full h-[1px] bg-outline-variant" />
              <span className="px-4 text-sm text-on-surface-variant">{t('login.or')}</span>
              <div className="w-full h-[1px] bg-outline-variant" />
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {isRegister ? t('login.have_account') : t('login.no_account')}
              </button>
            </div>

          </div>
        </div>

        <div className="absolute bottom-8 text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-label">
          {t('login.footer')}
        </div>
      </section>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 -z-10 pointer-events-none overflow-hidden h-full w-full opacity-30" aria-hidden="true">
        <div className="absolute -top-[10%] -right-[5%] w-[40vw] h-[40vw] rounded-full blur-[120px] bg-secondary-container/10" />
        <div className="absolute top-[40%] right-[10%] w-[20vw] h-[20vw] rounded-full blur-[100px] bg-primary-container/5" />
      </div>
    </main>
  );
}
