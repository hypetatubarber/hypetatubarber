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

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/admin/change-password') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const { targetUserId, newPassword } = JSON.parse(bodyStr || '{}');

              if (!targetUserId || !newPassword || newPassword.length < 6) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Dados inválidos. A senha deve ter no mínimo 6 caracteres.' }));
              }

              const authHeader = (req.headers['authorization'] as string) || '';
              const token = authHeader.replace(/^Bearer\s+/i, '');

              const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tdafyozvrhkbshmhhfik.supabase.co';
              const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

              if (!serviceRoleKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Chave de serviço SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' }));
              }

              const { createClient } = await import('@supabase/supabase-js');
              const adminSb = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              });

              if (token) {
                const { data: userData, error: userErr } = await adminSb.auth.getUser(token);
                if (userErr || !userData?.user) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Sessão inválida ou expirada. Faça login novamente.' }));
                }

                const { data: usuarioPerfil } = await adminSb
                  .from('usuarios')
                  .select('role, status')
                  .eq('id', userData.user.id)
                  .single();

                if (usuarioPerfil?.role !== 'master' || usuarioPerfil?.status !== 'ativo') {
                  res.statusCode = 403;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Apenas usuários Master ativos têm permissão para trocar senhas.' }));
                }
              }

              const updateRes = await adminSb.auth.admin.updateUserById(targetUserId, {
                password: newPassword,
              });

              if (updateRes.error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: updateRes.error.message }));
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'Senha atualizada com sucesso!' }));
            } catch (err: any) {
              console.error('[Admin API Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message || 'Erro interno.' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), whatsappWebhookPlugin(), adminApiPlugin()],
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
