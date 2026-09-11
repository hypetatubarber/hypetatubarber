import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MockDatabase } from '../services/mockData';

interface AuthContextType {
  currentUser: Usuario | null;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<Usuario>;
  setUserSession: (user: Usuario) => void;
  logout: () => Promise<void>;
  switchCollaborator: (slug: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hype_auth_user_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona a partir do localStorage para evitar deslogar no F5
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Erro ao carregar usuário inicial do localStorage:', e);
    }
    return null;
  });

  // Se já há usuário restaurado, loading inicia como false
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
    } catch {
      return true;
    }
  });

  const setUserSession = (user: Usuario) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('[AuthContext] Erro ao salvar sessão:', e);
    }
  };

  // Inicializa e sincroniza a sessão de autenticação
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          // 1. Tenta recuperar sessão ativa no Supabase Auth
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user && !error) {
            // Busca o perfil na tabela public.usuarios
            const { data: profile } = await supabase
              .from('usuarios')
              .select('*')
              .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            if (profile && mounted) {
              setCurrentUser(profile);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
              return;
            }

            // Perfil fallback caso a tabela public.usuarios ainda não contenha o registro
            const roleInferred: UserRole =
              session.user.user_metadata?.role ||
              (session.user.email?.includes('recepcao') ? 'recepcionista' : 'master');

            const fallbackUser: Usuario = {
              id: session.user.id,
              nome: session.user.user_metadata?.nome || (session.user.email?.split('@')[0] || 'Usuário'),
              email: session.user.email || '',
              role: roleInferred,
              slug: roleInferred === 'master' ? 'admin' : roleInferred === 'recepcionista' ? 'recepcao' : 'colaborador',
              status: 'ativo',
            };

            if (mounted) {
              setCurrentUser(fallbackUser);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
              return;
            }
          }
          
          // Se não há sessão no Supabase, mas temos usuário salvo no localStorage (login local/colaborador), mantém logado!
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.id && parsed.role && mounted) {
                setCurrentUser(parsed);
                return;
              }
            } catch {}
          }

          if (mounted) {
            setCurrentUser(null);
          }
        } else {
          // Modo Local / Demo sem Supabase
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved && mounted) {
            try {
              setCurrentUser(JSON.parse(saved));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Erro ao restaurar sessão:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças no estado de autenticação do Supabase
    let subscription: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Apenas desloga se o evento for explicitamente SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          if (mounted) {
            setCurrentUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('usuarios')
            .select('*')
            .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
            .maybeSingle();

          if (profile && mounted) {
            setCurrentUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Login com e-mail e senha
  const loginWithEmail = async (email: string, pass: string): Promise<Usuario> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('Informe o e-mail e a senha.');
    }

    // 1. Autenticação via Supabase (quando configurado)
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data && data.user) {
        // 2. Busca o perfil e role na tabela public.usuarios
        let usuarioFinal: Usuario;
        try {
          const { data: profile, error: profError } = await supabase
            .from('usuarios')
            .select('*')
            .or(`id.eq.${data.user.id},email.eq.${cleanEmail}`)
            .maybeSingle();

          if (profile && !profError) {
            usuarioFinal = profile;
          } else {
            // Fallback a partir de metadados se public.usuarios não respondeu
            const roleInferred: UserRole =
              data.user.user_metadata?.role ||
              (cleanEmail.includes('recepcao') ? 'recepcionista' : 'master');

            usuarioFinal = {
              id: data.user.id,
              nome: data.user.user_metadata?.nome || cleanEmail.split('@')[0],
              email: cleanEmail,
              role: roleInferred,
              slug: roleInferred === 'master' ? 'admin' : roleInferred === 'recepcionista' ? 'recepcao' : 'colaborador',
              status: 'ativo',
            };
          }
        } catch (err) {
          console.warn('Erro ao consultar tabela usuarios:', err);
          const roleInferred: UserRole = cleanEmail.includes('recepcao') ? 'recepcionista' : 'master';
          usuarioFinal = {
            id: data.user.id,
            nome: cleanEmail.split('@')[0],
            email: cleanEmail,
            role: roleInferred,
            slug: roleInferred === 'master' ? 'admin' : 'recepcao',
            status: 'ativo',
          };
        }

        setCurrentUser(usuarioFinal);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(usuarioFinal));
        return usuarioFinal;
      }

      // Se o erro do Supabase for credencial inválida legítima (400) e não for usuário local, avisa
      if (error) {
        console.warn('[Supabase Auth Info]:', error.message);
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('E-mail ainda não confirmado no Supabase.');
        }
        // Para outros erros (como Database error querying schema 500), continua para o fallback local abaixo
      }
    }

    // 2. Modo Offline / Mock Demo
    const usuarios = MockDatabase.getUsuarios();
    let found = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);

    // Aliases para Master e Recepção
    if (!found) {
      if (cleanEmail === 'master@hypetatu.com.br' || cleanEmail === 'hypetatubarber@gmail.com') {
        found = usuarios.find((u) => u.role === 'master');
      } else if (cleanEmail === 'recepcao@hypetatu.com.br' || cleanEmail === 'recepcao.hype@hypetatu.com.br') {
        found = usuarios.find((u) => u.role === 'recepcionista');
      }
    }

    if (!found) {
      throw new Error('E-mail não cadastrado no sistema.');
    }

    // Validação de senha em modo local / fallback
    const validMasterPass = ['hypemaster@2024', 'senhamaster@2024', '123456', 'master123'];
    const validRecepcaoPass = ['hyperecepcao@2024', 'senharecepcao@2024', '123456', 'recepcao123'];
    const lowerPass = pass.toLowerCase();

    if ((cleanEmail === 'master@hypetatu.com.br' || cleanEmail === 'hypetatubarber@gmail.com') && !validMasterPass.includes(lowerPass)) {
      throw new Error('Senha incorreta para usuário Master.');
    }
    if ((cleanEmail === 'recepcao@hypetatu.com.br' || cleanEmail === 'recepcao.hype@hypetatu.com.br') && !validRecepcaoPass.includes(lowerPass)) {
      throw new Error('Senha incorreta para usuário Recepção.');
    }

    setCurrentUser(found);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
    return found;
  };

  const switchCollaborator = async (slug: string) => {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('usuarios').select('*').eq('slug', slug).maybeSingle();
      if (data) {
        setCurrentUser(data);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        return;
      }
    }
    const colab = MockDatabase.getUsuarioBySlug(slug);
    if (colab) {
      setCurrentUser(colab);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(colab));
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Erro ao encerrar sessão Supabase:', e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const role: UserRole | null = currentUser?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        loginWithEmail,
        setUserSession,
        logout,
        switchCollaborator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
