/**
 * Banco de Dados Mock e Dados Iniciais (com persistência em LocalStorage)
 * Garante funcionamento perfeito mesmo sem chaves ativas do Supabase.
 */

import { Usuario, Cliente, CategoriaServico, Servico, Agendamento, Produto, UsoProduto, MovimentacaoEstoque, Notificacao, Conversa, Mensagem, SolicitacaoRotativo, Pagamento, CustoFixo, RepasseComissao } from '../types';

const STORAGE_KEYS = {
  USUARIOS: 'hype_usuarios_v1',
  CLIENTES: 'hype_clientes_v1',
  CATEGORIAS: 'hype_categorias_v1',
  SERVICOS: 'hype_servicos_v1',
  AGENDAMENTOS: 'hype_agendamentos_v1',
  PRODUTOS: 'hype_produtos_v1',
  USO_PRODUTOS: 'hype_uso_produtos_v1',
  MOVIMENTACOES: 'hype_movimentacoes_v1',
  NOTIFICACOES: 'hype_notificacoes_v1',
  CONVERSAS: 'hype_conversas_v1',
  MENSAGENS: 'hype_mensagens_v1',
  SOLICITACOES_ROTATIVO: 'hype_solicitacoes_rotativo_v1',
  PAGAMENTOS: 'hype_pagamentos_v1',
  CUSTOS_FIXOS: 'hype_custos_fixos_v1',
  REPASSES: 'hype_repasses_v1',
};

// Data formatada para hoje no formato YYYY-MM-DD
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dados sementes iniciais
const INITIAL_CATEGORIAS: CategoriaServico[] = [
  { id: 'cat-barber', nome: 'Barbearia', cor_identificacao: '#3b82f6' },
  { id: 'cat-tattoo', nome: 'Tatuagem', cor_identificacao: '#e5a93c' },
  { id: 'cat-piercing', nome: 'Piercing', cor_identificacao: '#ec4899' },
];

const INITIAL_SERVICOS: Servico[] = [
  // Barbearia
  { id: 'srv-1', categoria_id: 'cat-barber', nome: 'Corte Masculino', descricao: 'Corte degradê ou clássico com lavagem e finalização.', duracao_minutos: 45, preco: 55, ativo: true },
  { id: 'srv-2', categoria_id: 'cat-barber', nome: 'Corte + Barba (Combo Hype)', descricao: 'Corte completo e barboterapia com toalha quente.', duracao_minutos: 75, preco: 95, ativo: true },
  { id: 'srv-3', categoria_id: 'cat-barber', nome: 'Barba Terapia', descricao: 'Modelagem na navalha, toalha quente e óleos nobres.', duracao_minutos: 40, preco: 45, ativo: true },
  { id: 'srv-4', categoria_id: 'cat-barber', nome: 'Pézinho & Acabamento', descricao: 'Alinhamento rápido de nuca e costeletas.', duracao_minutos: 20, preco: 25, ativo: true },
  { id: 'srv-5', categoria_id: 'cat-barber', nome: 'Design de Sobrancelha', descricao: 'Limpeza anatômica com pinça e navalhete.', duracao_minutos: 15, preco: 20, ativo: true },
  
  // Tatuagem
  { id: 'srv-6', categoria_id: 'cat-tattoo', nome: 'Tattoo Pequena (até 6cm)', descricao: 'Traço fino, frases, pequenas ilustrações minimalistas.', duracao_minutos: 60, preco: 220, ativo: true },
  { id: 'srv-7', categoria_id: 'cat-tattoo', nome: 'Tattoo Média (7 a 15cm)', descricao: 'Blackwork, botânica, sombreados ou pontilhismo.', duracao_minutos: 120, preco: 450, ativo: true },
  { id: 'srv-8', categoria_id: 'cat-tattoo', nome: 'Tattoo Grande (Sessão Fechamento)', descricao: 'Sessão de 4 horas para projetos grandes autorais.', duracao_minutos: 240, preco: 900, ativo: true },
  { id: 'srv-9', categoria_id: 'cat-tattoo', nome: 'Retoque de Tatuagem', descricao: 'Retoque de pigmento e revisão de linhas cicatrizadas.', duracao_minutos: 45, preco: 100, ativo: true },

  // Piercing
  { id: 'srv-10', categoria_id: 'cat-piercing', nome: 'Piercing Orelha', descricao: 'Perfuração estéril na orelha com joia de titânio inclusa.', duracao_minutos: 30, preco: 90, ativo: true },
  { id: 'srv-11', categoria_id: 'cat-piercing', nome: 'Piercing Nariz', descricao: 'Nostril ou septo com joia antialérgica em titânio.', duracao_minutos: 30, preco: 95, ativo: true },
  { id: 'srv-12', categoria_id: 'cat-piercing', nome: 'Piercing Sobrancelha', descricao: 'Perfuração na sobrancelha com microbell.', duracao_minutos: 30, preco: 90, ativo: true },
  { id: 'srv-13', categoria_id: 'cat-piercing', nome: 'Piercing Umbigo', descricao: 'Perfuração com banana bell com pedras zircônia.', duracao_minutos: 30, preco: 110, ativo: true },
];

const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'f3d56c6d-dc15-433d-894f-8f42d851865f',
    nome: 'Carlos Henrique (Master)',
    email: 'master@hypetatu.com.br',
    role: 'master',
    slug: 'admin',
    especialidade: 'Gestão Geral & Administração',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:28:11.570246+00:00',
  },
  {
    id: 'user-master-gmail',
    nome: 'Admin Master (Gmail)',
    email: 'hypetatubarber@gmail.com',
    role: 'master',
    slug: 'admin',
    especialidade: 'Gestão Geral & Administração',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:28:11.570246+00:00',
    setor_atuacao: 'todos',
  },
  {
    id: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    nome: 'Recepção Hype Tatu',
    email: 'recepcao@hypetatu.com.br',
    role: 'recepcionista',
    slug: 'recepcao',
    especialidade: 'Atendimento & Recepção',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:29:43.142543+00:00',
    setor_atuacao: 'todos',
  },
  {
    id: 'user-recepcao-hype-br',
    nome: 'Recepção (Secundário)',
    email: 'recepcao.hype@hypetatu.com.br',
    role: 'recepcionista',
    slug: 'recepcao',
    especialidade: 'Atendimento & Recepção',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:29:43.142543+00:00',
    setor_atuacao: 'todos',
  },
  {
    id: 'a0c1e8d4-52bb-4c22-95f8-b80c6198f26a',
    nome: 'Danilinho Barber',
    email: 'danilinho@hypetatu.com.br',
    role: 'colaborador',
    tipo_colaborador: 'fixo',
    slug: 'danilinho-barber',
    especialidade: 'Master Barber • Degradê & Barboterapia',
    setor_atuacao: 'barbearia',
    telefone: '(71) 99411-1967',
    comissao_porcentagem: 50,
    comissao_barbearia: 50,
    comissao_tatuagem: 60,
    comissao_piercing: 55,
    tipo_repasse: 'semanal',
    status_disponibilidade: 'disponivel',
    notificacoes_ativas: true,
    senha_acesso: 'danili123',
    primeiro_acesso_pendente: false,
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:28:11.600000+00:00',
  },
  {
    id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    nome: 'Tatuador 1 (Lucas Rocha)',
    email: 'tatuador1@gmail.com',
    role: 'colaborador',
    tipo_colaborador: 'fixo',
    slug: 'tatuador1',
    especialidade: 'Tatuador • Realismo & Blackwork',
    setor_atuacao: 'tatuagem',
    estilos_tatuagem: ['Realismo', 'Blackwork'],
    telefone: '(71) 99111-2233',
    comissao_porcentagem: 60,
    comissao_barbearia: 50,
    comissao_tatuagem: 60,
    comissao_piercing: 55,
    tipo_repasse: 'semanal',
    status_disponibilidade: 'disponivel',
    notificacoes_ativas: true,
    senha_acesso: 'tattoo123',
    primeiro_acesso_pendente: false,
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:28:11.664289+00:00',
  },
  {
    id: 'rotativo-gabriel-1',
    nome: 'Gabriel Santos (Rotativo)',
    email: 'gabriel.rotativo@hypetatu.com.br',
    role: 'colaborador',
    tipo_colaborador: 'rotativo',
    slug: 'gabriel-rotativo',
    especialidade: 'Tatuador Rotativo • Fineline & Minimalismo',
    setor_atuacao: 'tatuagem',
    estilos_tatuagem: ['Fineline', 'Minimalista', 'Lettering', 'Blackwork'],
    telefone: '(71) 99333-4455',
    comissao_porcentagem: 60,
    comissao_barbearia: 50,
    comissao_tatuagem: 60,
    comissao_piercing: 55,
    tipo_repasse: 'servico',
    status_disponibilidade: 'disponivel',
    notificacoes_ativas: true,
    senha_acesso: 'gabriel123',
    primeiro_acesso_pendente: false,
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:35:00.000000+00:00',
  },
  {
    id: 'rotativo-bia-2',
    nome: 'Bia Ink (Rotativa)',
    email: 'bia.rotativa@hypetatu.com.br',
    role: 'colaborador',
    tipo_colaborador: 'rotativo',
    slug: 'bia-rotativa',
    especialidade: 'Tatuadora Rotativa • Realismo & Aquarela',
    estilos_tatuagem: ['Realismo', 'Aquarela', 'Botânica', 'Old School'],
    telefone: '(71) 99444-5566',
    comissao_porcentagem: 65,
    comissao_barbearia: 50,
    comissao_tatuagem: 65,
    comissao_piercing: 55,
    tipo_repasse: 'servico',
    status_disponibilidade: 'disponivel',
    notificacoes_ativas: true,
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2026-09-10T17:36:00.000000+00:00',
  },
];

