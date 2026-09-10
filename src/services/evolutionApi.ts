/**
 * Serviço de Integração com a Evolution API (WhatsApp)
 * Hype Tatu — Estúdio de Tatuagem, Barbearia & Piercing
 */

import { EvolutionConnectionState, EvolutionQrResponse } from '../types';

export const EVOLUTION_CONFIG = {
  apiUrl: (import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution-api-production-6044.up.railway.app').replace(/\/$/, ''),
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'hype-tatu-api-2024',
  instance: import.meta.env.VITE_EVOLUTION_INSTANCE || 'hype-tatu',
  backendUrl: (import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')).replace(/\/$/, ''),
};

const getHeaders = () => ({
  apikey: EVOLUTION_CONFIG.apiKey,
  'Content-Type': 'application/json',
});

export const evolutionApi = {
  /**
   * Consulta o estado da conexão da instância (open, close, connecting, disconnected)
   */
  async getConnectionState(): Promise<EvolutionConnectionState> {
    try {
      const res = await fetch(
        `${EVOLUTION_CONFIG.apiUrl}/instance/connectionState/${EVOLUTION_CONFIG.instance}`,
        { headers: getHeaders() }
      );
      if (!res.ok) {
        throw new Error(`Erro ${res.status} ao consultar status da conexão.`);
      }
      const data = await res.json();
      const state = data?.instance?.state || (data?.state as any) || 'disconnected';
      return {
        instanceName: EVOLUTION_CONFIG.instance,
        state: state === 'open' ? 'open' : state === 'connecting' ? 'connecting' : 'disconnected',
      };
    } catch (err) {
      console.warn('[Evolution API] Falha ao consultar estado:', err);
      return {
        instanceName: EVOLUTION_CONFIG.instance,
        state: 'disconnected',
      };
    }
  },

  /**
   * Solicita o QR Code para conectar o WhatsApp
   */
  async connectInstance(): Promise<EvolutionQrResponse> {
    try {
      const res = await fetch(
        `${EVOLUTION_CONFIG.apiUrl}/instance/connect/${EVOLUTION_CONFIG.instance}`,
        { headers: getHeaders() }
      );
      if (!res.ok) {
        throw new Error(`Erro ${res.status} ao obter QR Code da Evolution API.`);
      }
      const data = await res.json();
      return {
        base64: data.base64,
        code: data.code,
        pairingCode: data.pairingCode,
        count: data.count,
      };
    } catch (err: any) {
      console.error('[Evolution API] Erro ao conectar instância:', err);
      throw err;
    }
  },

  /**
   * Desconecta a instância do WhatsApp (Logout)
   */
  async disconnectInstance(): Promise<boolean> {
    try {
      const res = await fetch(
        `${EVOLUTION_CONFIG.apiUrl}/instance/logout/${EVOLUTION_CONFIG.instance}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );
      return res.ok;
    } catch (err) {
      console.error('[Evolution API] Erro ao desconectar instância:', err);
      return false;
    }
  },

  /**
   * Envia uma mensagem de texto pelo WhatsApp
   * @param numero Número com DDD (ex: 5571994111967 ou (71) 99411-1967)
   * @param texto Conteúdo da mensagem
   */
  async sendWhatsAppMessage(numero: string, texto: string): Promise<any> {
    // Limpa formatação do número deixando apenas dígitos
    let cleanNumber = numero.replace(/\D/g, '');
    
    // Se não tiver DDI (55), adiciona se for número brasileiro padrão
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = `55${cleanNumber}`;
    }

    const payload = {
      number: cleanNumber,
      text: texto,
    };

    try {
      const res = await fetch(
        `${EVOLUTION_CONFIG.apiUrl}/message/sendText/${EVOLUTION_CONFIG.instance}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('[Evolution API] Falha no envio da mensagem:', res.status, errorBody);
        throw new Error(`Falha no envio (${res.status}): ${errorBody}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('[Evolution API] Erro sendWhatsAppMessage:', err);
      throw err;
    }
  },

  /**
   * Configura o webhook na Evolution API para envio de eventos
   * @param webhookUrl URL completa que receberá o POST /webhook/whatsapp
   */
  async setWebhook(webhookUrl?: string): Promise<boolean> {
    const targetUrl = webhookUrl || `${EVOLUTION_CONFIG.backendUrl}/webhook/whatsapp`;
    
    const body = {
      url: targetUrl,
      webhook_by_events: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    };

    try {
      const res = await fetch(
        `${EVOLUTION_CONFIG.apiUrl}/webhook/set/${EVOLUTION_CONFIG.instance}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        console.log('[Evolution API] Webhook configurado com sucesso para:', targetUrl);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[Evolution API] Não foi possível registrar o webhook agora:', err);
      return false;
    }
  },

  /**
   * Registro automático do webhook na inicialização da aplicação
   */
  async autoRegisterWebhook(): Promise<void> {
    // Evita chamadas repetidas na mesma sessão
    if ((window as any).__evolutionWebhookRegistered) return;
    (window as any).__evolutionWebhookRegistered = true;

    try {
      await this.setWebhook();
    } catch (e) {
      // Falha silenciosa em ambientes sem backend público
    }
  },
};
