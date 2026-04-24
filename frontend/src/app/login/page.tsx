'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (provider === 'google') setLoadingGoogle(true);
    if (provider === 'github') setLoadingGithub(true);
    setError(null);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('redirect') || '/callback';

    // We need the full URL for OAuth redirect
    const redirectTo = `${window.location.origin}${redirectPath}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError(error.message);
      if (provider === 'google') setLoadingGoogle(false);
      if (provider === 'github') setLoadingGithub(false);
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
              disabled={loadingGoogle || loadingGithub}
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

            {/* GitHub Login Button */}
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loadingGoogle || loadingGithub}
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#24292F] text-white rounded-full font-bold tracking-tight hover:bg-[#24292F]/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {loadingGithub ? (
                t('common.connecting')
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  {t('login.continue_github')}
                </>
              )}
            </button>
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