const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Rodrigo Mendonça',
    telefone: '(71) 99123-4567',
    email: 'rodrigo.m@gmail.com',
    observacoes: 'Cliente fiel aos sábados. Gosta do fade zero bem disfarçado.',
    tags: ['Cliente VIP', 'Barbearia'],
    criado_em: '2024-02-01T10:00:00Z',
  },
  {
    id: 'cli-2',
    nome: 'Larissa Vasconcelos',
    telefone: '(71) 98765-4321',
    email: 'larissa.v@outlook.com',
    observacoes: 'Pele sensível a álcool. Sempre higienizar com clorexidina aquosa.',
    tags: ['Tatuagem', 'Pele Sensível'],
    criado_em: '2024-02-05T14:30:00Z',
  },
  {
    id: 'cli-3',
    nome: 'Felipe Santos',
    telefone: '(71) 99234-8899',
    email: 'felipe.s@gmail.com',
    observacoes: 'Fechando o braço esquerdo em Blackwork.',
    tags: ['Tatuagem', 'Cliente VIP'],
    criado_em: '2024-02-10T11:00:00Z',
  },
  {
    id: 'cli-4',
    nome: 'Beatriz Lima',
    telefone: '(71) 98111-2233',
    email: 'bia.lima@gmail.com',
    observacoes: 'Alérgica a bijuterias. Usar exclusivamente titânio grau implante.',
    tags: ['Piercing', 'Alergia a Níquel'],
    criado_em: '2024-02-12T16:00:00Z',
  },
  {
    id: 'cli-5',
    nome: 'Gustavo Almeida',
    telefone: '(71) 99345-6789',
    email: 'gustavo.almeida@uol.com.br',
    observacoes: 'Corta cabelo a cada 15 dias.',
    tags: ['Barbearia'],
    criado_em: '2024-02-15T09:00:00Z',
  },
  {
    id: 'cli-lucas-1',
    nome: 'Rafael Albuquerque',
    telefone: '(71) 99122-3344',
    email: 'rafael.albuquerque@gmail.com',
    observacoes: 'Fechamento de braço oriental. Prefere sessões longas de 4 horas.',
    tags: ['Tatuagem', 'Cliente VIP'],
    criado_em: '2026-09-01T10:00:00Z',
  },
  {
    id: 'cli-lucas-2',
    nome: 'Marina Siqueira',
    telefone: '(71) 98844-5566',
    email: 'marina.siqueira@hotmail.com',
    observacoes: 'Tatuagem fineline floral na costela. Pele clara e sensível.',
    tags: ['Tatuagem', 'Fineline'],
    criado_em: '2026-09-02T14:30:00Z',
  },
  {
    id: 'cli-lucas-3',
    nome: 'Thiago Meireles',
    telefone: '(71) 99777-8899',
    email: 'thiago.meireles@yahoo.com.br',
    observacoes: 'Retoque de caligrafia e mini flash no antebraço.',
    tags: ['Tatuagem'],
    criado_em: '2026-09-03T11:00:00Z',
  },
  {
    id: 'cli-danilo-1',
    nome: 'Bruno Carvalho',
    telefone: '(71) 99333-1122',
    email: 'bruno.carvalho@gmail.com',
    observacoes: 'Cliente semanal. Gosta do combo corte degradê com toalha quente dupla.',
    tags: ['Barbearia', 'Cliente Frequente'],
    criado_em: '2026-09-04T09:00:00Z',
  },
  {
    id: 'cli-danilo-2',
    nome: 'Lucas Silveira',
    telefone: '(71) 99455-6677',
    email: 'lucas.silveira@uol.com.br',
    observacoes: 'Degradê navalhado alto e barba alinhada.',
    tags: ['Barbearia'],
    criado_em: '2026-09-05T15:00:00Z',
  },
];

const INITIAL_PRODUTOS: Produto[] = [
  // Tatuagem
  { id: 'prod-1', nome: 'Tinta Dynamic Black (240ml)', categoria: 'Tatuagem', subcategoria: 'Tintas', setor_destinado: 'tatuagem', unidade: 'un', custo_unitario: 180, estoque_atual: 8, estoque_minimo: 3 },
  { id: 'prod-2', nome: 'Agulha Cartucho 03RL (Caixa 20un)', categoria: 'Tatuagem', subcategoria: 'Agulhas & Cartuchos', setor_destinado: 'tatuagem', unidade: 'cx', custo_unitario: 120, estoque_atual: 14, estoque_minimo: 5 },
  { id: 'prod-8', nome: 'Plástico Filme Protetor (Rolo 300m)', categoria: 'Tatuagem', subcategoria: 'Decalque & Cuidados', setor_destinado: 'tatuagem', unidade: 'un', custo_unitario: 25, estoque_atual: 6, estoque_minimo: 3 },
  { id: 'prod-10', nome: 'Vaselina Slip Tattoo Hidratante (500g)', categoria: 'Tatuagem', subcategoria: 'Decalque & Cuidados', setor_destinado: 'tatuagem', unidade: 'un', custo_unitario: 42, estoque_atual: 5, estoque_minimo: 2 },
  { id: 'prod-11', nome: 'Transfer Stencil Gel It (120ml)', categoria: 'Tatuagem', subcategoria: 'Decalque & Cuidados', setor_destinado: 'tatuagem', unidade: 'un', custo_unitario: 65, estoque_atual: 3, estoque_minimo: 2 },

  // Barbearia
  { id: 'prod-3', nome: 'Pomada Hype Matte Efeito Seco (150g)', categoria: 'Barbearia', subcategoria: 'Pomadas & Finalizadores', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 32, estoque_atual: 22, estoque_minimo: 10 },
  { id: 'prod-4', nome: 'Óleo para Barba Wood & Spice (30ml)', categoria: 'Barbearia', subcategoria: 'Óleos & Barboterapia', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 28, estoque_atual: 18, estoque_minimo: 6 },
  { id: 'prod-5', nome: 'Lâminas Descartáveis Derby (Cx 100un)', categoria: 'Barbearia', subcategoria: 'Lâminas & Navalhas', setor_destinado: 'barbearia', unidade: 'cx', custo_unitario: 45, estoque_atual: 7, estoque_minimo: 4 },
  { id: 'prod-9', nome: 'Gillette Espuma Refrescante (200ml)', categoria: 'Barbearia', subcategoria: 'Óleos & Barboterapia', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 22, estoque_atual: 11, estoque_minimo: 5 },
  { id: 'prod-12', nome: 'Shampoo Anticaspa Tea Tree (300ml)', categoria: 'Barbearia', subcategoria: 'Shampoos & Lavatório', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 38, estoque_atual: 9, estoque_minimo: 4 },
  { id: 'prod-24', nome: 'Balm Modelador de Barba Efeito Seco (100g)', categoria: 'Barbearia', subcategoria: 'Óleos & Barboterapia', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 34, estoque_atual: 15, estoque_minimo: 8 },

  // Piercing
  { id: 'prod-6', nome: 'Labret Titânio Grau Implante G23', categoria: 'Piercing', subcategoria: 'Jóias & Titânio', setor_destinado: 'piercing', unidade: 'un', custo_unitario: 35, estoque_atual: 32, estoque_minimo: 15 },
  { id: 'prod-13', nome: 'Argola Articulada Segmentada Titânio', categoria: 'Piercing', subcategoria: 'Jóias & Titânio', setor_destinado: 'piercing', unidade: 'un', custo_unitario: 40, estoque_atual: 18, estoque_minimo: 8 },
  { id: 'prod-14', nome: 'Cateter Descartável 16G (Cx 50un)', categoria: 'Piercing', subcategoria: 'Agulhas & Cateteres', setor_destinado: 'piercing', unidade: 'cx', custo_unitario: 85, estoque_atual: 4, estoque_minimo: 5 },
  { id: 'prod-25', nome: 'Piercing Microdermal Base Titânio ASTM F-136', categoria: 'Piercing', subcategoria: 'Jóias & Titânio', setor_destinado: 'piercing', unidade: 'un', custo_unitario: 68, estoque_atual: 2, estoque_minimo: 6 },

  // Descartáveis & Higiene (Compartilhado entre Barbeiros e Tatuadores)
  { id: 'prod-7', nome: 'Luvas Nitrílicas Pretas Tam M (Cx 100un)', categoria: 'Descartáveis', subcategoria: 'Luvas & Proteção', setor_destinado: 'todos', unidade: 'cx', custo_unitario: 55, estoque_atual: 4, estoque_minimo: 8 },
  { id: 'prod-21', nome: 'Álcool 70% Spray Hospitalar (1L)', categoria: 'Descartáveis', subcategoria: 'Antissépticos & Higiene', setor_destinado: 'todos', unidade: 'un', custo_unitario: 18, estoque_atual: 6, estoque_minimo: 3 },
  { id: 'prod-22', nome: 'Papel Toalha Interfolha Bobina (Pct 500fls)', categoria: 'Descartáveis', subcategoria: 'Papéis & Plásticos', setor_destinado: 'todos', unidade: 'un', custo_unitario: 24, estoque_atual: 12, estoque_minimo: 5 },

  // Bebidas (Revenda / Frigobar - Não utilizável como insumo de procedimento)
  { id: 'prod-15', nome: 'Cerveja Heineken Long Neck (330ml)', categoria: 'Bebidas', subcategoria: 'Cervejas', setor_destinado: 'nenhum', unidade: 'un', custo_unitario: 7.5, estoque_atual: 48, estoque_minimo: 24 },
  { id: 'prod-16', nome: 'Cerveja Corona Extra (330ml)', categoria: 'Bebidas', subcategoria: 'Cervejas', setor_destinado: 'nenhum', unidade: 'un', custo_unitario: 8.0, estoque_atual: 36, estoque_minimo: 18 },
  { id: 'prod-17', nome: 'Energético Red Bull Energy Drink (250ml)', categoria: 'Bebidas', subcategoria: 'Energéticos', setor_destinado: 'nenhum', unidade: 'lata', custo_unitario: 9.0, estoque_atual: 24, estoque_minimo: 12 },
  { id: 'prod-18', nome: 'Whisky Johnnie Walker Black Label (1L)', categoria: 'Bebidas', subcategoria: 'Destilados', setor_destinado: 'nenhum', unidade: 'garrafa', custo_unitario: 140, estoque_atual: 2, estoque_minimo: 1 },
  { id: 'prod-19', nome: 'Refrigerante Coca-Cola Zero Lata (350ml)', categoria: 'Bebidas', subcategoria: 'Refrigerantes', setor_destinado: 'nenhum', unidade: 'lata', custo_unitario: 3.5, estoque_atual: 30, estoque_minimo: 15 },
  { id: 'prod-20', nome: 'Água Mineral Crystal Sem Gás (500ml)', categoria: 'Bebidas', subcategoria: 'Águas', setor_destinado: 'nenhum', unidade: 'garrafa', custo_unitario: 2.0, estoque_atual: 5, estoque_minimo: 20 },
  { id: 'prod-23', nome: 'Água Tônica Antarctica Zero Lata (350ml)', categoria: 'Bebidas', subcategoria: 'Refrigerantes', setor_destinado: 'nenhum', unidade: 'lata', custo_unitario: 4.5, estoque_atual: 42, estoque_minimo: 12 },

  // Novos Produtos para visualização destacada e quantidades variáveis no salão
  { id: 'prod-26', nome: 'Cera Modeladora Efeito Teia Barber Hype (120g)', categoria: 'Barbearia', subcategoria: 'Pomadas & Finalizadores', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 35, estoque_atual: 19, estoque_minimo: 8 },
  { id: 'prod-27', nome: 'Shaving Gel Refrescante Mentolado Hype (500ml)', categoria: 'Barbearia', subcategoria: 'Óleos & Barboterapia', setor_destinado: 'barbearia', unidade: 'un', custo_unitario: 29, estoque_atual: 12, estoque_minimo: 5 },
  { id: 'prod-28', nome: 'Set Tintas Intenze Color Set (10 cores x 30ml)', categoria: 'Tatuagem', subcategoria: 'Tintas', setor_destinado: 'tatuagem', unidade: 'cx', custo_unitario: 380, estoque_atual: 3, estoque_minimo: 5 },
  { id: 'prod-29', nome: 'Batoques Descartáveis Esterilizados (Pct 500un)', categoria: 'Tatuagem', subcategoria: 'Decalque & Cuidados', setor_destinado: 'tatuagem', unidade: 'pct', custo_unitario: 32, estoque_atual: 4, estoque_minimo: 8 },
  { id: 'prod-30', nome: 'Gola Higiênica Descartável Pro (Rolo 100un)', categoria: 'Descartáveis', subcategoria: 'Papéis & Plásticos', setor_destinado: 'todos', unidade: 'rolo', custo_unitario: 16.5, estoque_atual: 16, estoque_minimo: 6 },
];

