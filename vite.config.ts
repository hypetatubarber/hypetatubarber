import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function whatsappWebhookPlugin(): Plugin {
  return {
    name: 'whatsapp-webhook-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && (req.url === '/webhook/whatsapp' || req.url === '/api/webhook/whatsapp')) {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(bodyStr || '{}');
              console.log('[Webhook WhatsApp] Recebido evento:', payload.event || payload.type);

              // Processa messages.upsert
              if (payload.event === 'messages.upsert' || payload.event === 'MESSAGES_UPSERT') {
                const msgData = payload.data;
                const isFromMe = msgData?.key?.fromMe;
                
                if (!isFromMe) {
                  const remoteJid = msgData?.key?.remoteJid || '';
                  const numero = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
                  const pushName = msgData?.pushName || '';
                  const conteudo = msgData?.message?.conversation || 
                                   msgData?.message?.extendedTextMessage?.text || 
                                   msgData?.message?.imageMessage?.caption || 
                                   '[Mídia/Áudio recebido]';
                  const id = msgData?.key?.id;
                  const timestamp = msgData?.messageTimestamp 
                    ? new Date(Number(msgData.messageTimestamp) * 1000).toISOString() 
                    : new Date().toISOString();

                  if (numero && conteudo) {
                    server.ws.send({
                      type: 'custom',
                      event: 'whatsapp:message',
                      data: { numero, pushName, conteudo, id, timestamp }
                    });
                  }
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ status: 'success', received: true }));
            } catch (err) {
              console.error('[Webhook WhatsApp] Erro ao processar:', err);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
            }
          });
        } else if (req.method === 'GET' && req.url === '/webhook/whatsapp') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ status: 'online', endpoint: '/webhook/whatsapp' }));
        } else {
          next();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), whatsappWebhookPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
