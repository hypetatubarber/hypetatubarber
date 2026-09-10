import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

export const getSupabaseStatus = () => {
  const isConfigured = isSupabaseConfigured();
  if (!isConfigured) {
    console.warn(
      '[Hype Tatu Supabase] ATENÇÃO: As variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não estão configuradas ou são inválidas. O sistema operará em modo offline/demo. Configure-as no painel do Railway para habilitar autenticação em nuvem.'
    );
  }
  return {
    isConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseAnonKey),
  };
};

// Log inicial
getSupabaseStatus();

// Cliente oficial Supabase
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

