-- ============================================================================
-- SCRIPT DE CRIAÇÃO DOS USUÁRIOS INICIAIS NO SUPABASE — HYPE TATU
-- Execute este script no SQL Editor do painel Supabase (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Garantir criação da tabela public.usuarios caso o schema completo ainda não tenha sido rodado
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('master', 'recepcionista', 'colaborador')),
    slug VARCHAR(100) UNIQUE,
    especialidade VARCHAR(100),
    foto TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar política de leitura
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de usuarios" ON public.usuarios;
CREATE POLICY "Permitir leitura de usuarios" ON public.usuarios 
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir escrita de usuarios" ON public.usuarios;
CREATE POLICY "Permitir escrita de usuarios" ON public.usuarios 
FOR ALL TO authenticated USING (true);

-- 3. Inserção / Atualização dos Usuários no auth.users e public.usuarios
DO $$
DECLARE
  v_master_id UUID;
  v_recepcao_id UUID;
BEGIN
  -- --------------------------------------------------------------------------
  -- 1. USUÁRIO MASTER (master@hypetatu.com.br / Senhamaster@2024)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_master_id FROM auth.users WHERE email = 'master@hypetatu.com.br';

  IF v_master_id IS NULL THEN
    v_master_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_master_id,
      '00000000-0000-0000-0000-000000000000',
      'master@hypetatu.com.br',
      crypt('Senhamaster@2024', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Administrador Master","role":"master"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('Senhamaster@2024', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = '{"nome":"Administrador Master","role":"master"}',
        updated_at = now()
    WHERE id = v_master_id;
  END IF;

  -- Registra identidade no Supabase Auth de forma segura
  BEGIN
    DELETE FROM auth.identities WHERE user_id = v_master_id;
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_master_id::text,
      v_master_id,
      format('{"sub":"%s","email":"%s"}', v_master_id, 'master@hypetatu.com.br')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Prossegue mesmo se a versão específica do Supabase gerenciar identities internamente
  END;

  -- Insere na tabela public.usuarios com role 'master'
  INSERT INTO public.usuarios (id, nome, email, role, slug, status)
  VALUES (
    v_master_id,
    'Administrador Master',
    'master@hypetatu.com.br',
    'master',
    'admin',
    'ativo'
  )
  ON CONFLICT (email) DO UPDATE 
  SET id = EXCLUDED.id,
      role = 'master',
      nome = 'Administrador Master',
      slug = 'admin',
      status = 'ativo';

  -- --------------------------------------------------------------------------
  -- 2. USUÁRIO RECEPÇÃO (recepcao@hypetatu.com.br / SenhaRecepcao@2024)
  -- --------------------------------------------------------------------------
  SELECT id INTO v_recepcao_id FROM auth.users WHERE email = 'recepcao@hypetatu.com.br';

  IF v_recepcao_id IS NULL THEN
    v_recepcao_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_recepcao_id,
      '00000000-0000-0000-0000-000000000000',
      'recepcao@hypetatu.com.br',
      crypt('SenhaRecepcao@2024', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"nome":"Recepção Hype Tatu","role":"recepcionista"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('SenhaRecepcao@2024', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = '{"nome":"Recepção Hype Tatu","role":"recepcionista"}',
        updated_at = now()
    WHERE id = v_recepcao_id;
  END IF;

  -- Registra identidade no Supabase Auth de forma segura
  BEGIN
    DELETE FROM auth.identities WHERE user_id = v_recepcao_id;
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_recepcao_id::text,
      v_recepcao_id,
      format('{"sub":"%s","email":"%s"}', v_recepcao_id, 'recepcao@hypetatu.com.br')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Prossegue mesmo se a versão específica do Supabase gerenciar identities internamente
  END;

  -- Insere na tabela public.usuarios com role 'recepcionista'
  INSERT INTO public.usuarios (id, nome, email, role, slug, status)
  VALUES (
    v_recepcao_id,
    'Recepção Hype Tatu',
    'recepcao@hypetatu.com.br',
    'recepcionista',
    'recepcao',
    'ativo'
  )
  ON CONFLICT (email) DO UPDATE 
  SET id = EXCLUDED.id,
      role = 'recepcionista',
      nome = 'Recepção Hype Tatu',
      slug = 'recepcao',
      status = 'ativo';

END $$;
