import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Tag,
  Users,
  Package,
  Contact,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Bell,
  Sparkles,
  MessageSquare,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWhatsAppUnread } from '../../hooks/useWhatsAppUnread';

export const Sidebar: React.FC = () => {
  const { role, currentUser } = useAuth();
  const whatsAppUnread = useWhatsAppUnread();

  const getLinks = () => {
    if (role === 'master') {
      return [
        { to: '/admin', label: 'Dashboard Geral', icon: LayoutDashboard, end: true },
        { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
        { to: '/admin/conversas', label: 'Conversas', icon: MessageSquare, badge: whatsAppUnread },
        { to: '/admin/clientes', label: 'Clientes', icon: Contact },
        { to: '/admin/servicos', label: 'Serviços & Preços', icon: Tag },
        { to: '/admin/equipe', label: 'Colaboradores', icon: Users },
        { to: '/admin/estoque', label: 'Controle de Estoque', icon: Package },
        { to: '/admin/relatorios', label: 'Consumo & Relatórios', icon: BarChart3 },
        { to: '/admin/configuracoes/whatsapp', label: 'WhatsApp & Conexão', icon: Smartphone },
      ];
    }

    if (role === 'recepcionista') {
      return [
        { to: '/recepcao', label: 'Dashboard Geral', icon: LayoutDashboard, end: true },
        { to: '/recepcao/conversas', label: 'Conversas', icon: MessageSquare, badge: whatsAppUnread },
        { to: '/recepcao/clientes', label: 'Clientes', icon: Contact },
        { to: '/recepcao/estoque', label: 'Consulta de Estoque', icon: Package },
      ];
    }

    // Colaborador
    return [
      { to: '/equipe', label: 'Hoje em Destaque', icon: CheckCircle2, end: true },
      { to: '/equipe/agenda', label: 'Minha Agenda', icon: Calendar },
      { to: '/equipe/ganhos', label: 'Meus Ganhos', icon: DollarSign },
      { to: '/equipe/materiais', label: 'Registrar Material', icon: ClipboardList },
      { to: '/equipe/notificacoes', label: 'Notificações', icon: Bell },
    ];
  };

  const links = getLinks();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-sidebar)] text-[var(--sidebar-text)] border-r border-[var(--border-sidebar)] shrink-0 transition-colors">
      {/* Informações do Estúdio & Logo Oficial */}
      <div className="p-5 border-b border-[var(--border-sidebar)]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Hype Tatu"
            className="h-9 w-auto object-contain max-w-[140px]"
          />
          <div>
            <div className="text-xs text-[var(--sidebar-text-muted)] font-inter">Lauro de Freitas — BA</div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-oswald uppercase tracking-[0.08em] font-semibold text-[var(--sidebar-accent)]">
          Navegação Principal
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-xs font-oswald uppercase tracking-wider font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--sidebar-accent)]/15 text-[var(--sidebar-accent)] border-l-[3px] border-[var(--sidebar-accent)] rounded-r-lg rounded-l-none'
                    : 'text-[var(--sidebar-text)] hover:text-white hover:bg-white/10 rounded-lg'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--sidebar-accent)]' : 'text-[var(--sidebar-text-muted)]'}`} />
                  <span className="truncate flex-1">{link.label}</span>
                  {link.badge && link.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--sidebar-accent)] text-[#0B0E11] text-[10px] font-black leading-none shrink-0 shadow-sm">
                      {link.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar (PWA & Notificações) */}
      <div className="p-4 border-t border-[var(--border-sidebar)]">
        <div className="bg-white/[0.04] rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-[var(--sidebar-accent)] text-xs font-oswald uppercase tracking-wider font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PWA & Notificações</span>
          </div>
          <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-relaxed font-inter">
            Instale o app na tela inicial para receber notificações em tempo real de novos agendamentos.
          </p>
        </div>
      </div>
    </aside>
  );
};
