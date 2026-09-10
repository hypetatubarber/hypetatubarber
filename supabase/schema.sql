-- ============================================================================
-- HYPE TATU — BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Schema Completo, Triggers de Estoque, Políticas RLS e Dados Iniciais (Seeds)
-- ============================================================================

-- Habilita extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABELAS PRINCIPAIS
-- ----------------------------------------------------------------------------

-- 1.1 Tabela de Usuários / Colaboradores do Sistema
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

-- 1.2 Tabela de Clientes (CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Categorias de Serviço (Tatuagem, Barbearia, Piercing)
CREATE TABLE IF NOT EXISTS public.categorias_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor_identificacao VARCHAR(20) NOT NULL DEFAULT '#e5a93c'
);

-- 1.4 Serviços Cadastrados
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL REFERENCES public.categorias_servico(id) ON DELETE RESTRICT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER NOT NULL DEFAULT 30,
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN NOT NULL DEFAULT true
);

-- 1.5 Agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE RESTRICT,
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado')),
    observacoes TEXT,
    criado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Produtos & Controle de Estoque
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidade VARCHAR(20) NOT NULL DEFAULT 'un' CHECK (unidade IN ('ml', 'un', 'g', 'cx', 'par')),
    custo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estoque_atual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estoque_minimo NUMERIC(10, 2) NOT NULL DEFAULT 5
);

