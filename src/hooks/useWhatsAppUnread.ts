import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useWhatsAppUnread() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchCount = async () => {
    try {
      const count = await api.getTotalNaoLidas();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCount();

    const handleUpdate = () => {
      fetchCount();
    };

    window.addEventListener('hype_conversas_updated', handleUpdate);
    window.addEventListener('hype_mensagem_received', handleUpdate);

    return () => {
      window.removeEventListener('hype_conversas_updated', handleUpdate);
      window.removeEventListener('hype_mensagem_received', handleUpdate);
    };
  }, []);

  return unreadCount;
}
