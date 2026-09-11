import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, CheckCheck, Plus, Smartphone, Sun, Moon, Palette, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme, AppTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const { notificacoes, unreadCount, markAsRead, markAllAsRead, requestPushPermission, pushPermission } = useNotifications();
  const { theme, setTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

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
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
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
          <span className="bg-[rgba(140,189,173,0.14)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[rgba(140,189,173,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            MASTER
          </span>
        );
      case 'recepcionista':
        return (
          <span className="bg-[rgba(140,189,173,0.14)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[rgba(140,189,173,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            RECEPCIONISTA
          </span>
        );
      case 'colaborador':
        return (
          <span className="bg-[rgba(81,117,102,0.15)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[rgba(81,117,102,0.25)] text-xs font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
            COLABORADOR
          </span>
        );
      default:
        return null;
    }
  };

  const themeOptions: { id: AppTheme; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      id: 'light',
      label: 'Fundo Branco',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      desc: 'Claro, nítido e iluminado',
      color: '#FFFFFF',
    },
    {
      id: 'dark-black',
      label: 'Fundo Preto',
      icon: <Moon className="w-4 h-4 text-zinc-300" />,
      desc: 'Preto puro (Pitch Black)',
      color: '#000000',
    },
    {
      id: 'dark-blue',
      label: 'Escuro Azulado',
      icon: <Palette className="w-4 h-4 text-[#8CBDAD]" />,
      desc: 'Slate Noturno (Padrão)',
      color: '#0B1118',
    },
  ];

  const currentThemeIcon = theme === 'light' ? (
    <Sun className="w-4 h-4 text-amber-500" />
  ) : theme === 'dark-black' ? (
    <Moon className="w-4 h-4 text-zinc-300" />
  ) : (
    <Palette className="w-4 h-4 text-[var(--accent)]" />
  );

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-header)] border-b border-[var(--border)] px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Lado Esquerdo: Marca & Papel */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img
          src="/logo.png"
          alt="Hype Tatu"
          className="h-7 sm:h-9 w-auto object-contain shrink-0"
        />
        <div className="hidden sm:block">
          <span className="text-[10px] sm:text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-widest block leading-tight font-semibold">
            PAINEL DE GESTÃO
          </span>
        </div>

        <div className="hidden md:block ml-1">
          {getRoleBadge()}
        </div>
      </div>

      {/* Lado Direito: Ações, Notificações & Perfil */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">

        {/* Botão "+ NOVO AGENDAMENTO" - Compacto no mobile */}
        <button
          onClick={handleNewAppointmentClick}
          className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-white transition-all shadow-sm active:scale-95"
          title="Criar novo agendamento no sistema"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">+ Novo Agendamento</span>
        </button>

        {/* Botão "INSTALAR APP" (Apenas desktop/tablet) */}
        <button
          onClick={handleInstallPWA}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold bg-[var(--bg-surface-alt)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] transition-all"
          title="Instalar App no Celular ou Desktop"
        >
          <Smartphone className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Instalar App</span>
        </button>

        {/* Seletor de Tema / Cores (Disponível no Admin e no Celular) */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] border border-[var(--border)] transition-colors"
            title="Escolher cor do tema (Branco, Preto ou Azulado)"
            aria-label="Escolher cor do tema"
          >
            {currentThemeIcon}
            <span className="hidden sm:inline text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-primary)]">
              {theme === 'light' ? 'Branco' : theme === 'dark-black' ? 'Preto' : 'Azulado'}
            </span>
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border)] py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Tema & Fundo de Tela
              </div>
              <div className="p-1 space-y-1">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors text-xs font-inter ${
                      theme === opt.id
                        ? 'bg-[var(--accent-bg)] text-[var(--text-primary)] font-semibold'
                        : 'hover:bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-[var(--border)] shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: opt.color }}
                      />
                      <div>
                        <div className="font-oswald uppercase tracking-wider text-xs">{opt.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{opt.desc}</div>
                      </div>
                    </div>
                    {theme === opt.id && <Check className="w-4 h-4 text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notificações Push Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] border border-[var(--border)] transition-colors"
            aria-label="Abrir notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EB5757] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
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
