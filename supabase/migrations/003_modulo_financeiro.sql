-- ============================================================================
-- HYPE TATU — MIGRATION 003: MÓDULO FINANCEIRO, COMISSÕES & CONTROLE DE CUSTOS
-- Caminho: supabase/migrations/003_modulo_financeiro.sql
-- ============================================================================

-- 1. Adicionar colunas de comissão e repasse na tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS comissao_barbearia NUMERIC(5, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS comissao_tatuagem NUMERIC(5, 2) DEFAULT 60.00,
ADD COLUMN IF NOT EXISTS comissao_piercing NUMERIC(5, 2) DEFAULT 55.00,
ADD COLUMN IF NOT EXISTS tipo_repasse VARCHAR(20) DEFAULT 'semanal';

-- 2. Adicionar status de pagamento no agendamento
ALTER TABLE public.agendamentos
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pagamento_id VARCHAR(100);

-- 3. Tabela de Pagamentos (Financeiro)
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id VARCHAR(100) PRIMARY KEY,
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(150) NOT NULL,
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(150) NOT NULL,
    servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
    servico_nome VARCHAR(150) NOT NULL,
    categoria_nome VARCHAR(50) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME,
    valor_bruto NUMERIC(10, 2) NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    parcelas INTEGER DEFAULT 1,
    taxa_maquininha_pct NUMERIC(5, 2) DEFAULT 0.00,
    taxa_maquininha_valor NUMERIC(10, 2) DEFAULT 0.00,
    valor_liquido_transacao NUMERIC(10, 2) NOT NULL,
    comissao_pct NUMERIC(5, 2) NOT NULL,
    comissao_valor NUMERIC(10, 2) NOT NULL,
    valor_liquido_estudio NUMERIC(10, 2) NOT NULL,
    status_repasse VARCHAR(20) NOT NULL DEFAULT 'a_pagar' CHECK (status_repasse IN ('a_pagar', 'pago')),
    repasse_id VARCHAR(100),
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Custos Fixos
CREATE TABLE IF NOT EXISTS public.custos_fixos (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    valor_mensal NUMERIC(10, 2) NOT NULL,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    categoria VARCHAR(50) DEFAULT 'Geral',
    status_mes JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Histórico de Repasses de Comissões
CREATE TABLE IF NOT EXISTS public.repasses_comissao (
    id VARCHAR(100) PRIMARY KEY,
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(150) NOT NULL,
    periodo_inicio DATE,
    periodo_fim DATE,
    valor_total NUMERIC(10, 2) NOT NULL,
    pagamentos_ids TEXT[] DEFAULT '{}',
    pago_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    pago_por VARCHAR(150),
    observacoes TEXT
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON public.pagamentos(data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_colaborador ON public.pagamentos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status_repasse ON public.pagamentos(status_repasse);
CREATE INDEX IF NOT EXISTS idx_repasses_colaborador ON public.repasses_comissao(colaborador_id);

-- 7. Row Level Security (RLS)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses_comissao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total pagamentos" ON public.pagamentos;
CREATE POLICY "Acesso total pagamentos" ON public.pagamentos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total custos_fixos" ON public.custos_fixos;
CREATE POLICY "Acesso total custos_fixos" ON public.custos_fixos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total repasses_comissao" ON public.repasses_comissao;
CREATE POLICY "Acesso total repasses_comissao" ON public.repasses_comissao FOR ALL TO anon, authenticated USING (true);
