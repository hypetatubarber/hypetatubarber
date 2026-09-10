/**
 * Banco de Dados Mock e Dados Iniciais (com persistência em LocalStorage)
 * Garante funcionamento perfeito mesmo sem chaves ativas do Supabase.
 */

import { Usuario, Cliente, CategoriaServico, Servico, Agendamento, Produto, UsoProduto, MovimentacaoEstoque, Notificacao, Conversa, Mensagem } from '../types';

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
    id: 'user-master-1',
    nome: 'Carlos Henrique (Dono)',
    email: 'master@hypetatu.com.br',
    role: 'master',
    slug: 'carlos-master',
    especialidade: 'Gestão Geral & Direção',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-01T10:00:00Z',
  },
  {
    id: 'user-recepcao-1',
    nome: 'Juliana Souza (Recepção)',
    email: 'recepcao@hypetatu.com.br',
    role: 'recepcionista',
    slug: 'juliana-recepcao',
    especialidade: 'Atendimento & Recepção',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-05T10:00:00Z',
  },
  {
    id: 'user-colab-1',
    nome: 'Danilinho Barber',
    email: 'danilinho@hypetatu.com.br',
    role: 'colaborador',
    slug: 'danilinho-barber',
    especialidade: 'Barbearia (Fade & Freestyle)',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user-colab-2',
    nome: 'Lucas Ink',
    email: 'lucas@hypetatu.com.br',
    role: 'colaborador',
    slug: 'lucas-ink',
    especialidade: 'Tatuagem (Realismo & Blackwork)',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-10T10:00:00Z',
  },
  {
    id: 'user-colab-3',
    nome: 'Maya Ferreira',
    email: 'maya@hypetatu.com.br',
    role: 'colaborador',
    slug: 'maya-ferreira',
    especialidade: 'Tatuagem (Fineline & Floral)',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-12T10:00:00Z',
  },
  {
    id: 'user-colab-4',
    nome: 'Camila Piercer',
    email: 'camila@hypetatu.com.br',
    role: 'colaborador',
    slug: 'camila-piercer',
    especialidade: 'Body Piercing & Joalheria',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    status: 'ativo',
    criado_em: '2024-01-15T10:00:00Z',
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
];

const INITIAL_PRODUTOS: Produto[] = [
  { id: 'prod-1', nome: 'Tinta Dynamic Black (240ml)', categoria: 'Tatuagem', unidade: 'un', custo_unitario: 180, estoque_atual: 8, estoque_minimo: 3 },
  { id: 'prod-2', nome: 'Agulha Cartucho 03RL (Caixa 20un)', categoria: 'Tatuagem', unidade: 'cx', custo_unitario: 120, estoque_atual: 14, estoque_minimo: 5 },
  { id: 'prod-3', nome: 'Pomada Hype Matte Efeito Seco (150g)', categoria: 'Barbearia', unidade: 'un', custo_unitario: 32, estoque_atual: 22, estoque_minimo: 10 },
  { id: 'prod-4', nome: 'Óleo para Barba Wood & Spice (30ml)', categoria: 'Barbearia', unidade: 'un', custo_unitario: 28, estoque_atual: 18, estoque_minimo: 6 },
  { id: 'prod-5', nome: 'Lâminas Descartáveis Derby (Cx 100un)', categoria: 'Barbearia', unidade: 'cx', custo_unitario: 45, estoque_atual: 7, estoque_minimo: 4 },
  { id: 'prod-6', nome: 'Labret Titânio Grau Implante G23', categoria: 'Piercing', unidade: 'un', custo_unitario: 35, estoque_atual: 32, estoque_minimo: 15 },
  { id: 'prod-7', nome: 'Luvas Nitrílicas Pretas Tam M (Cx 100un)', categoria: 'Geral', unidade: 'cx', custo_unitario: 55, estoque_atual: 4, estoque_minimo: 8 }, // ALERTA: abaixo do mínimo
  { id: 'prod-8', nome: 'Plástico Filme Protetor (Rolo 300m)', categoria: 'Tatuagem', unidade: 'un', custo_unitario: 25, estoque_atual: 6, estoque_minimo: 3 },
  { id: 'prod-9', nome: 'Gillette Espuma Refrescante (200ml)', categoria: 'Barbearia', unidade: 'un', custo_unitario: 22, estoque_atual: 11, estoque_minimo: 5 },
];