-- 1.7 Registro de Materiais Usados por Colaboradores
CREATE TABLE IF NOT EXISTS public.uso_produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    quantidade NUMERIC(10, 2) NOT NULL CHECK (quantidade > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.8 Movimentações de Estoque (Auditoria)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    quantidade NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- 1.9 Notificações Internas do Sistema
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.10 Inscrições para Notificações Web Push (PWA)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.11 Tabela de Conversas WhatsApp (Evolution API)
CREATE TABLE IF NOT EXISTS public.conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150),
    foto TEXT,
    ultima_mensagem TEXT,
    ultima_mensagem_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nao_lidas INTEGER DEFAULT 0 NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.12 Tabela de Mensagens WhatsApp (Evolution API)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    direcao VARCHAR(20) NOT NULL CHECK (direcao IN ('enviada', 'recebida')),
    status VARCHAR(20) DEFAULT 'enviado',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. ÍNDICES DE DESEMPENHO
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_colaborador ON public.agendamentos(data, colaborador_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_clientes_nome_telefone ON public.clientes(nome, telefone);
CREATE INDEX IF NOT EXISTS idx_uso_produtos_colaborador_data ON public.uso_produtos(colaborador_id, data);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON public.notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_conversas_numero ON public.conversas(numero);
CREATE INDEX IF NOT EXISTS idx_conversas_ultima_msg ON public.conversas(ultima_mensagem_em DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_data ON public.mensagens(conversa_id, criado_em);

-- ----------------------------------------------------------------------------
-- 3. TRIGGERS AUTOMÁTICOS
-- ----------------------------------------------------------------------------

-- 3.1 Trigger para abater estoque automaticamente e registrar movimentação de saída
CREATE OR REPLACE FUNCTION public.fn_processar_uso_produto()
RETURNS TRIGGER AS $$
BEGIN
    -- Abate a quantidade no estoque atual do produto
    UPDATE public.produtos
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.produto_id;

    -- Cria o registro auditável na tabela de movimentações de estoque
    INSERT INTO public.movimentacoes_estoque (
        produto_id,
        tipo,
        quantidade,
        motivo,
        usuario_id
    ) VALUES (
        NEW.produto_id,
        'saida',
        NEW.quantidade,
        COALESCE(NEW.observacao, 'Uso registrado por colaborador'),
        NEW.colaborador_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apos_uso_produto ON public.uso_produtos;
CREATE TRIGGER trg_apos_uso_produto
AFTER INSERT ON public.uso_produtos
FOR EACH ROW EXECUTE FUNCTION public.fn_processar_uso_produto();

-- 3.2 Trigger para gerar notificação ao colaborador quando um agendamento for criado ou alterado
CREATE OR REPLACE FUNCTION public.fn_notificar_agendamento()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_nome VARCHAR(150);
    v_servico_nome VARCHAR(100);
BEGIN
    SELECT nome INTO v_cliente_nome FROM public.clientes WHERE id = NEW.cliente_id;
    SELECT nome INTO v_servico_nome FROM public.servicos WHERE id = NEW.servico_id;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.notificacoes (usuario_id, titulo, mensagem, link)
        VALUES (
            NEW.colaborador_id,
            'Novo Agendamento Marcado!',
            'Cliente: ' || COALESCE(v_cliente_nome, 'Cliente') || ' às ' || TO_CHAR(NEW.hora_inicio, 'HH24:MI') || ' — ' || COALESCE(v_servico_nome, 'Serviço'),
            '/equipe'
        );
    ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'cancelado') THEN
        INSERT INTO public.notificacoes (usuario_id, titulo, mensagem, link)
        VALUES (
            NEW.colaborador_id,
            'Agendamento Cancelado',
            'O agendamento com ' || COALESCE(v_cliente_nome, 'Cliente') || ' das ' || TO_CHAR(NEW.hora_inicio, 'HH24:MI') || ' foi cancelado.',
            '/equipe'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notificar_agendamento ON public.agendamentos;
CREATE TRIGGER trg_notificar_agendamento
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.fn_notificar_agendamento();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uso_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas padrão para acesso autenticado (customizáveis por token JWT)
CREATE POLICY "Permitir leitura geral para usuários autenticados" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir gerenciamento para master" ON public.usuarios FOR ALL USING (true);

CREATE POLICY "Acesso completo a clientes para recepcao e master" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Acesso a categorias e serviços" ON public.categorias_servico FOR ALL USING (true);
CREATE POLICY "Acesso a serviços" ON public.servicos FOR ALL USING (true);
CREATE POLICY "Acesso a agendamentos" ON public.agendamentos FOR ALL USING (true);
CREATE POLICY "Acesso a produtos e estoque" ON public.produtos FOR ALL USING (true);
CREATE POLICY "Acesso a uso de produtos" ON public.uso_produtos FOR ALL USING (true);
CREATE POLICY "Acesso a movimentações de estoque" ON public.movimentacoes_estoque FOR ALL USING (true);
CREATE POLICY "Acesso a notificações" ON public.notificacoes FOR ALL USING (true);
CREATE POLICY "Acesso a push subscriptions" ON public.push_subscriptions FOR ALL USING (true);
CREATE POLICY "Acesso a conversas para equipe" ON public.conversas FOR ALL USING (true);
CREATE POLICY "Acesso a mensagens para equipe" ON public.mensagens FOR ALL USING (true);

-- Habilitar Supabase Realtime para tabelas de atendimento e WhatsApp
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. SEEDS / DADOS INICIAIS
-- ----------------------------------------------------------------------------

-- Inserir Categorias
INSERT INTO public.categorias_servico (id, nome, cor_identificacao) VALUES
('11111111-1111-1111-1111-111111111111', 'Barbearia', '#3b82f6'),
('22222222-2222-2222-2222-222222222222', 'Tatuagem', '#e5a93c'),
('33333333-3333-3333-3333-333333333333', 'Piercing', '#ec4899')
ON CONFLICT (id) DO NOTHING;

-- Inserir Serviços (conforme solicitado na especificação)
INSERT INTO public.servicos (id, categoria_id, nome, descricao, duracao_minutos, preco, ativo) VALUES
-- Barbearia
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Corte Masculino', 'Corte moderno com degradê, tesoura e finalização com pomada.', 45, 55.00, true),
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Corte + Barba', 'Combo completo: corte alinhado e barboterapia com toalha quente.', 75, 95.00, true),
('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Barba', 'Desenho na navalha afiada e hidratação facial com óleos.', 40, 45.00, true),
('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Pézinho', 'Acabamento rápido de nuca e costeletas.', 20, 25.00, true),
('b5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Sobrancelha', 'Design anatômico com pinça e navalhete.', 15, 20.00, true),

-- Tatuagem
('t1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Tattoo Pequena', 'Tatuagens de até 6cm (frases, traço fino, símbolos).', 60, 220.00, true),
('t2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Tattoo Média', 'Tatuagens de 7 a 15cm (blackwork, ilustrações, botânica).', 120, 450.00, true),
('t3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Tattoo Grande', 'Sessão para projetos grandes e fechamentos parciais.', 240, 900.00, true),
('t4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Retoque', 'Retoque de linhas e pigmentos em tatuagens cicatrizadas.', 45, 100.00, true),

-- Piercing
('p1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Piercing Orelha', 'Perfuração estéril na orelha com joia básica em titânio.', 30, 90.00, true),
('p2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Piercing Nariz', 'Perfuração nostril ou septo com joia antialérgica.', 30, 95.00, true),
('p3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Piercing Sobrancelha', 'Perfuração na sobrancelha com barbell curvo.', 30, 90.00, true),
('p4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Piercing Umbigo', 'Perfuração no umbigo com banana bell em titânio.', 30, 110.00, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir Usuários (Master, Recepcionista e Colaboradores)
INSERT INTO public.usuarios (id, nome, email, role, slug, especialidade, foto, status) VALUES
('aaaa1111-1111-1111-1111-111111111111', 'Carlos Henrique (Dono)', 'master@hypetatu.com.br', 'master', 'carlos-master', 'Gestão & Direção Artística', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'ativo'),
('bbbb2222-2222-2222-2222-222222222222', 'Juliana Recepção', 'recepcao@hypetatu.com.br', 'recepcionista', 'juliana-recepcao', 'Atendimento & Recepção', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'ativo'),
('cccc3333-3333-3333-3333-333333333333', 'Danilinho Barber', 'danilinho@hypetatu.com.br', 'colaborador', 'danilinho-barber', 'Barbearia (Fade & Clássico)', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80', 'ativo'),
('dddd4444-4444-4444-4444-444444444444', 'Lucas Ink', 'lucas@hypetatu.com.br', 'colaborador', 'lucas-ink', 'Tatuagem (Realismo & Blackwork)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'ativo'),
('eeee5555-5555-5555-5555-555555555555', 'Maya Ferreira', 'maya@hypetatu.com.br', 'colaborador', 'maya-ferreira', 'Tatuagem (Fineline & Floral)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 'ativo'),
('ffff6666-6666-6666-6666-666666666666', 'Camila Piercer', 'camila@hypetatu.com.br', 'colaborador', 'camila-piercer', 'Body Piercing & Joalheria', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 'ativo')
ON CONFLICT (id) DO NOTHING;

-- Inserir Produtos & Estoque
INSERT INTO public.produtos (id, nome, categoria, unidade, custo_unitario, estoque_atual, estoque_minimo) VALUES
('prod-1111-1111-1111-111111111111', 'Tinta Dynamic Black (240ml)', 'Tatuagem', 'un', 180.00, 8, 3),
('prod-2222-2222-2222-222222222222', 'Agulha Cartucho 03RL (Caixa 20un)', 'Tatuagem', 'cx', 120.00, 14, 5),
('prod-3333-3333-3333-333333333333', 'Pomada Modeladora Hype Matte (150g)', 'Barbearia', 'un', 32.00, 22, 10),
('prod-4444-4444-4444-444444444444', 'Óleo para Barba Wood & Spice (30ml)', 'Barbearia', 'un', 28.00, 18, 6),
('prod-5555-5555-5555-555555555555', 'Lâminas Descartáveis Derby (Cx 100un)', 'Barbearia', 'cx', 45.00, 7, 4),
('prod-6666-6666-6666-666666666666', 'Labret Titânio Grau Implante G23', 'Piercing', 'un', 35.00, 32, 15),
('prod-7777-7777-7777-7777-7777-777777777777', 'Luvas Nitrílicas Pretas Tam M (Cx 100un)', 'Geral', 'cx', 55.00, 4, 6), -- Alerta de estoque baixo!
('prod-8888-8888-8888-8888-888888888888', 'Plástico Filme Protetor (Rolo 300m)', 'Tatuagem', 'un', 25.00, 5, 3)
ON CONFLICT (id) DO NOTHING;

-- Inserir Clientes Exemplares (Lauro de Freitas e Região)
INSERT INTO public.clientes (id, nome, telefone, email, observacoes, tags) VALUES
('cli-1111-1111-1111-111111111111', 'Rodrigo Mendonça', '(71) 99123-4567', 'rodrigo.mendonca@gmail.com', 'Cliente assíduo de barbearia aos sábados. Gosta de café sem açúcar.', ARRAY['Cliente VIP', 'Barbearia']),
('cli-2222-2222-2222-222222222222', 'Larissa Vasconcelos', '(71) 98765-4321', 'larissa.v@outlook.com', 'Pele sensível. Prefere traço fino botânico.', ARRAY['Tatuagem', 'Pele Sensível']),
('cli-3333-3333-3333-333333333333', 'Felipe Santos', '(71) 99234-8899', 'felipe.santos@bol.com.br', 'Já fez 2 tattoos e quer fechar o braço.', ARRAY['Tatuagem', 'Cliente VIP']),
('cli-4444-4444-4444-444444444444', 'Beatriz Lima', '(71) 98111-2233', 'bia.lima@gmail.com', 'Piercing no septo marcado. Alérgica a níquel (usar titânio).', ARRAY['Piercing', 'Alergia'])
ON CONFLICT (id) DO NOTHING;

-- Inserir Agendamentos Exemplares para Hoje
INSERT INTO public.agendamentos (id, cliente_id, colaborador_id, servico_id, data, hora_inicio, hora_fim, status, observacoes, criado_por) VALUES
('ag-1111-1111-1111-111111111111', 'cli-1111-1111-1111-111111111111', 'cccc3333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', CURRENT_DATE, '09:00', '10:15', 'confirmado', 'Corte fade alto + barboterapia.', 'bbbb2222-2222-2222-2222-222222222222'),
('ag-2222-2222-2222-222222222222', 'cli-2222-2222-2222-222222222222', 'eeee5555-5555-5555-5555-555555555555', 't1111111-1111-1111-1111-111111111111', CURRENT_DATE, '10:30', '11:30', 'agendado', 'Fineline ramo de oliveira no pulso.', 'bbbb2222-2222-2222-2222-222222222222'),
('ag-3333-3333-3333-333333333333', 'cli-3333-3333-3333-333333333333', 'dddd4444-4444-4444-4444-444444444444', 't2222222-2222-2222-2222-222222222222', CURRENT_DATE, '14:00', '16:00', 'agendado', 'Blackwork adaga e serpente antebraço.', 'bbbb2222-2222-2222-2222-222222222222'),
('ag-4444-4444-4444-4444-444444444444', 'cli-4444-4444-4444-4444-444444444444', 'ffff6666-6666-6666-6666-666666666666', 'p2222222-2222-2222-2222-222222222222', CURRENT_DATE, '16:30', '17:00', 'confirmado', 'Piercing no septo com joia ferradura em titânio.', 'bbbb2222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;
