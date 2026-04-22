'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
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
          nome,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Create user profile
      await supabase.from('usuarios').insert({
        id: data.user.id,
        email: data.user.email,
        nome: nome || email.split('@')[0],
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
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Amigo Oculto</h1>
        <p className={styles.subtitle}>{isLogin ? 'Entre na sua conta' : 'Crie sua conta'}</p>
        
        <form onSubmit={isLogin ? handleLogin : handleSignUp} className={styles.form}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Seu Nome Completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required={!isLogin}
              className={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Seu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Sua Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.actions}>
            {isLogin ? (
              <>
                <button type="submit" disabled={loading} className={styles.buttonPrimary}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setIsLogin(false)} disabled={loading} className={styles.buttonSecondary}>
                  Criar Conta
                </button>
              </>
            ) : (
              <>
                <button type="submit" disabled={loading} className={styles.buttonPrimary}>
                  {loading ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
                <button type="button" onClick={() => setIsLogin(true)} disabled={loading} className={styles.buttonSecondary}>
                  Voltar
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
