-- ============================================================================
-- HYPE TATU — MIGRATION 001: SCHEMA INICIAL, CORREÇÃO DE AUTH & RLS
-- Caminho: supabase/migrations/001_initial.sql
-- ============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CORREÇÃO CRÍTICA DO GOTRUE ("Database error querying schema")
-- Corrige colunas com valor NULL em auth.users que causam erro 500 no driver Go
-- ============================================================================
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL 
   OR email_change_token_new IS NULL 
   OR email_change IS NULL;

-- ============================================================================
-- 3. CRIAÇÃO DAS TABELAS DO SISTEMA HYPE TATU
-- ============================================================================

-- 3.1 Tabela de Usuários / Colaboradores
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('master', 'recepcionista', 'colaborador')),
    slug VARCHAR(100) UNIQUE,
    especialidade VARCHAR(100),
    foto TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 Tabela de Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    avatar_url TEXT,
    foto TEXT,
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.3 Categorias de Serviço
CREATE TABLE IF NOT EXISTS public.categorias_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(20) NOT NULL DEFAULT '#8CBDAD',
    cor_identificacao VARCHAR(20) DEFAULT '#8CBDAD'
);

-- 3.4 Serviços do Estúdio
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.categorias_servico(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL DEFAULT 30,
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN NOT NULL DEFAULT true
);

-- 3.5 Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado')),
    observacoes TEXT,
    criado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.6 Produtos & Estoque
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un' CHECK (unidade IN ('ml', 'un', 'g', 'cx', 'par')),
    custo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estoque_atual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estoque_minimo NUMERIC(10, 2) NOT NULL DEFAULT 5
);

