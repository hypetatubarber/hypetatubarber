/**
 * Supabase Realtime Synchronization Manager — Hype Tatu
 * Conecta ao canal Realtime do Supabase e sincroniza em tempo real
 * agendamentos, clientes, estoque, conversas, mensagens e notificações.
 */

import { supabase, isSupabaseConfigured } from './supabase';

let activeChannel: any = null;

export const initRealtimeSync = () => {
  if (!isSupabaseConfigured() || activeChannel) {
    return;
  }

  try {
    activeChannel = supabase
      .channel('hype-tatu-realtime-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload: any) => {
          const { table, eventType, new: newRecord, old: oldRecord } = payload;
          console.log(`[Supabase Realtime] ${table} -> ${eventType}`);

          // Dispara evento geral de banco
          window.dispatchEvent(
            new CustomEvent('hype_realtime_change', {
              detail: { table, eventType, new: newRecord, old: oldRecord },
            })
          );

          // Dispara evento específico por tabela
          window.dispatchEvent(
            new CustomEvent(`hype_${table}_changed`, {
              detail: { eventType, new: newRecord, old: oldRecord },
            })
          );

          // Disparos customizados para componentes de UI
          if (table === 'agendamentos') {
            window.dispatchEvent(new CustomEvent('hype_agendamentos_changed', { detail: payload }));
          }

          if (table === 'produtos' || table === 'movimentacoes_estoque') {
            window.dispatchEvent(new CustomEvent('hype_produtos_changed', { detail: payload }));
            window.dispatchEvent(new CustomEvent('hype_movimentacoes_estoque_changed', { detail: payload }));
          }

          if (table === 'uso_produtos') {
            window.dispatchEvent(new CustomEvent('hype_uso_produtos_changed', { detail: payload }));
            window.dispatchEvent(new CustomEvent('hype_produtos_changed', { detail: payload }));
          }

          if (table === 'clientes') {
            window.dispatchEvent(new CustomEvent('hype_clientes_changed', { detail: payload }));
          }

          if (table === 'servicos' || table === 'categorias_servico') {
            window.dispatchEvent(new CustomEvent('hype_servicos_changed', { detail: payload }));
            window.dispatchEvent(new CustomEvent('hype_categorias_servico_changed', { detail: payload }));
          }

          if (table === 'conversas') {
            window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: payload }));
          }

          if (table === 'mensagens') {
            window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: payload }));
            if (eventType === 'INSERT') {
              window.dispatchEvent(new CustomEvent('hype_mensagem_received', { detail: newRecord }));
            }
          }

          if (table === 'notificacoes') {
            window.dispatchEvent(new CustomEvent('hype_notificacoes_changed', { detail: payload }));
          }
        }
      )
      .subscribe((status: string) => {
        console.log('[Supabase Realtime] Status da inscrição:', status);
      });
  } catch (err) {
    console.warn('[Supabase Realtime] Falha ao iniciar Realtime channel:', err);
  }
};

export const stopRealtimeSync = () => {
  if (activeChannel && isSupabaseConfigured()) {
    try {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    } catch (e) {
      console.warn('[Supabase Realtime] Erro ao remover canal:', e);
    }
  }
};
