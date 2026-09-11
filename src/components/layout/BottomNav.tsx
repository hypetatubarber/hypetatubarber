import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Contact,
  CheckCircle2,
  ClipboardList,
  Bell,
  Tag,
  MessageSquare,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useWhatsAppUnread } from '../../hooks/useWhatsAppUnread';

export const BottomNav: React.FC = () => {
  const { role, currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const whatsAppUnread = useWhatsAppUnread();

  const getMobileLinks = () => {
    if (role === 'master') {
      return [
        { to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true },
        { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
        { to: '/admin/conversas', label: 'Conversas', icon: MessageSquare, badge: whatsAppUnread },
        { to: '/admin/clientes', label: 'Clientes', icon: Contact },
      ];
    }

    if (role === 'recepcionista') {
      return [
        { to: '/recepcao', label: 'Painel', icon: LayoutDashboard, end: true },
        { to: '/recepcao/conversas', label: 'Conversas', icon: MessageSquare, badge: whatsAppUnread },
        { to: '/recepcao/clientes', label: 'Clientes', icon: Contact },
        { to: '/recepcao/estoque', label: 'Estoque', icon: Package },
      ];
    }

    // Colaborador
    return [
      { to: '/equipe', label: 'Hoje', icon: CheckCircle2, end: true },
      { to: '/equipe/agenda', label: 'Agenda', icon: Calendar },
      { to: '/equipe/ganhos', label: 'Ganhos', icon: DollarSign },
      { to: '/equipe/notificacoes', label: 'Avisos', icon: Bell, badge: unreadCount },
    ];
  };

  const links = getMobileLinks();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-header)]/95 backdrop-blur-xl border-t border-[var(--border)] px-2 py-1.5 shadow-2xl safe-area-bottom transition-colors">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative font-oswald uppercase tracking-wider ${
                  isActive
                    ? 'text-[var(--accent)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge && link.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#EB5757] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {link.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