const INITIAL_AGENDAMENTOS: Agendamento[] = [
  // 3 Clientes para HOJE no Tatuador 1 (Lucas Rocha - id: 18c24c4b-0e19-4a79-9523-008d2c31365b)
  {
    id: 'ag-lucas-today-1',
    cliente_id: 'cli-lucas-1',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    servico_id: 'srv-8',
    data: getTodayDateString(),
    hora_inicio: '10:00',
    hora_fim: '14:00',
    status: 'confirmado',
    observacoes: 'Fechamento oriental antebraço (carpa + ondas).',
    criado_por: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    criado_em: '2026-09-11T08:00:00Z',
  },
  {
    id: 'ag-lucas-today-2',
    cliente_id: 'cli-lucas-2',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    servico_id: 'srv-7',
    data: getTodayDateString(),
    hora_inicio: '14:30',
    hora_fim: '16:30',
    status: 'em_atendimento',
    observacoes: 'Peônia floral fineline delicada na costela.',
    criado_por: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    criado_em: '2026-09-11T08:30:00Z',
  },
  {
    id: 'ag-lucas-today-3',
    cliente_id: 'cli-lucas-3',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    servico_id: 'srv-6',
    data: getTodayDateString(),
    hora_inicio: '17:00',
    hora_fim: '18:00',
    status: 'agendado',
    observacoes: 'Frase caligrafia no antebraço esquerdo.',
    criado_por: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    criado_em: '2026-09-11T09:00:00Z',
  },

  // 2 Clientes para HOJE no Danilinho Barber (id: a0c1e8d4-52bb-4c22-95f8-b80c6198f26a)
  {
    id: 'ag-danilo-today-1',
    cliente_id: 'cli-danilo-1',
    colaborador_id: 'a0c1e8d4-52bb-4c22-95f8-b80c6198f26a',
    servico_id: 'srv-2',
    data: getTodayDateString(),
    hora_inicio: '09:30',
    hora_fim: '10:45',
    status: 'concluido',
    observacoes: 'Degradê na zero navalhado + barboterapia.',
    criado_por: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    criado_em: '2026-09-11T07:30:00Z',
  },
  {
    id: 'ag-danilo-today-2',
    cliente_id: 'cli-danilo-2',
    colaborador_id: 'a0c1e8d4-52bb-4c22-95f8-b80c6198f26a',
    servico_id: 'srv-1',
    data: getTodayDateString(),
    hora_inicio: '11:15',
    hora_fim: '12:00',
    status: 'confirmado',
    observacoes: 'Fade médio com acabamento em navalha.',
    criado_por: '350079c7-c94f-47f8-9bae-10d1b50f08b8',
    criado_em: '2026-09-11T08:00:00Z',
  },

  // Outros agendamentos para manter histórico
  {
    id: 'ag-5',
    cliente_id: 'cli-4',
    colaborador_id: 'user-colab-4',
    servico_id: 'srv-11',
    data: getTodayDateString(),
    hora_inicio: '16:30',
    hora_fim: '17:00',
    status: 'concluido',
    observacoes: 'Septo com ferradura em titânio.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T11:00:00Z',
  },
  {
    id: 'ag-6',
    cliente_id: 'cli-1',
    colaborador_id: 'a0c1e8d4-52bb-4c22-95f8-b80c6198f26a',
    servico_id: 'srv-4',
    data: getTomorrowDateString(),
    hora_inicio: '10:00',
    hora_fim: '10:20',
    status: 'agendado',
    observacoes: 'Apenas acerto da barba.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T12:00:00Z',
  }
];

const INITIAL_USO_PRODUTOS: UsoProduto[] = [
  {
    id: 'uso-1',
    colaborador_id: 'user-colab-1',
    produto_id: 'prod-5', // Lâminas Derby
    quantidade: 1,
    data: getTodayDateString(),
    agendamento_id: 'ag-1',
    observacao: 'Uso em barba terapia',
    criado_em: '2024-03-01T09:40:00Z',
  },
  {
    id: 'uso-2',
    colaborador_id: 'user-colab-3',
    produto_id: 'prod-2', // Agulha Cartucho
    quantidade: 1,
    data: getTodayDateString(),
    agendamento_id: 'ag-3',
    observacao: 'Fineline punho',
    criado_em: '2024-03-01T10:15:00Z',
  },
];

const INITIAL_MOVIMENTACOES: MovimentacaoEstoque[] = [
  {
    id: 'mov-1',
    produto_id: 'prod-1',
    tipo: 'entrada',
    quantidade: 10,
    motivo: 'Compra mensal de tintas (Nota Fiscal 4812)',
    data: '2024-02-20T10:00:00Z',
    usuario_id: 'user-master-1',
  },
  {
    id: 'mov-2',
    produto_id: 'prod-5',
    tipo: 'saida',
    quantidade: 1,
    motivo: 'Uso em barba terapia pelo colaborador Danilinho Barber',
    data: '2024-03-01T09:40:00Z',
    usuario_id: 'user-colab-1',
  },
];

const INITIAL_NOTIFICACOES: Notificacao[] = [
  {
    id: 'notif-1',
    usuario_id: 'user-colab-1', // Danilinho
    titulo: 'Novo Agendamento Marcado!',
    mensagem: 'Cliente Rodrigo Mendonça às 09:00 — Combo Hype (Corte + Barba)',
    lida: true,
    link: '/equipe',
    criado_em: '2024-03-01T08:00:00Z',
  },
  {
    id: 'notif-2',
    usuario_id: 'user-colab-1', // Danilinho
    titulo: 'Novo Agendamento Marcado!',
    mensagem: 'Cliente Gustavo Almeida às 11:00 — Corte Masculino',
    lida: false,
    link: '/equipe',
    criado_em: '2024-03-01T08:30:00Z',
  },
  {
    id: 'notif-3',
    usuario_id: 'user-colab-2', // Lucas Ink
    titulo: 'Novo Agendamento Marcado!',
    mensagem: 'Cliente Felipe Santos às 14:00 — Tattoo Média (Blackwork)',
    lida: false,
    link: '/equipe',
    criado_em: '2024-03-01T10:00:00Z',
  },
];

