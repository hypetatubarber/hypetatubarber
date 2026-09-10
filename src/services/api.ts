/**
 * Unified API Service Layer
 * Fornece métodos assíncronos para todas as operações do Hype Tatu.
 * Alterna dinamicamente entre Supabase (quando configurado) e MockDatabase (modo demo offline).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MockDatabase } from './mockData';
import { evolutionApi } from './evolutionApi';
import { Usuario, Cliente, CategoriaServico, Servico, Agendamento, Produto, UsoProduto, MovimentacaoEstoque, Notificacao, StatusAgendamento, Conversa, Mensagem, SolicitacaoRotativo } from '../types';

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

  async changeUserPassword(targetUserId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
    }

    if (isSupabaseConfigured()) {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const currentUser = session?.user;

      // Se for o próprio usuário logado alterando sua própria senha:
      if (currentUser && currentUser.id === targetUserId) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return;
      }

      // Se for o Master alterando a senha de outro usuário:
      const token = session?.access_token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetUserId, newPassword }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ao alterar senha do usuário (${res.status}).`);
      }

      return;
    }

    // Modo offline/demo
    console.log(`[Demo Mode] Senha do usuário ${targetUserId} alterada.`);
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
      const { data: prod, error: prodErr } = await supabase.from('produtos').select('estoque_atual').eq('id', produtoId).single();
      if (prodErr) throw prodErr;
      if (prod) {
        const novoEstoque = Number(prod.estoque_atual) + Number(quantidade);
        const { error: updErr } = await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produtoId);
        if (updErr) throw updErr;

        const { error: movErr } = await supabase.from('movimentacoes_estoque').insert({
          produto_id: produtoId,
          tipo: 'entrada',
          quantidade,
          motivo,
          usuario_id: usuarioId,
        });
        if (movErr) throw movErr;
      }
      return;
    }
    MockDatabase.addEntradaEstoque(produtoId, quantidade, motivo, usuarioId);
  },

  async registrarUsoProduto(uso: UsoProduto): Promise<UsoProduto> {
    if (isSupabaseConfigured()) {
      // 1. Registra o uso
      const { data, error } = await supabase.from('uso_produtos').insert(uso).select().single();
      if (error) {
        console.error('[API Supabase] Erro ao registrar uso do produto:', error);
        throw error;
      }

      // 2. Deduz o estoque do produto e registra movimentação de saída
      try {
        const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', uso.produto_id).single();
        if (prod) {
          const novoEstoque = Math.max(0, Number(prod.estoque_atual) - Number(uso.quantidade));
          await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', uso.produto_id);
          await supabase.from('movimentacoes_estoque').insert({
            produto_id: uso.produto_id,
            tipo: 'saida',
            quantidade: uso.quantidade,
            motivo: `Uso em atendimento (${uso.data})`,
            usuario_id: uso.colaborador_id,
          });
        }
      } catch (stockErr) {
        console.warn('[API Supabase] Erro ao debitar estoque após uso:', stockErr);
      }

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
      if (error) {
        console.error('[API Supabase] Erro ao buscar uso de produtos:', error);
        throw error;
      }
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
      if (error) {
        console.error('[API Supabase] Erro ao buscar movimentações de estoque:', error);
        throw error;
      }
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
      if (error) {
        console.error('[API Supabase] Erro ao buscar notificações:', error);
        throw error;
      }
      return data || [];
    }
    return MockDatabase.getNotificacoes(usuarioId);
  },

  async marcarNotificacaoLida(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      if (error) throw error;
      return;
    }
    MockDatabase.marcarNotificacaoLida(id);
  },

  // Disparo de notificação Web Push e persistência no banco
  async sendPushNotification(usuarioId: string, titulo: string, mensagem: string, url?: string): Promise<void> {
    console.log('[API Push] Disparando notificação:', { usuarioId, titulo, mensagem });
    const notifId = 'notif-' + Date.now();
    const linkUrl = url || '/equipe';

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notificacoes').insert({
          id: notifId,
          usuario_id: usuarioId,
          titulo,
          mensagem,
          link: linkUrl,
          lida: false,
          criado_em: new Date().toISOString(),
        });
      } catch (e) {
        console.error('[API Supabase] Erro ao salvar notificação:', e);
      }
    } else {
      MockDatabase.addNotificacao({
        id: notifId,
        usuario_id: usuarioId,
        titulo,
        mensagem,
        lida: false,
        link: linkUrl,
        criado_em: new Date().toISOString(),
      });
    }

    // Se suportar notificação no navegador e houver permissão concedida, mostra alerta nativo
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg && reg.showNotification) {
          reg.showNotification(titulo, {
            body: mensagem,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            data: { url: linkUrl },
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
        console.error('[API Supabase] Erro ao buscar conversas:', error);
        throw error;
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
      if (error) {
        console.error('[API Supabase] Erro ao buscar conversa por id:', error);
        throw error;
      }
      return data || null;
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
        console.error('[API Supabase] Erro ao buscar mensagens:', error);
        throw error;
      }
      return data || [];
    }
    return MockDatabase.getMensagens(conversaId);
  },

  async enviarMensagem(conversaId: string, numero: string, conteudo: string): Promise<Mensagem> {
    const msgId = 'msg-' + Date.now();
    const now = new Date().toISOString();

    const novaMensagem: Mensagem = {
      id: msgId,
      conversa_id: conversaId,
      numero,
      conteudo,
      direcao: 'enviada',
      status: 'enviado',
      criado_em: now,
    };

    if (isSupabaseConfigured()) {
      const { error: insErr } = await supabase.from('mensagens').insert(novaMensagem);
      if (insErr) {
        console.error('[API Supabase] Erro ao persistir mensagem enviada:', insErr);
        throw insErr;
      }

      await supabase
        .from('conversas')
        .update({
          ultima_mensagem: conteudo,
          ultima_mensagem_em: now,
          atualizado_em: now,
        })
        .eq('id', conversaId);
    } else {
      MockDatabase.saveMensagem(novaMensagem);
    }

    // Dispara via Evolution API no WhatsApp
    try {
      await evolutionApi.sendWhatsAppMessage(numero, conteudo);
    } catch (err) {
      console.error('[API WhatsApp] Falha ao enviar pela Evolution API:', err);
    }

    return novaMensagem;
  },

  async marcarConversaLida(conversaId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('conversas').update({ nao_lidas: 0 }).eq('id', conversaId);
      if (error) {
        console.error('[API Supabase] Erro ao marcar conversa como lida:', error);
      }
      return;
    }
    MockDatabase.marcarConversaLida(conversaId);
  },

  async getTotalNaoLidas(): Promise<number> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('conversas').select('nao_lidas');
      if (error) {
        console.error('[API Supabase] Erro ao buscar contagem de não lidas:', error);
        throw error;
      }
      return (data || []).reduce((acc, c) => acc + (c.nao_lidas || 0), 0);
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
    const finalMsgId = messageId || 'msg-' + Date.now();

    if (isSupabaseConfigured()) {
      const cleanNum = numero.replace(/\D/g, '');
      const { data: convData, error: convErr } = await supabase
        .from('conversas')
        .select('*')
        .or(`numero.eq.${numero},numero.eq.${cleanNum}`)
        .maybeSingle();

      if (convErr) {
        console.error('[API Supabase] Erro ao buscar conversa existente:', convErr);
        throw convErr;
      }

      let convId = convData?.id;
      let finalConversa: Conversa;

      if (!convData) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('id, nome, avatar_url')
          .ilike('telefone', `%${cleanNum.slice(-8)}%`)
          .maybeSingle();

        const novaConversa = {
          id: 'conv-' + (cleanNum || Date.now()),
          numero,
          nome: nomeRemetente || cliente?.nome || `WhatsApp ${numero.slice(-4)}`,
          cliente_id: cliente?.id,
          avatar_url: cliente?.avatar_url,
          ultima_mensagem: conteudo,
          ultima_mensagem_em: now,
          atualizado_em: now,
          nao_lidas: 1,
          status: 'ativa',
        };

        const { data: convCreated, error: createErr } = await supabase
          .from('conversas')
          .insert(novaConversa)
          .select()
          .single();

        if (createErr) {
          console.error('[API Supabase] Erro ao criar nova conversa:', createErr);
          throw createErr;
        }

        convId = convCreated.id;
        finalConversa = convCreated;
      } else {
        const { data: convUpdated, error: updateErr } = await supabase
          .from('conversas')
          .update({
            ultima_mensagem: conteudo,
            ultima_mensagem_em: now,
            atualizado_em: now,
            nao_lidas: (convData.nao_lidas || 0) + 1,
          })
          .eq('id', convData.id)
          .select()
          .single();

        if (updateErr) {
          console.error('[API Supabase] Erro ao atualizar conversa existente:', updateErr);
          throw updateErr;
        }

        convId = convUpdated.id;
        finalConversa = convUpdated;
      }

      const novaMensagem: Mensagem = {
        id: finalMsgId,
        conversa_id: convId,
        numero,
        conteudo,
        direcao: 'recebida',
        status: 'entregue',
        criado_em: now,
      };

      const { data: msgCreated, error: msgErr } = await supabase
        .from('mensagens')
        .insert(novaMensagem)
        .select()
        .single();

      if (msgErr) {
        console.error('[API Supabase] Erro ao persistir mensagem recebida:', msgErr);
        throw msgErr;
      }

      return { conversa: finalConversa, mensagem: msgCreated };
    }

    // Modo Mock Offline
    const conversaMock = MockDatabase.salvarOuAtualizarConversa(numero, nomeRemetente, conteudo);
    const msgMock = MockDatabase.saveMensagem({
      id: finalMsgId,
      conversa_id: conversaMock.id,
      numero,
      conteudo,
      direcao: 'recebida',
      status: 'entregue',
      criado_em: now,
    });
    return { conversa: conversaMock, mensagem: msgMock };
  },

  // ==========================================================================
  // TATUADORES ROTATIVOS & SOLICITAÇÕES DE JOBS
  // ==========================================================================
  async getRotativosDisponiveis(): Promise<Usuario[]> {
    const usuarios = await this.getUsuarios();
    return usuarios.filter(
      u =>
        u.role === 'colaborador' &&
        u.tipo_colaborador === 'rotativo' &&
        u.status === 'ativo' &&
        u.status_disponibilidade !== 'indisponivel'
    );
  },

  async getSolicitacoesRotativo(): Promise<SolicitacaoRotativo[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('solicitacoes_rotativo')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) {
        console.error('[API Supabase] Erro ao buscar solicitações de rotativo:', error);
        return MockDatabase.getSolicitacoesRotativo();
      }
      return data || [];
    }
    return MockDatabase.getSolicitacoesRotativo();
  },

  async criarSolicitacaoRotativo(
    dados: Omit<SolicitacaoRotativo, 'id' | 'status' | 'criado_em'>
  ): Promise<SolicitacaoRotativo> {
    const solId = 'sol-rot-' + Date.now();
    const now = new Date().toISOString();

    const novaSolicitacao: SolicitacaoRotativo = {
      ...dados,
      id: solId,
      status: 'aberto',
      criado_em: now,
    };

    // 1. Salva a solicitação
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('solicitacoes_rotativo')
        .insert(novaSolicitacao)
        .select()
        .single();
      if (error) {
        console.error('[API Supabase] Erro ao criar solicitação de rotativo:', error);
        throw error;
      }
    } else {
      MockDatabase.saveSolicitacaoRotativo(novaSolicitacao);
    }

    // 2. Dispara notificação push para TODOS os rotativos disponíveis com notificações ativas simultaneamente
    const rotativosDisponiveis = await this.getRotativosDisponiveis();
    const rotativosComNotif = rotativosDisponiveis.filter(r => r.notificacoes_ativas !== false);

    const mensagemPush = `🔔 Job disponível — Hype Tatu\nEstilo: ${dados.estilo} | Tamanho: ${dados.tamanho.toUpperCase()}\nData: ${dados.data} às ${dados.hora_inicio}\nValor: R$ ${Number(dados.valor_estimado).toFixed(2)}\nPrimeiro a aceitar fica com o job.`;

    for (const rotativo of rotativosComNotif) {
      await this.sendPushNotification(
        rotativo.id,
        '🔔 Job disponível — Hype Tatu',
        mensagemPush,
        `/equipe/${rotativo.slug || ''}`
      ).catch(err => console.warn('Erro ao disparar push para rotativo:', rotativo.nome, err));
    }

    window.dispatchEvent(new CustomEvent('hype_solicitacoes_rotativo_changed', { detail: novaSolicitacao }));
    return novaSolicitacao;
  },

  async aceitarJobRotativo(
    jobId: string,
    rotativoId: string
  ): Promise<{ solicitacao: SolicitacaoRotativo; agendamento: Agendamento }> {
    if (isSupabaseConfigured()) {
      // 1. Consulta o job atual e faz verificação de trava (lock)
      const { data: job, error: jobErr } = await supabase
        .from('solicitacoes_rotativo')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobErr || !job) {
        throw new Error('Solicitação de job não encontrada.');
      }

      if (job.status === 'aceito') {
        throw new Error(`Este job já foi aceito por ${job.aceito_por_nome || 'outro tatuador'}.`);
      }

      const { data: rotativo } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', rotativoId)
        .single();

      if (!rotativo) {
        throw new Error('Colaborador não encontrado.');
      }

      const now = new Date().toISOString();

      // 2. Atualiza status do job
      const { data: jobAtualizado, error: updErr } = await supabase
        .from('solicitacoes_rotativo')
        .update({
          status: 'aceito',
          aceito_por_id: rotativo.id,
          aceito_por_nome: rotativo.nome,
          aceito_em: now,
        })
        .eq('id', jobId)
        .select()
        .single();

      if (updErr) throw updErr;

      // 3. Cliente: encontra ou cria
      let clienteId = job.cliente_id;
      if (!clienteId) {
        const { data: existingCli } = await supabase
          .from('clientes')
          .select('id')
          .ilike('nome', job.cliente_nome)
          .maybeSingle();

        if (existingCli) {
          clienteId = existingCli.id;
        } else {
          const { data: novoCli } = await supabase
            .from('clientes')
            .insert({
              nome: job.cliente_nome,
              telefone: job.cliente_telefone || '(71) 99999-0000',
              tags: ['Tatuagem', 'Job Rotativo'],
            })
            .select('id')
            .single();
          clienteId = novoCli?.id;
        }
      }

      // 4. Serviço
      const servicos = await this.getServicos();
      const servicoTattoo =
        servicos.find(s => s.categoria_id === 'cat-tattoo' && s.nome.toLowerCase().includes(job.tamanho)) ||
        servicos.find(s => s.categoria_id === 'cat-tattoo') ||
        servicos[0];

      // 5. Cria agendamento automaticamente
      const novoAgendamento: Agendamento = {
        id: 'ag-rot-' + Date.now(),
        cliente_id: clienteId,
        colaborador_id: rotativo.id,
        servico_id: servicoTattoo.id,
        data: job.data,
        hora_inicio: job.hora_inicio,
        hora_fim: job.hora_fim,
        status: 'confirmado',
        observacoes: `[JOB ROTATIVO ACEITO] Profissional: ${rotativo.nome} | Estilo: ${job.estilo} | Porte: ${job.tamanho.toUpperCase()} | Valor: R$ ${job.valor_estimado}. ${job.observacoes || ''}`,
        criado_em: now,
      };

      const { data: agCreated, error: agErr } = await supabase
        .from('agendamentos')
        .insert(novoAgendamento)
        .select(`*, cliente:clientes(*), colaborador:usuarios(*), servico:servicos(*)`)
        .single();

      if (agErr) throw agErr;

      // 6. Notifica a recepção e o master (NÃO notificar o cliente — recepcionista faz isso manualmente)
      const usuarios = await this.getUsuarios();
      const destinatarios = usuarios.filter(u => u.role === 'recepcionista' || u.role === 'master');
      for (const dest of destinatarios) {
        await this.sendPushNotification(
          dest.id,
          '🔔 Job Aceito por Rotativo!',
          `${rotativo.nome} aceitou o job de ${job.data} às ${job.hora_inicio} (${job.cliente_nome} — ${job.estilo})`,
          '/recepcao'
        ).catch(() => {});
      }

      window.dispatchEvent(new CustomEvent('hype_solicitacoes_rotativo_changed', { detail: jobAtualizado }));
      window.dispatchEvent(new CustomEvent('hype_agendamentos_changed', { detail: agCreated }));
      return { solicitacao: jobAtualizado, agendamento: agCreated };
    }

    // Modo Mock Offline
    return MockDatabase.aceitarJobRotativo(jobId, rotativoId);
  },

  async recusarJobRotativo(jobId: string, rotativoId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: job } = await supabase.from('solicitacoes_rotativo').select('recusado_por_ids').eq('id', jobId).single();
      const recusados = job?.recusado_por_ids || [];
      if (!recusados.includes(rotativoId)) {
        await supabase
          .from('solicitacoes_rotativo')
          .update({ recusado_por_ids: [...recusados, rotativoId] })
          .eq('id', jobId);
      }
      return;
    }
    MockDatabase.recusarJobRotativo(jobId, rotativoId);
  },
};
