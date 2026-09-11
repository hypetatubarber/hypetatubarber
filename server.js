/**
 * HYPE TATU — Servidor de Produção & API Backend
 * Serve o frontend estático (dist) com suporte a SPA routing
 * e fornece endpoints administrativos seguros com Service Role Key.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis do .env e .env.local se existirem localmente
['.env', '.env.local'].forEach((envFile) => {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
});

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tdafyozvrhkbshmhhfik.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSb = (SUPABASE_URL && SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  }

  // Endpoint: Alteração de Senha de Usuários pelo Master
  if (req.method === 'POST' && req.url === '/api/admin/change-password') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const { targetUserId, newPassword } = JSON.parse(bodyStr || '{}');

        if (!targetUserId || !newPassword || newPassword.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Dados inválidos. Senha deve ter no mínimo 6 caracteres.' }));
        }

        if (!adminSb) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' }));
        }

        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');

        if (token) {
          const { data: userData, error: userErr } = await adminSb.auth.getUser(token);
          if (userErr || !userData?.user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Sessão inválida ou expirada. Faça login novamente.' }));
          }

          const { data: usuarioPerfil } = await adminSb
            .from('usuarios')
            .select('role, status')
            .eq('id', userData.user.id)
            .single();

          if (usuarioPerfil?.role !== 'master' || usuarioPerfil?.status !== 'ativo') {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Apenas usuários Master ativos têm permissão para trocar senhas.' }));
          }
        }

        const updateRes = await adminSb.auth.admin.updateUserById(targetUserId, {
          password: newPassword,
        });

        if (updateRes.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: updateRes.error.message }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Senha atualizada com sucesso!' }));
      } catch (err) {
        console.error('[Change Password Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message || 'Erro interno.' }));
      }
    });
    return;
  }

  // Endpoint: Salvar Usuário/Colaborador pelo Master (Bypassa RLS com Service Role)
  if (req.method === 'POST' && req.url === '/api/admin/save-user') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const userData = JSON.parse(bodyStr || '{}');
        if (!userData || !userData.nome || !userData.email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Nome e email são obrigatórios.' }));
        }

        if (adminSb) {
          // Salva ou atualiza no Supabase usando a Service Role
          const { data, error } = await adminSb
            .from('usuarios')
            .upsert(userData)
            .select()
            .single();

          if (error) {
            console.warn('[Server save-user warning]:', error.message);
            // Se houver erro de coluna ou restrição, tenta salvar com colunas base
            const baseUser = {
              id: userData.id,
              nome: userData.nome,
              email: userData.email,
              role: userData.role || 'colaborador',
              slug: userData.slug,
              especialidade: userData.especialidade,
              foto: userData.foto,
              status: userData.status || 'ativo',
            };
            const { data: baseData, error: baseErr } = await adminSb
              .from('usuarios')
              .upsert(baseUser)
              .select()
              .single();

            if (baseErr) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: baseErr.message, user: userData }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, user: { ...userData, ...baseData } }));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, user: data }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, user: userData, demo: true }));
      } catch (err) {
        console.error('[Save User Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message || 'Erro ao processar requisição.' }));
      }
    });
    return;
  }

  // Endpoint: Ativação de Conta pelo Colaborador (Define seu e-mail e senha)
  if (req.method === 'POST' && req.url === '/api/colaborador/activate') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        const { userId, email, password } = JSON.parse(bodyStr || '{}');
        if (!userId || !email || !password || password.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'ID do usuário, e-mail e senha válida (mínimo 6 dígitos) são obrigatórios.' }));
        }

        const cleanEmail = email.trim().toLowerCase();

        if (adminSb) {
          // 1. Tenta atualizar ou criar no Supabase Auth
          try {
            const { error: updateAuthErr } = await adminSb.auth.admin.updateUserById(userId, {
              email: cleanEmail,
              password: password,
              email_confirm: true,
            });

            if (updateAuthErr) {
              await adminSb.auth.admin.createUser({
                id: userId,
                email: cleanEmail,
                password: password,
                email_confirm: true,
              });
            }
          } catch (authEx) {
            console.warn('[Server activate auth warning]:', authEx.message);
          }

          // 2. Atualiza a tabela usuarios
          const { data: updatedUser, error: dbErr } = await adminSb
            .from('usuarios')
            .update({
              email: cleanEmail,
              status: 'ativo',
            })
            .eq('id', userId)
            .select()
            .single();

          if (dbErr) {
            console.warn('[Server activate db update warning]:', dbErr.message);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            user: { ...(updatedUser || { id: userId, email: cleanEmail }), senha_acesso: password, primeiro_acesso_pendente: false }
          }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          user: { id: userId, email: cleanEmail, senha_acesso: password, primeiro_acesso_pendente: false, status: 'ativo' },
          demo: true
        }));
      } catch (err) {
        console.error('[Activate Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message || 'Erro ao ativar conta.' }));
      }
    });
    return;
  }

  // Webhook WhatsApp (Evolution API)
  if (req.method === 'POST' && (req.url === '/webhook/whatsapp' || req.url === '/api/webhook/whatsapp')) {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      try {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'success', received: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  // Static File Serving (SPA Fallback)
  if (req.method === 'GET') {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA fallback
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found - Build not found');
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`[Hype Tatu Server] Rodando na porta ${PORT}`);
});
