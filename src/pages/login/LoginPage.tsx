import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, User, Scissors, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Detecta intenção pela rota (/admin, /recepcao ou geral)
  const isReceptionLogin = location.pathname.includes('/recepcao');
  const isMasterLogin = location.pathname.includes('/admin');

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    isReceptionLogin ? 'recepcionista' : isMasterLogin ? 'master' : 'master'
  );

  const [email, setEmail] = useState<string>(
    isReceptionLogin
      ? 'recepcao@hypetatu.com.br'
      : isMasterLogin
      ? 'master@hypetatu.com.br'
      : 'master@hypetatu.com.br'
  );
  const [password, setPassword] = useState<string>('••••••••');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'master') setEmail('master@hypetatu.com.br');
    else if (role === 'recepcionista') setEmail('recepcao@hypetatu.com.br');
    else setEmail('danilinho@hypetatu.com.br');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await loginWithEmail(email, password, selectedRole);
      if (success) {
        showToast('Login realizado com sucesso!', 'success');
        if (selectedRole === 'master') navigate('/admin');
        else if (selectedRole === 'recepcionista') navigate('/recepcao');
        else navigate('/equipe/danilinho-barber');
      } else {
        await loginAsDemo(selectedRole);
        showToast('Bem-vindo ao Hype Tatu!', 'success');
        if (selectedRole === 'master') navigate('/admin');
        else if (selectedRole === 'recepcionista') navigate('/recepcao');
        else navigate('/equipe/danilinho-barber');
      }
    } catch (err) {
      showToast('Erro ao realizar login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole, slug?: string) => {
    await loginAsDemo(role, slug);
    showToast(`Acesso rápido ativado como ${role.toUpperCase()}!`, 'success');
    if (role === 'master') navigate('/admin');
    else if (role === 'recepcionista') navigate('/recepcao');
    else navigate(`/equipe/${slug || 'danilinho-barber'}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-[var(--text-primary)]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Logo Oficial */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Hype Tatu"
            className="h-14 w-auto object-contain drop-shadow-md"
          />
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-inter">
          Sistema de Gestão, Agenda de Salão & Estoque
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[var(--bg-surface)] backdrop-blur-xl py-8 px-6 sm:px-10 rounded-2xl shadow-soft border border-[var(--border)]">
          {/* Seletor de Perfil / Nível de Acesso */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)] mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect('master')}
              className={`py-2 px-1 text-[11px] font-oswald uppercase tracking-wider font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'master'
                  ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Master
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('recepcionista')}
              className={`py-2 px-1 text-[11px] font-oswald uppercase tracking-wider font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'recepcionista'
                  ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <User className="w-4 h-4" />
              Recepção
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('colaborador')}
              className={`py-2 px-1 text-[11px] font-oswald uppercase tracking-wider font-semibold rounded-lg transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'colaborador'
                  ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Equipe
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-oswald uppercase tracking-wider text-[#517566] font-semibold mb-1">
                E-mail de Acesso
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
              />
            </div>

            <div>
              <label className="block text-xs font-oswald uppercase tracking-wider text-[#517566] font-semibold mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] font-oswald uppercase tracking-wider font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {/* Atalhos Rápidos Demo (1 Clique) */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[10px] font-oswald font-semibold text-[#517566] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#517566]" />
              <span>Acesso Imediato para Demonstração:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('master')}
                className="p-2.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-all text-left font-inter"
              >
                👑 <strong className="font-semibold text-xs">Dono / Master</strong>
                <span className="block text-[10px] text-[var(--text-secondary)]">/admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('recepcionista')}
                className="p-2.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-all text-left font-inter"
              >
                📋 <strong className="font-semibold text-xs">Recepção</strong>
                <span className="block text-[10px] text-[var(--text-secondary)]">/recepcao</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('colaborador', 'danilinho-barber')}
                className="p-2.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-all text-left font-inter"
              >
                💈 <strong className="font-semibold text-xs">Danilinho Barber</strong>
                <span className="block text-[10px] text-[var(--text-secondary)]">/equipe/danilinho</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('colaborador', 'lucas-ink')}
                className="p-2.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-all text-left font-inter"
              >
                🖋️ <strong className="font-semibold text-xs">Lucas Ink (Tattoo)</strong>
                <span className="block text-[10px] text-[var(--text-secondary)]">/equipe/lucas-ink</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
