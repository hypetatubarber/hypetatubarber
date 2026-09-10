import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notificacao } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationContextType {
  notificacoes: Notificacao[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
  pushPermission: NotificationPermission | 'unsupported';
  refreshNotificacoes: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const fetchNotificacoes = useCallback(async () => {
    if (!currentUser) {
      setNotificacoes([]);
      return;
    }
    try {
      const list = await api.getNotificacoes(currentUser.role === 'master' ? undefined : currentUser.id);
      setNotificacoes(list);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotificacoes();
    // Atualiza periodicamente para simular novas mensagens push
    const interval = setInterval(fetchNotificacoes, 12000);
    return () => clearInterval(interval);
  }, [fetchNotificacoes]);

  const markAsRead = async (id: string) => {
    await api.marcarNotificacaoLida(id);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unread = notificacoes.filter((n) => !n.lida);
    for (const n of unread) {
      await api.marcarNotificacaoLida(n.id);
    }
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    showToast('Todas as notificações marcadas como lidas', 'info');
  };

  // Solicita permissão para Web Push Notifications nativas
  const requestPushPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      showToast('Seu navegador não suporta notificações push.', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        showToast('Notificações push ativadas com sucesso!', 'success');

        // Se houver service worker, exibe notificação de boas-vindas
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            reg.showNotification('Hype Tatu — Notificações Ativas', {
              body: 'Você receberá avisos imediatos quando novos agendamentos forem feitos para você!',
              icon: '/favicon.svg',
              badge: '/favicon.svg',
            });
          }
        }
        return true;
      } else {
        showToast('Permissão de notificações não foi concedida.', 'warning');
        return false;
      }
    } catch (err) {
      console.error('Erro ao pedir permissão de push:', err);
      return false;
    }
  };

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificationContext.Provider
      value={{
        notificacoes,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        requestPushPermission,
        pushPermission,
        refreshNotificacoes: fetchNotificacoes,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
