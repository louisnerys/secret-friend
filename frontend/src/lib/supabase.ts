import { createClient } from '@supabase/supabase-js';

// No build da Vercel, estas variáveis podem estar ausentes momentaneamente
// Usamos valores placeholder para evitar que o createClient lance erro e quebre o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
