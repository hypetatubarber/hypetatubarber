import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Calendar,
  Phone,
  Clock,
  Check,
  CheckCheck,
  ArrowLeft,
  Filter,
  User,
  Settings,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Conversa, Mensagem } from '../../types';

export const ConversasPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [activeConversaId, setActiveConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loadingConversas, setLoadingConversas] = useState<boolean>(true);
  const [loadingMensagens, setLoadingMensagens] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega todas as conversas
  const loadConversas = async () => {
    try {
      const data = await api.getConversas();
      setConversas(data);
      // Se não houver conversa ativa selecionada no desktop, seleciona a primeira
      if (!activeConversaId && data.length > 0 && window.innerWidth >= 1024) {
        setActiveConversaId(data[0].id);
      }
    } catch (e) {
      console.error('Erro ao carregar conversas:', e);
    } finally {
      setLoadingConversas(false);
    }
  };

  // Carrega mensagens da conversa ativa
  const loadMensagens = async (conversaId: string) => {
    setLoadingMensagens(true);
    try {
      const data = await api.getMensagens(conversaId);
      setMensagens(data);
      // Marca como lida
      await api.marcarConversaLida(conversaId);
      // Atualiza na lista local de conversas
      setConversas(prev =>
        prev.map(c => (c.id === conversaId ? { ...c, nao_lidas: 0 } : c))
      );
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    } finally {
      setLoadingMensagens(false);
    }
  };

  // Efeito ao trocar a conversa ativa
  useEffect(() => {
    if (activeConversaId) {
      loadMensagens(activeConversaId);
    } else {
      setMensagens([]);
    }
  }, [activeConversaId]);

  // Efeito inicial e listeners de tempo real
  useEffect(() => {
    loadConversas();

    // Listener para atualizações locais
    const handleConversasUpdated = () => {
      loadConversas();
    };

    const handleMensagemReceived = (e: any) => {
      const msg: Mensagem = e.detail;
      if (activeConversaId && msg.conversa_id === activeConversaId) {
        setMensagens(prev => [...prev, msg]);
        api.marcarConversaLida(activeConversaId);
      }
      loadConversas();
    };

    window.addEventListener('hype_conversas_updated', handleConversasUpdated);
    window.addEventListener('hype_mensagem_received', handleMensagemReceived);

    // Listener de HMR do Vite para o Webhook Dev
    if (import.meta.hot) {
      import.meta.hot.on('whatsapp:message', async (data: any) => {
        console.log('[Frontend HMR] Mensagem recebida via Webhook:', data);
        await api.receberMensagem(data.numero, data.pushName, data.conteudo, data.id, data.timestamp);
      });
    }

    return () => {
      window.removeEventListener('hype_conversas_updated', handleConversasUpdated);
      window.removeEventListener('hype_mensagem_received', handleMensagemReceived);
    };
  }, [activeConversaId]);

  // Scroll para o fim da lista de mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Envio de Mensagem
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversaId || isSending) return;

    const conv = conversas.find(c => c.id === activeConversaId);
    if (!conv) return;

    const texto = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const novaMsg = await api.enviarMensagem(activeConversaId, conv.numero, texto);
      setMensagens(prev => [...prev, novaMsg]);
      // Atualiza na lista de conversas
      setConversas(prev =>
        prev.map(c =>
          c.id === activeConversaId
            ? { ...c, ultima_mensagem: texto, ultima_mensagem_em: novaMsg.criado_em }
            : c
        )
      );
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Respostas Rápidas / Modelos
  const sendQuickReply = (texto: string) => {
    setInputText(texto);
  };

  // Formatação de data/hora
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const activeConversa = conversas.find(c => c.id === activeConversaId);

  // Filtro de conversas
  const filteredConversas = conversas.filter(c => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.numero.includes(searchQuery) ||
      (c.ultima_mensagem && c.ultima_mensagem.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUnread = filterUnreadOnly ? (c.nao_lidas || 0) > 0 : true;
    return matchesSearch && matchesUnread;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col max-w-7xl mx-auto">
      {/* Top Banner de Status WhatsApp */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-[#E2E6EA] mb-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#0B0E11]">WhatsApp Hype Tatu</span>
          <span className="text-[11px] text-[#4A5568] hidden sm:inline">
            • Atendimento em tempo real via Evolution API
          </span>
        </div>
        <Link
          to="/admin/configuracoes/whatsapp"
          className="text-xs font-semibold text-[#517566] hover:text-[#0B0E11] flex items-center gap-1.5 transition"
        >
          <Settings className="w-3.5 h-3.5" />
          Configurar Instância
        </Link>
      </div>

      {/* Janela Principal: Duas Colunas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-[#E2E6EA] shadow-sm overflow-hidden min-h-0">
        {/* =========================================================================
            COLUNA ESQUERDA: LISTA DE CONVERSAS (Oculta no mobile se conversa ativa)
            ========================================================================= */}
        <div
          className={`lg:col-span-5 border-r border-[#E2E6EA] flex flex-col h-full ${
            activeConversaId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header da Coluna */}
          <div className="p-4 border-b border-[#E2E6EA] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B0E11] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8CBDAD]" />
                Conversas
              </h2>
              <button
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                  filterUnreadOnly
                    ? 'bg-[#8CBDAD]/20 border-[#8CBDAD] text-[#517566] font-bold'
                    : 'border-[#E2E6EA] text-[#4A5568] hover:bg-[#F0F2F5]'
                }`}
                title="Filtrar não lidas"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Não lidas</span>
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8A96A3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou mensagem..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E6EA] bg-[#F5F6FA] text-[#0B0E11] placeholder-[#8A96A3] focus:bg-white focus:outline-none focus:border-[#8CBDAD]"
              />
            </div>
          </div>

          {/* Lista Rolável de Conversas */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2E6EA]/60">
            {loadingConversas ? (
              <div className="p-8 text-center text-xs text-[#8A96A3]">
                Carregando conversas...
              </div>
            ) : filteredConversas.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8A96A3] space-y-2">
                <Smartphone className="w-8 h-8 mx-auto text-[#AAB6BE]" />
                <p>Nenhuma conversa encontrada.</p>
              </div>
            ) : (
              filteredConversas.map(conv => {
                const isSelected = conv.id === activeConversaId;
                const hasUnread = (conv.nao_lidas || 0) > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversaId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-[#F0F2F5] border-l-4 border-[#8CBDAD]'
                        : 'hover:bg-[#F5F6FA]'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.avatar_url ? (
                        <img
                          src={conv.avatar_url}
                          alt={conv.nome}
                          className="w-11 h-11 rounded-full object-cover border border-[#E2E6EA]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#1A1F25] text-[#8CBDAD] font-bold text-sm flex items-center justify-center border border-[#8CBDAD]/30">
                          {conv.nome ? conv.nome[0].toUpperCase() : 'W'}
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Detalhes da Conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`text-sm truncate font-semibold ${
                            hasUnread ? 'text-[#0B0E11] font-bold' : 'text-[#0B0E11]'
                          }`}
                        >
                          {conv.nome}
                        </span>
                        <span className="text-[10px] text-[#8A96A3] flex-shrink-0 ml-2">
                          {formatTime(conv.ultima_mensagem_em)}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? 'text-[#0B0E11] font-semibold'
                            : 'text-[#4A5568]'
                        }`}
                      >
                        {conv.ultima_mensagem || 'Nenhuma mensagem recente'}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-mono text-[#8A96A3]">
                          {conv.numero}
                        </span>
                        {hasUnread && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#8CBDAD] text-[#0B0E11] text-[10px] font-black leading-none">
                            {conv.nao_lidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUNA DIREITA: CONVERSA ATIVA / CHAT (Visível no mobile se conversa ativa)
            ========================================================================= */}
        <div
          className={`lg:col-span-7 flex flex-col h-full bg-[#F5F6FA] ${
            !activeConversaId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConversa ? (
            <>
              {/* Header do Chat */}
              <div className="p-3.5 bg-white border-b border-[#E2E6EA] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Botão voltar no mobile */}
                  <button
                    onClick={() => setActiveConversaId(null)}
                    className="p-1.5 rounded-lg text-[#4A5568] hover:bg-[#F0F2F5] lg:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Avatar & Nome */}
                  <div className="flex items-center gap-2.5">
                    {activeConversa.avatar_url ? (
                      <img
                        src={activeConversa.avatar_url}
                        alt={activeConversa.nome}
                        className="w-9 h-9 rounded-full object-cover border border-[#E2E6EA]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#1A1F25] text-[#8CBDAD] font-bold text-xs flex items-center justify-center">
                        {activeConversa.nome ? activeConversa.nome[0].toUpperCase() : 'W'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-[#0B0E11] leading-tight">
                        {activeConversa.nome}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#4A5568]">
                        <span className="font-mono">{activeConversa.numero}</span>
                        <span className="text-[#8CBDAD]">• WhatsApp</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ações do Header */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/admin/agendamentos')}
                    className="px-3 py-1.5 rounded-xl bg-[#8CBDAD]/20 hover:bg-[#8CBDAD]/30 text-[#517566] text-xs font-bold flex items-center gap-1.5 transition"
                    title="Novo Agendamento"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Agendar</span>
                  </button>
                </div>
              </div>

              {/* Corpo das Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMensagens ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#8A96A3]">
                    Carregando mensagens...
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8A96A3]">
                    <MessageSquare className="w-10 h-10 mb-2 text-[#AAB6BE]" />
                    <p className="text-sm font-semibold text-[#0B0E11]">Nenhuma mensagem ainda</p>
                    <p className="text-xs max-w-xs mt-1">
                      Envie uma mensagem abaixo para iniciar a conversa com este cliente via WhatsApp.
                    </p>
                  </div>
                ) : (
                  mensagens.map(msg => {
                    const isMe = msg.direcao === 'enviada';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                            isMe
                              ? 'bg-[#8CBDAD] text-[#0B0E11] font-medium rounded-br-none'
                              : 'bg-white text-[#0B0E11] border border-[#E2E6EA] rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.conteudo}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMe ? 'text-[#0B0E11]/70' : 'text-[#8A96A3]'
                            }`}
                          >
                            <span>{formatTime(msg.criado_em)}</span>
                            {isMe && (
                              <CheckCheck className="w-3.5 h-3.5 text-[#0B0E11]/80" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Atalhos de Resposta Rápida */}
              <div className="px-4 py-2 bg-white/70 backdrop-blur border-t border-[#E2E6EA] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                <span className="text-[11px] font-semibold text-[#8A96A3] flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-[#8CBDAD]" />
                  Respostas rápidas:
                </span>
                <button
                  onClick={() =>
                    sendQuickReply('Olá! Tudo bem? Como posso te ajudar hoje no estúdio Hype Tatu?')
                  }
                  className="px-2.5 py-1 rounded-full bg-[#F0F2F5] hover:bg-[#E2E6EA] text-[#4A5568] flex-shrink-0 transition"
                >
                  Saudação inicial
                </button>
                <button
                  onClick={() =>
                    sendQuickReply(
                      'Seu agendamento foi confirmado! Nosso estúdio fica em Lauro de Freitas - BA. Te aguardamos!'
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-[#F0F2F5] hover:bg-[#E2E6EA] text-[#4A5568] flex-shrink-0 transition"
                >
                  Confirmar agendamento
                </button>
                <button
                  onClick={() =>
                    sendQuickReply(
                      'Para orçamentos de tatuagem, nos envie a ideia de referência, tamanho aproximado em cm e local do corpo.'
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-[#F0F2F5] hover:bg-[#E2E6EA] text-[#4A5568] flex-shrink-0 transition"
                >
                  Orçamento de Tattoo
                </button>
              </div>

              {/* Barra de Input / Envio */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-white border-t border-[#E2E6EA] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Digite uma mensagem WhatsApp..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#E2E6EA] bg-[#F5F6FA] text-[#0B0E11] placeholder-[#8A96A3] focus:bg-white focus:outline-none focus:border-[#8CBDAD]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 rounded-xl bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shadow-sm"
                  title="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* Estado Vazio Quando Nenhuma Conversa Selecionada */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#8CBDAD]/15 flex items-center justify-center text-[#517566] mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#0B0E11]">Nenhuma conversa selecionada</h3>
              <p className="text-xs text-[#4A5568] max-w-sm mt-1">
                Escolha uma conversa na coluna à esquerda para visualizar as mensagens e responder o
                cliente pelo WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ConversasPage;