-- 3.7 Uso de Produtos por Colaboradores
CREATE TABLE IF NOT EXISTS public.uso_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    quantidade NUMERIC(10, 2) NOT NULL CHECK (quantidade > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.8 Movimentações de Estoque (Auditoria)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    data TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- 3.9 Conversas (WhatsApp)
CREATE TABLE IF NOT EXISTS public.conversas (
    id VARCHAR(100) PRIMARY KEY,
    numero VARCHAR(50) NOT NULL,
    whatsapp_numero VARCHAR(50),
    nome VARCHAR(150) NOT NULL,
    whatsapp_nome VARCHAR(150),
    ultima_mensagem TEXT,
    ultima_mensagem_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    nao_lidas INTEGER NOT NULL DEFAULT 0,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    foto TEXT,
    avatar_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.10 Mensagens (WhatsApp)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id VARCHAR(100) PRIMARY KEY,
    conversa_id VARCHAR(100) NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
    direcao VARCHAR(10) NOT NULL CHECK (direcao IN ('enviada', 'recebida')),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'texto',
    media_url TEXT,
    numero VARCHAR(50),
    status VARCHAR(20) DEFAULT 'entregue',
    enviada_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    lida BOOLEAN DEFAULT false,
    enviada_por_usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.11 Notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id VARCHAR(100) PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    link VARCHAR(255) DEFAULT '/equipe',
    lida BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. ATIVAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uso_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Acesso total usuarios" ON public.usuarios;
CREATE POLICY "Acesso total usuarios" ON public.usuarios FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total clientes" ON public.clientes;
CREATE POLICY "Acesso total clientes" ON public.clientes FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total categorias" ON public.categorias_servico;
CREATE POLICY "Acesso total categorias" ON public.categorias_servico FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total servicos" ON public.servicos;
CREATE POLICY "Acesso total servicos" ON public.servicos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total agendamentos" ON public.agendamentos;
CREATE POLICY "Acesso total agendamentos" ON public.agendamentos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total produtos" ON public.produtos;
CREATE POLICY "Acesso total produtos" ON public.produtos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total uso_produtos" ON public.uso_produtos;
CREATE POLICY "Acesso total uso_produtos" ON public.uso_produtos FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "Acesso total movimentacoes" ON public.movimentacoes_estoque FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total conversas" ON public.conversas;
CREATE POLICY "Acesso total conversas" ON public.conversas FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total mensagens" ON public.mensagens;
CREATE POLICY "Acesso total mensagens" ON public.mensagens FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Acesso total notificacoes" ON public.notificacoes;
CREATE POLICY "Acesso total notificacoes" ON public.notificacoes FOR ALL TO anon, authenticated USING (true);

-- ============================================================================
-- 5. REALTIME PUBLICATION
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.usuarios, public.clientes, public.servicos, public.agendamentos, 
      public.produtos, public.uso_produtos, public.movimentacoes_estoque, 
      public.conversas, public.mensagens, public.notificacoes;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 6. CRIAÇÃO AUTOMÁTICA DOS USUÁRIOS INICIAIS (MASTER & RECEPÇÃO)
-- ============================================================================
DO $$
DECLARE
  v_master_id UUID;
  v_recepcao_id UUID;
BEGIN
  -- --------------------------------------------------------------------------
  -- 6.1 USUÁRIO MASTER (master@hypetatu.com.br / HypeMaster@2024 / Carlos Henrique)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_master_id FROM auth.users WHERE email = 'master@hypetatu.com.br';

  IF v_master_id IS NULL THEN
    v_master_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_master_id, '00000000-0000-0000-0000-000000000000',
      'master@hypetatu.com.br', crypt('HypeMaster@2024', gen_salt('bf')), now(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}', '{"nome":"Carlos Henrique","role":"master"}',
      now(), now(), 'authenticated', 'authenticated'
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('HypeMaster@2024', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        raw_user_meta_data = '{"nome":"Carlos Henrique","role":"master"}',
        updated_at = now()
    WHERE id = v_master_id;
  END IF;

  BEGIN
    DELETE FROM auth.identities WHERE user_id = v_master_id;
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_master_id::text, v_master_id, format('{"sub":"%s","email":"%s"}', v_master_id, 'master@hypetatu.com.br')::jsonb, 'email', now(), now(), now());
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  INSERT INTO public.usuarios (id, nome, email, role, slug, status)
  VALUES (v_master_id, 'Carlos Henrique', 'master@hypetatu.com.br', 'master', 'admin', 'ativo')
  ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, role = 'master', nome = 'Carlos Henrique', slug = 'admin', status = 'ativo';

  -- --------------------------------------------------------------------------
  -- 6.2 USUÁRIO RECEPÇÃO (recepcao@hypetatu.com.br / HypeRecepcao@2024 / Recepção Hype Tatu)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_recepcao_id FROM auth.users WHERE email = 'recepcao@hypetatu.com.br';

  IF v_recepcao_id IS NULL THEN
    v_recepcao_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    ) VALUES (
      v_recepcao_id, '00000000-0000-0000-0000-000000000000',
      'recepcao@hypetatu.com.br', crypt('HypeRecepcao@2024', gen_salt('bf')), now(),
      '', '', '', '',
      '{"provider":"email","providers":["email"]}', '{"nome":"Recepção Hype Tatu","role":"recepcionista"}',
      now(), now(), 'authenticated', 'authenticated'
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('HypeRecepcao@2024', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        raw_user_meta_data = '{"nome":"Recepção Hype Tatu","role":"recepcionista"}',
        updated_at = now()
    WHERE id = v_recepcao_id;
  END IF;

  BEGIN
    DELETE FROM auth.identities WHERE user_id = v_recepcao_id;
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_recepcao_id::text, v_recepcao_id, format('{"sub":"%s","email":"%s"}', v_recepcao_id, 'recepcao@hypetatu.com.br')::jsonb, 'email', now(), now(), now());
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  INSERT INTO public.usuarios (id, nome, email, role, slug, status)
  VALUES (v_recepcao_id, 'Recepção Hype Tatu', 'recepcao@hypetatu.com.br', 'recepcionista', 'recepcao', 'ativo')
  ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, role = 'recepcionista', nome = 'Recepção Hype Tatu', slug = 'recepcao', status = 'ativo';

END $$;

-- ============================================================================
-- 7. DADOS INICIAIS (CATEGORIAS E SERVIÇOS PADRÃO)
-- ============================================================================
DO $$
DECLARE
  v_cat_tattoo UUID;
  v_cat_barber UUID;
  v_cat_piercing UUID;
BEGIN
  INSERT INTO public.categorias_servico (nome, cor, cor_identificacao)
  VALUES ('Tatuagem', '#8CBDAD', '#8CBDAD')
  ON CONFLICT (nome) DO UPDATE SET cor = EXCLUDED.cor
  RETURNING id INTO v_cat_tattoo;

  INSERT INTO public.categorias_servico (nome, cor, cor_identificacao)
  VALUES ('Barbearia', '#517566', '#517566')
  ON CONFLICT (nome) DO UPDATE SET cor = EXCLUDED.cor
  RETURNING id INTO v_cat_barber;

  INSERT INTO public.categorias_servico (nome, cor, cor_identificacao)
  VALUES ('Piercing', '#A3CFBF', '#A3CFBF')
  ON CONFLICT (nome) DO UPDATE SET cor = EXCLUDED.cor
  RETURNING id INTO v_cat_piercing;

  -- Serviços base
  IF v_cat_tattoo IS NOT NULL THEN
    INSERT INTO public.servicos (categoria_id, nome, descricao, duracao_minutos, preco, ativo)
    VALUES (v_cat_tattoo, 'Tatuagem Autoral (Hora)', 'Sessão de tatuagem autoral personalizada', 60, 250.00, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_cat_barber IS NOT NULL THEN
    INSERT INTO public.servicos (categoria_id, nome, descricao, duracao_minutos, preco, ativo)
    VALUES (v_cat_barber, 'Corte Degradê Premium', 'Corte moderno com finalização e lavagem', 45, 60.00, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.servicos (categoria_id, nome, descricao, duracao_minutos, preco, ativo)
    VALUES (v_cat_barber, 'Barba Terapia com Toalha Quente', 'Alinhamento com navalha, toalha quente e óleos essenciais', 30, 45.00, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
