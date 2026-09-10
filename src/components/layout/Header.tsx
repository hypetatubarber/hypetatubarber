import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, CheckCheck, Smartphone, Sparkles, User, ShieldCheck, Scissors, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser, role, logout, loginAsDemo } = useAuth();
  const { notificacoes, unreadCount, markAsRead, markAllAsRead, requestPushPermission, pushPermission } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Captura evento de instalação PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fechar popovers ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar no celular: toque no botão Compartilhar do navegador e selecione "Adicionar à Tela de Início".');
    }
  };

  const handleNewAppointmentClick = () => {
    window.dispatchEvent(new CustomEvent('open-appointment-modal'));
    if (role === 'master' && !window.location.pathname.startsWith('/admin')) {
      navigate('/admin');
    } else if (role === 'recepcionista' && !window.location.pathname.startsWith('/recepcao')) {
      navigate('/recepcao');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'master':
        return (
          <span className="bg-[rgba(140,189,173,0.12)] text-[#517566] border border-[rgba(140,189,173,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            MASTER
          </span>
        );
      case 'recepcionista':
        return (
          <span className="bg-[rgba(140,189,173,0.12)] text-[#517566] border border-[rgba(140,189,173,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            RECEPCIONISTA
          </span>
        );
      case 'colaborador':
        return (
          <span className="bg-[rgba(81,117,102,0.15)] text-[#517566] border border-[rgba(81,117,102,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            COLABORADOR
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#DDE1E7] px-4 sm:px-6 h-16 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Lado Esquerdo: Marca & Papel */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Hype Tatu"
            className="h-8 md:h-9 w-auto object-contain max-w-[150px] md:hidden"
          />
          <div>
            <span className="text-xs text-[#8A96A3] font-inter uppercase tracking-wider block leading-tight">
              PAINEL DE GESTÃO
            </span>
          </div>
        </div>

        <div className="hidden sm:block ml-2">
          {getRoleBadge()}
        </div>
      </div>

      {/* Lado Direito: Ações, Tema, Notificações & Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão de Troca Rápida de Perfil (Demo Tester) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] transition-colors border border-[var(--border)]"
            title="Alternar entre perfis para teste"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden md:inline">Trocar Perfil</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border)] py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-oswald font-semibold text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border)]">
                Acessar como:
              </div>
              <button
                onClick={() => { loginAsDemo('master'); navigate('/admin'); setShowRoleSwitcher(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface-alt)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                <div>
                  <div className="font-medium text-xs text-[var(--text-primary)]">Carlos Henrique (Master)</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Acesso total /admin</div>
                </div>
              </button>
              <button
                onClick={() => { loginAsDemo('recepcionista'); navigate('/recepcao'); setShowRoleSwitcher(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface-alt)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <User className="w-4 h-4 text-[var(--accent)]" />
                <div>
                  <div className="font-medium text-xs text-[var(--text-primary)]">Juliana Souza (Recepção)</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Agenda geral /recepcao</div>
                </div>
              </button>
              <div className="px-3 py-1 text-[10px] font-oswald font-semibold text-[var(--accent)] uppercase tracking-widest border-t border-[var(--border)] mt-1">
                Colaboradores:
              </div>
              <button
                onClick={() => { loginAsDemo('colaborador', 'danilinho-barber'); navigate('/equipe/danilinho-barber'); setShowRoleSwitcher(false); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-surface-alt)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs">Danilinho Barber</span>
              </button>
              <button
                onClick={() => { loginAsDemo('colaborador', 'lucas-ink'); navigate('/equipe/lucas-ink'); setShowRoleSwitcher(false); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-surface-alt)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs">Lucas Ink (Tatuador)</span>
              </button>
              <button
                onClick={() => { loginAsDemo('colaborador', 'maya-ferreira'); navigate('/equipe/maya-ferreira'); setShowRoleSwitcher(false); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-surface-alt)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs">Maya Ferreira (Tatuadora)</span>
              </button>
            </div>
          )}
        </div>

        {/* Botão "+ NOVO AGENDAMENTO" */}
        <button
          onClick={handleNewAppointmentClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-bold bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-[#FFFFFF] transition-all shadow-sm"
          title="Criar novo agendamento no sistema"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Novo Agendamento</span>
        </button>

        {/* Botão "INSTALAR APP" */}
        <button
          onClick={handleInstallPWA}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold bg-[#1A1F25] hover:bg-[#252C34] text-[#F2F5F7] transition-all"
          title="Instalar App no Celular ou Desktop"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>

        {/* Notificações Push Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors border border-transparent hover:border-[var(--border)]"
            aria-label="Abrir notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#EB5757] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="font-oswald text-xs uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                    Notificações
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 font-inter"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar todas lidas
                  </button>
                )}
              </div>

              {pushPermission !== 'granted' && (
                <div className="p-3 mx-3 my-2 bg-[var(--accent-bg)] border border-[var(--accent)]/30 rounded-xl text-xs">
                  <p className="font-medium text-[var(--text-primary)] mb-1">Deseja receber avisos no celular?</p>
                  <button
                    onClick={requestPushPermission}
                    className="w-full py-1.5 px-3 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-white font-oswald text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors"
                  >
                    Ativar Notificações Push
                  </button>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                {notificacoes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)] font-inter">
                    Nenhuma notificação por enquanto.
                  </div>
                ) : (
                  notificacoes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-left transition-colors cursor-pointer flex gap-3 ${
                        n.lida ? 'bg-[var(--bg-surface)] opacity-70' : 'bg-[var(--accent-bg)] hover:opacity-90'
                      }`}
                    >
                      <div className="mt-1">
                        <div className={`w-2 h-2 rounded-full ${n.lida ? 'bg-[var(--text-muted)]' : 'bg-[var(--accent)]'}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-oswald uppercase tracking-wider text-[var(--text-primary)]">{n.titulo}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed font-inter">{n.mensagem}</p>
                        <span className="text-[10px] text-[var(--text-muted)] mt-1 block font-inter">
                          {new Date(n.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Informações do Usuário & Sair */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <img
            src={currentUser?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={currentUser?.nome}
            className="w-8 h-8 rounded-full object-cover border border-[var(--accent)]/30"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[120px] font-inter">{currentUser?.nome}</div>
            <div className="text-[10px] text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider">{role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-[var(--text-muted)] hover:text-[#EB5757] rounded-lg hover:bg-[var(--bg-surface-alt)] transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
