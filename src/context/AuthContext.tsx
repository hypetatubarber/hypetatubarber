import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: Usuario | null;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string, roleHint?: UserRole, slugHint?: string) => Promise<boolean>;
  loginAsDemo: (role: UserRole, slug?: string) => Promise<void>;
  logout: () => void;
  switchCollaborator: (slug: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hype_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Recupera sessão salva no localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
        } else {
          // Por padrão inicial, faz login como Master para visualização completa
          const usuarios = await api.getUsuarios();
          const defaultMaster = usuarios.find((u) => u.role === 'master');
          if (defaultMaster) {
            setCurrentUser(defaultMaster);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultMaster));
          }
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login com e-mail e senha
  const loginWithEmail = async (email: string, _pass: string, roleHint?: UserRole, slugHint?: string): Promise<boolean> => {
    const usuarios = await api.getUsuarios();
    
    // Procura usuário por email ou por slug/role
    let found = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found && slugHint) {
      found = usuarios.find((u) => u.slug === slugHint);
    }

    if (!found && roleHint) {
      found = usuarios.find((u) => u.role === roleHint);
    }

    if (found) {
      setCurrentUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      return true;
    }

    return false;
  };

  // Login rápido de demonstração (1 clique)
  const loginAsDemo = async (role: UserRole, slug?: string) => {
    const usuarios = await api.getUsuarios();
    let found: Usuario | undefined;

    if (slug) {
      found = usuarios.find((u) => u.slug === slug);
    } else {
      found = usuarios.find((u) => u.role === role);
    }

    if (found) {
      setCurrentUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
    }
  };

  const switchCollaborator = async (slug: string) => {
    const colab = await api.getUsuarioBySlug(slug);
    if (colab) {
      setCurrentUser(colab);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(colab));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        loading,
        loginWithEmail,
        loginAsDemo,
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
