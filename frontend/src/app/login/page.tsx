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
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
    if (isLogin) {
      setIsLogin(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Create user profile
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
        alert('Cadastro realizado! Faça o login agora.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 transition-colors">
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">Amigo Oculto</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta para participar'}
        </p>
        
        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                placeholder="João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="pt-2 flex flex-col space-y-3">
            {isLogin ? (
              <>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-70"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsLogin(false)} 
                  disabled={loading} 
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Criar Conta
                </button>
              </>
            ) : (
              <>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-70"
                >
                  {loading ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsLogin(true)} 
                  disabled={loading} 
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  Voltar para o Login
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
