'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback initiated...');
      
      // Supabase library parses the URL automatically on initialization/load.
      // We just need to check if we have a session now.
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=callback_failed');
        return;
      }

      if (session) {
        console.log('Session established for:', session.user.email);
        router.push('/dashboard');
      } else {
        console.log('No session found in callback, checking onAuthStateChange...');
        // Sometimes the session takes a moment to be persisted to storage
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            console.log('Session confirmed via event:', event);
            subscription.unsubscribe();
            router.push('/dashboard');
          }
        });

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          router.push('/login?error=timeout');
        }, 5000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl font-display font-bold text-on-surface mb-2">Autenticando...</h1>
      <p className="text-on-surface-variant max-w-xs">
        Estamos preparando sua experiência de prestígio. Um momento, por favor.
      </p>
    </div>
  );
}
