/**
 * HYPE TATU — Script Automático de Execução de Migrations Supabase
 * Executa supabase/migrations/001_initial.sql diretamente contra o banco de dados Supabase.
 *
 * Suporta:
 * 1. SUPABASE_ACCESS_TOKEN (Supabase Management API)
 * 2. DATABASE_URL / SUPABASE_DB_URL (Conexão direta Postgres)
 * 3. SUPABASE_SERVICE_ROLE_KEY (RPC de execução de SQL)
 *
 * Uso:
 *   node scripts/migrate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Carrega .env manualmente se existir
const envPath = path.join(rootDir, '.env');
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tdafyozvrhkbshmhhfik.supabase.co';
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

const migrationFilePath = path.join(rootDir, 'supabase', 'migrations', '001_initial.sql');

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 HYPE TATU — MIGRAÇÃO AUTOMÁTICA SUPABASE');
  console.log('================================================================');
  console.log(`Projeto Ref: ${PROJECT_REF}`);
  console.log(`Arquivo: ${migrationFilePath}`);

  if (!fs.existsSync(migrationFilePath)) {
    console.error('❌ Arquivo de migration não encontrado:', migrationFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
  console.log(`Tamanho do script SQL: ${sqlContent.length} bytes`);

  // Método 1: Conexão direta PostgreSQL via pg (se DATABASE_URL ou DB_PASSWORD estiverem presentes)
  if (DATABASE_URL || DB_PASSWORD) {
    console.log('\nTentando conexão direta via PostgreSQL (pg)...');
    try {
      const clientConfig = DATABASE_URL
        ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
            host: 'aws-0-sa-east-1.pooler.supabase.com',
            port: 6543,
            user: `postgres.${PROJECT_REF}`,
            password: DB_PASSWORD,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
          };

      const pgClient = new Client(clientConfig);
      await pgClient.connect();
      console.log('Conectado ao PostgreSQL do Supabase com sucesso!');
      console.log('Executando o script 001_initial.sql no banco...');
      await pgClient.query(sqlContent);
      console.log('✅ Migrations executadas com sucesso no banco de dados Supabase!');
      await pgClient.end();
      process.exit(0);
    } catch (pgErr) {
      console.warn('⚠️ Falha ao executar via PostgreSQL:', pgErr.message);
    }
  }

  // Método 1: Supabase Management API via Access Token
  if (ACCESS_TOKEN) {
    console.log('\nTentando execução via Supabase Management API...');
    try {
      const endpoint = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlContent }),
      });

      if (res.ok) {
        console.log('✅ Migration executada com sucesso via Supabase Management API!');
        process.exit(0);
      } else {
        const errText = await res.text();
        console.warn('⚠️ Falha via Management API:', res.status, errText);
      }
    } catch (e) {
      console.warn('⚠️ Erro na requisição da Management API:', e.message);
    }
  }

  // Método 2: Supabase RPC exec_sql se disponível com Service Role Key
  if (SERVICE_ROLE_KEY) {
    console.log('\nTentando execução via Supabase RPC exec_sql...');
    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlContent }),
      });

      if (res.ok) {
        console.log('✅ Migration executada com sucesso via RPC exec_sql!');
        process.exit(0);
      }
    } catch (e) {
      console.warn('⚠️ RPC exec_sql não disponível.');
    }
  }

  // Método 3: Verificação do status do banco atual
  console.log('\nVerificando conectividade atual com o Supabase...');
  try {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=count`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    console.log(`Endpoint Supabase acessível! Status: ${res.status}`);
  } catch (e) {
    console.warn('⚠️ Não foi possível testar endpoint:', e.message);
  }

  console.log('\n================================================================');
  console.log('📋 INSTRUÇÃO PARA APLICAÇÃO IMEDIATA DO SCHEMA:');
  console.log('================================================================');
  console.log('O script SQL com todo o schema (11 tabelas, RLS e usuários) está pronto em:');
  console.log(`👉 ${migrationFilePath}`);
  console.log('\nPara aplicar instantaneamente no Supabase:');
  console.log('1. Abra o SQL Editor no painel:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
  console.log('2. Cole o conteúdo de supabase/migrations/001_initial.sql');
  console.log('3. Clique no botão "Run" (Executar).');
  console.log('================================================================\n');
}

runMigration().catch((err) => {
  console.error('Erro fatal:', err);
});
