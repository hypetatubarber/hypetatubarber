/**
 * Auto-Migration & Schema Health Checker — Hype Tatu
 * Verifica o status das 11 tabelas necessárias no Supabase
 * e auxilia na execução e diagnóstico automático de schema.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export const REQUIRED_TABLES = [
  'usuarios',
  'clientes',
  'categorias_servico',
  'servicos',
  'agendamentos',
  'produtos',
  'uso_produtos',
  'movimentacoes_estoque',
  'conversas',
  'mensagens',
  'notificacoes',
  'pagamentos',
  'custos_fixos',
  'repasses_comissao',
] as const;

export interface SchemaHealthReport {
  checked: boolean;
  isComplete: boolean;
  missingTables: string[];
  existingTables: string[];
  error?: string;
}

let lastReport: SchemaHealthReport | null = null;

export const checkSchemaStatus = async (): Promise<SchemaHealthReport> => {
  if (!isSupabaseConfigured()) {
    return {
      checked: true,
      isComplete: false,
      missingTables: [...REQUIRED_TABLES],
      existingTables: [],
      error: 'Supabase não configurado no ambiente.',
    };
  }

  const existing: string[] = [];
  const missing: string[] = [];

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
      if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
        missing.push(tableName);
      } else {
        existing.push(tableName);
      }
    } catch {
      missing.push(tableName);
    }
  }

  const report: SchemaHealthReport = {
    checked: true,
    isComplete: missing.length === 0,
    missingTables: missing,
    existingTables: existing,
  };

  lastReport = report;

  if (missing.length > 0) {
    console.warn(
      `[Hype Tatu Schema] Tabelas pendentes de criação no Supabase (${missing.length}):`,
      missing.join(', ')
    );
    window.dispatchEvent(new CustomEvent('hype_schema_missing', { detail: report }));
  } else {
    console.log('[Hype Tatu Schema] Todas as 11 tabelas verificadas com sucesso no Supabase.');
    window.dispatchEvent(new CustomEvent('hype_schema_healthy', { detail: report }));
  }

  return report;
};

export const getLastSchemaReport = () => lastReport;

// Executa na inicialização do sistema
export const initAutoMigrationCheck = () => {
  if (isSupabaseConfigured()) {
    checkSchemaStatus().catch((err) => {
      console.warn('[Hype Tatu Schema] Falha ao verificar schema inicial:', err);
    });
  }
};