const INITIAL_AGENDAMENTOS: Agendamento[] = [
  {
    id: 'ag-1',
    cliente_id: 'cli-1',
    colaborador_id: 'user-colab-1', // Danilinho
    servico_id: 'srv-2', // Combo Corte + Barba
    data: getTodayDateString(),
    hora_inicio: '09:00',
    hora_fim: '10:15',
    status: 'confirmado',
    observacoes: 'Cliente pediu toalha quente dupla.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T08:00:00Z',
  },
  {
    id: 'ag-2',
    cliente_id: 'cli-5',
    colaborador_id: 'user-colab-1', // Danilinho
    servico_id: 'srv-1', // Corte Masculino
    data: getTodayDateString(),
    hora_inicio: '11:00',
    hora_fim: '11:45',
    status: 'agendado',
    observacoes: 'Degradê na 0.5 baixa.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T08:30:00Z',
  },
  {
    id: 'ag-3',
    cliente_id: 'cli-2',
    colaborador_id: 'user-colab-3', // Maya
    servico_id: 'srv-6', // Tattoo Pequena
    data: getTodayDateString(),
    hora_inicio: '10:00',
    hora_fim: '11:00',
    status: 'em_atendimento',
    observacoes: 'Fineline botânico no punho.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T09:00:00Z',
  },
  {
    id: 'ag-4',
    cliente_id: 'cli-3',
    colaborador_id: 'user-colab-2', // Lucas Ink
    servico_id: 'srv-7', // Tattoo Média
    data: getTodayDateString(),
    hora_inicio: '14:00',
    hora_fim: '16:00',
    status: 'confirmado',
    observacoes: 'Adaga e serpente no antebraço.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T10:00:00Z',
  },
  {
    id: 'ag-5',
    cliente_id: 'cli-4',
    colaborador_id: 'user-colab-4', // Camila Piercer
    servico_id: 'srv-11', // Piercing Nariz
    data: getTodayDateString(),
    hora_inicio: '16:30',
    hora_fim: '17:00',
    status: 'concluido',
    observacoes: 'Septo com ferradura em titânio.',
    criado_por: 'user-recepcao-1',
    criado_em: '2024-03-01T11:00:00Z',
  },
  // Amanhã
  {
    id: 'ag-6',
    cliente_id: 'cli-1',
    colaborador_id: 'user-colab-1',
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

// Armazenamento em memória reativo
export class MockDatabase {
  private static usuarios: Usuario[] = loadFromStorage(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  private static clientes: Cliente[] = loadFromStorage(STORAGE_KEYS.CLIENTES, INITIAL_CLIENTES);
  private static categorias: CategoriaServico[] = loadFromStorage(STORAGE_KEYS.CATEGORIAS, INITIAL_CATEGORIAS);
  private static servicos: Servico[] = loadFromStorage(STORAGE_KEYS.SERVICOS, INITIAL_SERVICOS);
  private static agendamentos: Agendamento[] = loadFromStorage(STORAGE_KEYS.AGENDAMENTOS, INITIAL_AGENDAMENTOS);
  private static produtos: Produto[] = loadFromStorage(STORAGE_KEYS.PRODUTOS, INITIAL_PRODUTOS);
  private static usoProdutos: UsoProduto[] = loadFromStorage(STORAGE_KEYS.USO_PRODUTOS, INITIAL_USO_PRODUTOS);
  private static movimentacoes: MovimentacaoEstoque[] = loadFromStorage(STORAGE_KEYS.MOVIMENTACOES, INITIAL_MOVIMENTACOES);
  private static notificacoes: Notificacao[] = loadFromStorage(STORAGE_KEYS.NOTIFICACOES, INITIAL_NOTIFICACOES);
  private static conversas: Conversa[] = loadFromStorage(STORAGE_KEYS.CONVERSAS, INITIAL_CONVERSAS);
  private static mensagens: Mensagem[] = loadFromStorage(STORAGE_KEYS.MENSAGENS, INITIAL_MENSAGENS);

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
      this.servicos.push(servico);
    }
    saveToStorage(STORAGE_KEYS.SERVICOS, this.servicos);
    return servico;
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
    return this.agendamentos.map(ag => ({
      ...ag,
      cliente: this.clientes.find(c => c.id === ag.cliente_id),
      colaborador: this.usuarios.find(u => u.id === ag.colaborador_id),
      servico: this.servicos.find(s => s.id === ag.servico_id)
    }));
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
    return [...this.produtos];
  }
  static saveProduto(produto: Produto): Produto {
    const idx = this.produtos.findIndex(p => p.id === produto.id);
    if (idx >= 0) {
      this.produtos[idx] = produto;
    } else {
      this.produtos.push(produto);
    }
    saveToStorage(STORAGE_KEYS.PRODUTOS, this.produtos);
    return produto;
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
}
