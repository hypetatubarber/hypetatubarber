-- ============================================================================
-- HYPE TATU — MIGRATION 002: TATUADORES ROTATIVOS & SOLICITAÇÕES DE JOB
-- Caminho: supabase/migrations/002_tatuadores_rotativos.sql
-- ============================================================================

-- 1. Campos para Tatuadores Rotativos na tabela de usuários
ALTER TABLE public.usuarios 
  ADD COLUMN IF NOT EXISTS tipo_colaborador VARCHAR(20) DEFAULT 'fixo',
  ADD COLUMN IF NOT EXISTS estilos_tatuagem TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS comissao_porcentagem NUMERIC(5, 2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS status_disponibilidade VARCHAR(20) DEFAULT 'disponivel',
  ADD COLUMN IF NOT EXISTS notificacoes_ativas BOOLEAN DEFAULT true;

-- 2. Tabela de Solicitações de Job para Tatuadores Rotativos
CREATE TABLE IF NOT EXISTS public.solicitacoes_rotativo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(150) NOT NULL,
    cliente_telefone VARCHAR(30),
    estilo VARCHAR(100) NOT NULL,
    tamanho VARCHAR(20) NOT NULL,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    valor_estimado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'aceito', 'cancelado')),
    aceito_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    aceito_por_nome VARCHAR(150),
    aceito_em TIMESTAMPTZ,
    recusado_por_ids TEXT[] DEFAULT '{}',
    criado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_por_nome VARCHAR(150),
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS
ALTER TABLE public.solicitacoes_rotativo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total solicitacoes_rotativo" ON public.solicitacoes_rotativo;
CREATE POLICY "Acesso total solicitacoes_rotativo" ON public.solicitacoes_rotativo FOR ALL TO anon, authenticated USING (true);

-- 4. Adicionar ao Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_rotativo;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
