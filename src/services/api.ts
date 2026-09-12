/**
 * Unified API Service Layer
 * Fornece métodos assíncronos para todas as operações do Hype Tatu.
 * Alterna dinamicamente entre Supabase (quando configurado) e MockDatabase (modo demo offline).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MockDatabase } from './mockData';
import { evolutionApi } from './evolutionApi';
import { generateUUID, isValidUUID } from '../lib/uuid';
import { Usuario, Cliente, CategoriaServico, Servico, Agendamento, Produto, UsoProduto, MovimentacaoEstoque, Notificacao, StatusAgendamento, Conversa, Mensagem, SolicitacaoRotativo, Pagamento, CustoFixo, RepasseComissao, FormaPagamento } from '../types';

export const api = {
  // ==========================================================================
  // USUÁRIOS & COLABORADORES
  // ==========================================================================
  async getUsuarios(): Promise<Usuario[]> {
    const localUsers = MockDatabase.getUsuarios();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('usuarios').select('*').order('nome');
        if (!error && data && data.length > 0) {
          return data.map((sbUser) => {
            const local = localUsers.find((l) => l.id === sbUser.id || (sbUser.email && l.email === sbUser.email));
            return {
              ...sbUser,
              senha_acesso: local?.senha_acesso || sbUser.senha_acesso,
              primeiro_acesso_pendente: local?.primeiro_acesso_pendente ?? sbUser.primeiro_acesso_pendente,
            };
          });
        }
      } catch (err) {
        console.warn('[API] Falha ao buscar usuários do Supabase, usando fallback local:', err);
      }
    }
    return localUsers;
  },

  async getColaboradores(): Promise<Usuario[]> {
    const users = await this.getUsuarios();
    return users.filter(u => u.role === 'colaborador' && u.status === 'ativo');
  },

  async getUsuarioById(id: string): Promise<Usuario | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
        if (!error && data) {
          const local = MockDatabase.getUsuarioById(id);
          return {
            ...data,
            senha_acesso: local?.senha_acesso || data.senha_acesso,
            primeiro_acesso_pendente: local?.primeiro_acesso_pendente ?? data.primeiro_acesso_pendente,
          };
        }
      } catch (e) {}
    }
    return MockDatabase.getUsuarioById(id) || null;
  },

  async getUsuarioBySlug(slug: string): Promise<Usuario | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('usuarios').select('*').eq('slug', slug).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return MockDatabase.getUsuarioBySlug(slug) || null;
  },

  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    const validUser: Usuario = {
      ...usuario,
      id: isValidUUID(usuario.id) ? usuario.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      // 1. Tenta salvar via backend com Service Role (bypassa restrições de RLS)
      try {
        const res = await fetch('/api/admin/save-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validUser),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.user) {
            MockDatabase.saveUsuario(resData.user);
            return resData.user;
          }
        }
      } catch (netErr) {
        console.warn('[API] Falha ao comunicar com backend para salvar usuário:', netErr);
      }

      // 2. Tentativa direta no Supabase client
      try {
        const { data, error } = await supabase.from('usuarios').upsert(validUser).select().single();
        if (!error && data) {
          MockDatabase.saveUsuario(data);
          return data;
        }
      } catch (sbErr) {
        console.warn('[API Supabase saveUsuario]:', sbErr);
      }
    }

    // 3. Fallback seguro garantindo que o usuário seja cadastrado
    return MockDatabase.saveUsuario(validUser);
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

      const localUser = MockDatabase.getUsuarioById(targetUserId);
      if (localUser) {
        MockDatabase.saveUsuario({ ...localUser, senha_acesso: newPassword, primeiro_acesso_pendente: false });
      }
      window.dispatchEvent(new Event('hype_usuarios_changed'));
      return;
    }

    // Modo offline/demo
    const localUser = MockDatabase.getUsuarioById(targetUserId);
    if (localUser) {
      MockDatabase.saveUsuario({ ...localUser, senha_acesso: newPassword, primeiro_acesso_pendente: false });
    }
    window.dispatchEvent(new Event('hype_usuarios_changed'));
    console.log(`[Demo Mode] Senha do usuário ${targetUserId} alterada.`);
  },

  async ativarContaColaborador(userId: string, email: string, password: string): Promise<Usuario> {
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tenta ativar via backend
    try {
      const res = await fetch('/api/colaborador/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: cleanEmail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const userUpdated: Usuario = {
            ...data.user,
            email: cleanEmail,
            senha_acesso: password,
            primeiro_acesso_pendente: false,
            status: 'ativo',
          };
          MockDatabase.saveUsuario(userUpdated);
          window.dispatchEvent(new Event('hype_usuarios_changed'));
          return userUpdated;
        }
      }
    } catch (netErr) {
      console.warn('[API] Falha ao ativar via backend, aplicando atualização local:', netErr);
    }

    // 2. Atualização local segura
    const existing = await this.getUsuarioById(userId);
    const updated: Usuario = {
      ...(existing || { id: userId, nome: 'Colaborador', role: 'colaborador' }),
      id: userId,
      email: cleanEmail,
      senha_acesso: password,
      primeiro_acesso_pendente: false,
      status: 'ativo',
    };

    MockDatabase.saveUsuario(updated);
    window.dispatchEvent(new Event('hype_usuarios_changed'));
    return updated;
  },

  // ==========================================================================
  // CLIENTES (CRM)
  // ==========================================================================
  async getClientes(): Promise<Cliente[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('clientes').select('*').order('nome');
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('[API] Falha ao buscar clientes do Supabase:', err);
      }
    }
    return MockDatabase.getClientes();
  },

  async saveCliente(cliente: Cliente): Promise<Cliente> {
    const validCliente: Cliente = {
      ...cliente,
      id: isValidUUID(cliente.id) ? cliente.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('clientes').upsert(validCliente).select().single();
        if (!error && data) {
          MockDatabase.saveCliente(data);
          return data;
        }
        console.warn('[API Supabase saveCliente warning]:', error?.message);
      } catch (err) {
        console.warn('[API Supabase saveCliente catch]:', err);
      }
    }

    // Salva no storage local resiliente
    return MockDatabase.saveCliente(validCliente);
  },

  // ==========================================================================
  // CATEGORIAS & SERVIÇOS
  // ==========================================================================
  async getCategorias(): Promise<CategoriaServico[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('categorias_servico').select('*').order('nome');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return MockDatabase.getCategorias();
  },

  async saveCategoria(cat: CategoriaServico): Promise<CategoriaServico> {
    const validCat: CategoriaServico = {
      ...cat,
      id: isValidUUID(cat.id) ? cat.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('categorias_servico').upsert(validCat).select().single();
        if (!error && data) {
          MockDatabase.saveCategoria(data);
          return data;
        }
      } catch (err) {
        console.warn('[API Supabase saveCategoria]:', err);
      }
    }
    return MockDatabase.saveCategoria(validCat);
  },

  async getServicos(): Promise<Servico[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('servicos')
          .select('*, categoria:categorias_servico(*)')
          .order('nome');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return MockDatabase.getServicos();
  },

  async saveServico(servico: Servico): Promise<Servico> {
    const validServ: Servico = {
      ...servico,
      id: isValidUUID(servico.id) ? servico.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('servicos').upsert(validServ).select().single();
        if (!error && data) {
          MockDatabase.saveServico(data);
          return data;
        }
      } catch (err) {
        console.warn('[API Supabase saveServico]:', err);
      }
    }
    return MockDatabase.saveServico(validServ);
  },

  async deleteServico(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('servicos').delete().eq('id', id);
      } catch (err) {
        console.warn('[API Supabase deleteServico]:', err);
      }
    }
    MockDatabase.deleteServico(id);
  },

  // ==========================================================================
  // AGENDAMENTOS (CALENDÁRIO & SALÃO)
  // ==========================================================================
  async getAgendamentos(): Promise<Agendamento[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('agendamentos')
          .select(`
            *,
            cliente:clientes(*),
            colaborador:usuarios(*),
            servico:servicos(*, categoria:categorias_servico(*))
          `)
          .order('hora_inicio');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    const list = MockDatabase.getAgendamentos();
    try {
      const users = await this.getUsuarios();
      return list.map(ag => {
        if (!ag.colaborador) {
          const c = users.find(u => u.id === ag.colaborador_id);
          if (c) return { ...ag, colaborador: c };
        }
        return ag;
      });
    } catch {
      return list;
    }
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
    const validAg: Agendamento = {
      ...agendamento,
      id: isValidUUID(agendamento.id) ? agendamento.id : generateUUID(),
    };

    // 1. Valida conflito antes de salvar
    const hasConflict = await this.checkConflitoHorario(
      validAg.colaborador_id,
      validAg.data,
      validAg.hora_inicio,
      validAg.hora_fim,
      validAg.id
    );

    if (hasConflict) {
      throw new Error(`Conflito de horário! O profissional já possui atendimento entre ${validAg.hora_inicio} e ${validAg.hora_fim}.`);
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('agendamentos').upsert(validAg).select().single();
        if (!error && data) {
          MockDatabase.saveAgendamento(data);
          return data;
        }
      } catch (err) {
        console.warn('[API Supabase saveAgendamento]:', err);
      }
    }

    const saved = MockDatabase.saveAgendamento(validAg);
    return saved;
  },

  async updateAgendamentoStatus(id: string, status: StatusAgendamento): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('agendamentos').update({ status }).eq('id', id);
      } catch (e) {}
    }
    MockDatabase.updateAgendamentoStatus(id, status);
  },

  // ==========================================================================
  // ESTOQUE & CONSUMO DE MATERIAIS
  // ==========================================================================
  async getProdutos(): Promise<Produto[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('produtos').select('*').order('nome');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[API] Falha ao buscar produtos do Supabase:', err);
      }
    }
    const list = MockDatabase.getProdutos();
    if (!list || list.length === 0) {
      return MockDatabase.seedDefaultProdutos();
    }
    return list;
  },

  seedDefaultProdutos(): Produto[] {
    return MockDatabase.seedDefaultProdutos();
  },

  async saveProduto(produto: Produto): Promise<Produto> {
    const validProd: Produto = {
      ...produto,
      id: isValidUUID(produto.id) ? produto.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('produtos').upsert(validProd).select().single();
        if (!error && data) {
          MockDatabase.saveProduto(data);
          return data;
        }
        console.warn('[API Supabase saveProduto warning]:', error?.message);
      } catch (err) {
        console.warn('[API Supabase saveProduto catch]:', err);
      }
    }

    return MockDatabase.saveProduto(validProd);
  },

  async deleteProduto(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('produtos').delete().eq('id', id);
      } catch (err) {
        console.warn('[API Supabase deleteProduto]:', err);
      }
    }
    MockDatabase.deleteProduto(id);
  },

  async registrarEntradaEstoque(produtoId: string, quantidade: number, motivo: string, usuarioId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', produtoId).single();
        if (prod) {
          const novoEstoque = Number(prod.estoque_atual) + Number(quantidade);
          await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produtoId);
          await supabase.from('movimentacoes_estoque').insert({
            id: generateUUID(),
            produto_id: produtoId,
            tipo: 'entrada',
            quantidade,
            motivo,
            usuario_id: isValidUUID(usuarioId) ? usuarioId : null,
          });
        }
      } catch (err) {
        console.warn('[API Supabase registrarEntradaEstoque catch]:', err);
      }
    }
    MockDatabase.addEntradaEstoque(produtoId, quantidade, motivo, usuarioId);
  },

  async registrarUsoProduto(uso: UsoProduto): Promise<UsoProduto> {
    const validUso: UsoProduto = {
      ...uso,
      id: isValidUUID(uso.id) ? uso.id : generateUUID(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('uso_produtos').insert(validUso).select().single();
        if (!error && data) {
          try {
            const { data: prod } = await supabase.from('produtos').select('estoque_atual').eq('id', validUso.produto_id).single();
            if (prod) {
              const novoEstoque = Math.max(0, Number(prod.estoque_atual) - Number(validUso.quantidade));
              await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', validUso.produto_id);
              await supabase.from('movimentacoes_estoque').insert({
                id: generateUUID(),
                produto_id: validUso.produto_id,
                tipo: 'saida',
                quantidade: validUso.quantidade,
                motivo: `Uso em atendimento (${validUso.data})`,
                usuario_id: isValidUUID(validUso.colaborador_id) ? validUso.colaborador_id : null,
              });
            }
          } catch (stErr) {}

          MockDatabase.registrarUsoProduto(data);
          return data;
        }
      } catch (err) {
        console.warn('[API Supabase registrarUsoProduto catch]:', err);
      }
    }
    return MockDatabase.registrarUsoProduto(validUso);
  },

  async getUsoProdutos(): Promise<UsoProduto[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('uso_produtos')
          .select('*, produto:produtos(*), colaborador:usuarios(*)')
          .order('data', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }
    return MockDatabase.getUsoProdutos();
  },

  async getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('movimentacoes_estoque')
          .select('*, produto:produtos(*), usuario:usuarios(*)')
          .order('data', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar movimentações de estoque:', err);
      }
    }
    return MockDatabase.getMovimentacoes();
  },

  // ==========================================================================
  // NOTIFICAÇÕES & PUSH
  // ==========================================================================
  async getNotificacoes(usuarioId?: string): Promise<Notificacao[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('notificacoes').select('*').order('criado_em', { ascending: false });
        if (usuarioId) query = query.eq('usuario_id', usuarioId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar notificações:', err);
      }
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
            icon: '/icon-192.png',
            badge: '/icon-192.png',
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
      try {
        const { data, error } = await supabase
          .from('conversas')
          .select('*, cliente:clientes(*)')
          .order('ultima_mensagem_em', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar conversas:', err);
      }
    }
    return MockDatabase.getConversas();
  },

  async getConversaById(id: string): Promise<Conversa | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('conversas')
          .select('*, cliente:clientes(*)')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar conversa por id:', err);
      }
    }
    return MockDatabase.getConversaById(id) || null;
  },

  async getMensagens(conversaId: string): Promise<Mensagem[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('mensagens')
          .select('*')
          .eq('conversa_id', conversaId)
          .order('criado_em', { ascending: true });
        if (!error && data) return data;
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar mensagens:', err);
      }
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

  // ==========================================================================
  // MÓDULO FINANCEIRO: PAGAMENTOS, COMISSÕES, CAIXA E CUSTOS
  // ==========================================================================

  async getPagamentos(colaboradorId?: string): Promise<Pagamento[]> {
    const mockPags = MockDatabase.getPagamentos(colaboradorId);
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('pagamentos').select('*').order('criado_em', { ascending: false });
        if (colaboradorId) {
          query = query.eq('colaborador_id', colaboradorId);
        }
        const { data, error } = await query;
        if (error || !data) {
          console.warn('[API Supabase] Erro ao buscar pagamentos, fallback para mock:', error);
          return mockPags;
        }

        // Mescla pagamentos de forma segura: preserva 'pago' se foi atualizado localmente
        const map = new Map<string, Pagamento>();
        data.forEach((p: Pagamento) => map.set(p.id, p));
        mockPags.forEach((p: Pagamento) => {
          if (!map.has(p.id)) {
            map.set(p.id, p);
          } else {
            const existing = map.get(p.id)!;
            if (p.status_repasse === 'pago' && existing.status_repasse !== 'pago') {
              map.set(p.id, { ...existing, status_repasse: 'pago', repasse_id: p.repasse_id || existing.repasse_id });
            }
          }
        });
        return Array.from(map.values()).sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));
      } catch (err) {
        console.warn('[API Supabase] Falha ao consultar pagamentos:', err);
        return mockPags;
      }
    }
    return mockPags;
  },

  async registrarPagamento(params: {
    agendamento_id?: string;
    cliente_id?: string;
    cliente_nome: string;
    colaborador_id: string;
    colaborador_nome: string;
    servico_id?: string;
    servico_nome: string;
    categoria_nome: string;
    valor_bruto: number;
    forma_pagamento: FormaPagamento;
    parcelas?: number;
    taxa_maquininha_pct: number;
    observacoes?: string;
  }): Promise<Pagamento> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Obter colaborador para descobrir a porcentagem de comissão específica da categoria
    let colab: Usuario | undefined;
    try {
      const users = await this.getUsuarios();
      colab = users.find(u => u.id === params.colaborador_id);
    } catch {
      colab = MockDatabase.getUsuarioById(params.colaborador_id);
    }

    // Identificar porcentagem conforme categoria (Barbearia / Tatuagem / Piercing)
    let comissaoPct = 50;
    const catLower = (params.categoria_nome || '').toLowerCase();
    if (catLower.includes('tatu') || catLower.includes('tattoo')) {
      comissaoPct = colab?.comissao_tatuagem !== undefined ? colab.comissao_tatuagem : (colab?.comissao_porcentagem || 60);
    } else if (catLower.includes('barb') || catLower.includes('corte')) {
      comissaoPct = colab?.comissao_barbearia !== undefined ? colab.comissao_barbearia : (colab?.comissao_porcentagem || 50);
    } else if (catLower.includes('pierc')) {
      comissaoPct = colab?.comissao_piercing !== undefined ? colab.comissao_piercing : (colab?.comissao_porcentagem || 55);
    } else {
      comissaoPct = colab?.comissao_porcentagem !== undefined ? colab.comissao_porcentagem : 50;
    }

    // 2. Cálculos Automáticos Exatos
    const valorBruto = Number(params.valor_bruto);
    const taxaPct = Number(params.taxa_maquininha_pct || 0);
    const taxaValor = Number(((valorBruto * taxaPct) / 100).toFixed(2));
    const valorLiquidoTransacao = Number((valorBruto - taxaValor).toFixed(2));
    const comissaoValor = Number(((valorBruto * comissaoPct) / 100).toFixed(2));
    const valorLiquidoEstudio = Number((valorLiquidoTransacao - comissaoValor).toFixed(2));

    const novoPagamento: Pagamento = {
      id: 'pag-' + Date.now(),
      agendamento_id: params.agendamento_id,
      cliente_id: params.cliente_id,
      cliente_nome: params.cliente_nome,
      colaborador_id: params.colaborador_id,
      colaborador_nome: params.colaborador_nome,
      servico_id: params.servico_id,
      servico_nome: params.servico_nome,
      categoria_nome: params.categoria_nome,
      data: todayStr,
      hora: timeStr,
      valor_bruto: valorBruto,
      forma_pagamento: params.forma_pagamento,
      parcelas: params.parcelas || 1,
      taxa_maquininha_pct: taxaPct,
      taxa_maquininha_valor: taxaValor,
      valor_liquido_transacao: valorLiquidoTransacao,
      comissao_pct: comissaoPct,
      comissao_valor: comissaoValor,
      valor_liquido_estudio: valorLiquidoEstudio,
      status_repasse: 'a_pagar',
      observacoes: params.observacoes,
      criado_em: now.toISOString(),
    };

    // Salvar no Banco
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('pagamentos').insert(novoPagamento);
        if (params.agendamento_id) {
          await supabase.from('agendamentos').update({ pago: true, pagamento_id: novoPagamento.id }).eq('id', params.agendamento_id);
        }
      } catch (e) {
        console.warn('[API Supabase] Falha ao gravar pagamento no Supabase, gravando no Mock:', e);
        MockDatabase.savePagamento(novoPagamento);
      }
    } else {
      MockDatabase.savePagamento(novoPagamento);
    }

    // 3. Notificação IMEDIATA para o ADMIN MASTER
    const labelForma = 
      params.forma_pagamento === 'pix' ? 'PIX' :
      params.forma_pagamento === 'dinheiro' ? 'Dinheiro' :
      params.forma_pagamento === 'debito' ? 'Débito' :
      `Crédito ${params.parcelas && params.parcelas > 1 ? `${params.parcelas}x` : 'à vista'}`;

    try {
      const allUsers = await this.getUsuarios();
      const admins = allUsers.filter(u => u.role === 'master');
      for (const admin of admins) {
        await this.sendPushNotification(
          admin.id,
          '💰 Pagamento recebido',
          `Cliente: ${params.cliente_nome}\nServiço: ${params.servico_nome} com ${params.colaborador_nome}\nValor bruto: R$ ${valorBruto.toFixed(2)}\nForma: ${labelForma}\nLíquido estúdio: R$ ${valorLiquidoEstudio.toFixed(2)}`,
          '/admin/financeiro'
        );
      }
    } catch (e) {
      console.error('[API] Erro ao notificar admin:', e);
    }

    // 4. Notificação para o COLABORADOR no painel dele
    try {
      await this.sendPushNotification(
        params.colaborador_id,
        '💈 Serviço concluído',
        `Cliente: ${params.cliente_nome} — ${params.servico_nome}\nValor do serviço: R$ ${valorBruto.toFixed(2)}\nSua comissão (${comissaoPct}%): R$ ${comissaoValor.toFixed(2)}`,
        colab?.slug ? `/equipe/${colab.slug}/ganhos` : '/equipe'
      );
    } catch (e) {
      console.error('[API] Erro ao notificar colaborador:', e);
    }

    window.dispatchEvent(new CustomEvent('hype_pagamentos_changed', { detail: novoPagamento }));
    return novoPagamento;
  },

  async getCustosFixos(): Promise<CustoFixo[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('custos_fixos').select('*').order('dia_vencimento');
      if (error) {
        console.warn('[API Supabase] Erro ao buscar custos fixos, usando mock:', error);
        return MockDatabase.getCustosFixos();
      }
      return data || [];
    }
    return MockDatabase.getCustosFixos();
  },

  async saveCustoFixo(custo: CustoFixo): Promise<CustoFixo> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('custos_fixos').upsert(custo).select().single();
        if (error) throw error;
        window.dispatchEvent(new CustomEvent('hype_custos_fixos_changed', { detail: data }));
        return data;
      } catch (e) {
        console.warn('[API Supabase] Erro ao salvar custo fixo, fallback para mock:', e);
        return MockDatabase.saveCustoFixo(custo);
      }
    }
    return MockDatabase.saveCustoFixo(custo);
  },

  async deleteCustoFixo(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('custos_fixos').delete().eq('id', id);
    }
    MockDatabase.deleteCustoFixo(id);
  },

  async toggleStatusCustoFixo(id: string, mesAno: string): Promise<CustoFixo> {
    if (isSupabaseConfigured()) {
      const { data: custo } = await supabase.from('custos_fixos').select('*').eq('id', id).single();
      if (custo) {
        const statusMes = custo.status_mes || {};
        statusMes[mesAno] = statusMes[mesAno] === 'pago' ? 'pendente' : 'pago';
        const { data: updated } = await supabase.from('custos_fixos').update({ status_mes: statusMes }).eq('id', id).select().single();
        window.dispatchEvent(new CustomEvent('hype_custos_fixos_changed', { detail: updated }));
        return updated || custo;
      }
    }
    return MockDatabase.toggleStatusCustoFixo(id, mesAno);
  },

  async getRepassesComissao(): Promise<RepasseComissao[]> {
    const mockReps = MockDatabase.getRepassesComissao();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('repasses_comissao').select('*').order('pago_em', { ascending: false });
        if (error || !data) {
          console.warn('[API Supabase] Erro ao buscar repasses, usando mock:', error);
          return mockReps;
        }
        const map = new Map<string, RepasseComissao>();
        data.forEach((r: RepasseComissao) => map.set(r.id, r));
        mockReps.forEach((r: RepasseComissao) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });
        return Array.from(map.values()).sort((a, b) => (b.pago_em || '').localeCompare(a.pago_em || ''));
      } catch (err) {
        console.warn('[API Supabase] Erro ao buscar repasses:', err);
        return mockReps;
      }
    }
    return mockReps;
  },

  async marcarComissaoPaga(
    colaboradorId: string,
    pagamentosIds: string[],
    valorTotal: number,
    pagoPor?: string
  ): Promise<RepasseComissao> {
    // 1. SEMPRE persiste imediatamente no MockDatabase local como garantia de atualização instantânea
    const localRepasse = MockDatabase.marcarComissaoPaga(colaboradorId, pagamentosIds, valorTotal, pagoPor);

    // 2. Se o Supabase estiver configurado, espelha no banco remoto
    if (isSupabaseConfigured()) {
      try {
        const now = new Date().toISOString();
        const users = await this.getUsuarios();
        const colab = users.find(u => u.id === colaboradorId);
        const repasseRemoto: RepasseComissao = {
          id: localRepasse?.id || ('rep-' + Date.now()),
          colaborador_id: colaboradorId,
          colaborador_nome: colab?.nome || localRepasse?.colaborador_nome || 'Colaborador',
          valor_total: valorTotal,
          pagamentos_ids: pagamentosIds,
          pago_em: now,
          pago_por: pagoPor || 'Admin Master',
          observacoes: `Repasse de ${pagamentosIds.length > 0 ? pagamentosIds.length : 'atendimentos'} serviço(s) quitado.`
        };

        const { error: repErr } = await supabase.from('repasses_comissao').insert(repasseRemoto);
        if (repErr) {
          console.warn('[API Supabase repasses_comissao insert error]:', repErr);
        }

        if (pagamentosIds.length > 0) {
          const { error: updErr } = await supabase
            .from('pagamentos')
            .update({ status_repasse: 'pago', repasse_id: repasseRemoto.id })
            .in('id', pagamentosIds);
          if (updErr) {
            console.warn('[API Supabase pagamentos update status_repasse error]:', updErr);
          }
        }
      } catch (e) {
        console.warn('[API Supabase] Erro ao sincronizar repasse remoto:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('hype_pagamentos_changed'));
    window.dispatchEvent(new CustomEvent('hype_repasses_changed', { detail: localRepasse }));
    return localRepasse;
  },
};
