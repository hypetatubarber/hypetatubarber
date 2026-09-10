/**
 * Standalone Node.js Webhook Server para Evolution API
 * Pode ser hospedado no Railway, Render, VPS ou rodado localmente.
 * Executar: node server/webhook.js
 */

import http from 'http';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'hype-tatu-whatsapp-webhook' }));
  }

  if (req.method === 'POST' && (req.url === '/webhook/whatsapp' || req.url === '/')) {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyStr || '{}');
        console.log('[Webhook Server] Evento recebido:', payload.event);

        if (payload.event === 'messages.upsert' || payload.event === 'MESSAGES_UPSERT') {
          const data = payload.data;
          const key = data?.key;

          if (key?.fromMe) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'ignored_from_me' }));
          }

          const remoteJid = key?.remoteJid || '';
          const numero = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
          const nomeRemetente = data?.pushName || '';
          const conteudo =
            data?.message?.conversation ||
            data?.message?.extendedTextMessage?.text ||
            data?.message?.imageMessage?.caption ||
            '[Mídia recebida]';

          const messageId = key?.id || `msg-${Date.now()}`;
          const timestamp = data?.messageTimestamp
            ? new Date(Number(data.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString();

          if (supabase && numero && conteudo) {
            const cleanNum = numero.replace(/\D/g, '');
            const { data: convData } = await supabase
              .from('conversas')
              .select('*')
              .or(`numero.eq.${numero},numero.eq.${cleanNum}`)
              .maybeSingle();

            let conversaId = convData?.id;

            if (!conversaId) {
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
                  ultima_mensagem_em: timestamp,
                  nao_lidas: 1,
                  status: 'ativa',
                })
                .select()
                .single();

              if (novaConv) conversaId = novaConv.id;
            } else {
              await supabase
                .from('conversas')
                .update({
                  ultima_mensagem: conteudo,
                  ultima_mensagem_em: timestamp,
                  nao_lidas: (convData.nao_lidas || 0) + 1,
                  atualizado_em: timestamp,
                })
                .eq('id', conversaId);
            }

            if (conversaId) {
              await supabase.from('mensagens').insert({
                id: messageId,
                conversa_id: conversaId,
                numero,
                conteudo,
                direcao: 'recebida',
                status: 'entregue',
                criado_em: timestamp,
              });
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, processed: true }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'received' }));
      } catch (err) {
        console.error('[Webhook Server Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[Hype Tatu Webhook Server] Rodando na porta ${PORT}`);
});