const INITIAL_CONVERSAS: Conversa[] = [
  {
    id: 'conv-1',
    numero: '5571991234567',
    nome: 'Rodrigo Mendonça',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    ultima_mensagem: 'E aí Danilinho! Tudo certo pro meu corte amanhã às 09h?',
    ultima_mensagem_em: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    nao_lidas: 1,
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'conv-2',
    numero: '5571987654321',
    nome: 'Larissa Vasconcelos',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    ultima_mensagem: 'Oi Maya! Mandei a referência no direct do insta. Consegue dar uma olhada?',
    ultima_mensagem_em: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    nao_lidas: 1,
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'conv-3',
    numero: '5571981112233',
    nome: 'Beatriz Lima',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    ultima_mensagem: 'Bom dia! Vocês têm joia de titânio dourada para septo disponível no estúdio?',
    ultima_mensagem_em: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    nao_lidas: 1,
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'conv-4',
    numero: '5571992348899',
    nome: 'Felipe Santos',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    ultima_mensagem: 'Show de bola Carlos, nos vemos no estúdio sábado!',
    ultima_mensagem_em: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    nao_lidas: 0,
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const INITIAL_MENSAGENS: Mensagem[] = [
  {
    id: 'msg-101',
    conversa_id: 'conv-1',
    numero: '5571991234567',
    conteudo: 'Fala Rodrigo, tudo bem? Confirmado seu horário para amanhã!',
    direcao: 'enviada',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'msg-102',
    conversa_id: 'conv-1',
    numero: '5571991234567',
    conteudo: 'E aí Danilinho! Tudo certo pro meu corte amanhã às 09h?',
    direcao: 'recebida',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'msg-201',
    conversa_id: 'conv-2',
    numero: '5571987654321',
    conteudo: 'Oi Larissa, vi sim! O projeto botânico vai ficar lindo no antebraço.',
    direcao: 'enviada',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  {
    id: 'msg-202',
    conversa_id: 'conv-2',
    numero: '5571987654321',
    conteudo: 'Oi Maya! Mandei a referência no direct do insta. Consegue dar uma olhada?',
    direcao: 'recebida',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 'msg-301',
    conversa_id: 'conv-3',
    numero: '5571981112233',
    conteudo: 'Bom dia! Vocês têm joia de titânio dourada para septo disponível no estúdio?',
    direcao: 'recebida',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'msg-401',
    conversa_id: 'conv-4',
    numero: '5571992348899',
    conteudo: 'E aí Felipe, já separei seu horário das 14h com o Lucas Ink.',
    direcao: 'enviada',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: 'msg-402',
    conversa_id: 'conv-4',
    numero: '5571992348899',
    conteudo: 'Show de bola Carlos, nos vemos no estúdio sábado!',
    direcao: 'recebida',
    status: 'lido',
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

// ============================================================================
// DADOS FINANCEIROS INICIAIS (CUSTOS FIXOS, PAGAMENTOS E REPASSES)
// ============================================================================
const INITIAL_CUSTOS_FIXOS: CustoFixo[] = [
  { id: 'cf-1', nome: 'Aluguel do Salão & Ponto Comercial', valor_mensal: 3500.00, dia_vencimento: 10, categoria: 'Instalações', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-2', nome: 'Energia Elétrica (Coelba)', valor_mensal: 680.00, dia_vencimento: 15, categoria: 'Utilidades', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-3', nome: 'Água & Esgoto (Embasa)', valor_mensal: 145.00, dia_vencimento: 12, categoria: 'Utilidades', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-4', nome: 'Internet Fibra Óptica 600MB', valor_mensal: 180.00, dia_vencimento: 5, categoria: 'Tecnologia', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-5', nome: 'Sistema de Gestão & Nuvem Hype', valor_mensal: 250.00, dia_vencimento: 20, categoria: 'Software', status_mes: { '2026-09': 'pendente' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-6', nome: 'Assessoria Contábil Especializada', valor_mensal: 600.00, dia_vencimento: 8, categoria: 'Serviços', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
  { id: 'cf-7', nome: 'Marketing Digital & Anúncios Meta', valor_mensal: 800.00, dia_vencimento: 1, categoria: 'Marketing', status_mes: { '2026-09': 'pago' }, criado_em: '2026-09-01T00:00:00Z' },
];

const today = getTodayDateString();

const INITIAL_PAGAMENTOS: Pagamento[] = [
  // Pagamentos de Hoje
  {
    id: 'pag-today-1',
    agendamento_id: 'ag-1',
    cliente_id: 'cli-1',
    cliente_nome: 'Rodrigo Mendonça',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    servico_id: 'srv-1',
    servico_nome: 'Corte Masculino Degradê',
    categoria_nome: 'Barbearia',
    data: today,
    hora: '09:45',
    valor_bruto: 55.00,
    forma_pagamento: 'pix',
    parcelas: 1,
    taxa_maquininha_pct: 0,
    taxa_maquininha_valor: 0,
    valor_liquido_transacao: 55.00,
    comissao_pct: 50,
    comissao_valor: 27.50,
    valor_liquido_estudio: 27.50,
    status_repasse: 'a_pagar',
    observacoes: 'Pagamento via Chave PIX Estúdio recebido com sucesso.',
    criado_em: `${today}T09:45:00Z`,
  },
  {
    id: 'pag-today-2',
    agendamento_id: 'ag-2',
    cliente_id: 'cli-3',
    cliente_nome: 'Bruno Carvalho',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    servico_id: 'srv-2',
    servico_nome: 'Corte + Barba (Combo Hype)',
    categoria_nome: 'Barbearia',
    data: today,
    hora: '11:15',
    valor_bruto: 95.00,
    forma_pagamento: 'debito',
    parcelas: 1,
    taxa_maquininha_pct: 1.9,
    taxa_maquininha_valor: 1.81,
    valor_liquido_transacao: 93.19,
    comissao_pct: 50,
    comissao_valor: 47.50,
    valor_liquido_estudio: 45.69,
    status_repasse: 'a_pagar',
    observacoes: 'Cartão de Débito aprovado.',
    criado_em: `${today}T11:15:00Z`,
  },
  {
    id: 'pag-today-3',
    agendamento_id: 'ag-3',
    cliente_id: 'cli-2',
    cliente_nome: 'Larissa Vasconcelos',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    colaborador_nome: 'Tatuador 1 (Lucas Rocha)',
    servico_id: 'srv-6',
    servico_nome: 'Tattoo Pequena (até 6cm)',
    categoria_nome: 'Tatuagem',
    data: today,
    hora: '15:30',
    valor_bruto: 220.00,
    forma_pagamento: 'credito',
    parcelas: 1,
    taxa_maquininha_pct: 3.5,
    taxa_maquininha_valor: 7.70,
    valor_liquido_transacao: 212.30,
    comissao_pct: 60,
    comissao_valor: 132.00,
    valor_liquido_estudio: 80.30,
    status_repasse: 'a_pagar',
    observacoes: 'Crédito à vista Stone.',
    criado_em: `${today}T15:30:00Z`,
  },
  {
    id: 'pag-today-4',
    cliente_nome: 'Camila Alencar',
    colaborador_id: 'rotativo-gabriel-1',
    colaborador_nome: 'Gabriel Santos (Rotativo)',
    servico_nome: 'Tattoo Média Fineline',
    categoria_nome: 'Tatuagem',
    data: today,
    hora: '17:00',
    valor_bruto: 450.00,
    forma_pagamento: 'credito_parcelado',
    parcelas: 3,
    taxa_maquininha_pct: 5.5,
    taxa_maquininha_valor: 24.75,
    valor_liquido_transacao: 425.25,
    comissao_pct: 60,
    comissao_valor: 270.00,
    valor_liquido_estudio: 155.25,
    status_repasse: 'a_pagar',
    observacoes: 'Tattoo botânica braço em 3x.',
    criado_em: `${today}T17:00:00Z`,
  },

  // Pagamentos deste mês (Setembro 2026)
  {
    id: 'pag-m-1',
    cliente_nome: 'Tiago Fonseca',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    colaborador_nome: 'Tatuador 1 (Lucas Rocha)',
    servico_nome: 'Tattoo Grande (Sessão Fechamento)',
    categoria_nome: 'Tatuagem',
    data: '2026-09-05',
    hora: '18:00',
    valor_bruto: 900.00,
    forma_pagamento: 'pix',
    parcelas: 1,
    taxa_maquininha_pct: 0,
    taxa_maquininha_valor: 0,
    valor_liquido_transacao: 900.00,
    comissao_pct: 60,
    comissao_valor: 540.00,
    valor_liquido_estudio: 360.00,
    status_repasse: 'pago',
    repasse_id: 'rep-init-1',
    observacoes: 'Fechamento de antebraço oriental.',
    criado_em: '2026-09-05T18:00:00Z',
  },
  {
    id: 'pag-m-2',
    cliente_nome: 'Matheus Ribeiro',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    servico_nome: 'Barba Terapia Completa',
    categoria_nome: 'Barbearia',
    data: '2026-09-06',
    hora: '14:20',
    valor_bruto: 45.00,
    forma_pagamento: 'dinheiro',
    parcelas: 1,
    taxa_maquininha_pct: 0,
    taxa_maquininha_valor: 0,
    valor_liquido_transacao: 45.00,
    comissao_pct: 50,
    comissao_valor: 22.50,
    valor_liquido_estudio: 22.50,
    status_repasse: 'pago',
    repasse_id: 'rep-init-2',
    observacoes: 'Recebido em espécie no caixa.',
    criado_em: '2026-09-06T14:20:00Z',
  },
  {
    id: 'pag-m-3',
    cliente_nome: 'Juliana Pires',
    colaborador_id: 'rotativo-bia-2',
    colaborador_nome: 'Bia Ink (Rotativa)',
    servico_nome: 'Tattoo Aquarela Borboleta',
    categoria_nome: 'Tatuagem',
    data: '2026-09-08',
    hora: '16:40',
    valor_bruto: 550.00,
    forma_pagamento: 'credito_parcelado',
    parcelas: 4,
    taxa_maquininha_pct: 6.2,
    taxa_maquininha_valor: 34.10,
    valor_liquido_transacao: 515.90,
    comissao_pct: 65,
    comissao_valor: 357.50,
    valor_liquido_estudio: 158.40,
    status_repasse: 'a_pagar',
    observacoes: 'Tattoo colorida autoral.',
    criado_em: '2026-09-08T16:40:00Z',
  },

  // Pagamentos do Mês Anterior (Agosto 2026 - Para Comparativo de Gráficos)
  {
    id: 'pag-prev-1',
    cliente_nome: 'Carlos Drummond',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    servico_nome: 'Corte + Barba',
    categoria_nome: 'Barbearia',
    data: '2026-08-10',
    hora: '10:00',
    valor_bruto: 95.00,
    forma_pagamento: 'pix',
    parcelas: 1,
    taxa_maquininha_pct: 0,
    taxa_maquininha_valor: 0,
    valor_liquido_transacao: 95.00,
    comissao_pct: 50,
    comissao_valor: 47.50,
    valor_liquido_estudio: 47.50,
    status_repasse: 'pago',
    criado_em: '2026-08-10T10:00:00Z',
  },
  {
    id: 'pag-prev-2',
    cliente_nome: 'Amanda Neves',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    colaborador_nome: 'Tatuador 1 (Lucas Rocha)',
    servico_nome: 'Tattoo Grande Realismo',
    categoria_nome: 'Tatuagem',
    data: '2026-08-15',
    hora: '14:00',
    valor_bruto: 1100.00,
    forma_pagamento: 'credito_parcelado',
    parcelas: 5,
    taxa_maquininha_pct: 7.0,
    taxa_maquininha_valor: 77.00,
    valor_liquido_transacao: 1023.00,
    comissao_pct: 60,
    comissao_valor: 660.00,
    valor_liquido_estudio: 363.00,
    status_repasse: 'pago',
    criado_em: '2026-08-15T14:00:00Z',
  },
  {
    id: 'pag-prev-3',
    cliente_nome: 'Leandro Dias',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    servico_nome: 'Corte Degradê',
    categoria_nome: 'Barbearia',
    data: '2026-08-22',
    hora: '15:30',
    valor_bruto: 55.00,
    forma_pagamento: 'debito',
    parcelas: 1,
    taxa_maquininha_pct: 1.9,
    taxa_maquininha_valor: 1.05,
    valor_liquido_transacao: 53.95,
    comissao_pct: 50,
    comissao_valor: 27.50,
    valor_liquido_estudio: 26.45,
    status_repasse: 'pago',
    criado_em: '2026-08-22T15:30:00Z',
  },
  {
    id: 'pag-prev-4',
    cliente_nome: 'Fernanda Lima',
    colaborador_id: 'rotativo-bia-2',
    colaborador_nome: 'Bia Ink (Rotativa)',
    servico_nome: 'Tattoo Média',
    categoria_nome: 'Tatuagem',
    data: '2026-08-28',
    hora: '16:00',
    valor_bruto: 420.00,
    forma_pagamento: 'pix',
    parcelas: 1,
    taxa_maquininha_pct: 0,
    taxa_maquininha_valor: 0,
    valor_liquido_transacao: 420.00,
    comissao_pct: 65,
    comissao_valor: 273.00,
    valor_liquido_estudio: 147.00,
    status_repasse: 'pago',
    criado_em: '2026-08-28T16:00:00Z',
  },
];

const INITIAL_REPASSES: RepasseComissao[] = [
  {
    id: 'rep-init-1',
    colaborador_id: '18c24c4b-0e19-4a79-9523-008d2c31365b',
    colaborador_nome: 'Tatuador 1 (Lucas Rocha)',
    periodo_inicio: '2026-09-01',
    periodo_fim: '2026-09-07',
    valor_total: 540.00,
    pagamentos_ids: ['pag-m-1'],
    pago_em: '2026-09-07T19:00:00Z',
    pago_por: 'Admin Master',
    observacoes: 'Fechamento semanal regular via PIX transferido.',
  },
  {
    id: 'rep-init-2',
    colaborador_id: 'user-colab-1',
    colaborador_nome: 'Danilinho Barber',
    periodo_inicio: '2026-09-01',
    periodo_fim: '2026-09-07',
    valor_total: 22.50,
    pagamentos_ids: ['pag-m-2'],
    pago_em: '2026-09-07T19:10:00Z',
    pago_por: 'Admin Master',
    observacoes: 'Fechamento semanal regular pago em espécie.',
  },
];

// Funções utilitárias de carregamento e salvamento
const loadFromStorage = <T>(key: string, initial: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch {
    return initial;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao persistir no localStorage:', err);
  }
};

export const getProductSetor = (prod: Partial<Produto>): 'barbearia' | 'tatuagem' | 'piercing' | 'todos' | 'nenhum' => {
  if (prod.setor_destinado) return prod.setor_destinado;
  const cat = (prod.categoria || '').toLowerCase();
  if (cat.includes('barb')) return 'barbearia';
  if (cat.includes('tatu')) return 'tatuagem';
  if (cat.includes('pierc')) return 'piercing';
  if (cat.includes('bebid')) return 'nenhum';
  if (cat.includes('descart') || cat.includes('higiene') || cat.includes('geral')) return 'todos';
  return 'todos';
};

export const getProductSubcategoria = (prod: Partial<Produto>): string => {
  if (prod.subcategoria && prod.subcategoria.trim()) return prod.subcategoria.trim();
  const nome = (prod.nome || '').toLowerCase();
  const cat = (prod.categoria || '').toLowerCase();

  if (cat.includes('tatu')) {
    if (nome.includes('tinta') || nome.includes('black') || nome.includes('color') || nome.includes('pigmento')) return 'Tintas';
    if (nome.includes('agulha') || nome.includes('cartucho') || nome.includes('rl') || nome.includes('mg') || nome.includes('rs')) return 'Agulhas & Cartuchos';
    if (nome.includes('stencil') || nome.includes('transfer') || nome.includes('decalque') || nome.includes('filme') || nome.includes('vaselina')) return 'Decalque & Cuidados';
    return 'Geral Tatuagem';
  }
  if (cat.includes('barb')) {
    if (nome.includes('pomada') || nome.includes('cera') || nome.includes('matte') || nome.includes('fixador') || nome.includes('gel')) return 'Pomadas & Finalizadores';
    if (nome.includes('óleo') || nome.includes('oleo') || nome.includes('balm') || nome.includes('espuma') || nome.includes('barba')) return 'Óleos & Barboterapia';
    if (nome.includes('lâmina') || nome.includes('lamina') || nome.includes('navalha') || nome.includes('gillette')) return 'Lâminas & Navalhas';
    if (nome.includes('shampoo') || nome.includes('condicionador') || nome.includes('lavat')) return 'Shampoos & Lavatório';
    return 'Geral Barbearia';
  }
  if (cat.includes('pierc')) {
    if (nome.includes('labret') || nome.includes('argola') || nome.includes('microdermal') || nome.includes('jóia') || nome.includes('joia') || nome.includes('titânio') || nome.includes('titanio')) return 'Jóias & Titânio';
    if (nome.includes('cateter') || nome.includes('agulha') || nome.includes('pinça') || nome.includes('pinca')) return 'Agulhas & Cateteres';
    return 'Geral Piercing';
  }
  if (cat.includes('descart') || cat.includes('higiene') || cat.includes('geral')) {
    if (nome.includes('luva')) return 'Luvas & Proteção';
    if (nome.includes('álcool') || nome.includes('alcool')) return 'Antissépticos & Higiene';
    if (nome.includes('papel') || nome.includes('toalha') || nome.includes('plástico') || nome.includes('plastico')) return 'Papéis & Plásticos';
    return 'Descartáveis & Proteção';
  }
  if (cat.includes('bebid')) {
    if (nome.includes('cerveja')) return 'Cervejas';
    if (nome.includes('energético') || nome.includes('energetico') || nome.includes('red bull')) return 'Energéticos';
    if (nome.includes('whisky') || nome.includes('vodka') || nome.includes('destil')) return 'Destilados';
    if (nome.includes('refrigerante') || nome.includes('coca') || nome.includes('tônica') || nome.includes('tonica')) return 'Refrigerantes';
    if (nome.includes('água') || nome.includes('agua')) return 'Águas';
    return 'Bebidas';
  }
  return prod.categoria || 'Diversos';
};

export const getColaboradorSetor = (user?: Partial<Usuario> | null): 'barbearia' | 'tatuagem' | 'piercing' | 'todos' => {
  if (!user) return 'todos';
  if (user.setor_atuacao) return user.setor_atuacao;
  if (user.role === 'master' || user.role === 'recepcionista') return 'todos';
  
  const text = `${user.especialidade || ''} ${user.nome || ''} ${(user.estilos_tatuagem || []).join(' ')}`.toLowerCase();
  if (text.includes('barber') || text.includes('barbeiro') || text.includes('corte') || text.includes('barba')) {
    return 'barbearia';
  }
  if (text.includes('tatu') || text.includes('tattoo') || text.includes('ink') || text.includes('blackwork') || text.includes('fineline') || text.includes('realismo')) {
    return 'tatuagem';
  }
  if (text.includes('pierc') || text.includes('body')) {
    return 'piercing';
  }
  return 'todos';
};

const loadProdutosWithDefaults = (): Produto[] => {
  let loaded = loadFromStorage<Produto[]>(STORAGE_KEYS.PRODUTOS, INITIAL_PRODUTOS);
  if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
    loaded = [...INITIAL_PRODUTOS];
  }
  const existingIds = new Set(loaded.map((p) => p.id));
  const missing = INITIAL_PRODUTOS.filter((p) => !existingIds.has(p.id));
  const allProds = missing.length > 0 ? [...loaded, ...missing] : loaded;

  const enriched = allProds.map((p) => {
    const initialMatch = INITIAL_PRODUTOS.find((ip) => ip.id === p.id);
    return {
      ...p,
      subcategoria: p.subcategoria || initialMatch?.subcategoria || getProductSubcategoria(p),
      setor_destinado: p.setor_destinado || initialMatch?.setor_destinado || getProductSetor(p),
    };
  });

  saveToStorage(STORAGE_KEYS.PRODUTOS, enriched);
  return enriched;
};

const loadClientesWithDefaults = (): Cliente[] => {
  const loaded = loadFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
  const existingIds = new Set(loaded.map((c) => c.id));
  const missing = INITIAL_CLIENTES.filter((c) => !existingIds.has(c.id));
  if (missing.length > 0) {
    const merged = [...loaded, ...missing];
    saveToStorage(STORAGE_KEYS.CLIENTES, merged);
    return merged;
  }
  return loaded;
};

const loadUsuariosWithDefaults = (): Usuario[] => {
  const loaded = loadFromStorage<Usuario[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  const existingIds = new Set(loaded.map((u) => u.id));
  const missing = INITIAL_USUARIOS.filter((u) => !existingIds.has(u.id));
  const allUsers = missing.length > 0 ? [...loaded, ...missing] : loaded;

  const enriched = allUsers.map((u) => {
    const initialMatch = INITIAL_USUARIOS.find((iu) => iu.id === u.id);
    return {
      ...u,
      setor_atuacao: u.setor_atuacao || initialMatch?.setor_atuacao || getColaboradorSetor(u),
    };
  });

  saveToStorage(STORAGE_KEYS.USUARIOS, enriched);
  return enriched;
};

const loadAgendamentosWithDefaults = (): Agendamento[] => {
  const loaded = loadFromStorage<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, INITIAL_AGENDAMENTOS);
  const today = getTodayDateString();
  const existingIds = new Set(loaded.map((a) => a.id));
  const missing = INITIAL_AGENDAMENTOS.filter((a) => !existingIds.has(a.id));

  const updatedLoaded = loaded.map((a) => {
    if (a.id.startsWith('ag-lucas-today') || a.id.startsWith('ag-danilo-today') || a.id === 'ag-1' || a.id === 'ag-2' || a.id === 'ag-3') {
      return { ...a, data: today };
    }
    return a;
  });

  if (missing.length > 0) {
    const merged = [...updatedLoaded, ...missing];
    saveToStorage(STORAGE_KEYS.AGENDAMENTOS, merged);
    return merged;
  }
  saveToStorage(STORAGE_KEYS.AGENDAMENTOS, updatedLoaded);
  return updatedLoaded;
};

// Armazenamento em memória reativo
export class MockDatabase {
  private static usuarios: Usuario[] = loadUsuariosWithDefaults();
  private static clientes: Cliente[] = loadClientesWithDefaults();
  private static categorias: CategoriaServico[] = loadFromStorage(STORAGE_KEYS.CATEGORIAS, INITIAL_CATEGORIAS);
  private static servicos: Servico[] = loadFromStorage(STORAGE_KEYS.SERVICOS, INITIAL_SERVICOS);
  private static agendamentos: Agendamento[] = loadAgendamentosWithDefaults();
  private static produtos: Produto[] = loadProdutosWithDefaults();
  private static usoProdutos: UsoProduto[] = loadFromStorage(STORAGE_KEYS.USO_PRODUTOS, INITIAL_USO_PRODUTOS);
  private static movimentacoes: MovimentacaoEstoque[] = loadFromStorage(STORAGE_KEYS.MOVIMENTACOES, INITIAL_MOVIMENTACOES);
  private static notificacoes: Notificacao[] = loadFromStorage(STORAGE_KEYS.NOTIFICACOES, INITIAL_NOTIFICACOES);
  private static conversas: Conversa[] = loadFromStorage(STORAGE_KEYS.CONVERSAS, INITIAL_CONVERSAS);
  private static mensagens: Mensagem[] = loadFromStorage(STORAGE_KEYS.MENSAGENS, INITIAL_MENSAGENS);
  private static solicitacoesRotativo: SolicitacaoRotativo[] = loadFromStorage(STORAGE_KEYS.SOLICITACOES_ROTATIVO, []);
  private static pagamentos: Pagamento[] = loadFromStorage(STORAGE_KEYS.PAGAMENTOS, INITIAL_PAGAMENTOS);
  private static custosFixos: CustoFixo[] = loadFromStorage(STORAGE_KEYS.CUSTOS_FIXOS, INITIAL_CUSTOS_FIXOS);
  private static repasses: RepasseComissao[] = loadFromStorage(STORAGE_KEYS.REPASSES, INITIAL_REPASSES);

  // Usuários
  static getUsuarios(): Usuario[] {
    return [...this.usuarios];
  }
  static getUsuarioById(id: string): Usuario | undefined {
    return this.usuarios.find(u => u.id === id);
  }
  static getUsuarioBySlug(slug: string): Usuario | undefined {
    return this.usuarios.find(u => u.slug === slug);
  }
  static saveUsuario(usuario: Usuario): Usuario {
    const idx = this.usuarios.findIndex(u => u.id === usuario.id);
    if (idx >= 0) {
      this.usuarios[idx] = usuario;
    } else {
      this.usuarios.push(usuario);
    }
    saveToStorage(STORAGE_KEYS.USUARIOS, this.usuarios);
    return usuario;
  }

  // Clientes
  static getClientes(): Cliente[] {
    return [...this.clientes];
  }
  static getClienteById(id: string): Cliente | undefined {
    return this.clientes.find(c => c.id === id);
  }
  static saveCliente(cliente: Cliente): Cliente {
    const idx = this.clientes.findIndex(c => c.id === cliente.id);
    if (idx >= 0) {
      this.clientes[idx] = cliente;
    } else {
      this.clientes.unshift(cliente);
    }
    saveToStorage(STORAGE_KEYS.CLIENTES, this.clientes);
    return cliente;
  }

  // Categorias & Serviços
  static getCategorias(): CategoriaServico[] {
    return [...this.categorias];
  }
  static getServicos(): Servico[] {
    return this.servicos.map(s => ({
      ...s,
      categoria: this.categorias.find(c => c.id === s.categoria_id)
    }));
  }
  static saveServico(servico: Servico): Servico {
    const idx = this.servicos.findIndex(s => s.id === servico.id);
    if (idx >= 0) {
      this.servicos[idx] = servico;
    } else {
      this.servicos.unshift(servico);
    }
    saveToStorage(STORAGE_KEYS.SERVICOS, this.servicos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_servicos_changed', { detail: servico }));
    }
    return servico;
  }
  static deleteServico(id: string): boolean {
    const initialLen = this.servicos.length;
    this.servicos = this.servicos.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SERVICOS, this.servicos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_servicos_changed', { detail: { id, deleted: true } }));
    }
    return this.servicos.length < initialLen;
  }
  static saveCategoria(cat: CategoriaServico): CategoriaServico {
    const idx = this.categorias.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      this.categorias[idx] = cat;
    } else {
      this.categorias.push(cat);
    }
    saveToStorage(STORAGE_KEYS.CATEGORIAS, this.categorias);
    return cat;
  }

  // Agendamentos (com joins automáticos)
  static getAgendamentos(): Agendamento[] {
    return this.agendamentos.map(ag => {
      const colab =
        this.usuarios.find(u => u.id === ag.colaborador_id) ||
        (ag.colaborador_id === 'user-colab-1' ? this.usuarios.find(u => u.id === 'a0c1e8d4-52bb-4c22-95f8-b80c6198f26a') : undefined);
      return {
        ...ag,
        cliente: this.clientes.find(c => c.id === ag.cliente_id),
        colaborador: colab,
        servico: this.servicos.find(s => s.id === ag.servico_id)
      };
    });
  }
  static saveAgendamento(ag: Agendamento): Agendamento {
    const idx = this.agendamentos.findIndex(a => a.id === ag.id);
    const isNew = idx === -1;

    if (!isNew) {
      this.agendamentos[idx] = ag;
    } else {
      this.agendamentos.unshift(ag);

      // Dispara notificação interna automática para o colaborador
      const cliente = this.clientes.find(c => c.id === ag.cliente_id);
      const servico = this.servicos.find(s => s.id === ag.servico_id);
      this.addNotificacao({
        id: 'notif-' + Date.now(),
        usuario_id: ag.colaborador_id,
        titulo: 'Novo Agendamento Marcado!',
        mensagem: `Cliente: ${cliente?.nome || 'Cliente'} às ${ag.hora_inicio} — ${servico?.nome || 'Serviço'}`,
        lida: false,
        link: '/equipe',
        criado_em: new Date().toISOString()
      });
    }

    saveToStorage(STORAGE_KEYS.AGENDAMENTOS, this.agendamentos);
    return ag;
  }

  static updateAgendamentoStatus(id: string, status: Agendamento['status']): Agendamento | undefined {
    const ag = this.agendamentos.find(a => a.id === id);
    if (ag) {
      ag.status = status;
      saveToStorage(STORAGE_KEYS.AGENDAMENTOS, this.agendamentos);
      return ag;
    }
    return undefined;
  }

  // Produtos & Estoque
  static getProdutos(): Produto[] {
    if (!this.produtos || this.produtos.length === 0) {
      this.produtos = loadProdutosWithDefaults();
    }
    return [...this.produtos];
  }
  static seedDefaultProdutos(): Produto[] {
    this.produtos = [...INITIAL_PRODUTOS];
    saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_produtos_changed', { detail: this.produtos }));
    }
    return [...this.produtos];
  }
  static saveProduto(produto: Produto): Produto {
    const idx = this.produtos.findIndex(p => p.id === produto.id);
    if (idx >= 0) {
      this.produtos[idx] = produto;
    } else {
      this.produtos.unshift(produto);
    }
    saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_produtos_changed', { detail: produto }));
    }
    return produto;
  }
  static deleteProduto(id: string): boolean {
    const initialLen = this.produtos.length;
    this.produtos = this.produtos.filter(p => p.id !== id);
    saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_produtos_changed', { detail: { id, deleted: true } }));
    }
    return this.produtos.length < initialLen;
  }

  // Registrar Entrada de Estoque
  static addEntradaEstoque(produtoId: string, quantidade: number, motivo: string, usuarioId: string) {
    const prod = this.produtos.find(p => p.id === produtoId);
    if (prod) {
      prod.estoque_atual += quantidade;
      saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);

      const mov: MovimentacaoEstoque = {
        id: 'mov-' + Date.now(),
        produto_id: produtoId,
        tipo: 'entrada',
        quantidade,
        motivo,
        data: new Date().toISOString(),
        usuario_id: usuarioId
      };
      this.movimentacoes.unshift(mov);
      saveToStorage(STORAGE_KEYS.MOVIMENTACOES, this.movimentacoes);
    }
  }

  // Registrar Uso de Produto por Colaborador (Baixa Automática)
  static registrarUsoProduto(uso: UsoProduto): UsoProduto {
    this.usoProdutos.unshift(uso);
    saveToStorage(STORAGE_KEYS.USO_PRODUTOS, this.usoProdutos);

    // Abate no estoque atual
    const prod = this.produtos.find(p => p.id === uso.produto_id);
    if (prod) {
      prod.estoque_atual = Math.max(0, prod.estoque_atual - uso.quantidade);
      saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);

      // Gera movimentação de saída
      const colab = this.usuarios.find(u => u.id === uso.colaborador_id);
      const mov: MovimentacaoEstoque = {
        id: 'mov-' + Date.now(),
        produto_id: uso.produto_id,
        tipo: 'saida',
        quantidade: uso.quantidade,
        motivo: uso.observacao || `Uso registrado por ${colab?.nome || 'Colaborador'}`,
        data: new Date().toISOString(),
        usuario_id: uso.colaborador_id
      };
      this.movimentacoes.unshift(mov);
      saveToStorage(STORAGE_KEYS.MOVIMENTACOES, this.movimentacoes);
    }

    return uso;
  }

  static getUsoProdutos(): UsoProduto[] {
    return this.usoProdutos.map(u => ({
      ...u,
      produto: this.produtos.find(p => p.id === u.produto_id),
      colaborador: this.usuarios.find(col => col.id === u.colaborador_id)
    }));
  }

  static getMovimentacoes(): MovimentacaoEstoque[] {
    return this.movimentacoes.map(m => ({
      ...m,
      produto: this.produtos.find(p => p.id === m.produto_id),
      usuario: this.usuarios.find(u => u.id === m.usuario_id)
    }));
  }

  // Notificações
  static getNotificacoes(usuarioId?: string): Notificacao[] {
    if (usuarioId) {
      return this.notificacoes.filter(n => n.usuario_id === usuarioId);
    }
    return [...this.notificacoes];
  }
  static addNotificacao(notif: Notificacao) {
    this.notificacoes.unshift(notif);
    saveToStorage(STORAGE_KEYS.NOTIFICACOES, this.notificacoes);
  }
  static marcarNotificacaoLida(id: string) {
    const n = this.notificacoes.find(item => item.id === id);
    if (n) {
      n.lida = true;
      saveToStorage(STORAGE_KEYS.NOTIFICACOES, this.notificacoes);
    }
  }

  // Conversas (WhatsApp)
  static getConversas(): Conversa[] {
    return [...this.conversas].sort((a, b) => {
      const timeA = a.ultima_mensagem_em ? new Date(a.ultima_mensagem_em).getTime() : 0;
      const timeB = b.ultima_mensagem_em ? new Date(b.ultima_mensagem_em).getTime() : 0;
      return timeB - timeA;
    });
  }

  static getConversaById(id: string): Conversa | undefined {
    return this.conversas.find(c => c.id === id);
  }

  static getConversaByNumero(numero: string): Conversa | undefined {
    const cleanNum = numero.replace(/\D/g, '');
    return this.conversas.find(c => {
      const cClean = c.numero.replace(/\D/g, '');
      return cClean === cleanNum || cClean.endsWith(cleanNum) || cleanNum.endsWith(cClean);
    });
  }

  static saveConversa(conversa: Conversa): Conversa {
    const idx = this.conversas.findIndex(c => c.id === conversa.id);
    if (idx >= 0) {
      this.conversas[idx] = { ...this.conversas[idx], ...conversa };
    } else {
      this.conversas.unshift(conversa);
    }
    saveToStorage(STORAGE_KEYS.CONVERSAS, this.conversas);
    window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: conversa }));
    return conversa;
  }

  static getMensagens(conversaId: string): Mensagem[] {
    return this.mensagens
      .filter(m => m.conversa_id === conversaId)
      .sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  }

  static saveMensagem(msg: Mensagem): Mensagem {
    const idx = this.mensagens.findIndex(m => m.id === msg.id);
    if (idx >= 0) {
      this.mensagens[idx] = msg;
    } else {
      this.mensagens.push(msg);
    }
    saveToStorage(STORAGE_KEYS.MENSAGENS, this.mensagens);

    // Atualiza conversa correspondente
    const conv = this.conversas.find(c => c.id === msg.conversa_id);
    if (conv) {
      conv.ultima_mensagem = msg.conteudo;
      conv.ultima_mensagem_em = msg.criado_em;
      if (msg.direcao === 'recebida') {
        conv.nao_lidas = (conv.nao_lidas || 0) + 1;
      }
      saveToStorage(STORAGE_KEYS.CONVERSAS, this.conversas);
      window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: conv }));
    }

    window.dispatchEvent(new CustomEvent('hype_mensagem_received', { detail: msg }));
    return msg;
  }

  static marcarConversaLida(conversaId: string): void {
    const conv = this.conversas.find(c => c.id === conversaId);
    if (conv && conv.nao_lidas > 0) {
      conv.nao_lidas = 0;
      saveToStorage(STORAGE_KEYS.CONVERSAS, this.conversas);
      window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: conv }));
    }
  }

  static getTotalNaoLidas(): number {
    return this.conversas.reduce((acc, c) => acc + (c.nao_lidas || 0), 0);
  }

  static salvarOuAtualizarConversa(numero: string, nome?: string, ultimaMensagem?: string): Conversa {
    let conv = this.getConversaByNumero(numero);
    const now = new Date().toISOString();

    if (!conv) {
      // Tenta encontrar cliente por telefone
      const cleanNum = numero.replace(/\D/g, '');
      const cliente = this.clientes.find(c => c.telefone.replace(/\D/g, '').endsWith(cleanNum.slice(-8)));

      conv = {
        id: 'conv-' + Date.now(),
        numero,
        nome: nome || cliente?.nome || `WhatsApp ${numero.slice(-4)}`,
        cliente_id: cliente?.id,
        avatar_url: cliente?.avatar_url,
        ultima_mensagem: ultimaMensagem || '',
        ultima_mensagem_em: now,
        nao_lidas: 1,
        status: 'ativa',
        criado_em: now,
        atualizado_em: now,
      };
      this.conversas.unshift(conv);
    } else {
      if (nome && (!conv.nome || conv.nome.startsWith('WhatsApp '))) {
        conv.nome = nome;
      }
      if (ultimaMensagem) {
        conv.ultima_mensagem = ultimaMensagem;
        conv.ultima_mensagem_em = now;
      }
      conv.atualizado_em = now;
    }

    saveToStorage(STORAGE_KEYS.CONVERSAS, this.conversas);
    window.dispatchEvent(new CustomEvent('hype_conversas_updated', { detail: conv }));
    return conv;
  }

  // ==========================================================================
  // TATUADORES ROTATIVOS & SOLICITAÇÕES DE JOBS
  // ==========================================================================
  static getSolicitacoesRotativo(): SolicitacaoRotativo[] {
    return [...this.solicitacoesRotativo].sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    );
  }

  static getRotativosDisponiveis(): Usuario[] {
    return this.usuarios.filter(
      u =>
        u.role === 'colaborador' &&
        u.tipo_colaborador === 'rotativo' &&
        u.status === 'ativo' &&
        u.status_disponibilidade !== 'indisponivel'
    );
  }

  static saveSolicitacaoRotativo(sol: SolicitacaoRotativo): SolicitacaoRotativo {
    const idx = this.solicitacoesRotativo.findIndex(s => s.id === sol.id);
    if (idx >= 0) {
      this.solicitacoesRotativo[idx] = sol;
    } else {
      this.solicitacoesRotativo.unshift(sol);
    }
    saveToStorage(STORAGE_KEYS.SOLICITACOES_ROTATIVO, this.solicitacoesRotativo);
    window.dispatchEvent(new CustomEvent('hype_solicitacoes_rotativo_changed', { detail: sol }));
    return sol;
  }

  static aceitarJobRotativo(jobId: string, rotativoId: string): { solicitacao: SolicitacaoRotativo; agendamento: Agendamento } {
    const job = this.solicitacoesRotativo.find(s => s.id === jobId);
    if (!job) {
      throw new Error('Solicitação de job não encontrada.');
    }
    if (job.status === 'aceito') {
      throw new Error(`Este job já foi aceito por ${job.aceito_por_nome || 'outro tatuador'}.`);
    }

    const rotativo = this.usuarios.find(u => u.id === rotativoId);
    if (!rotativo) {
      throw new Error('Colaborador rotativo não encontrado.');
    }

    const now = new Date().toISOString();
    job.status = 'aceito';
    job.aceito_por_id = rotativo.id;
    job.aceito_por_nome = rotativo.nome;
    job.aceito_em = now;
    saveToStorage(STORAGE_KEYS.SOLICITACOES_ROTATIVO, this.solicitacoesRotativo);

    // 1. Cliente: encontrar ou criar
    let clienteId = job.cliente_id;
    if (!clienteId) {
      const existingCli = this.clientes.find(c => c.nome.toLowerCase() === job.cliente_nome.toLowerCase());
      if (existingCli) {
        clienteId = existingCli.id;
      } else {
        const novoCli: Cliente = {
          id: 'cli-' + Date.now(),
          nome: job.cliente_nome,
          telefone: job.cliente_telefone || '(71) 99999-0000',
          tags: ['Tatuagem', 'Job Rotativo'],
          criado_em: now,
        };
        this.clientes.push(novoCli);
        saveToStorage(STORAGE_KEYS.CLIENTES, this.clientes);
        clienteId = novoCli.id;
      }
    }

    // 2. Serviço correspondente
    const servicoTattoo =
      this.servicos.find(s => s.categoria_id === 'cat-tattoo' && s.nome.toLowerCase().includes(job.tamanho)) ||
      this.servicos.find(s => s.categoria_id === 'cat-tattoo') ||
      this.servicos[0];

    // 3. Criar agendamento automaticamente
    const novoAgendamento: Agendamento = {
      id: 'ag-rotativo-' + Date.now(),
      cliente_id: clienteId,
      colaborador_id: rotativo.id,
      servico_id: servicoTattoo.id,
      data: job.data,
      hora_inicio: job.hora_inicio,
      hora_fim: job.hora_fim,
      status: 'confirmado',
      observacoes: `[JOB ROTATIVO ACEITO] Profissional: ${rotativo.nome} | Estilo: ${job.estilo} | Porte: ${job.tamanho.toUpperCase()} | Estimado: R$ ${job.valor_estimado}. ${job.observacoes || ''}`,
      criado_em: now,
      cliente: this.clientes.find(c => c.id === clienteId),
      colaborador: rotativo,
      servico: servicoTattoo,
    };
    this.agendamentos.push(novoAgendamento);
    saveToStorage(STORAGE_KEYS.AGENDAMENTOS, this.agendamentos);

    // 4. Notificar a Recepção e Master (NÃO notificar o cliente — recepcionista faz isso manualmente)
    const destinatarios = this.usuarios.filter(u => u.role === 'recepcionista' || u.role === 'master');
    destinatarios.forEach(dest => {
      this.notificacoes.unshift({
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        usuario_id: dest.id,
        titulo: '🔔 Job Aceito por Rotativo!',
        mensagem: `${rotativo.nome} aceitou o job de ${job.data} às ${job.hora_inicio} (${job.cliente_nome} — ${job.estilo})`,
        lida: false,
        link: '/recepcao',
        criado_em: now,
      });
    });
    saveToStorage(STORAGE_KEYS.NOTIFICACOES, this.notificacoes);

    window.dispatchEvent(new CustomEvent('hype_solicitacoes_rotativo_changed', { detail: job }));
    window.dispatchEvent(new CustomEvent('hype_agendamentos_changed', { detail: novoAgendamento }));
    window.dispatchEvent(new CustomEvent('hype_notificacoes_changed'));

    return { solicitacao: job, agendamento: novoAgendamento };
  }

  static recusarJobRotativo(jobId: string, rotativoId: string): SolicitacaoRotativo {
    const job = this.solicitacoesRotativo.find(s => s.id === jobId);
    if (!job) throw new Error('Job não encontrado.');
    if (!job.recusado_por_ids) job.recusado_por_ids = [];
    if (!job.recusado_por_ids.includes(rotativoId)) {
      job.recusado_por_ids.push(rotativoId);
      saveToStorage(STORAGE_KEYS.SOLICITACOES_ROTATIVO, this.solicitacoesRotativo);
      window.dispatchEvent(new CustomEvent('hype_solicitacoes_rotativo_changed', { detail: job }));
    }
    return job;
  }

  // ==========================================================================
  // MÓDULO FINANCEIRO: PAGAMENTOS, CUSTOS FIXOS E REPASSES
  // ==========================================================================
  static getPagamentos(colaboradorId?: string): Pagamento[] {
    if (colaboradorId) {
      return this.pagamentos.filter(p => p.colaborador_id === colaboradorId);
    }
    return [...this.pagamentos];
  }

  static savePagamento(pagamento: Pagamento): Pagamento {
    const idx = this.pagamentos.findIndex(p => p.id === pagamento.id);
    if (idx >= 0) {
      this.pagamentos[idx] = pagamento;
    } else {
      this.pagamentos.unshift(pagamento);
    }
    saveToStorage(STORAGE_KEYS.PAGAMENTOS, this.pagamentos);

    // Se vinculado a um agendamento, marca como pago
    if (pagamento.agendamento_id) {
      const ag = this.agendamentos.find(a => a.id === pagamento.agendamento_id);
      if (ag) {
        ag.pago = true;
        ag.pagamento_id = pagamento.id;
        saveToStorage(STORAGE_KEYS.AGENDAMENTOS, this.agendamentos);
        window.dispatchEvent(new CustomEvent('hype_agendamentos_changed', { detail: ag }));
      }
    }

    window.dispatchEvent(new CustomEvent('hype_pagamentos_changed', { detail: pagamento }));
    return pagamento;
  }

  static getCustosFixos(): CustoFixo[] {
    return [...this.custosFixos];
  }

  static saveCustoFixo(custo: CustoFixo): CustoFixo {
    const idx = this.custosFixos.findIndex(c => c.id === custo.id);
    if (idx >= 0) {
      this.custosFixos[idx] = custo;
    } else {
      this.custosFixos.push(custo);
    }
    saveToStorage(STORAGE_KEYS.CUSTOS_FIXOS, this.custosFixos);
    window.dispatchEvent(new CustomEvent('hype_custos_fixos_changed', { detail: custo }));
    return custo;
  }

  static deleteCustoFixo(id: string): void {
    this.custosFixos = this.custosFixos.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CUSTOS_FIXOS, this.custosFixos);
    window.dispatchEvent(new CustomEvent('hype_custos_fixos_changed'));
  }

  static toggleStatusCustoFixo(id: string, mesAno: string): CustoFixo {
    const custo = this.custosFixos.find(c => c.id === id);
    if (!custo) throw new Error('Custo fixo não encontrado.');
    if (!custo.status_mes) custo.status_mes = {};
    const atual = custo.status_mes[mesAno] || 'pendente';
    custo.status_mes[mesAno] = atual === 'pago' ? 'pendente' : 'pago';
    saveToStorage(STORAGE_KEYS.CUSTOS_FIXOS, this.custosFixos);
    window.dispatchEvent(new CustomEvent('hype_custos_fixos_changed', { detail: custo }));
    return custo;
  }

  static getRepassesComissao(): RepasseComissao[] {
    return [...this.repasses];
  }

  static marcarComissaoPaga(
    colaboradorId: string,
    pagamentosIds: string[],
    valorTotal: number,
    pagoPor?: string
  ): RepasseComissao {
    const colab = this.usuarios.find(u => u.id === colaboradorId);
    const now = new Date().toISOString();
    const repasse: RepasseComissao = {
      id: 'rep-' + Date.now(),
      colaborador_id: colaboradorId,
      colaborador_nome: colab?.nome || 'Colaborador',
      periodo_inicio: undefined,
      periodo_fim: now.split('T')[0],
      valor_total: valorTotal,
      pagamentos_ids: pagamentosIds,
      pago_em: now,
      pago_por: pagoPor || 'Admin Master',
      observacoes: `Repasse quitado de ${pagamentosIds.length > 0 ? pagamentosIds.length : 'atendimentos'} serviço(s).`
    };

    // Atualiza o status dos pagamentos correspondentes para 'pago'
    // Se pagamentosIds foi passado, atualiza esses; também atualiza qualquer pagamento pendente do colaborador
    const colabNomeLower = colab?.nome?.toLowerCase() || '';
    this.pagamentos.forEach(p => {
      const matchId = pagamentosIds.includes(p.id);
      const matchColab = p.colaborador_id === colaboradorId || (colabNomeLower && p.colaborador_nome?.toLowerCase() === colabNomeLower);
      
      if (matchId || (matchColab && p.status_repasse !== 'pago')) {
        p.status_repasse = 'pago';
        p.repasse_id = repasse.id;
      }
    });

    this.repasses.unshift(repasse);
    saveToStorage(STORAGE_KEYS.PAGAMENTOS, this.pagamentos);
    saveToStorage(STORAGE_KEYS.REPASSES, this.repasses);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hype_pagamentos_changed', { detail: this.pagamentos }));
      window.dispatchEvent(new CustomEvent('hype_repasses_changed', { detail: repasse }));
    }
    return repasse;
  }
}
