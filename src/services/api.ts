/**
 * Unified API Service Layer
 * Fornece métodos assíncronos para todas as operações do Hype Tatu.
 * Alterna dinamicamente entre Supabase (quando configurado) e MockDatabase (modo demo offline).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MockDatabase } from './mockData';
import { evolutionApi } from './evolutionApi';
import { Usuario, Cliente, CategoriaServico, Servico, Agendamento, Produto, UsoProduto, MovimentacaoEstoque, Notificacao, StatusAgendamento, Conversa, Mensagem } from '../types';

export const api = {
  // ==========================================================================
  // USUÁRIOS & COLABORADORES
  // ==========================================================================
  async getUsuarios(): Promise<Usuario[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('usuarios').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getUsuarios();
  },

  async getColaboradores(): Promise<Usuario[]> {
    const users = await this.getUsuarios();
    return users.filter(u => u.role === 'colaborador' && u.status === 'ativo');
  },

  async getUsuarioBySlug(slug: string): Promise<Usuario | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('usuarios').select('*').eq('slug', slug).single();
      if (error) return null;
      return data;
    }
    return MockDatabase.getUsuarioBySlug(slug) || null;
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('usuarios').upsert(usuario).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.saveUsuario(usuario);
  },

  // ==========================================================================
  // CLIENTES (CRM)
  // ==========================================================================
  async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('clientes').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getClientes();
  },

  async saveCliente(cliente: Cliente): Promise<Cliente> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('clientes').upsert(cliente).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.saveCliente(cliente);
  },

  // ==========================================================================
  // CATEGORIAS & SERVIÇOS
  // ==========================================================================
  async getCategorias(): Promise<CategoriaServico[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('categorias_servico').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getCategorias();
  },

  async saveCategoria(cat: CategoriaServico): Promise<CategoriaServico> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('categorias_servico').upsert(cat).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.saveCategoria(cat);
  },

  async getServicos(): Promise<Servico[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('servicos')
        .select('*, categoria:categorias_servico(*)')
        .order('nome');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getServicos();
  },

  async saveServico(servico: Servico): Promise<Servico> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('servicos').upsert(servico).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.saveServico(servico);
  },

  // ==========================================================================
  // AGENDAMENTOS (CALENDÁRIO & SALÃO)
  // ==========================================================================
  async getAgendamentos(): Promise<Agendamento[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:clientes(*),
          colaborador:usuarios(*),
          servico:servicos(*, categoria:categorias_servico(*))
        `)
        .order('hora_inicio');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getAgendamentos();
  },

  async getAgendamentosByDate(dateStr: string): Promise<Agendamento[]> {
    const list = await this.getAgendamentos();
    return list.filter(a => a.data === dateStr);
  },

  async getAgendamentosByColaborador(colaboradorId: string): Promise<Agendamento[]> {
    const list = await this.getAgendamentos();
    return list.filter(a => a.colaborador_id === colaboradorId);
  },

  // Validação em tempo real contra conflitos de horário
  async checkConflitoHorario(colaboradorId: string, data: string, horaInicio: string, horaFim: string, ignorarAgendamentoId?: string): Promise<boolean> {
    const agendamentos = await this.getAgendamentos();
    
    return agendamentos.some(ag => {
      if (ag.id === ignorarAgendamentoId) return false;
      if (ag.colaborador_id !== colaboradorId) return false;
      if (ag.data !== data) return false;
      if (ag.status === 'cancelado') return false;

      // Verifica sobreposição de horário
      const agInicio = ag.hora_inicio;
      const agFim = ag.hora_fim;

      return (horaInicio < agFim && horaFim > agInicio);
    });
  },

  async saveAgendamento(agendamento: Agendamento): Promise<Agendamento> {
    // 1. Valida conflito antes de salvar
    const hasConflict = await this.checkConflitoHorario(
      agendamento.colaborador_id,
      agendamento.data,
      agendamento.hora_inicio,
      agendamento.hora_fim,
      agendamento.id
    );

    if (hasConflict) {
      throw new Error(`Conflito de horário! O profissional já possui atendimento entre ${agendamento.hora_inicio} e ${agendamento.hora_fim}.`);
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('agendamentos').upsert(agendamento).select().single();
      if (error) throw error;
      return data;
    }

    const saved = MockDatabase.saveAgendamento(agendamento);
    return saved;
  },

  async updateAgendamentoStatus(id: string, status: StatusAgendamento): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id);
      if (error) throw error;
      return;
    }
    MockDatabase.updateAgendamentoStatus(id, status);
  },

  // ==========================================================================
  // ESTOQUE & CONSUMO DE MATERIAIS
  // ==========================================================================
  async getProdutos(): Promise<Produto[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('produtos').select('*').order('nome');
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getProdutos();
  },

  async saveProduto(produto: Produto): Promise<Produto> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('produtos').upsert(produto).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.saveProduto(produto);
  },

  async registrarEntradaEstoque(produtoId: string, quantidade: number, motivo: string, usuarioId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      // No Supabase, atualiza produto e insere movimentacao
      const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', produtoId).single();
      if (prod) {
        await supabase.from('produtos').update({ estoque_atual: prod.estoque_atual + quantidade }).eq('id', produtoId);
        await supabase.from('movimentacoes_estoque').insert({
          produto_id: produtoId,
          tipo: 'entrada',
          quantidade,
          motivo,
          usuario_id: usuarioId,
        });
      }
      return;
    }
    MockDatabase.addEntradaEstoque(produtoId, quantidade, motivo, usuarioId);
  },

  async registrarUsoProduto(uso: UsoProduto): Promise<UsoProduto> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('uso_produtos').insert(uso).select().single();
      if (error) throw error;
      return data;
    }
    return MockDatabase.registrarUsoProduto(uso);
  },

  async getUsoProdutos(): Promise<UsoProduto[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('uso_produtos')
        .select('*, produto:produtos(*), colaborador:usuarios(*)')
        .order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getUsoProdutos();
  },

  async getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*, produto:produtos(*), usuario:usuarios(*)')
        .order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getMovimentacoes();
  },

  // ==========================================================================
  // NOTIFICAÇÕES & PUSH
  // ==========================================================================
  async getNotificacoes(usuarioId?: string): Promise<Notificacao[]> {
    if (isSupabaseConfigured()) {
      let query = supabase.from('notificacoes').select('*').order('criado_em', { ascending: false });
      if (usuarioId) query = query.eq('usuario_id', usuarioId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
    return MockDatabase.getNotificacoes(usuarioId);
  },

  async marcarNotificacaoLida(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      return;
    }
    MockDatabase.marcarNotificacaoLida(id);
  },

  // Disparo de notificação Web Push (usa Service Worker nativo e/ou Edge Function)
  async sendPushNotification(usuarioId: string, titulo: string, mensagem: string, url?: string): Promise<void> {
    console.log('[API Push] Disparando notificação:', { usuarioId, titulo, mensagem });

    // Salva na tabela local/mock
    MockDatabase.addNotificacao({
      id: 'notif-' + Date.now(),
      usuario_id: usuarioId,
      titulo,
      mensagem,
      lida: false,
      link: url || '/equipe',
      criado_em: new Date().toISOString()
    });

    // Se suportar notificação no navegador e houver permissão concedida, mostra alerta nativo
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg && reg.showNotification) {
          reg.showNotification(titulo, {
            body: mensagem,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: { url: url || '/equipe' }
          });
        }
      } catch (e) {
        console.warn('Erro ao disparar notificação local:', e);
      }
    }
  },

  // ==========================================================================
  // CONVERSAS & WHATSAPP (EVOLUTION API)
  // ==========================================================================
  async getConversas(): Promise<Conversa[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('conversas')
        .select('*, cliente:clientes(*)')
        .order('ultima_mensagem_em', { ascending: false });
      if (error) {
        console.warn('Erro ao buscar conversas no Supabase, usando local:', error);
        return MockDatabase.getConversas();
      }
      return data || [];
    }
    return MockDatabase.getConversas();
  },

  async getConversaById(id: string): Promise<Conversa | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('conversas')
        .select('*, cliente:clientes(*)')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return MockDatabase.getConversaById(id) || null;
      return data;
    }
    return MockDatabase.getConversaById(id) || null;
  },

  async getMensagens(conversaId: string): Promise<Mensagem[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('criado_em', { ascending: true });
      if (error) {
        console.warn('Erro ao buscar mensagens no Supabase, usando local:', error);
        return MockDatabase.getMensagens(conversaId);
      }
      return data || [];
    }
    return MockDatabase.getMensagens(conversaId);
  },

  async enviarMensagem(conversaId: string, numero: string, conteudo: string): Promise<Mensagem> {
    const msgId = 'msg-' + Date.now();
    const now = new Date().toISOString();
    
    // Objeto da nova mensagem enviada
    const novaMensagem: Mensagem = {
      id: msgId,
      conversa_id: conversaId,
      numero,
      conteudo,
      direcao: 'enviada',
      status: 'enviado',
      criado_em: now,
    };

    // 1. Salva localmente ou no Supabase imediatamente (Otimista)
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('mensagens').insert(novaMensagem);
        await supabase.from('conversas').update({
          ultima_mensagem: conteudo,
          ultima_mensagem_em: now,
          atualizado_em: now,
        }).eq('id', conversaId);
      } catch (e) {
        console.warn('Erro ao persistir mensagem no Supabase:', e);
      }
    }
    MockDatabase.saveMensagem(novaMensagem);

    // 2. Dispara via Evolution API no WhatsApp
    try {
      await evolutionApi.sendWhatsAppMessage(numero, conteudo);
    } catch (err) {
      console.error('[API WhatsApp] Falha ao enviar pela Evolution API:', err);
    }

    return novaMensagem;
  },

  async marcarConversaLida(conversaId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('conversas').update({ nao_lidas: 0 }).eq('id', conversaId);
      } catch (e) {
        console.warn('Erro ao marcar conversa como lida no Supabase:', e);
      }
    }
    MockDatabase.marcarConversaLida(conversaId);
  },

  async getTotalNaoLidas(): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('conversas').select('nao_lidas');
        if (!error && data) {
          return data.reduce((acc, c) => acc + (c.nao_lidas || 0), 0);
        }
      } catch {
        // fallback
      }
    }
    return MockDatabase.getTotalNaoLidas();
  },

  async receberMensagem(
    numero: string,
    nomeRemetente: string,
    conteudo: string,
    messageId?: string,
    timestamp?: string
  ): Promise<{ conversa: Conversa; mensagem: Mensagem }> {
    const now = timestamp || new Date().toISOString();

    // Atualiza MockDatabase
    const conversaMock = MockDatabase.salvarOuAtualizarConversa(numero, nomeRemetente, conteudo);
    const msgMock = MockDatabase.saveMensagem({
      id: messageId || 'msg-' + Date.now(),
      conversa_id: conversaMock.id,
      numero,
      conteudo,
      direcao: 'recebida',
      status: 'entregue',
      criado_em: now,
    });

    if (isSupabaseConfigured()) {
      try {
        // Busca ou cria no Supabase
        const cleanNum = numero.replace(/\D/g, '');
        const { data: convData } = await supabase
          .from('conversas')
          .select('*')
          .or(`numero.eq.${numero},numero.eq.${cleanNum}`)
          .maybeSingle();

        let convId = convData?.id;

        if (!convData) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('id, nome, avatar_url')
            .ilike('telefone', `%${cleanNum.slice(-8)}%`)
            .maybeSingle();

          const { data: novaConv } = await supabase
            .from('conversas')
            .insert({
              numero,
              nome: nomeRemetente || cliente?.nome || `WhatsApp ${numero.slice(-4)}`,
              cliente_id: cliente?.id,
              avatar_url: cliente?.avatar_url,
              ultima_mensagem: conteudo,
              ultima_mensagem_em: now,
              nao_lidas: 1,
              status: 'ativa',
            })
            .select()
            .single();

          if (novaConv) convId = novaConv.id;
        } else {
          await supabase
            .from('conversas')
            .update({
              ultima_mensagem: conteudo,
              ultima_mensagem_em: now,
              nao_lidas: (convData.nao_lidas || 0) + 1,
              atualizado_em: now,
            })
            .eq('id', convData.id);
        }

        if (convId) {
          await supabase.from('mensagens').insert({
            id: messageId || 'msg-' + Date.now(),
            conversa_id: convId,
            numero,
            conteudo,
            direcao: 'recebida',
            status: 'entregue',
            criado_em: now,
          });
        }
      } catch (err) {
        console.warn('Erro ao salvar mensagem recebida no Supabase:', err);
      }
    }

    return { conversa: conversaMock, mensagem: msgMock };
  },
};
