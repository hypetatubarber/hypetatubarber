import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Link2,
  ShieldCheck,
  Send,
  Zap,
  Info,
  Check,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { evolutionApi } from '../../services/evolutionApi';
import { api } from '../../services/api';
import { EvolutionState } from '../../types';

export const WhatsAppConfigPage: React.FC = () => {
  const [connectionState, setConnectionState] = useState<EvolutionState>('close');
  const [loading, setLoading] = useState<boolean>(true);
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [autoRefreshCount, setAutoRefreshCount] = useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Webhook settings
  const defaultWebhookUrl = `${window.location.origin}/webhook/whatsapp`;
  const [webhookUrl, setWebhookUrl] = useState<string>(
    import.meta.env.VITE_WEBHOOK_URL || defaultWebhookUrl
  );
  const [webhookSaving, setWebhookSaving] = useState<boolean>(false);

  // Simulação de teste
  const [testNumber, setTestNumber] = useState<string>('5571999887766');
  const [testNome, setTestNome] = useState<string>('Cliente Teste');
  const [testTexto, setTestTexto] = useState<string>('Olá! Gostaria de agendar um orçamento para tattoo.');
  const [testSending, setTestSending] = useState<boolean>(false);

  // Checa status de conexão
  const checkStatus = useCallback(async () => {
    try {
      const res = await evolutionApi.getConnectionState();
      const state: EvolutionState = res.state || 'close';
      setConnectionState(state);
      if (state === 'open') {
        setQrCode(null);
      }
    } catch (e) {
      console.warn('Erro ao consultar status do WhatsApp:', e);
      setConnectionState('close');
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca ou recarrega o QR Code
  const fetchQrCode = async () => {
    setQrLoading(true);
    setFeedbackMsg(null);
    try {
      const data = await evolutionApi.connectInstance();
      if (data.base64) {
        setQrCode(data.base64);
        if (data.pairingCode) setPairingCode(data.pairingCode);
        setFeedbackMsg({ type: 'success', text: 'Novo QR Code gerado! Aponte o celular.' });
      } else {
        // Pode já estar conectado
        await checkStatus();
      }
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Não foi possível gerar QR Code. ' + (e.message || '') });
    } finally {
      setQrLoading(false);
    }
  };

  // Desconectar instância
  const handleDisconnect = async () => {
    if (!window.confirm('Deseja realmente desconectar o WhatsApp do estúdio?')) return;
    setLoading(true);
    try {
      await evolutionApi.disconnectInstance();
      setConnectionState('close');
      setQrCode(null);
      setFeedbackMsg({ type: 'success', text: 'Instância desconectada com sucesso.' });
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Erro ao desconectar: ' + (e.message || '') });
    } finally {
      setLoading(false);
    }
  };

  // Salvar Webhook na Evolution API
  const handleSaveWebhook = async () => {
    setWebhookSaving(true);
    setFeedbackMsg(null);
    try {
      await evolutionApi.setWebhook(webhookUrl);
      setFeedbackMsg({ type: 'success', text: 'Webhook registrado com sucesso na Evolution API!' });
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Erro ao configurar webhook: ' + (e.message || '') });
    } finally {
      setWebhookSaving(false);
    }
  };

  // Simula mensagem recebida localmente para testar o painel
  const handleSimulateIncoming = async () => {
    setTestSending(true);
    try {
      await api.receberMensagem(testNumber, testNome, testTexto);
      setFeedbackMsg({
        type: 'success',
        text: `Mensagem de "${testNome}" simulada com sucesso! Verifique a aba de Conversas.`,
      });
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: 'Erro ao simular: ' + e.message });
    } finally {
      setTestSending(false);
    }
  };

  // Efeito inicial e polling a cada 4 segundos
  useEffect(() => {
    checkStatus();
    const interval = setInterval(() => {
      checkStatus();
      setAutoRefreshCount(c => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Se o QR Code expirar (após várias tentativas) ou se estiver conectando, tenta renovar
  useEffect(() => {
    if (connectionState === 'connecting' && !qrCode && !loading) {
      fetchQrCode();
    }
  }, [connectionState]);

  const isConnected = connectionState === 'open';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#8CBDAD]/15 text-[#517566]">
              <Smartphone className="w-6 h-6 text-[#517566]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B0E11] tracking-tight">Conexão WhatsApp</h1>
              <p className="text-sm text-[#4A5568]">
                Integração oficial via Evolution API para o estúdio Hype Tatu
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge & Quick Refresh */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : connectionState === 'connecting'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isConnected
              ? 'WhatsApp Conectado ✓'
              : connectionState === 'connecting'
              ? 'Conectando / Lendo...'
              : 'Desconectado'}
          </div>

          <button
            onClick={() => {
              setLoading(true);
              checkStatus();
            }}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E2E6EA] bg-white text-[#4A5568] hover:bg-[#F0F2F5] transition"
            title="Atualizar Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#8CBDAD]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Grid Principal: Conexão / QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Status & Ações */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E6EA] shadow-sm">
            <h2 className="text-base font-bold text-[#0B0E11] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#8CBDAD]" />
              Instância Evolution API
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#E2E6EA]">
                <span className="text-[#4A5568]">Instância Ativa:</span>
                <span className="font-mono font-semibold text-[#0B0E11] bg-[#F0F2F5] px-2.5 py-1 rounded">
                  hype-tatu
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E2E6EA]">
                <span className="text-[#4A5568]">Servidor Evolution:</span>
                <span className="text-xs font-mono text-[#4A5568] truncate max-w-[260px]">
                  evolution-api-production-6044.up.railway.app
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E2E6EA]">
                <span className="text-[#4A5568]">Status de Conexão:</span>
                <span className="font-medium text-[#0B0E11] capitalize">{connectionState}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#E2E6EA]">
                <span className="text-[#4A5568]">Última verificação:</span>
                <span className="text-xs text-[#8A96A3]">Atualizando a cada 4s</span>
              </div>
            </div>

            {/* Ações de Conexão */}
            <div className="mt-6 pt-4 border-t border-[#E2E6EA] flex flex-wrap items-center gap-3">
              {isConnected ? (
                <>
                  <div className="flex-1 bg-emerald-50 rounded-xl p-3.5 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Pronto para envio e recebimento de mensagens
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      As mensagens chegam automaticamente no módulo Conversas.
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium text-sm flex items-center gap-2 transition"
                  >
                    <Power className="w-4 h-4" />
                    Desconectar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={fetchQrCode}
                    disabled={qrLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-white font-bold text-sm flex items-center gap-2 transition shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${qrLoading ? 'animate-spin' : ''}`} />
                    {qrCode ? 'Atualizar QR Code' : 'Conectar WhatsApp (Gerar QR Code)'}
                  </button>

                  <button
                    onClick={checkStatus}
                    className="px-4 py-2.5 rounded-xl border border-[#E2E6EA] bg-white text-[#4A5568] hover:bg-[#F0F2F5] font-medium text-sm transition"
                  >
                    Checar Conexão
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Configuração de Webhook */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E6EA] shadow-sm">
            <h2 className="text-base font-bold text-[#0B0E11] mb-2 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#8CBDAD]" />
              Configuração do Webhook
            </h2>
            <p className="text-xs text-[#4A5568] mb-4">
              Endpoint para o qual a Evolution API encaminha as mensagens recebidas (
              <code className="text-[#517566] font-mono">MESSAGES_UPSERT</code>).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A5568] mb-1">
                  URL do Webhook
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-dominio.com/webhook/whatsapp"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-[#E2E6EA] bg-[#F0F2F5] text-[#0B0E11] focus:bg-white focus:outline-none focus:border-[#8CBDAD]"
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={webhookSaving}
                    className="px-4 py-2 rounded-xl bg-[#1A1F25] hover:bg-[#252B33] text-white font-medium text-xs flex items-center gap-1.5 transition"
                  >
                    {webhookSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Salvar
                  </button>
                </div>
              </div>

              <div className="bg-[#F5F6FA] rounded-xl p-3 border border-[#E2E6EA] text-xs text-[#4A5568] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Eventos Configurados:</span>
                  <span className="font-mono text-[#517566] font-semibold">
                    MESSAGES_UPSERT, CONNECTION_UPDATE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modo Atual:</span>
                  <span className="font-semibold text-[#0B0E11]">
                    Vite Dev Server Proxy + Supabase Edge Function
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Painel do QR Code & Instruções */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E6EA] shadow-sm flex flex-col items-center text-center">
            <h2 className="text-base font-bold text-[#0B0E11] mb-1">
              {isConnected ? 'Dispositivo Conectado' : 'Leitura do QR Code'}
            </h2>
            <p className="text-xs text-[#8A96A3] mb-6">
              {isConnected
                ? 'Seu WhatsApp está emparelhado e pronto para operar'
                : 'Escaneie com a câmera do seu WhatsApp para conectar'}
            </p>

            {/* Container do QR Code */}
            <div className="w-64 h-64 bg-[#F5F6FA] rounded-2xl border-2 border-dashed border-[#E2E6EA] flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {isConnected ? (
                <div className="flex flex-col items-center p-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <span className="font-bold text-sm text-[#0B0E11]">Sessão Ativa</span>
                  <span className="text-xs text-[#4A5568] mt-1 font-mono">hype-tatu</span>
                </div>
              ) : qrCode ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-full h-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : qrLoading ? (
                <div className="flex flex-col items-center text-[#4A5568] space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#8CBDAD]" />
                  <span className="text-xs font-medium">Gerando QR Code...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-[#8A96A3] p-4">
                  <Smartphone className="w-12 h-12 mb-2 text-[#AAB6BE]" />
                  <span className="text-xs">Nenhum QR Code ativo no momento.</span>
                  <button
                    onClick={fetchQrCode}
                    className="mt-3 text-xs font-bold text-[#517566] hover:underline"
                  >
                    Clique aqui para gerar
                  </button>
                </div>
              )}
            </div>

            {/* Código de Pareamento alternativo se houver */}
            {pairingCode && !isConnected && (
              <div className="mt-4 bg-[#F0F2F5] px-4 py-2 rounded-xl text-xs font-mono text-[#0B0E11] font-bold">
                Código de Pareamento: <span className="text-[#517566]">{pairingCode}</span>
              </div>
            )}

            {/* Instruções passo a passo */}
            <div className="w-full mt-6 text-left border-t border-[#E2E6EA] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5568] mb-3">
                Como conectar:
              </h3>
              <ol className="text-xs text-[#4A5568] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#8CBDAD]/20 text-[#517566] font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Abra o <strong>WhatsApp</strong> no seu celular.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#8CBDAD]/20 text-[#517566] font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Toque em <strong>Mais opções</strong> (Android) ou <strong>Configurações</strong> (iPhone).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#8CBDAD]/20 text-[#517566] font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Selecione <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#8CBDAD]/20 text-[#517566] font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span>Aponte a câmera para o QR Code acima.</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Teste Rápido de Simulação de Mensagem Recebida */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E6EA] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B0E11] mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#8CBDAD]" />
              Simulador de Teste (Mensagem Recebida)
            </h3>
            <p className="text-xs text-[#8A96A3] mb-3">
              Teste o fluxo de conversa simulando uma mensagem que chegaria via webhook.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#4A5568] font-medium mb-1">Nome do Remetente</label>
                <input
                  type="text"
                  value={testNome}
                  onChange={e => setTestNome(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E2E6EA] bg-[#F5F6FA] text-[#0B0E11]"
                />
              </div>
              <div>
                <label className="block text-[#4A5568] font-medium mb-1">Número</label>
                <input
                  type="text"
                  value={testNumber}
                  onChange={e => setTestNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E2E6EA] bg-[#F5F6FA] text-[#0B0E11]"
                />
              </div>
              <div>
                <label className="block text-[#4A5568] font-medium mb-1">Mensagem</label>
                <input
                  type="text"
                  value={testTexto}
                  onChange={e => setTestTexto(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E2E6EA] bg-[#F5F6FA] text-[#0B0E11]"
                />
              </div>
              <button
                onClick={handleSimulateIncoming}
                disabled={testSending}
                className="w-full mt-2 py-2 rounded-xl bg-[#517566] hover:bg-[#3d5a4e] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                Simular Recebimento no Painel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WhatsAppConfigPage;
